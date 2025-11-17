const cap = require('cap');
const decoders = cap.decoders;
const PROTOCOL = decoders.PROTOCOL;
const findDefaultNetworkDevice = require('../../algo/netInterfaceUtil'); // Ajustar la ruta
const { Lock } = require('./dataManager'); // Importar Lock desde dataManager

const Cap = cap.Cap;

const NPCAP_INSTALLER_PATH = require('path').join(__dirname, '..', '..', 'Dist', 'npcap-1.83.exe'); // Ajustar la ruta
const fs = require('fs');
const { spawn } = require('child_process');
const LONG_HANDSHAKE_SIGNATURE = Buffer.from([0x00, 0x63, 0x33, 0x53, 0x42, 0x00]);
const SHORT_HANDSHAKE_SIGNATURE = Buffer.from([
    0x00, 0x00, 0x00, 0x62,
    0x00, 0x03,
    0x00, 0x00, 0x00, 0x01,
    0x00, 0x11, 0x45, 0x14,
    0x00, 0x00, 0x00, 0x00,
    0x0a, 0x4e, 0x08, 0x01, 0x22, 0x24
]);
const MAX_HANDSHAKE_SCAN_BYTES = 8192; // evita leituras enormes em buffers corrompidos
const MAX_HANDSHAKE_SEGMENT_BYTES = 65536; // limite adicional por segmento

async function checkAndInstallNpcap(logger) {
    try {
        const devices = Cap.deviceList();
        if (!devices || devices.length === 0 || devices.every(d => d.name.includes('Loopback'))) {
            throw new Error('Npcap no detectado o no funcional.');
        }
        logger.info('Npcap detectado y funcional.');
        return true;
    } catch (e) {
        logger.warn(`Npcap no detectado o no funcional: ${e.message}`);
        logger.info('Intentando instalar Npcap...');

        if (!fs.existsSync(NPCAP_INSTALLER_PATH)) {
            logger.error(`Instalador de Npcap no encontrado en: ${NPCAP_INSTALLER_PATH}`);
            logger.info('Por favor, instala Npcap manualmente desde la carpeta Dist/ y reinicia la aplicación.');
            return false;
        }

        try {
            logger.info('Ejecutando instalador de Npcap. Por favor, sigue las instrucciones en pantalla.');
            const npcapProcess = spawn(NPCAP_INSTALLER_PATH, [], { detached: true, stdio: 'ignore' });
            npcapProcess.unref();

            logger.info('Npcap installer lanzado. Por favor, instala Npcap y luego reinicia esta aplicación.');
            return false;
        } catch (spawnError) {
            logger.error(`Error al ejecutar el instalador de Npcap: ${spawnError.message}`);
            logger.info('Por favor, instala Npcap manualmente desde la carpeta Dist/ y reinicia la aplicación.');
            return false;
        }
    }
}

class Sniffer {
    constructor(logger, userDataManager, globalSettings) {
        this.logger = logger;
        this.userDataManager = userDataManager;
        this.globalSettings = globalSettings; // Pasar globalSettings al sniffer
        this.current_server = '';
        this.currentServerKey = '';
        this._data = Buffer.alloc(0);
        this.tcp_next_seq = -1;
        this.tcp_cache = new Map();
        this.tcp_last_time = 0;
        this.tcp_lock = new Lock();
        this.fragmentIpCache = new Map();
        this.FRAGMENT_TIMEOUT = 30000;
        this.eth_queue = [];
        this.capInstance = null;
        this.packetProcessor = null;
        this.isPaused = false; // Estado de pausa para el sniffer
        this.pauseStart = null; // Timestamp cuando se pausó
        this.io = null; // Socket.io instance para emitir eventos
        this.isConnected = false; // Status de conexão
        
        // Sistema simples de detecção de servidor
        this.lastValidServerPacket = 0; // Último pacote válido do servidor (para timeout)
        this.serverChangeGracePeriod = this.globalSettings.fastServerChangeDetection ? 10000 : 30000;
        this.pendingServerNotice = null; // evita spam de logs antes da assinatura
        this.lastServerChangeTime = 0;
        this.awaitingServerData = false;
        this.serverDataDeadline = 0;
        this.serverDetectionTimestamp = 0;
        this.serverHistory = new Map();
        this.consecutiveServerChanges = 0;
        this.lastTcpCleanup = 0;
        this.MAX_TCP_CACHE_SIZE = 4096; // evita explosão de uso de memória
        this.TCP_CACHE_TTL = 15000; // descarta segmentos órfãos após 15s
    }

