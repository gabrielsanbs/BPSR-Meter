const fsPromises = require('fs').promises;
const path = require('path');
const skillConfig = require('../../tables/skill_names.json').skill_names; // Ajustar la ruta

class Lock {
    constructor() {
        this.queue = [];
        this.locked = false;
    }

    async acquire() {
        if (this.locked) {
            return new Promise((resolve) => this.queue.push(resolve));
        }
        this.locked = true;
    }

    release() {
        if (this.queue.length > 0) {
            const nextResolve = this.queue.shift();
            nextResolve();
        } else {
            this.locked = false;
        }
    }
}

function getSubProfessionBySkillId(skillId) {
    switch (skillId) {
        case 1241:
            return '射线';
        case 2307:
        case 2361:
        case 55302:
            return '协奏';
        case 20301:
            return '愈合';
        case 1518:
        case 1541:
        case 21402:
            return '惩戒';
        case 2306:
            return '狂音';
        case 120901:
        case 120902:
            return '冰矛';
        case 1714:
        case 1734:
            return '居合';
        case 44701:
        case 179906:
            return '月刃';
        case 220112:
        case 2203622:
            return '鹰弓';
        case 2292:
        case 1700820:
        case 1700825:
        case 1700827:
            return '狼弓';
        case 1419:
            return '空枪';
        case 1405:
        case 1418:
            return '重装';
        case 2405:
            return '防盾';
        case 2406:
            return '光盾';
        case 1922:
            return '岩盾';
        case 1930:
        case 1931:
        case 1934:
        case 1935:
            return '格挡';
        default:
            return '';
    }
}

class StatisticData {
    constructor(user, type, element) {
        this.user = user;
        this.type = type || '';
        this.element = element || '';
        this.stats = {
            normal: 0,
            critical: 0,
            lucky: 0,
            crit_lucky: 0,
            hpLessen: 0, 
            total: 0,
        };
        this.count = {
            normal: 0,
            critical: 0,
            lucky: 0,
            crit_lucky: 0,
            total: 0,
        };
        this.realtimeWindow = [];
        this.timeRange = [];
        this.totalPausedTime = 0; // Tempo total acumulado em pause (em ms)
        this.realtimeStats = {
            value: 0,
            max: 0,
        };
    }

    /** 添加数据记录
     * @param {number} value - 数值
     * @param {boolean} isCrit - 是否为暴击
     * @param {boolean} isLucky - 是否为幸运
     * @param {number} hpLessenValue - 生命值减少量（仅伤害使用）
     */
    addRecord(value, isCrit, isLucky, hpLessenValue = 0) {
        const now = Date.now();


        if (isCrit) {
            if (isLucky) {
                this.stats.crit_lucky += value;
            } else {
                this.stats.critical += value;
            }
        } else if (isLucky) {
            this.stats.lucky += value;
        } else {
            this.stats.normal += value;
        }
        this.stats.total += value;
        this.stats.hpLessen += hpLessenValue;

        if (isCrit) {
            this.count.critical++;
        }
        if (isLucky) {
            this.count.lucky++;
        }
        if (!isCrit && !isLucky) {
            this.count.normal++;
        }
        if (isCrit && isLucky) {
            this.count.crit_lucky++;
        }
        this.count.total++;

        this.realtimeWindow.push({
            time: now,
            value,
        });

        if (this.timeRange[0]) {
            this.timeRange[1] = now;
        } else {
            this.timeRange[0] = now;
        }
    }

    updateRealtimeStats() {
        const now = Date.now();

        while (this.realtimeWindow.length > 0 && now - this.realtimeWindow[0].time > 1000) {
            this.realtimeWindow.shift();
        }

        this.realtimeStats.value = 0;
        for (const entry of this.realtimeWindow) {
            this.realtimeStats.value += entry.value;
        }
        if (this.realtimeStats.value > this.realtimeStats.max) {
            this.realtimeStats.max = this.realtimeStats.value;
        }
    }

