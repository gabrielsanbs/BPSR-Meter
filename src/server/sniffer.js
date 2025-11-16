const cap = require('cap');
const decoders = cap.decoders;
const PROTOCOL = decoders.PROTOCOL;
const Readable = require('stream').Readable;
const findDefaultNetworkDevice = require('../../algo/netInterfaceUtil'); // Ajustar la ruta
const { Lock } = require('./dataManager'); // Importar Lock desde dataManager

const Cap = cap.Cap;

const NPCAP_INSTALLER_PATH = require('path').join(__dirname, '..', '..', 'Dist', 'npcap-1.83.exe'); // Ajustar la ruta
const fs = require('fs');
const { spawn } = require('child_process');

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
        
        // Sistema de detecção de servidor robusto para VPNs (ExitLag, etc)
        this.serverDetectionTimestamp = 0; // Último timestamp de detecção válida
        this.serverChangeGracePeriod = 5000; // 5 segundos de tolerância para mudanças de IP/porta
        this.lastValidServerPacket = 0; // Último pacote válido do servidor
        this.consecutiveServerChanges = 0; // Contador de mudanças consecutivas
        this.serverHistory = new Map(); // Histórico de servidores vistos recentemente
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
                // para que el cálculo de DPS/HPS no incluya el tiempo pausado.
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
    }

    isRealServerChange(src_server) {
        const now = Date.now();
        
        // Se nunca detectamos um servidor, aceitar imediatamente
        if (!this.current_server || this.current_server === '') {
            console.log(`[SERVER-DETECT] Primeiro servidor detectado: ${src_server}`);
            return true;
        }
        
        // Se o servidor é o mesmo, não é mudança
        if (this.current_server === src_server) {
            this.serverHistory.set(src_server, now);
            this.consecutiveServerChanges = 0;
            return false;
        }
        
        // Verificar se estamos dentro do período de graça (5 segundos)
        const timeSinceLastDetection = now - this.serverDetectionTimestamp;
        
        // Se a última detecção foi há menos de 5 segundos E
        // tivemos pacotes válidos recentemente (último 2 segundos)
        const timeSinceLastValidPacket = now - this.lastValidServerPacket;
        
        console.log(`[SERVER-DETECT] Analisando mudança de servidor:`);
        console.log(`  Current: ${this.current_server}`);
        console.log(`  New: ${src_server}`);
        console.log(`  Tempo desde última detecção: ${timeSinceLastDetection}ms`);
        console.log(`  Tempo desde último pacote válido: ${timeSinceLastValidPacket}ms`);
        console.log(`  Período de graça: ${this.serverChangeGracePeriod}ms`);
        console.log(`  Mudanças consecutivas: ${this.consecutiveServerChanges}`);
        
        if (timeSinceLastDetection < this.serverChangeGracePeriod && timeSinceLastValidPacket < 2000) {
            // Provavelmente é flutuação de VPN/ExitLag, ignorar mudança
            this.consecutiveServerChanges++;
            console.log(`  ✓ IGNORANDO mudança (VPN flutuação #${this.consecutiveServerChanges})`);
            return false;
        }
        
        // Limpar histórico antigo (> 30 segundos)
        for (const [server, timestamp] of this.serverHistory) {
            if (now - timestamp > 30000) {
                this.serverHistory.delete(server);
            }
        }
        
        // Se vimos este servidor recentemente (últimos 30 segundos), não é mudança real
        if (this.serverHistory.has(src_server)) {
            const lastSeen = this.serverHistory.get(src_server);
            if (now - lastSeen < 30000) {
                // Servidor conhecido, apenas rotação de IP da VPN
                this.consecutiveServerChanges++;
                console.log(`  ✓ IGNORANDO mudança (servidor conhecido no histórico, visto há ${now - lastSeen}ms)`);
                return false;
            }
        }
        
        // Se passou do período de graça OU não tivemos pacotes recentes,
        // é provável que seja uma mudança real de servidor
        console.log(`  ✗ MUDANÇA REAL DE SERVIDOR DETECTADA!`);
        console.log(`     Razão: Tempo desde detecção (${timeSinceLastDetection}ms) >= ${this.serverChangeGracePeriod}ms`);
        console.log(`     OU pacote válido há muito tempo (${timeSinceLastValidPacket}ms >= 2000ms)`);
        this.consecutiveServerChanges = 0;
        return true;
    }

    updateServerTracking(src_server) {
        const now = Date.now();
        console.log(`[SERVER-TRACK] Atualizando tracking: ${src_server}`);
        this.current_server = src_server;
        this.serverDetectionTimestamp = now;
        this.lastValidServerPacket = now;
        this.serverHistory.set(src_server, now);
        this.consecutiveServerChanges = 0;
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

        await this.tcp_lock.acquire();
        try {
            // Usar o novo sistema de detecção de servidor robusto
            const isServerChange = this.isRealServerChange(src_server);
            
            if (isServerChange) {
                try {
                    if (buf[4] == 0) {
                        const data = buf.subarray(10);
                        if (data.length) {
                            const stream = Readable.from(data, { objectMode: false });
                            let data1;
                            do {
                                const len_buf = stream.read(4);
                                if (!len_buf) break;
                                data1 = stream.read(len_buf.readUInt32BE() - 4);
                                const signature = Buffer.from([0x00, 0x63, 0x33, 0x53, 0x42, 0x00]);
                                if (Buffer.compare(data1.subarray(5, 5 + signature.length), signature)) break;
                                try {
                                    // Mudança real de servidor detectada
                                    this.updateServerTracking(src_server);
                                    this.clearTcpCache();
                                    this.tcp_next_seq = tcpPacket.info.seqno + buf.length;
                                    this.userDataManager.refreshEnemyCache();
                                    if (this.globalSettings.autoClearOnServerChange && this.userDataManager.lastLogTime !== 0 && this.userDataManager.users.size !== 0) {
                                        console.log(`[CLEAR-ALL] Chamando clearAll() devido a mudança de servidor`);
                                        console.log(`  autoClearOnServerChange: ${this.globalSettings.autoClearOnServerChange}`);
                                        console.log(`  lastLogTime: ${this.userDataManager.lastLogTime}`);
                                        console.log(`  users.size: ${this.userDataManager.users.size}`);
                                        this.userDataManager.clearAll(this.globalSettings);
                                        console.log('¡Servidor cambiado, estadísticas limpiadas!');
                                    } else {
                                        console.log(`[CLEAR-ALL] NÃO chamando clearAll():`);
                                        console.log(`  autoClearOnServerChange: ${this.globalSettings.autoClearOnServerChange}`);
                                        console.log(`  lastLogTime: ${this.userDataManager.lastLogTime}`);
                                        console.log(`  users.size: ${this.userDataManager.users.size}`);
                                    }
                                    console.log('Servidor de juego detectado. Midiendo DPS...');
                                    // Emitir evento de conexão estabelecida
                                    if (!this.isConnected && this.io) {
                                        this.isConnected = true;
                                        this.io.emit('game-connected', { connected: true });
                                    }
                                } catch (e) {}
                            } while (data1 && data1.length);
                        }
                    }
                    if (buf.length === 0x62) {
                        const signature = Buffer.from([
                            0x00, 0x00, 0x00, 0x62,
                            0x00, 0x03,
                            0x00, 0x00, 0x00, 0x01,
                            0x00, 0x11, 0x45, 0x14,
                            0x00, 0x00, 0x00, 0x00,
                            0x0a, 0x4e, 0x08, 0x01, 0x22, 0x24
                        ]);
                        if (
                            Buffer.compare(buf.subarray(0, 10), signature.subarray(0, 10)) === 0 &&
                            Buffer.compare(buf.subarray(14, 14 + 6), signature.subarray(14, 14 + 6)) === 0
                        ) {
                            // Mudança real de servidor detectada
                            this.updateServerTracking(src_server);
                            this.clearTcpCache();
                            this.tcp_next_seq = tcpPacket.info.seqno + buf.length;
                            this.userDataManager.refreshEnemyCache();
                            if (this.globalSettings.autoClearOnServerChange && this.userDataManager.lastLogTime !== 0 && this.userDataManager.users.size !== 0) {
                                console.log(`[CLEAR-ALL] Chamando clearAll() devido a mudança de servidor (pacote 0x62)`);
                                console.log(`  autoClearOnServerChange: ${this.globalSettings.autoClearOnServerChange}`);
                                console.log(`  lastLogTime: ${this.userDataManager.lastLogTime}`);
                                console.log(`  users.size: ${this.userDataManager.users.size}`);
                                this.userDataManager.clearAll(this.globalSettings);
                                console.log('¡Servidor cambiado, estadísticas limpiadas!');
                            } else {
                                console.log(`[CLEAR-ALL] NÃO chamando clearAll() (pacote 0x62):`);
                                console.log(`  autoClearOnServerChange: ${this.globalSettings.autoClearOnServerChange}`);
                                console.log(`  lastLogTime: ${this.userDataManager.lastLogTime}`);
                                console.log(`  users.size: ${this.userDataManager.users.size}`);
                            }
                            console.log('Servidor de juego detectado por paquete de inicio de sesión. Midiendo DPS...');
                            // Emitir evento de conexão estabelecida
                            if (!this.isConnected && this.io) {
                                this.isConnected = true;
                                this.io.emit('game-connected', { connected: true });
                            }
                        }
                    }
                } catch (e) {}
                return;
            }
            
            // Atualizar timestamp de último pacote válido (não é mudança de servidor)
            if (!isServerChange && this.current_server === src_server) {
                const now = Date.now();
                const timeSinceLastPacket = now - this.lastValidServerPacket;
                if (timeSinceLastPacket > 1000) { // Log apenas se passou mais de 1 segundo
                    console.log(`[PACKET] Recebido pacote válido após ${timeSinceLastPacket}ms`);
                }
                this.lastValidServerPacket = now;
            }

            if (this.tcp_next_seq === -1) {
                this.logger.error('Unexpected TCP capture error! tcp_next_seq is -1');
                if (buf.length > 4 && buf.readUInt32BE() < 0x0fffff) {
                    this.tcp_next_seq = tcpPacket.info.seqno;
                }
            }

            if ((this.tcp_next_seq - tcpPacket.info.seqno) << 0 <= 0 || this.tcp_next_seq === -1) {
                this.tcp_cache.set(tcpPacket.info.seqno, buf);
            }
            while (this.tcp_cache.has(this.tcp_next_seq)) {
                const seq = this.tcp_next_seq;
                const cachedTcpData = this.tcp_cache.get(seq);
                this._data = this._data.length === 0 ? cachedTcpData : Buffer.concat([this._data, cachedTcpData]);
                this.tcp_next_seq = (seq + cachedTcpData.length) >>> 0;
                this.tcp_cache.delete(seq);
                this.tcp_last_time = Date.now();
            }

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
            this.eth_queue.push(Buffer.from(buffer.subarray(0, nbytes)));
        });

        (async () => {
            while (true) {
                if (this.eth_queue.length) {
                    const pkt = this.eth_queue.shift();
                    this.processEthPacket(pkt);
                } else {
                    await new Promise((r) => setTimeout(r, 1));
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
                this.logger.warn('Cannot capture the next packet! Is the game closed or disconnected? seq: ' + this.tcp_next_seq);
                this.current_server = '';
                this.clearTcpCache();
            }
        }, 10000);
    }
}

module.exports = Sniffer;