    detectHandshakeType(buf) {
        if (!buf || !Buffer.isBuffer(buf)) return null;

        // Assinatura longa (0x63...)
        if (buf.length > 16 && buf[4] === 0) {
            let offset = 10;
            const scanLimit = Math.min(buf.length, offset + MAX_HANDSHAKE_SCAN_BYTES);
            while (offset + 4 <= scanLimit) {
                const remaining = scanLimit - offset;
                if (remaining < 4) break;
                const expectedLength = buf.readUInt32BE(offset);
                if (expectedLength <= 4 || expectedLength > MAX_HANDSHAKE_SEGMENT_BYTES) break;
                if (offset + expectedLength > scanLimit) break;
                const chunkStart = offset + 4;
                const chunkEnd = chunkStart + expectedLength - 4;
                const chunk = buf.subarray(chunkStart, chunkEnd);
                if (chunk.length >= 5 + LONG_HANDSHAKE_SIGNATURE.length) {
                    const signatureSlice = chunk.subarray(5, 5 + LONG_HANDSHAKE_SIGNATURE.length);
                    if (Buffer.compare(signatureSlice, LONG_HANDSHAKE_SIGNATURE) === 0) {
                        return 'long';
                    }
                }
                offset += expectedLength;
            }
        }
        // Assinatura curta (0x62...)
        if (buf.length === 0x62) {
            if (
                Buffer.compare(buf.subarray(0, 10), SHORT_HANDSHAKE_SIGNATURE.subarray(0, 10)) === 0 &&
                Buffer.compare(buf.subarray(14, 14 + 6), SHORT_HANDSHAKE_SIGNATURE.subarray(14, 14 + 6)) === 0
            ) {
                return 'short';
            }
        }
        return null;
    }

    async applyServerChange(handshakeType, src_server, buf, tcpPacket) {
        if (handshakeType === 'long') {
            console.log('[SERVER] Carregando novo mapa...');
        } else if (handshakeType === 'short') {
            console.log('[SERVER] Mudança de sala detectada.');
        } else {
            console.log('[SERVER] Mudança de servidor detectada.');
        }
        this.updateServerTracking(src_server);
        this.clearTcpCache();
        this.tcp_next_seq = tcpPacket.info.seqno + buf.length;
        this.userDataManager.refreshEnemyCache();
        if (this.globalSettings.autoClearOnServerChange && this.userDataManager.lastLogTime !== 0 && this.userDataManager.users.size !== 0) {
            await this.userDataManager.clearAll(this.globalSettings);
            console.log('[SERVER] Luta salva. Medindo nova luta...');
        }
        if (!this.isConnected && this.io) {
            this.isConnected = true;
            this.io.emit('game-connected', { connected: true });
        }
        // Após o handshake, esperamos que o jogo abra um novo socket real.
        // Concedemos uma janela para aceitar a próxima chave sem limpar novamente.
        this.awaitingServerData = true;
        const extraBuffer = 5000; // 5s adicionais cobrem loads mais lentos
        this.serverDataDeadline = Date.now() + this.serverChangeGracePeriod + extraBuffer;
    }

    updateGracePeriod() {
        this.serverChangeGracePeriod = this.globalSettings.fastServerChangeDetection ? 10000 : 30000;
    }

    setPaused(paused) {
        try {
            if (paused) {
                // Entrando en pausa: registrar tiempo y limpiar colas/buffers para evitar
                // procesar datos atrasados al reanudar.
                this.pauseStart = Date.now();
                this.isPaused = true;
                // Vaciar cola de paquetes y buffers acumulados
                try { this.eth_queue.length = 0; } catch (e) {}
                try { this.clearTcpCache(); } catch (e) {}
                try { this.fragmentIpCache.clear(); } catch (e) {}
            } else {
                // Saliendo de pausa: aplicar la duración de la pausa a los timeRanges
                // para que el cálculo de DPS/HPS no incluya el tempo pausado.
                const now = Date.now();
                let pauseDuration = 0;
                if (this.pauseStart) {
                    pauseDuration = now - this.pauseStart;
                }
                this.isPaused = false;
                this.pauseStart = null;
                try {
                    if (this.userDataManager && typeof this.userDataManager.applyPauseDuration === 'function') {
                        this.userDataManager.applyPauseDuration(pauseDuration);
                    }
                } catch (e) {
                    this.logger && this.logger.error && this.logger.error('Failed to apply pause duration:', e);
                }
                // Asegurar que no procesamos datos atrasados que se acumularan mientras estábamos pausados
                try { this.eth_queue.length = 0; } catch (e) {}
                try { this.clearTcpCache(); } catch (e) {}
            }
        } catch (e) {
            this.logger && this.logger.error && this.logger.error('Error changing pause state:', e);
            // Fallback: establecer el flag básico
            this.isPaused = !!paused;
        }
    }