    /** Ajustar rangos de tiempo para excluir periodos pausados
     * @param {number} duration - Duración en ms que estuvo en pausa
     */
    adjustForPause(duration) {
        if (duration && duration > 0) {
            // Acumular o tempo total pausado (suporta múltiplos pause/unpause)
            this.totalPausedTime += duration;
        }
        // Não modificar timeRange diretamente - isso causava bugs com múltiplos pauses!
        // Em vez disso, subtraímos totalPausedTime no cálculo de DPS/HPS
    }

    getTotalPerSecond() {
        if (!this.timeRange[0] || !this.timeRange[1]) {
            return 0;
        }
        // Tempo total = fim - início - tempo pausado
        const actualElapsedTime = (this.timeRange[1] - this.timeRange[0]) - this.totalPausedTime;
        
        // Evitar divisão por zero ou tempos negativos
        if (actualElapsedTime <= 0) return 0;
        
        const totalPerSecond = (this.stats.total / actualElapsedTime) * 1000 || 0;
        if (!Number.isFinite(totalPerSecond)) return 0;
        return totalPerSecond;
    }

    reset() {
        this.stats = {
            normal: 0,
            critical: 0,
            lucky: 0,
            crit_lucky: 0,
            hpLessen: 0,
            total: 0,
        };
        this.count = {
            normal: 0,
            critical: 0,
            lucky: 0,
            crit_lucky: 0,
            total: 0,
        };
        this.realtimeWindow = [];
        this.timeRange = [];
        this.totalPausedTime = 0; // Resetar tempo pausado também
        this.realtimeStats = {
            value: 0,
            max: 0,
        };
    }
}

class UserData {
    constructor(uid) {
        this.uid = uid;
        this.name = '';
        this.damageStats = new StatisticData(this, '伤害');
        this.healingStats = new StatisticData(this, '治疗');
        this.takenDamage = 0;
        this.deadCount = 0;
        this.profession = '未知';
        this.skillUsage = new Map();
        this.fightPoint = 0;
        this.subProfession = '';
        this.attr = {};
    }

    /** 添加伤害记录
     * @param {number} skillId - 技能ID/Buff ID
     * @param {string} element - 技能元素属性
     * @param {number} damage - 伤害值
     * @param {boolean} isCrit - 是否为暴击
     * @param {boolean} [isLucky] - 是否为幸运
     * @param {boolean} [isCauseLucky] - 是否造成幸运
     * @param {number} hpLessenValue - 生命值减少量
     */
    addDamage(skillId, element, damage, isCrit, isLucky, isCauseLucky, hpLessenValue = 0) {
        this.damageStats.addRecord(damage, isCrit, isLucky, hpLessenValue);
        if (!this.skillUsage.has(skillId)) {
            this.skillUsage.set(skillId, new StatisticData(this, '伤害', element));
        }
        this.skillUsage.get(skillId).addRecord(damage, isCrit, isCauseLucky, hpLessenValue);
        this.skillUsage.get(skillId).realtimeWindow.length = 0;

        const subProfession = getSubProfessionBySkillId(skillId);
        if (subProfession) {
            this.setSubProfession(subProfession);
        }
    }

    /** 添加治疗记录
     * @param {number} skillId - 技能ID/Buff ID
     * @param {string} element - 技能元素属性
     * @param {number} healing - 治疗值
     * @param {boolean} isCrit - 是否为暴击
     * @param {boolean} [isLucky] - 是否为幸运
     * @param {boolean} [isCauseLucky] - 是否造成幸运
     */
    addHealing(skillId, element, healing, isCrit, isLucky, isCauseLucky) {
        this.healingStats.addRecord(healing, isCrit, isLucky);
        // 记录技能使用情况
        skillId = skillId + 1000000000;
        if (!this.skillUsage.has(skillId)) {
            this.skillUsage.set(skillId, new StatisticData(this, '治疗', element));
        }
        this.skillUsage.get(skillId).addRecord(healing, isCrit, isCauseLucky);
        this.skillUsage.get(skillId).realtimeWindow.length = 0;

        const subProfession = getSubProfessionBySkillId(skillId - 1000000000);
        if (subProfession) {
            this.setSubProfession(subProfession);
        }
    }

