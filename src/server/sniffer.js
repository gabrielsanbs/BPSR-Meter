const cap = require('cap');
const decoders = cap.decoders;
const PROTOCOL = decoders.PROTOCOL;
const findDefaultNetworkDevice = require('../../algo/netInterfaceUtil');
const { Lock } = require('./dataManager');

const Cap = cap.Cap;

const NPCAP_INSTALLER_PATH = require('path').join(__dirname, '..', '..', 'Dist', 'npcap-1.83.exe');
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
const MAX_HANDSHAKE_SCAN_BYTES = 8192;
const MAX_HANDSHAKE_SEGMENT_BYTES = 65536;

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
        this.globalSettings = globalSettings;
        this.current_server = '';
        this.currentServerKey = '';

        // Connection-Aware TCP Reassembly
        // Cache por conexão (key = "ip:port <-> ip:port")
        this.tcp_connections = new Map();
        // Conexão ativa (referência para a conexão atual do jogo)
        this.activeConnection = null;

        this.tcp_last_time = 0;
        this.tcp_lock = new Lock();
        this.fragmentIpCache = new Map();
        this.FRAGMENT_TIMEOUT = 30000;
        this.eth_queue = [];
        this.capInstance = null;
        this.packetProcessor = null;
        this.isPaused = false;
        this.pauseStart = null;
        this.io = null;
        this.isConnected = false;

        // Sistema de detecção de servidor
        this.lastValidServerPacket = 0;
        this.serverChangeGracePeriod = this.globalSettings.fastServerChangeDetection ? 1500 : 4000;
        this.pendingServerNotice = null;
        this.lastServerChangeTime = 0;
        this.awaitingServerData = false;
        this.serverDataDeadline = 0;
        this.serverDetectionTimestamp = 0;
        this.serverHistory = new Map();
        this.consecutiveServerChanges = 0;
        this.lastTcpCleanup = 0;
        this.MAX_TCP_CACHE_SIZE = 4096;
        this.TCP_CACHE_TTL = 15000;

        // Sistema de cooldown para handshakes + filtro de tamanho
        this.lastHandshakeTime = 0;
        this.HANDSHAKE_COOLDOWN = 5000; // 5 segundos entre handshakes
        this.lastHandshakeType = null;
        this.MIN_LONG_HANDSHAKE_SIZE = 150; // Filtrar sync packets pequenos
        this.serverNoticeCooldown = 1500; // evitar spams de eventos para o front
        this.lastServerNotice = { key: '', timestamp: 0 };

        // Intervalo de limpeza de fragmentos
        this.fragmentCleanupInterval = null;
    }

    /**
     * Obtém ou cria uma estrutura de cache para uma conexão TCP específica
     * @param {string} serverKey - Chave normalizada da conexão (ex: "ip:port <-> ip:port")
     * @returns {Object} Objeto contendo _data, tcp_next_seq, tcp_cache, etc.
     */
    getOrCreateConnection(serverKey) {
        if (!this.tcp_connections.has(serverKey)) {
            this.tcp_connections.set(serverKey, {
                _data: Buffer.alloc(0),
                tcp_next_seq: -1,
                tcp_cache: new Map(),
                tcp_last_time: 0,
                last_packet_time: Date.now()
            });
        }
        return this.tcp_connections.get(serverKey);
    }

    detectHandshakeType(buf) {
        if (!buf || !Buffer.isBuffer(buf)) return null;

        // Assinatura longa (0x63...) - NOVO MAPA
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
                        // FILTRO: Ignorar LONG handshakes muito pequenos (provavelmente sync packets)
                        if (buf.length < this.MIN_LONG_HANDSHAKE_SIZE) {
                            return null;
                        }

                        return 'long';
                    }
                }
                offset += expectedLength;
            }
        }

        // Assinatura curta (0x62...) - MUDANÇA DE SALA/CANAL
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
        const now = Date.now();
        const timeSinceLastChange = now - this.lastServerChangeTime;

        const changeSummary = `type=${handshakeType || 'no-handshake'} from=${this.current_server || 'none'} to=${src_server} Δ=${timeSinceLastChange}ms`;
        this.logger.info(`[SERVER-CHANGE] ${changeSummary}`);

        if (handshakeType === 'long') {
            this.logger.info('[SERVER] Carregando novo mapa...');
        } else if (handshakeType === 'short') {
            this.logger.info('[SERVER] Mudança de sala detectada.');
        } else {
            this.logger.info('[SERVER] Mudança de servidor detectada.');
        }

        this.updateServerTracking(src_server);
        this.clearTcpCache();

        // Inicializar nova conexão após mudança
        const normalizedServerKey = this.normalizeConnectionKey(src_server);
        const newConn = this.getOrCreateConnection(normalizedServerKey);
        newConn.tcp_next_seq = tcpPacket.info.seqno + buf.length;
        this.activeConnection = newConn;

        this.userDataManager.refreshEnemyCache();

        if (this.io) {
            try {
                const eventKey = `${handshakeType || 'unknown'}|${this.currentServerKey}`;
                const duplicateWithinCooldown = this.lastServerNotice.key === eventKey && (now - this.lastServerNotice.timestamp) < this.serverNoticeCooldown;
                if (!duplicateWithinCooldown) {
                    this.io.emit('server-change', {
                        handshakeType: handshakeType || 'unknown',
                        server: src_server,
                        timestamp: now,
                    });
                    this.lastServerNotice = { key: eventKey, timestamp: now };
                }
            } catch (emitError) {
                this.logger.error('Falha ao emitir evento server-change:', emitError);
            }
        }

        // A limpeza e salvamento de luta agora são conduzidos
        // principalmente pela SceneData (handleSceneChange) e pelo
        // timeout de inatividade de dano. Aqui evitamos chamar
        // clearAll() novamente para não gerar resets e históricos
        // duplicados em mudanças de sala/servidor ruidosas.

        if (!this.isConnected && this.io) {
            this.isConnected = true;
            this.io.emit('game-connected', { connected: true });
        }

        this.awaitingServerData = true;
        const extraBuffer = 500; // Reduzido de 2000ms - troca de mapa já foi validada pelo handshake
        this.serverDataDeadline = Date.now() + (this.globalSettings.fastServerChangeDetection ? 1000 : 2000);
    }

    updateGracePeriod() {
        this.serverChangeGracePeriod = this.globalSettings.fastServerChangeDetection ? 1500 : 4000;
    }

    setPaused(paused) {
        try {
            if (paused) {
                this.pauseStart = Date.now();
                this.isPaused = true;
                try { this.eth_queue.length = 0; } catch (e) { }
                try { this.clearTcpCache(); } catch (e) { }
                try { this.fragmentIpCache.clear(); } catch (e) { }
            } else {
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
                try { this.eth_queue.length = 0; } catch (e) { }
                try { this.clearTcpCache(); } catch (e) { }
            }
        } catch (e) {
            this.logger && this.logger.error && this.logger.error('Error changing pause state:', e);
            this.isPaused = !!paused;
        }
    }

    clearTcpCache() {
        // Limpar TODAS as conexões
        this.tcp_connections.clear();
        this.activeConnection = null;
        this.tcp_last_time = 0;
        this.lastTcpCleanup = Date.now();
    }

    cleanupTcpCache(now = Date.now()) {
        if (!this.tcp_connections.size) return;
        if (now - this.lastTcpCleanup < 1000) return;
        this.lastTcpCleanup = now;

        // Limpar cada conexão individualmente
        for (const [connKey, conn] of this.tcp_connections) {
            if (!conn) continue;

            // TIMEOUT: Se buffer travado por 5s sem progresso, limpar
            if (conn._data && conn._data.length > 0 &&
                now - conn.last_packet_time > 5000) {
                this.logger.warn(`[TIMEOUT] Conexão ${connKey} travada (buffer=${conn._data.length}bytes), limpando...`);
                conn._data = Buffer.alloc(0);
                conn.tcp_next_seq = -1;
            }

            // Limpar entradas antigas do cache
            if (conn.tcp_cache) {
                for (const [seq, entry] of conn.tcp_cache) {
                    if (!entry || !entry.buffer) {
                        conn.tcp_cache.delete(seq);
                        continue;
                    }
                    if (now - entry.timestamp > this.TCP_CACHE_TTL) {
                        conn.tcp_cache.delete(seq);
                    }
                }

                // Limitar tamanho do cache
                while (conn.tcp_cache.size > this.MAX_TCP_CACHE_SIZE) {
                    const oldestKey = conn.tcp_cache.keys().next().value;
                    if (oldestKey === undefined) break;
                    this.logger.warn(`TCP cache de ${connKey} ultrapassou ${this.MAX_TCP_CACHE_SIZE} entradas, descartando seq ${oldestKey}`);
                    conn.tcp_cache.delete(oldestKey);
                }
            }
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

        if (!this.current_server || this.current_server === '') {
            this.currentServerKey = newServerKey;
            return true;
        }
        // faz Verificação de isRealServerChange e Validação de Grace Period

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
        if (this.isPaused) return;

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

        await this.tcp_lock.acquire();
        try {
            // PRIORIDADE: Detectar handshake com cooldown + verificação de mudança real
            if (handshakeType && normalizedServerKey !== this.currentServerKey) {
                const timeSinceLastHandshake = now - this.lastHandshakeTime;

                // Verificar mudança real de servidor (IP ou porta diferente)
                const hasRealServerChange = this.currentServerKey !== normalizedServerKey;
                if (!hasRealServerChange) {
                    return;
                }

                // Aplicar cooldown: ignorar handshakes muito próximos
                if (timeSinceLastHandshake < this.HANDSHAKE_COOLDOWN) {
                    return;
                }

                // Atualizar timestamp do último handshake
                this.lastHandshakeTime = now;
                this.lastHandshakeType = handshakeType;

                await this.applyServerChange(handshakeType, src_server, buf, tcpPacket);
                return;
            }

            // Verificar mudança real de servidor (sem handshake)
            const isServerChange = this.isRealServerChange(src_server);

            if (isServerChange) {
                await this.applyServerChange(null, src_server, buf, tcpPacket);
                return;
            }

            // CANCELA a espera e processa o dano imediatamente.
            if (this.awaitingServerData && buf.length > 4) {
                const possibleLen = buf.readUInt32BE();
                // Verifica se o tamanho é realista (< 1MB) para evitar ler lixo
                if (possibleLen < 0x0fffff) {
                    this.awaitingServerData = false; // Destrava o sniffer
                    this.serverDataDeadline = 0;     // Zera o timer
                } else {
                }
            }

            // Atualizar timestamp de último pacote válido
            if (!isServerChange && normalizedServerKey === this.currentServerKey) {
                this.lastValidServerPacket = now;
                this.serverDetectionTimestamp = now;
                this.awaitingServerData = false;
            }

            // NOVO: Obter/criar conexão específica
            const conn = this.getOrCreateConnection(normalizedServerKey);

            // FILTRO: Ignorar pacotes de outras conexões (APÓS detectar mudança)
            if (this.currentServerKey && normalizedServerKey !== this.currentServerKey) {
                return; // Seguro pois mudança já foi detectada acima
            }

            // Marcar como conexão ativa se for a do servidor atual
            if (normalizedServerKey === this.currentServerKey) {
                this.activeConnection = conn;
            }

            // Inicialização do tcp_next_seq DA CONEXÃO
            if (conn.tcp_next_seq === -1) {
                if (buf.length > 4) {
                    const firstLen = buf.readUInt32BE();
                    if (firstLen < 0x0fffff) {
                        conn.tcp_next_seq = tcpPacket.info.seqno;
                    }
                }
            }

            // Adicionar ao cache DA CONEXÃO se necessário
            if ((conn.tcp_next_seq - tcpPacket.info.seqno) << 0 <= 0 || conn.tcp_next_seq === -1) {
                if (buf.length === 0) {
                    // Apenas atualizamos o timestamp para manter a conexão viva
                    conn.tcp_last_time = now;
                } else {
                    // Proteção extra de inicialização
                    if (conn.tcp_next_seq === -1 && conn.tcp_cache.size > 100) {
                        conn.tcp_cache.clear();
                    }
                    conn.tcp_cache.set(tcpPacket.info.seqno, { buffer: buf, timestamp: now });
                }
            }


            // Processar cache DA CONEXÃO
            while (conn.tcp_cache.has(conn.tcp_next_seq)) {
                const seq = conn.tcp_next_seq;
                const cachedEntry = conn.tcp_cache.get(seq);
                const cachedTcpData = cachedEntry ? cachedEntry.buffer : null;

                if (!cachedTcpData) {
                    conn.tcp_cache.delete(seq);
                    break;
                }

                if (conn._data.length === 0) {
                    const len = cachedTcpData.length;

                    // FILTRO 1: EXITLAG KEEP-ALIVE (41/53 bytes)
                    if (len <= 4 || len === 41 || len === 53) {
                        conn.tcp_next_seq = (seq + len) >>> 0;
                        conn.tcp_cache.delete(seq);
                        conn.last_packet_time = now; // Atualizar timestamp para timeout
                        continue;
                    }

                    // FILTRO 2: Validação de Header Blue Protocol
                    const possibleHeader = cachedTcpData.readUInt32BE();
                    if (possibleHeader > 0x0fffff || possibleHeader === 0) {
                        this.logger.debug(`[CORRUPT-HEADER] Descartando pacote: size=${possibleHeader} len=${len}`);
                        conn.tcp_next_seq = (seq + len) >>> 0;
                        conn.tcp_cache.delete(seq);
                        conn.last_packet_time = now;
                        continue;
                    }

                    // Se chegou aqui, o header é VÁLIDO
                }

                conn._data = conn._data.length === 0 ? cachedTcpData : Buffer.concat([conn._data, cachedTcpData]);
                conn.tcp_next_seq = (seq + cachedTcpData.length) >>> 0;
                conn.tcp_cache.delete(seq);
                conn.last_packet_time = now; // Atualizar timestamp de sucesso
            }

            this.cleanupTcpCache(now);

            // Processar pacotes completos do buffer DA CONEXÃO
            while (conn._data.length > 4) {
                let packetSize = conn._data.readUInt32BE();

                if (conn._data.length < packetSize) break;

                if (conn._data.length >= packetSize) {
                    const packet = conn._data.subarray(0, packetSize);
                    conn._data = conn._data.subarray(packetSize);
                    if (this.packetProcessor) {
                        this.packetProcessor.processPacket(packet, this.isPaused, this.globalSettings);
                    }
                } else if (packetSize > 0x0fffff) {
                    this.logger.error(`[CORRUPT] Invalid packet size: ${packetSize} (buffer=${conn._data.length}bytes, conn=${normalizedServerKey})`);
                    conn._data = Buffer.alloc(0); // Limpar buffer corrompido
                    conn.tcp_next_seq = -1;
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

        let devices = null; // Variável para armazenar a lista atualizada

        let num = deviceNum;
        if (num === undefined || num === 'auto') {
            let deviceFound = false;
            let attempts = 0;

            while (!deviceFound) {
                // Isso resolve o problema da instalação limpa onde o driver/rede demora a aparecer.
                try {
                    devices = Cap.deviceList();
                } catch (e) {
                    this.logger.warn(`Erro ao listar dispositivos: ${e.message}. Tentando novamente...`);
                }

                if (devices && devices.length > 0) {
                    const device_num = await findDefaultNetworkDevice(devices);
                    if (device_num !== undefined) {
                        num = device_num;
                        deviceFound = true;
                    } else {
                        this.logger.warn(`Nenhuma interface com tráfego detectada (Tentativa ${++attempts})...`);
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3s antes de tentar de novo
                    }
                } else {
                    this.logger.warn('Nenhum dispositivo de rede encontrado. Verifique Npcap. Tentando novamente em 3s...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        } else {
            // Modo manual para seleção de dispositivo
            devices = Cap.deviceList();
        }

        if (num === undefined || !devices || !devices[num]) {
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
            if (this.eth_queue.length < 1000) {
                this.eth_queue.push(Buffer.from(buffer.subarray(0, nbytes)));
            }
        });

        (async () => {
            while (true) {
                if (!this.eth_queue.length) {
                    await new Promise((r) => setTimeout(r, 4));
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

        this.fragmentCleanupInterval = setInterval(async () => {
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
                this.current_server = '';
                this.clearTcpCache();
                this.serverDetectionTimestamp = 0;
                this.lastValidServerPacket = 0;
                this.consecutiveServerChanges = 0;
                if (this.serverHistory && typeof this.serverHistory.clear === 'function') {
                    this.serverHistory.clear();
                }
            }
        }, 10000);
    }

    _debugLog(message) {
        if (this.logger && typeof this.logger.debug === 'function') {
            this.logger.debug(message);
        } else {
            console.log(message);
        }
    }

    /** Método de cleanup para limpar recursos antes de fechar */
    cleanup() {
        this.logger.info('Limpando recursos do Sniffer...');

        // Limpar intervalo de limpeza de fragmentos
        if (this.fragmentCleanupInterval) {
            clearInterval(this.fragmentCleanupInterval);
            this.fragmentCleanupInterval = null;
        }

        this.logger.info('Recursos do Sniffer limpos com sucesso');
    }
}

module.exports = Sniffer;