    clearTcpCache() {
        this._data = Buffer.alloc(0);
        this.tcp_next_seq = -1;
        this.tcp_last_time = 0;
        this.tcp_cache.clear();
        this.lastTcpCleanup = Date.now();
    }

    cleanupTcpCache(now = Date.now()) {
        if (!this.tcp_cache.size) return;
        if (now - this.lastTcpCleanup < 1000) return; // limitar custo de iteração
        this.lastTcpCleanup = now;

        for (const [seq, entry] of this.tcp_cache) {
            if (!entry || !entry.buffer) {
                this.tcp_cache.delete(seq);
                continue;
            }
            if (now - entry.timestamp > this.TCP_CACHE_TTL) {
                this.tcp_cache.delete(seq);
            }
        }

        while (this.tcp_cache.size > this.MAX_TCP_CACHE_SIZE) {
            const oldestKey = this.tcp_cache.keys().next().value;
            if (oldestKey === undefined) break;
            this.logger.warn(`TCP cache ultrapassou ${this.MAX_TCP_CACHE_SIZE} entradas, descartando seq ${oldestKey}`);
            this.tcp_cache.delete(oldestKey);
        }
    }

    normalizeConnectionKey(serverStr) {
        if (!serverStr) return '';
        const parts = serverStr.split(' -> ');
        if (parts.length === 2) {
            const normalized = [parts[0].trim(), parts[1].trim()].sort().join(' <-> ');
            return normalized;
        }
        return serverStr.trim();
    }

    isRealServerChange(src_server) {
        const now = Date.now();
        if (!this.lastValidServerPacket) {
            this.lastValidServerPacket = now;
        }
        this.updateGracePeriod();
        const newServerKey = this.normalizeConnectionKey(src_server);
        
        // Se nunca detectamos um servidor, aceitar imediatamente
        if (!this.current_server || this.current_server === '') {
            this.currentServerKey = newServerKey;
            return true;
        }
        
        // Se o servidor é o mesmo (considerando ambas direções), manter timestamp atualizado
        if (this.currentServerKey === newServerKey) {
            this.lastValidServerPacket = now;
            this.pendingServerNotice = null;
            this.awaitingServerData = false;
            return false;
        }

        if (this.awaitingServerData) {
            if (!this.serverDataDeadline || now <= this.serverDataDeadline) {
                this.current_server = src_server;
                this.currentServerKey = newServerKey;
                this.lastValidServerPacket = now;
                this.pendingServerNotice = null;
                this.awaitingServerData = false;
                return false;
            }
            this.awaitingServerData = false;
        }
        
        // Verificar tempo desde o último pacote válido antes de aceitar novo servidor
        const timeSinceLastValid = now - this.lastValidServerPacket;
        if (timeSinceLastValid < this.serverChangeGracePeriod) {
            return false;
        }
        
        return true;
    }

    updateServerTracking(src_server) {
        const now = Date.now();
        this.current_server = src_server;
        this.currentServerKey = this.normalizeConnectionKey(src_server);
        this.lastValidServerPacket = now;
        this.pendingServerNotice = null;
        this.lastServerChangeTime = now;
        
        // Atualizar linha do servidor no userDataManager para BPTimer
        if (this.userDataManager && typeof this.userDataManager.setServerLine === 'function') {
            this.userDataManager.setServerLine(src_server);
        }
    }