    /** 添加承伤记录
     * @param {number} damage - 承受的伤害值
     * @param {boolean} isDead - 是否致死伤害
     * */
    addTakenDamage(damage, isDead) {
        this.takenDamage += damage;
        if (isDead) this.deadCount++;
    }

    updateRealtimeDps() {
        this.damageStats.updateRealtimeStats();
        this.healingStats.updateRealtimeStats();
    }

    getTotalDps() {
        return this.damageStats.getTotalPerSecond();
    }

    getTotalHps() {
        return this.healingStats.getTotalPerSecond();
    }

    getTotalCount() {
        return {
            normal: this.damageStats.count.normal + this.healingStats.count.normal,
            critical: this.damageStats.count.critical + this.healingStats.count.critical,
            lucky: this.damageStats.count.lucky + this.healingStats.count.lucky,
            crit_lucky: this.damageStats.count.crit_lucky + this.healingStats.count.crit_lucky,
            total: this.damageStats.count.total + this.healingStats.count.total,
        };
    }

    getSummary() {
        return {
            realtime_dps: this.damageStats.realtimeStats.value,
            realtime_dps_max: this.damageStats.realtimeStats.max,
            total_dps: this.getTotalDps(),
            total_damage: { ...this.damageStats.stats },
            total_count: this.getTotalCount(),
            realtime_hps: this.healingStats.realtimeStats.value,
            realtime_hps_max: this.healingStats.realtimeStats.max,
            total_hps: this.getTotalHps(),
            total_healing: { ...this.healingStats.stats },
            taken_damage: this.takenDamage,
            profession: this.profession + (this.subProfession ? `-${this.subProfession}` : ''),
            name: this.name,
            fightPoint: this.fightPoint,
            hp: this.attr.hp,
            max_hp: this.attr.max_hp,
            dead_count: this.deadCount,
        };
    }

    getSkillSummary() {
        const skills = {};
        for (const [skillId, stat] of this.skillUsage) {
            const total = stat.stats.normal + stat.stats.critical + stat.stats.lucky + stat.stats.crit_lucky;
            const critCount = stat.count.critical;
            const luckyCount = stat.count.lucky;
            const critRate = stat.count.total > 0 ? critCount / stat.count.total : 0;
            const luckyRate = stat.count.total > 0 ? luckyCount / stat.count.total : 0;
            const name = skillConfig[skillId % 1000000000] ?? skillId % 1000000000;
            const elementype = stat.element;

            skills[skillId] = {
                displayName: name,
                type: stat.type,
                elementype: elementype,
                totalDamage: stat.stats.total,
                totalCount: stat.count.total,
                critCount: stat.count.critical,
                luckyCount: stat.count.lucky,
                critRate: critRate,
                luckyRate: luckyRate,
                damageBreakdown: { ...stat.stats },
                countBreakdown: { ...stat.count },
            };
        }
        return skills;
    }

    /** 设置职业
     * @param {string} profession - 职业名称
     * */
    setProfession(profession) {
        if (profession !== this.profession) this.setSubProfession('');
        this.profession = profession;
    }

    /** 设置子职业
     * @param {string} subProfession - 子职业名称
     * */
    setSubProfession(subProfession) {
        this.subProfession = subProfession;
    }

    /** 设置姓名
     * @param {string} name - 姓名
     * */
    setName(name) {
        this.name = name;
    }

    /** 设置用户总评分
     * @param {number} fightPoint - 总评分
     */
    setFightPoint(fightPoint) {
        this.fightPoint = fightPoint;
    }

    /** 设置额外数据
     * @param {string} key
     * @param {any} value
     */
    setAttrKV(key, value) {
        this.attr[key] = value;
    }

    /** 重置数据 预留 */
    reset() {
        this.damageStats.reset();
        this.healingStats.reset();
        this.takenDamage = 0;
        this.skillUsage.clear();
        this.fightPoint = 0;
    }
}