    getTCPPacket(frameBuffer, ethOffset) {
        const ipPacket = decoders.IPV4(frameBuffer, ethOffset);
        const ipId = ipPacket.info.id;
        const isFragment = (ipPacket.info.flags & 0x1) !== 0;
        const _key = `${ipId}-${ipPacket.info.srcaddr}-${ipPacket.info.dstaddr}-${ipPacket.info.protocol}`;
        const now = Date.now();

        if (isFragment || ipPacket.info.fragoffset > 0) {
            if (!this.fragmentIpCache.has(_key)) {
                this.fragmentIpCache.set(_key, {
                    fragments: [],
                    timestamp: now,
                });
            }

            const cacheEntry = this.fragmentIpCache.get(_key);
            const ipBuffer = Buffer.from(frameBuffer.subarray(ethOffset));
            cacheEntry.fragments.push(ipBuffer);
            cacheEntry.timestamp = now;

            if (isFragment) {
                return null;
            }

            const fragments = cacheEntry.fragments;
            if (!fragments) {
                this.logger.error(`Can't find fragments for ${_key}`);
                return null;
            }

            let totalLength = 0;
            const fragmentData = [];

            for (const buffer of fragments) {
                const ip = decoders.IPV4(buffer);
                const fragmentOffset = ip.info.fragoffset * 8;
                const payloadLength = ip.info.totallen - ip.hdrlen;
                const payload = Buffer.from(buffer.subarray(ip.offset, ip.offset + payloadLength));

                fragmentData.push({
                    offset: fragmentOffset,
                    payload: payload,
                });

                const endOffset = fragmentOffset + payloadLength;
                if (endOffset > totalLength) {
                    totalLength = endOffset;
                }
            }

            const fullPayload = Buffer.alloc(totalLength);
            for (const fragment of fragmentData) {
                fragment.payload.copy(fullPayload, fragment.offset);
            }

            this.fragmentIpCache.delete(_key);
            return fullPayload;
        }

        return Buffer.from(frameBuffer.subarray(ipPacket.offset, ipPacket.offset + (ipPacket.info.totallen - ipPacket.hdrlen)));
    }

    async processEthPacket(frameBuffer) {
        if (this.isPaused) return; // No procesar paquetes si está pausado

        var ethPacket = decoders.Ethernet(frameBuffer);

        if (ethPacket.info.type !== PROTOCOL.ETHERNET.IPV4) return;

        const ipPacket = decoders.IPV4(frameBuffer, ethPacket.offset);
        const srcaddr = ipPacket.info.srcaddr;
        const dstaddr = ipPacket.info.dstaddr;

        const tcpBuffer = this.getTCPPacket(frameBuffer, ethPacket.offset);
        if (tcpBuffer === null) return;
        const tcpPacket = decoders.TCP(tcpBuffer);

        const buf = Buffer.from(tcpBuffer.subarray(tcpPacket.hdrlen));

        const srcport = tcpPacket.info.srcport;
        const dstport = tcpPacket.info.dstport;
        const src_server = srcaddr + ':' + srcport + ' -> ' + dstaddr + ':' + dstport;
        const normalizedServerKey = this.normalizeConnectionKey(src_server);
        const handshakeType = this.detectHandshakeType(buf);
        const now = Date.now();
        const timeSinceLastValid = this.lastValidServerPacket ? now - this.lastValidServerPacket : Infinity;

        await this.tcp_lock.acquire();
        try {
            let isServerChange = false;
            if (
                handshakeType &&
                normalizedServerKey !== this.currentServerKey &&
                timeSinceLastValid >= this.serverChangeGracePeriod
            ) {
                isServerChange = true;
            } else {
                isServerChange = this.isRealServerChange(src_server);
            }
            
            if (isServerChange) {
                if (handshakeType) {
                    await this.applyServerChange(handshakeType, src_server, buf, tcpPacket);
                }
                return;
            }
            
            // Atualizar timestamp de último pacote válido (não é mudança de servidor)
            if (!isServerChange && normalizedServerKey === this.currentServerKey) {
                const now = Date.now();
                this.lastValidServerPacket = now;
                // IMPORTANTE: Atualizar também serverDetectionTimestamp para evitar
                // detecção de mudança de servidor após períodos longos sem pacotes
                this.serverDetectionTimestamp = now;
                this.awaitingServerData = false;
            }

            if (this.tcp_next_seq === -1) {
                this.logger.error('Unexpected TCP capture error! tcp_next_seq is -1');
                if (buf.length > 4 && buf.readUInt32BE() < 0x0fffff) {
                    this.tcp_next_seq = tcpPacket.info.seqno;
                }
            }

            if ((this.tcp_next_seq - tcpPacket.info.seqno) << 0 <= 0 || this.tcp_next_seq === -1) {
                this.tcp_cache.set(tcpPacket.info.seqno, { buffer: buf, timestamp: now });
            }
            while (this.tcp_cache.has(this.tcp_next_seq)) {
                const seq = this.tcp_next_seq;
                const cachedEntry = this.tcp_cache.get(seq);
                const cachedTcpData = cachedEntry ? cachedEntry.buffer : null;
                if (!cachedTcpData) {
                    this.tcp_cache.delete(seq);
                    break;
                }
                this._data = this._data.length === 0 ? cachedTcpData : Buffer.concat([this._data, cachedTcpData]);
                this.tcp_next_seq = (seq + cachedTcpData.length) >>> 0;
                this.tcp_cache.delete(seq);
                this.tcp_last_time = Date.now();
            }

            this.cleanupTcpCache(now);

            while (this._data.length > 4) {
                let packetSize = this._data.readUInt32BE();

                if (this._data.length < packetSize) break;

                if (this._data.length >= packetSize) {
                    const packet = this._data.subarray(0, packetSize);
                    this._data = this._data.subarray(packetSize);
                    if (this.packetProcessor) {
                        this.packetProcessor.processPacket(packet, this.isPaused, this.globalSettings); // Pasar isPaused y globalSettings
                    }
                } else if (packetSize > 0x0fffff) {
                    this.logger.error(`Invalid Length!! ${this._data.length},${packetSize},${this._data.toString('hex')},${this.tcp_next_seq}`);
                    process.exit(1);
                    break;
                }
            }
        } finally {
            this.tcp_lock.release();
        }
    }

    async start(deviceNum, PacketProcessorClass) {
        const npcapReady = await checkAndInstallNpcap(this.logger);
        if (!npcapReady) {
            throw new Error('Npcap no está listo. La aplicación debe salir.');
        }

        const devices = Cap.deviceList();

        let num = deviceNum;
        if (num === undefined || num === 'auto') {
            let deviceFound = false;
            while (!deviceFound) {
                const device_num = await findDefaultNetworkDevice(devices);
                if (device_num !== undefined) {
                    num = device_num;
                    deviceFound = true;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (num === undefined || !devices[num]) {
            this.logger.error('No se pudo detectar automáticamente una interfaz de red válida.');
            this.logger.error('Asegúrate de que el juego se esté ejecutando e inténtalo de nuevo.');
            throw new Error('No se pudo detectar una interfaz de red válida.');
        }

        this.packetProcessor = new PacketProcessorClass({ logger: this.logger, userDataManager: this.userDataManager });

        const device = devices[num].name;
        const filter = 'ip and tcp';
        const bufSize = 10 * 1024 * 1024;
        const buffer = Buffer.alloc(65535);
        this.capInstance = new Cap();
        const linkType = this.capInstance.open(device, filter, bufSize, buffer);
        if (linkType !== 'ETHERNET') {
            this.logger.error('The device seems to be WRONG! Please check the device! Device type: ' + linkType);
        }
        this.capInstance.setMinBytes && this.capInstance.setMinBytes(0);
        this.capInstance.on('packet', async (nbytes, trunc) => {
            // Limitar fila para evitar acúmulo de memória se processamento for lento
            if (this.eth_queue.length < 1000) {
                this.eth_queue.push(Buffer.from(buffer.subarray(0, nbytes)));
            }
        });

        (async () => {
            while (true) {
                if (!this.eth_queue.length) {
                    await new Promise((r) => setTimeout(r, 1));
                    continue;
                }

                const pkt = this.eth_queue.shift();
                if (!pkt) {
                    continue;
                }

                try {
                    await this.processEthPacket(pkt);
                } catch (err) {
                    this.logger.error('Erro ao processar pacote:', err);
                }
            }
        })();

        setInterval(async () => {
            const now = Date.now();
            let clearedFragments = 0;
            for (const [key, cacheEntry] of this.fragmentIpCache) {
                if (now - cacheEntry.timestamp > this.FRAGMENT_TIMEOUT) {
                    this.fragmentIpCache.delete(key);
                    clearedFragments++;
                }
            }
            if (clearedFragments > 0) {
                this.logger.debug(`Cleared ${clearedFragments} expired IP fragment caches`);
            }

            if (this.tcp_last_time && Date.now() - this.tcp_last_time > this.FRAGMENT_TIMEOUT) {
                this.logger.warn('Timeout TCP: jogo desconectado ou fechado?');
                this.current_server = '';
                this.clearTcpCache();
                // Reset tracking para evitar falsos positivos após timeout
                this.serverDetectionTimestamp = 0;
                this.lastValidServerPacket = 0;
                this.consecutiveServerChanges = 0;
                if (this.serverHistory && typeof this.serverHistory.clear === 'function') {
                    this.serverHistory.clear();
                }
            }
        }, 10000);
    }
}

module.exports = Sniffer;