class UserDataManager {
    constructor(logger, globalSettings, dataDir = null) {
        this.logger = logger;
        this.globalSettings = globalSettings; // Almacenar globalSettings
        this.users = new Map();
        this.userCache = new Map(); // Mantener userCache para cargar nombres y fightPoint
        this.playerMap = new Map(); // Mantener playerMap para cargar nombres

        this.hpCache = new Map();
        this.startTime = Date.now();
        this.lastDamageTime = Date.now(); // Para detectar fim de combate
        this.fightActive = false; // Indica se há uma luta ativa
        this.fightEnded = false; // Indica se luta terminou recentemente
        this.fightHistory = []; // Histórico das últimas 20 lutas
        this.MAX_FIGHT_HISTORY = 20; // Máximo de lutas no histórico
        
        // Usar diretório de dados customizado se fornecido, senão usar diretório do processo
        const baseDir = dataDir || process.cwd();
        this.FIGHT_HISTORY_PATH = path.join(baseDir, 'fight_history.json'); // Caminho do arquivo
        this.USER_CACHE_PATH = path.join(baseDir, 'user_cache.json'); // Cache de usuários

        // Debounce para salvar cache (evita escrever no disco constantemente)
        this.cacheSaveTimer = null;
        this.CACHE_SAVE_DELAY = 3000; // Salvar apenas após 3 segundos sem mudanças

        this.logLock = new Lock();
        this.logDirExist = new Set();

        this.enemyCache = {
            name: new Map(),
            hp: new Map(),
            maxHp: new Map(),
        };
    }

    async initialize() {
        // Carregar histórico de lutas do arquivo JSON
        await this.loadFightHistory();
        // Carregar cache de usuários
        await this.loadUserCache();
    }

    /** Carregar cache de usuários do arquivo JSON */
    async loadUserCache() {
        try {
            await fsPromises.access(this.USER_CACHE_PATH);
            const data = await fsPromises.readFile(this.USER_CACHE_PATH, 'utf8');
            const cacheArray = JSON.parse(data);
            
            // Converter array para Map
            this.userCache = new Map(cacheArray);
            this.logger.info(`Cache de usuários carregado: ${this.userCache.size} usuários`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.userCache = new Map();
                this.logger.info('Nenhum cache de usuários encontrado, iniciando vazio');
            } else {
                this.logger.error('Erro ao carregar cache de usuários:', error);
                this.userCache = new Map();
            }
        }
    }

    /** Salvar cache de usuários no arquivo JSON */
    async saveUserCache() {
        try {
            // Converter Map para array para serialização
            const cacheArray = Array.from(this.userCache.entries());
            await fsPromises.writeFile(
                this.USER_CACHE_PATH,
                JSON.stringify(cacheArray, null, 2),
                'utf8'
            );
            this.logger.info(`Cache de usuários salvo: ${this.userCache.size} usuários`);
        } catch (error) {
            this.logger.error('Erro ao salvar cache de usuários:', error);
        }
    }

    /** Salvar cache com debounce (evita escrever no disco constantemente)
     * Agrupa múltiplas mudanças e salva apenas após CACHE_SAVE_DELAY ms de inatividade
     * Reduz uso de CPU e disco em até 90%
     */
    scheduleCacheSave() {
        // Cancelar timer anterior se existir
        if (this.cacheSaveTimer) {
            clearTimeout(this.cacheSaveTimer);
        }
        
        // Agendar novo salvamento após CACHE_SAVE_DELAY
        this.cacheSaveTimer = setTimeout(() => {
            this.saveUserCache().catch(err => {
                this.logger.error('Erro ao salvar cache agendado:', err);
            });
            this.cacheSaveTimer = null;
        }, this.CACHE_SAVE_DELAY);
    }

    /** Carregar histórico de lutas do arquivo JSON */
    async loadFightHistory() {
        try {
            await fsPromises.access(this.FIGHT_HISTORY_PATH);
            const data = await fsPromises.readFile(this.FIGHT_HISTORY_PATH, 'utf8');
            this.fightHistory = JSON.parse(data);
            this.logger.info(`Histórico de lutas carregado: ${this.fightHistory.length} lutas`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.fightHistory = [];
                this.logger.info('Nenhum histórico de lutas encontrado, iniciando vazio');
            } else {
                this.logger.error('Erro ao carregar histórico de lutas:', error);
                this.fightHistory = [];
            }
        }
    }

    /** Salvar histórico de lutas no arquivo JSON */
    async saveFightHistoryToFile() {
        try {
            await fsPromises.writeFile(
                this.FIGHT_HISTORY_PATH,
                JSON.stringify(this.fightHistory, null, 2),
                'utf8'
            );
            this.logger.info(`Histórico de lutas salvo: ${this.fightHistory.length} lutas`);
        } catch (error) {
            this.logger.error('Erro ao salvar histórico de lutas:', error);
        }
    }
    /** Obtener o crear usuario
     * @param {number} uid - ID de usuario
     * @returns {UserData} - Instancia de datos de usuario
     */
    getUser(uid) {
        if (!this.users.has(uid)) {
            const user = new UserData(uid);
            const uidStr = String(uid);
            const cachedData = this.userCache.get(uidStr);
            
            // Definir nome padrão primeiro
            let hasName = false;
            
            if (this.playerMap.has(uidStr)) {
                const nameFromPlayerMap = this.playerMap.get(uidStr);
                user.setName(nameFromPlayerMap);
                hasName = true;
            }
            if (cachedData) {
                if (cachedData.name) {
                    user.setName(cachedData.name);
                    hasName = true;
                }
                // Profissão NÃO é mais salva no cache (removido para reduzir tamanho)
                if (cachedData.fightPoint !== undefined && cachedData.fightPoint !== null) {
                    user.setFightPoint(cachedData.fightPoint);
                }
                if (cachedData.maxHp !== undefined && cachedData.maxHp !== null) {
                    user.setAttrKV('max_hp', cachedData.maxHp);
                }
            }
            
            // Se não tem nome, usar nome temporário
            if (!hasName) {
                user.setName(`Player ${uid}`);
            }
            
            if (this.hpCache.has(uid)) {
                user.setAttrKV('hp', this.hpCache.get(uid));
            }

            this.users.set(uid, user);
        }
        return this.users.get(uid);
    }

    /** Agregar registro de daño
     * @param {number} uid - ID del usuario que inflige el daño
     * @param {number} skillId - ID de la habilidad/Buff
     * @param {string} element - Atributo elemental de la habilidad
     * @param {number} damage - Valor del daño
     * @param {boolean} isCrit - Si es crítico
     * @param {boolean} [isLucky] - Si es de fortuna
     * @param {boolean} [isCauseLucky] - Si causa fortuna
     * @param {number} hpLessenValue - Reducción de vida real
     * @param {number} targetUid - ID del objetivo del daño
     */
    addDamage(uid, skillId, element, damage, isCrit, isLucky, isCauseLucky, hpLessenValue = 0, targetUid) {
        // isPaused y globalSettings.onlyRecordEliteDummy se manejarán en el sniffer o en el punto de entrada
        this.checkTimeoutClear();
        
        // Marcar início da luta se não estiver ativa
        if (!this.fightActive) {
            this.startFight();
        }
        
        // Atualizar tempo do último dano
        this.lastDamageTime = Date.now();
        
        const user = this.getUser(uid);
        user.addDamage(skillId, element, damage, isCrit, isLucky, isCauseLucky, hpLessenValue);
    }

    /** Agregar registro de curación
     * @param {number} uid - ID del usuario que realiza la curación
     * @param {number} skillId - ID de la habilidad/Buff
     * @param {string} element - Atributo elemental de la habilidad
     * @param {number} healing - Valor de la curación
     * @param {boolean} isCrit - Si es crítico
     * @param {boolean} [isLucky] - Si es de fortuna
     * @param {boolean} [isCauseLucky] - Si causa fortuna
     * @param {number} targetUid - ID del objetivo de la curación
     */
    addHealing(uid, skillId, element, healing, isCrit, isLucky, isCauseLucky, targetUid) {
        // isPaused se manejará en el sniffer o en el punto de entrada
        this.checkTimeoutClear();
        
        // Atualizar tempo do último dano/healing
        this.lastDamageTime = Date.now();
        
        if (uid !== 0) {
            const user = this.getUser(uid);
            user.addHealing(skillId, element, healing, isCrit, isLucky, isCauseLucky);
        }
    }

    /** Agregar registro de daño recibido
     * @param {number} uid - ID del usuario que recibe el daño
     * @param {number} damage - Valor del daño recibido
     * @param {boolean} isDead - Si es daño letal
     * */
    addTakenDamage(uid, damage, isDead) {
        // isPaused se manejará en el sniffer o en el punto de entrada
        this.checkTimeoutClear();
        const user = this.getUser(uid);
        user.addTakenDamage(damage, isDead);
    }

    /** Agregar registro de log
     * @param {string} log - Contenido del log
     * */
    async addLog(log) {
        if (!this.globalSettings.enableFightLog) return;

        const logDir = path.join('./logs', String(this.startTime));
        const logFile = path.join(logDir, 'fight.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${log}\n`;

        await this.logLock.acquire();
        try {
            if (!this.logDirExist.has(logDir)) {
                try {
                    await fsPromises.access(logDir);
                } catch (error) {
                    await fsPromises.mkdir(logDir, { recursive: true });
                }
                this.logDirExist.add(logDir);
            }
            await fsPromises.appendFile(logFile, logEntry, 'utf8');
        } catch (error) {
            this.logger.error('Failed to save log:', error);
        }
        this.logLock.release();
    }

    /** Establecer profesión de usuario
     * @param {number} uid - ID de usuario
     * @param {string} profession - Nombre de la profesión
     * */
    setProfession(uid, profession) {
        const user = this.getUser(uid);
        if (user.profession !== profession) {
            user.setProfession(profession);
            this.logger.info(`Found profession ${profession} for uid ${uid}`);
        }
    }

    /** Establecer nombre de usuario
     * @param {number} uid - ID de usuario
     * @param {string} name - Nombre
     * */
    setName(uid, name) {
        const user = this.getUser(uid);
        if (user.name !== name) {
            user.setName(name);
            this.logger.info(`Found player name ${name} for uid ${uid}`);
            
            // Atualizar cache em memória
            const uidStr = String(uid);
            const cachedData = this.userCache.get(uidStr) || {};
            cachedData.name = name;
            this.userCache.set(uidStr, cachedData);
            
            // Agendar salvamento em arquivo com debounce (reduz I/O)
            this.scheduleCacheSave();
        }
    }

    /** Establecer puntuación de combate de usuario
     * @param {number} uid - ID de usuario
     * @param {number} fightPoint - Puntuación de combate
     */
    setFightPoint(uid, fightPoint) {
        const user = this.getUser(uid);
        if (user.fightPoint != fightPoint) {
            user.setFightPoint(fightPoint);
            this.logger.info(`Found fight point ${fightPoint} for uid ${uid}`);
            
            // Atualizar cache em memória
            const uidStr = String(uid);
            const cachedData = this.userCache.get(uidStr) || {};
            cachedData.fightPoint = fightPoint;
            this.userCache.set(uidStr, cachedData);
            
            // Agendar salvamento em arquivo com debounce (reduz I/O)
            this.scheduleCacheSave();
        }
    }

    /** Establecer datos adicionales
     * @param {number} uid - ID de usuario
     * @param {string} key
     * @param {any} value
     */
    setAttrKV(uid, key, value) {
        const user = this.getUser(uid);
        user.attr[key] = value;
    }

    /** Actualizar DPS y HPS en tiempo real para todos los usuarios */
    updateAllRealtimeDps() {
        for (const user of this.users.values()) {
            user.updateRealtimeDps();
        }
    }

    /** Aplicar duración de pausa a todos los usuarios para que el cálculo de DPS/HPS
     * no incluya el tiempo que la aplicación estuvo en pausa.
     * @param {number} durationMs - Duración en milisegundos
     */
    applyPauseDuration(durationMs) {
        if (!durationMs || durationMs <= 0) return;
        for (const user of this.users.values()) {
            try {
                if (user.damageStats && typeof user.damageStats.adjustForPause === 'function') {
                    user.damageStats.adjustForPause(durationMs);
                }
                if (user.healingStats && typeof user.healingStats.adjustForPause === 'function') {
                    user.healingStats.adjustForPause(durationMs);
                }
            } catch (e) {
                this.logger && this.logger.error && this.logger.error('Error applying pause duration to user', user.uid, e);
            }
        }
    }

    /** Obtener datos de habilidad de usuario
     * @param {number} uid - ID de usuario
     */
    getUserSkillData(uid) {
        const user = this.users.get(uid);
        if (!user) return null;

        return {
            uid: user.uid,
            name: user.name,
            profession: user.profession + (user.subProfession ? `-${user.subProfession}` : ''),
            skills: user.getSkillSummary(),
            attr: user.attr,
        };
    }

    /** Obtener datos de todos los usuarios */
    getAllUsersData() {
        const result = {};
        for (const [uid, user] of this.users.entries()) {
            result[uid] = user.getSummary();
        }
        return result;
    }

    /** Obtener todos los datos de caché de enemigos */
    getAllEnemiesData() {
        const result = {};
        const enemyIds = new Set([...this.enemyCache.name.keys(), ...this.enemyCache.hp.keys(), ...this.enemyCache.maxHp.keys()]);
        enemyIds.forEach((id) => {
            result[id] = {
                name: this.enemyCache.name.get(id),
                hp: this.enemyCache.hp.get(id),
                max_hp: this.enemyCache.maxHp.get(id),
            };
        });
        return result;
    }

    /** Limpiar caché de enemigos */
    refreshEnemyCache() {
        this.enemyCache.name.clear();
        this.enemyCache.hp.clear();
        this.enemyCache.maxHp.clear();
    }

    /** Limpiar todos los datos de usuario */
    async clearAll() {
        // Se autoResetOnFightEnd estiver ativo, salvar a luta antes de limpar
        if (this.fightActive && this.users.size > 0) {
            await this.saveFightToHistory();
        }
        
        this.users = new Map();
        this.startTime = Date.now();
        this.lastDamageTime = Date.now();
        this.fightActive = false;
    }

    /** Iniciar uma nova luta */
    startFight() {
        if (!this.fightActive) {
            this.fightActive = true;
            this.startTime = Date.now();
            this.lastDamageTime = Date.now();
            this.logger.info('Nova luta iniciada!');
        }
    }

    /** Finalizar luta atual e salvar no histórico */
    async endFight() {
        if (this.fightActive && this.users.size > 0) {
            await this.saveFightToHistory();
            
            // Se autoResetOnFightEnd estiver ativo, limpar dados
            if (this.globalSettings.autoResetOnFightEnd) {
                this.users = new Map();
                this.startTime = Date.now();
            }
            
            this.fightActive = false;
            this.fightEnded = true; // Marcar que luta terminou
            this.logger.info('Luta finalizada e salva no histórico!');
        }
    }

    /** Salvar luta atual no histórico */
    async saveFightToHistory() {
        if (this.users.size === 0) return;

        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        // Criar snapshot dos dados atuais
        const fightData = {
            id: Date.now(), // ID único baseado em timestamp
            startTime: this.startTime,
            endTime: endTime,
            duration: duration,
            players: []
        };

        // Salvar dados de cada jogador
        for (const [uid, user] of this.users.entries()) {
            const playerData = {
                uid: uid,
                name: user.name || `Player ${uid}`,
                profession: user.profession + (user.subProfession ? `-${user.subProfession}` : ''),
                totalDamage: user.damageStats.stats.total || 0,
                totalHealing: user.healingStats.stats.total || 0,
                totalDps: user.getTotalDps(),
                totalHps: user.getTotalHps(),
                takenDamage: user.takenDamage,
                deadCount: user.deadCount,
                fightPoint: user.fightPoint,
                critRate: user.damageStats.count.total > 0 ? 
                    (user.damageStats.count.critical / user.damageStats.count.total * 100) : 0,
                luckyRate: user.damageStats.count.total > 0 ? 
                    (user.damageStats.count.lucky / user.damageStats.count.total * 100) : 0,
                peakDps: user.damageStats.realtimeStats.max
            };
            fightData.players.push(playerData);
        }

        // Ordenar por DPS total
        fightData.players.sort((a, b) => b.totalDps - a.totalDps);

        // Adicionar ao histórico (no início)
        this.fightHistory.unshift(fightData);

        // Limitar a 20 lutas
        if (this.fightHistory.length > this.MAX_FIGHT_HISTORY) {
            this.fightHistory = this.fightHistory.slice(0, this.MAX_FIGHT_HISTORY);
        }

        this.logger.info(`Luta salva no histórico. Total de lutas: ${this.fightHistory.length}`);
        
        // Salvar no arquivo JSON
        await this.saveFightHistoryToFile();
    }

    /** Obter histórico de lutas */
    getFightHistory() {
        return this.fightHistory;
    }

    /** Limpar histórico de lutas */
    async clearFightHistory() {
        this.fightHistory = [];
        await this.saveFightHistoryToFile();
        this.logger.info('Histórico de lutas limpo!');
    }

    /** Verificar se deve finalizar a luta (30s sem dano) */
    checkFightTimeout() {
        if (this.fightActive) {
            const timeSinceLastDamage = Date.now() - this.lastDamageTime;
            const FIGHT_TIMEOUT = 30000; // 30 segundos
            
            if (timeSinceLastDamage > FIGHT_TIMEOUT) {
                this.endFight();
            }
        }
    }

    /** Obtener lista de IDs de usuario */
    getUserIds() {
        return Array.from(this.users.keys());
    }

    /** Guardar todos los datos de usuario en el historial
     * @param {Map} usersToSave - Mapa de datos de usuario a guardar
     * @param {number} startTime - Hora de inicio de los datos
     */
    async saveAllUserData(usersToSave = null, startTime = null) {
        if (!this.globalSettings.enableHistorySave) return; // No guardar historial si la configuración está deshabilitada

        try {
            const endTime = Date.now();
            const users = usersToSave || this.users;
            const timestamp = startTime || this.startTime;
            const logDir = path.join('./logs', String(timestamp));
            const usersDir = path.join(logDir, 'users');
            const summary = {
                startTime: timestamp,
                endTime,
                duration: endTime - timestamp,
                userCount: users.size,
                version: '3.1', // Usar la versión directamente o pasarla como argumento
            };

            const allUsersData = {};
            const userDatas = new Map();
            for (const [uid, user] of users.entries()) {
                allUsersData[uid] = user.getSummary();

                const userData = {
                    uid: user.uid,
                    name: user.name,
                    profession: user.profession + (user.subProfession ? `-${user.subProfession}` : ''),
                    skills: user.getSkillSummary(),
                    attr: user.attr,
                };
                userDatas.set(uid, userData);
            }

            try {
                await fsPromises.access(usersDir);
            } catch (error) {
                await fsPromises.mkdir(usersDir, { recursive: true });
            }

            // Guardar resumen de todos los datos de usuario
            const allUserDataPath = path.join(logDir, 'allUserData.json');
            await fsPromises.writeFile(allUserDataPath, JSON.stringify(allUsersData, null, 2), 'utf8');

            // Guardar datos detallados de cada usuario
            for (const [uid, userData] of userDatas.entries()) {
                const userDataPath = path.join(usersDir, `${uid}.json`);
                await fsPromises.writeFile(userDataPath, JSON.stringify(userData, null, 2), 'utf8');
            }

            await fsPromises.writeFile(path.join(logDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

            this.logger.debug(`Saved data for ${summary.userCount} users to ${logDir}`);
        } catch (error) {
            this.logger.error('Failed to save all user data:', error);
            throw error;
        }
    }

    checkTimeoutClear() {
        if (!this.globalSettings.autoClearOnTimeout || this.users.size === 0) return;
        const currentTime = Date.now();
        if (this.lastLogTime && currentTime - this.lastLogTime > 20000) {
            this.clearAll();
            this.logger.info('Timeout reached, statistics cleared!');
        }
    }
}

module.exports = { StatisticData, UserData, UserDataManager, Lock, getSubProfessionBySkillId };
