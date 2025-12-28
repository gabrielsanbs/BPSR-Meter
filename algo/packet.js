const zlib = require('zlib');
const pb = require('./blueprotobuf');
const Long = require('long');
const pbjs = require('protobufjs/minimal');
const fs = require('fs');

const monsterNames = require('../tables/monster_names.json');

class BinaryReader {
    constructor(buffer, offset = 0) {
        this.buffer = buffer;
        this.offset = offset;
    }

    readUInt64() {
        const value = this.buffer.readBigUInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    peekUInt64() {
        return this.buffer.readBigUInt64BE(this.offset);
    }

    readUInt32() {
        const value = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    peekUInt32() {
        return this.buffer.readUInt32BE(this.offset);
    }

    readInt32() {
        const value = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    readUInt32LE() {
        const value = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    peekInt32() {
        return this.buffer.readInt32BE(this.offset);
    }

    readUInt16() {
        const value = this.buffer.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    peekUInt16() {
        return this.buffer.readUInt16BE(this.offset);
    }

    readBytes(length) {
        const value = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }

    peekBytes(length) {
        return this.buffer.subarray(this.offset, this.offset + length);
    }

    remaining() {
        return this.buffer.length - this.offset;
    }

    readRemaining() {
        const value = this.buffer.subarray(this.offset);
        this.offset = this.buffer.length;
        return value;
    }
}

const MessageType = {
    None: 0,
    Call: 1,
    Notify: 2,
    Return: 3,
    Echo: 4,
    FrameUp: 5,
    FrameDown: 6,
};

const NotifyMethod = {
    SyncNearEntities: 0x00000006,
    SyncContainerData: 0x00000015,
    SyncContainerDirtyData: 0x00000016,
    SyncServerTime: 0x0000002b,
    SyncNearDeltaInfo: 0x0000002d,
    SyncToMeDeltaInfo: 0x0000002e,
};

const AttrType = {
    AttrName: 0x01,
    AttrId: 0x0a,
    AttrPos: 0x34,
    AttrProfessionId: 0xdc,
    AttrFightPoint: 0x272e,
    AttrLevel: 0x2710,
    AttrRankLevel: 0x274c,
    AttrCri: 0x2b66,
    AttrLucky: 0x2b7a,
    AttrHp: 0x2c2e,
    AttrMaxHp: 0x2c38,
    AttrElementFlag: 0x646d6c,
    AttrReductionLevel: 0x64696d,
    AttrReduntionId: 0x6f6c65,
    AttrEnergyFlag: 0x543cd3c6,
};

const ProfessionType = {
    雷影剑士: 1,
    冰魔导师: 2,
    涤罪恶火_战斧: 3,
    青岚骑士: 4,
    森语者: 5,
    雷霆一闪_手炮: 8,
    巨刃守护者: 9,
    暗灵祈舞_仪刀_仪仗: 10,
    神射手: 11,
    神盾骑士: 12,
    灵魂乐手: 13,
};

const EDamageSource = {
    EDamageSourceSkill: 0,
    EDamageSourceBullet: 1,
    EDamageSourceBuff: 2,
    EDamageSourceFall: 3,
    EDamageSourceFakeBullet: 4,
    EDamageSourceOther: 100,
};

const EDamageProperty = {
    General: 0,
    Fire: 1,
    Water: 2,
    Electricity: 3,
    Wood: 4,
    Wind: 5,
    Rock: 6,
    Light: 7,
    Dark: 8,
    Count: 9,
};

const getProfessionNameFromId = (professionId) => {
    switch (professionId) {
        case ProfessionType.雷影剑士:
            return '雷影剑士';
        case ProfessionType.冰魔导师:
            return '冰魔导师';
        case ProfessionType.涤罪恶火_战斧:
            return '涤罪恶火·战斧';
        case ProfessionType.青岚骑士:
            return '青岚骑士';
        case ProfessionType.森语者:
            return '森语者';
        case ProfessionType.雷霆一闪_手炮:
            return '雷霆一闪·手炮';
        case ProfessionType.巨刃守护者:
            return '巨刃守护者';
        case ProfessionType.暗灵祈舞_仪刀_仪仗:
            return '暗灵祈舞·仪刀/仪仗';
        case ProfessionType.神射手:
            return '神射手';
        case ProfessionType.神盾骑士:
            return '神盾骑士';
        case ProfessionType.灵魂乐手:
            return '灵魂乐手';
        default:
            return '';
    }
};

const getDamageElement = (damageProperty) => {
    switch (damageProperty) {
        case EDamageProperty.General:
            return '⚔️物';
        case EDamageProperty.Fire:
            return '🔥火';
        case EDamageProperty.Water:
            return '❄️冰';
        case EDamageProperty.Electricity:
            return '⚡雷';
        case EDamageProperty.Wood:
            return '🍀森';
        case EDamageProperty.Wind:
            return '💨风';
        case EDamageProperty.Rock:
            return '⛰️岩';
        case EDamageProperty.Light:
            return '🌟光';
        case EDamageProperty.Dark:
            return '🌑暗';
        case EDamageProperty.Count:
            return '❓？'; // 未知
        default:
            return '⚔️物';
    }
};

const getDamageSource = (damageSource) => {
    switch (damageSource) {
        case EDamageSource.EDamageSourceSkill:
            return 'Skill';
        case EDamageSource.EDamageSourceBullet:
            return 'Bullet';
        case EDamageSource.EDamageSourceBuff:
            return 'Buff';
        case EDamageSource.EDamageSourceFall:
            return 'Fall';
        case EDamageSource.EDamageSourceFakeBullet:
            return 'FBullet';
        case EDamageSource.EDamageSourceOther:
            return 'Other';
        default:
            return 'Unknown';
    }
};

// IDs permitidos para enviar a BPTimer (whitelist baseada em MOB_MAPPING do bptimer-api-client v0.2.0)
// Sincronizado com: https://github.com/woheedev/bptimer/blob/main/packages/bptimer-api-client/src/constants.ts
const ALLOWED_BPTIMER_MOB_IDS = new Set([
    10007, // Storm Goblin King
    10009, // Frost Ogre
    10010, // Tempest Ogre
    10018, // Inferno Ogre
    10029, // Muku King
    10032, // Golden Juggernaut
    10056, // Brigand Leader
    10059, // Muku Chief
    10069, // Phantom Arachnocrab
    10077, // Venobzzar Incubator
    10081, // Iron Fang
    10084, // Celestial Flier
    10085, // Lizardman King
    10086, // Goblin King
    10900, // Golden Nappo (requires position)
    10901, // Silver Nappo (requires position)
    10902, // Lovely Boarlet
    10903, // Breezy Boarlet
    10904  // Loyal Boarlet (requires position)
]);

// Mobs que requerem dados de posição para tracking de localização
const LOCATION_TRACKED_MOBS = new Set([10900, 10901, 10904]);

const toSafeNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'bigint') return Number(value);
    if (Long.isLong && Long.isLong(value)) {
        return value.toNumber();
    }
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? 0 : numeric;
};

const isUuidPlayer = (uuid) => {
    return (uuid.toBigInt() & 0xffffn) === 640n;
};

const isUuidMonster = (uuid) => {
    return (uuid.toBigInt() & 0xffffn) === 64n;
};

const doesStreamHaveIdentifier = (reader) => {
    let identifier = reader.readUInt32LE();
    reader.readInt32();
    if (identifier !== 0xfffffffe) return false;
    identifier = reader.readInt32();
    reader.readInt32();
    //if (identifier !== 0xfffffffd) return false;
    return true;
};

const streamReadString = (reader) => {
    const length = reader.readUInt32LE();
    reader.readInt32();
    const buffer = reader.readBytes(length);
    reader.readInt32();
    return buffer.toString();
};

let currentUserUuid = Long.ZERO;

class PacketProcessor {
    constructor({ logger, userDataManager }) {
        this.logger = logger;
        this.userDataManager = userDataManager;
        this.currentSceneSignature = '';
    }

    _decompressPayload(buffer) {
        if (!zlib.zstdDecompressSync) {
            this.logger.warn('zstdDecompressSync is not available! Please check your Node.js version!');
            return;
        }
        return zlib.zstdDecompressSync(buffer);
    }

    _processAoiSyncDelta(aoiSyncDelta) {
        if (!aoiSyncDelta) return;

        let targetUuid = aoiSyncDelta.Uuid;
        if (!targetUuid) return;
        const isTargetPlayer = isUuidPlayer(targetUuid);
        const isTargetMonster = isUuidMonster(targetUuid);
        targetUuid = targetUuid.shiftRight(16);

        const attrCollection = aoiSyncDelta.Attrs;
        if (attrCollection && (attrCollection.Attrs || attrCollection.MapAttrs)) {
            if (isTargetPlayer) {
                const playerUid = targetUuid.toNumber();
                this._processPlayerAttrs(playerUid, attrCollection);
            } else if (isTargetMonster && attrCollection.Attrs) {
                this._processEnemyAttrs(targetUuid.toString(), targetUuid.toNumber(), attrCollection.Attrs);
            }
        }

        const skillEffect = aoiSyncDelta.SkillEffects;
        if (!skillEffect) {
            return;
        }

        if (!skillEffect.Damages) {
            return;
        }

        for (const syncDamageInfo of skillEffect.Damages) {
            const skillId = syncDamageInfo.OwnerId;
            if (!skillId) continue;

            let attackerUuid = syncDamageInfo.TopSummonerId || syncDamageInfo.AttackerUuid;
            if (!attackerUuid) continue;
            const isAttackerPlayer = isUuidPlayer(attackerUuid);
            attackerUuid = attackerUuid.shiftRight(16);

            const value = syncDamageInfo.Value;
            const luckyValue = syncDamageInfo.LuckyValue;
            const damage = value ?? luckyValue ?? Long.ZERO;
            if (damage.isZero()) continue;

            // syncDamageInfo.IsCrit doesn't seem to be set by server, use typeFlag instead
            // const isCrit = syncDamageInfo.IsCrit !== null ? syncDamageInfo.IsCrit : false;

            // TODO: from testing, first bit is set when there's crit, 3rd bit for lucky, require more testing here
            const isCrit = syncDamageInfo.TypeFlag != null ? (syncDamageInfo.TypeFlag & 1) === 1 : false;
            const isCauseLucky = syncDamageInfo.TypeFlag != null ? (syncDamageInfo.TypeFlag & 0b100) === 0b100 : false;

            const isMiss = syncDamageInfo.IsMiss != null ? syncDamageInfo.IsMiss : false;
            const isHeal = syncDamageInfo.Type === pb.EDamageType.Heal;
            const isDead = syncDamageInfo.IsDead != null ? syncDamageInfo.IsDead : false;
            const isLucky = !!luckyValue;
            const hpLessenValue = syncDamageInfo.HpLessenValue != null ? syncDamageInfo.HpLessenValue : Long.ZERO;
            const damageElement = getDamageElement(syncDamageInfo.Property);
            const damageSource = syncDamageInfo.DamageSource ?? 0;

            if (isTargetPlayer) {
                //玩家目标
                if (isHeal) {
                    //玩家被治疗
                    this.userDataManager.addHealing(
                        isAttackerPlayer ? attackerUuid.toNumber() : 0,
                        skillId,
                        damageElement,
                        damage.toNumber(),
                        isCrit,
                        isLucky,
                        isCauseLucky,
                        targetUuid.toNumber(),
                    );
                } else {
                    //玩家受到伤害
                    this.userDataManager.addTakenDamage(targetUuid.toNumber(), damage.toNumber(), isDead);
                }
                if (isDead) {
                    this.userDataManager.setAttrKV(targetUuid.toNumber(), 'hp', 0);
                }
            } else {
                //非玩家目标
                if (!isHeal) {
                    const enemyUid = targetUuid.toNumber();
                    const enemyUuidStr = targetUuid.toString();
                    const maxHp = this.userDataManager.enemyCache.maxHp.get(enemyUuidStr);
                    const monsterId = this.userDataManager.enemyCache.attrId.get(enemyUuidStr);

                    // Detectar morte do boss
                    if (isDead && monsterId && ALLOWED_BPTIMER_MOB_IDS.has(monsterId) && maxHp && maxHp > 0) {
                        this.userDataManager.enemyCache.hp.set(enemyUuidStr, 0);
                        this.userDataManager.enemyCache.hp_pct.set(enemyUuidStr, 0);
                        this.userDataManager.reportBossHP(enemyUuidStr, monsterId, 0, maxHp);
                    }

                    if (isAttackerPlayer) {
                        const hpLossForStatsSource = hpLessenValue && !hpLessenValue.isZero() ? hpLessenValue : damage;
                        const hpLossForStats = Math.abs(toSafeNumber(hpLossForStatsSource));

                        //只记录玩家造成的伤害
                        this.userDataManager.addDamage(
                            attackerUuid.toNumber(),
                            skillId,
                            damageElement,
                            toSafeNumber(damage),
                            isCrit,
                            isLucky,
                            isCauseLucky,
                            hpLossForStats,
                            enemyUid,
                        );
                    }
                }
            }

            let extra = [];
            if (isCrit) extra.push('Crit');
            if (isLucky) extra.push('Lucky');
            if (isCauseLucky) extra.push('CauseLucky');
            if (extra.length === 0) extra = ['Normal'];

            const actionType = isHeal ? 'HEAL' : 'DMG';

            let infoStr = `SRC: `;
            if (isAttackerPlayer) {
                const attacker = this.userDataManager.getUser(attackerUuid.toNumber());
                if (attacker.name) {
                    infoStr += attacker.name;
                }
                infoStr += `#${attackerUuid.toString()}(player)`;
            } else {
                if (this.userDataManager.enemyCache.name.has(attackerUuid.toNumber())) {
                    infoStr += this.userDataManager.enemyCache.name.get(attackerUuid.toNumber());
                }
                infoStr += `#${attackerUuid.toString()}(enemy)`;
            }

            let targetName = '';
            if (isTargetPlayer) {
                const target = this.userDataManager.getUser(targetUuid.toNumber());
                if (target.name) {
                    targetName += target.name;
                }
                targetName += `#${targetUuid.toString()}(player)`;
            } else {
                if (this.userDataManager.enemyCache.name.has(targetUuid.toNumber())) {
                    targetName += this.userDataManager.enemyCache.name.get(targetUuid.toNumber());
                }
                targetName += `#${targetUuid.toString()}(enemy)`;
            }
            infoStr += ` TGT: ${targetName}`;

            const dmgLogArr = [
                `[${actionType}]`,
                `DS: ${getDamageSource(damageSource)}`,
                infoStr,
                `ID: ${skillId}`,
                `VAL: ${damage}`,
                `HPLSN: ${hpLessenValue}`,
                `ELEM: ${damageElement.slice(-1)}`,
                `EXT: ${extra.join('|')}`,
            ];
            const dmgLog = dmgLogArr.join(' ');
            this.userDataManager.addLog(dmgLog);
        }
    }

    _processSyncNearDeltaInfo(payloadBuffer) {
        const syncNearDeltaInfo = pb.SyncNearDeltaInfo.decode(payloadBuffer);
        // this.logger.debug(JSON.stringify(syncNearDeltaInfo, null, 2));

        if (!syncNearDeltaInfo.DeltaInfos) return;
        for (const aoiSyncDelta of syncNearDeltaInfo.DeltaInfos) {
            this._processAoiSyncDelta(aoiSyncDelta);
        }
    }

    _processSyncToMeDeltaInfo(payloadBuffer) {
        const syncToMeDeltaInfo = pb.SyncToMeDeltaInfo.decode(payloadBuffer);
        // this.logger.debug(JSON.stringify(syncToMeDeltaInfo, null, 2));

        const aoiSyncToMeDelta = syncToMeDeltaInfo.DeltaInfo;

        const uuid = aoiSyncToMeDelta.Uuid;
        if (uuid && !currentUserUuid.eq(uuid)) {
            currentUserUuid = uuid;
            // Atualizar o UID do jogador atual no userDataManager (para BPTimer account_id)
            const playerUid = currentUserUuid.shiftRight(16).toNumber();
            if (this.userDataManager && playerUid > 0) {
                this.userDataManager.currentPlayerUid = playerUid;
            }
        }

        const aoiSyncDelta = aoiSyncToMeDelta.BaseDelta;
        if (!aoiSyncDelta) return;

        this._processAoiSyncDelta(aoiSyncDelta);
    }

    _processSyncContainerData(payloadBuffer) {
        // for some reason protobufjs doesn't work here, we use google-protobuf instead
        try {
            const syncContainerData = pb.SyncContainerData.decode(payloadBuffer);
            // this.logger.debug(JSON.stringify(syncContainerData, null, 2));
            // fs.writeFileSync('SyncContainerData.json', JSON.stringify(syncContainerData, null, 2));

            if (!syncContainerData.VData) return;
            const vData = syncContainerData.VData;

            if (!vData.CharId) return;
            const playerUid = vData.CharId.toNumber();

            if (vData.RoleLevel && vData.RoleLevel.Level) this.userDataManager.setAttrKV(playerUid, 'level', vData.RoleLevel.Level);

            if (vData.Attr && vData.Attr.CurHp) this.userDataManager.setAttrKV(playerUid, 'hp', vData.Attr.CurHp.toNumber());

            if (vData.Attr && vData.Attr.MaxHp) this.userDataManager.setAttrKV(playerUid, 'max_hp', vData.Attr.MaxHp.toNumber());

            if (!vData.CharBase) return;
            const charBase = vData.CharBase;

            if (charBase.Name) {
                this.userDataManager.setName(playerUid, charBase.Name);
            }

            if (charBase.AccountId) {
                // Salvar no nível do dataManager para persistir entre mudanças de mapa/servidor
                this.userDataManager.currentPlayerAccountId = charBase.AccountId;
            }

            if (charBase.FightPoint) this.userDataManager.setFightPoint(playerUid, charBase.FightPoint);

            if (vData.SceneData) {
                this._handleSceneDataChange(vData.SceneData);
            }

            if (!vData.ProfessionList) return;
            const professionList = vData.ProfessionList;
            if (professionList.CurProfessionId) {
                const professionName = getProfessionNameFromId(professionList.CurProfessionId);
                this.userDataManager.setProfession(playerUid, professionName);
            }
        } catch (err) {
            fs.writeFileSync('./SyncContainerData.dat', payloadBuffer);
            this.logger.warn(`Failed to decode SyncContainerData for player ${currentUserUuid.shiftRight(16)}. Please report to developer`);
            throw err;
        }
    }

    _handleSceneDataChange(sceneData) {
        const sceneInfo = this._normalizeSceneInfo(sceneData);
        if (!sceneInfo) return;

        const newSignature = this._buildSceneSignature(sceneInfo);
        if (!newSignature || newSignature === this.currentSceneSignature) {
            return;
        }

        this.currentSceneSignature = newSignature;
        const lineLabel = sceneInfo.lineId || sceneInfo.channelId || 'n/a';

        if (this.userDataManager && typeof this.userDataManager.handleSceneChange === 'function') {
            try {
                this.userDataManager.handleSceneChange(sceneInfo);
            } catch (error) {
                this.logger.error('Falha ao propagar mudança de SceneData:', error);
            }
        }
    }

    _resolveSceneField(sceneData, fieldName) {
        if (!sceneData) return undefined;

        const direct = sceneData[fieldName];
        if (direct !== undefined && direct !== null) {
            return direct;
        }

        const camelCase = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        if (sceneData[camelCase] !== undefined && sceneData[camelCase] !== null) {
            return sceneData[camelCase];
        }

        const lowerCase = fieldName.toLowerCase();
        if (sceneData[lowerCase] !== undefined && sceneData[lowerCase] !== null) {
            return sceneData[lowerCase];
        }

        const getterCandidates = [
            `get${fieldName}`,
            `get${camelCase}`,
            `get${lowerCase}`,
        ];

        for (const getter of getterCandidates) {
            if (typeof sceneData[getter] === 'function') {
                try {
                    const value = sceneData[getter]();
                    if (value !== undefined && value !== null) {
                        return value;
                    }
                } catch (error) {
                    // Ignorar getter inválido
                }
            }
        }

        return undefined;
    }

    _normalizeSceneInfo(sceneData) {
        if (!sceneData) return null;

        const normalizeNumber = (fieldName) => {
            const raw = this._resolveSceneField(sceneData, fieldName);
            if (raw === undefined || raw === null) return 0;
            if (typeof raw === 'number') return raw;
            if (typeof raw === 'string') return Number(raw) || 0;
            if (typeof raw === 'object') {
                if (typeof raw.toNumber === 'function') {
                    return raw.toNumber();
                }
                if (typeof raw.valueOf === 'function') {
                    const value = raw.valueOf();
                    if (typeof value === 'number') {
                        return value;
                    }
                }
            }
            return Number(raw) || 0;
        };

        const normalizeString = (fieldName) => {
            const raw = this._resolveSceneField(sceneData, fieldName);
            if (raw === undefined || raw === null) return '';
            if (typeof raw === 'string') return raw;
            if (Buffer.isBuffer(raw) || raw instanceof Uint8Array) {
                return Buffer.from(raw).toString('utf8').replace(/\0/g, '').trim();
            }
            if (typeof raw.toString === 'function') {
                return raw.toString();
            }
            return '';
        };

        const mapId = normalizeNumber('MapId');
        const levelMapId = normalizeNumber('LevelMapId');
        const channelId = normalizeNumber('ChannelId');
        const lineId = normalizeNumber('LineId');
        const dungeonGuid = normalizeString('DungeonGuid');
        const sceneGuid = normalizeString('SceneGuid');
        const planeId = normalizeNumber('PlaneId');
        const levelReviveId = normalizeNumber('LevelReviveId');

        const hasMeaningfulData = mapId || levelMapId || channelId || lineId || dungeonGuid || sceneGuid;
        if (!hasMeaningfulData) return null;

        return {
            mapId,
            levelMapId,
            channelId,
            lineId,
            dungeonGuid,
            sceneGuid,
            planeId,
            levelReviveId,
        };
    }

    _buildSceneSignature(sceneInfo) {
        if (!sceneInfo) return '';
        return [
            sceneInfo.mapId || 0,
            sceneInfo.levelMapId || 0,
            sceneInfo.channelId || 0,
            sceneInfo.lineId || 0,
            sceneInfo.dungeonGuid || '',
            sceneInfo.sceneGuid || '',
        ].join(':');
    }

    _processSyncContainerDirtyData(payloadBuffer) {
        if (currentUserUuid.isZero()) return;

        const syncContainerDirtyData = pb.SyncContainerDirtyData.decode(payloadBuffer);
        if (!syncContainerDirtyData.VData || !syncContainerDirtyData.VData.Buffer) return;
        const messageReader = new BinaryReader(Buffer.from(syncContainerDirtyData.VData.Buffer));

        if (!doesStreamHaveIdentifier(messageReader)) return;

        let fieldIndex = messageReader.readUInt32LE();
        messageReader.readInt32();
        switch (fieldIndex) {
            case 2: // CharBase
                if (!doesStreamHaveIdentifier(messageReader)) break;

                fieldIndex = messageReader.readUInt32LE();
                messageReader.readInt32();
                switch (fieldIndex) {
                    case 5: // Name
                        const playerName = streamReadString(messageReader);
                        if (!playerName || playerName === '') break;
                        const playerUidFromStream = currentUserUuid.shiftRight(16).toNumber();
                        this.userDataManager.setName(playerUidFromStream, playerName);
                        break;
                    case 35: // FightPoint
                        const fightPoint = messageReader.readUInt32LE();
                        messageReader.readInt32();
                        this.userDataManager.setFightPoint(currentUserUuid.shiftRight(16).toNumber(), fightPoint);
                        break;
                    default:
                        // unhandle
                        break;
                }
                break;
            case 16: // UserFightAttr
                if (!doesStreamHaveIdentifier(messageReader)) break;

                fieldIndex = messageReader.readUInt32LE();
                messageReader.readInt32();
                switch (fieldIndex) {
                    case 1: // CurHp
                        const curHp = messageReader.readUInt32LE();
                        this.userDataManager.setAttrKV(currentUserUuid.shiftRight(16).toNumber(), 'hp', curHp);
                        break;
                    case 2: // MaxHp
                        const maxHp = messageReader.readUInt32LE();
                        this.userDataManager.setAttrKV(currentUserUuid.shiftRight(16).toNumber(), 'max_hp', maxHp);
                        break;
                    default:
                        // unhandle
                        break;
                }
                break;
            case 61: // ProfessionList
                if (!doesStreamHaveIdentifier(messageReader)) break;

                fieldIndex = messageReader.readUInt32LE();
                messageReader.readInt32();
                switch (fieldIndex) {
                    case 1: // CurProfessionId
                        const curProfessionId = messageReader.readUInt32LE();
                        messageReader.readInt32();
                        if (curProfessionId) {
                            const professionUidFromStream = currentUserUuid.shiftRight(16).toNumber();
                            const professionNameFromStream = getProfessionNameFromId(curProfessionId);
                            this.userDataManager.setProfession(professionUidFromStream, professionNameFromStream);
                        }
                        break;
                    default:
                        // unhandle
                        break;
                }
                break;
            default:
                // unhandle
                break;
        }

        // this.logger.debug(syncContainerDirtyData.VData.Buffer.toString('hex'));
    }

    _processPlayerAttrs(playerUid, attrCollection) {
        const attrs = Array.isArray(attrCollection?.Attrs)
            ? attrCollection.Attrs
            : Array.isArray(attrCollection)
                ? attrCollection
                : [];
        const mapAttrs = Array.isArray(attrCollection?.MapAttrs) ? attrCollection.MapAttrs : [];

        let hasName = false;
        for (const attr of attrs) {
            if (!attr.Id || !attr.RawData) continue;

            // Otimização: Criar reader apenas quando necessário
            let reader;

            switch (attr.Id) {
                case AttrType.AttrName:
                    hasName = true;
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerName = reader.string();
                    this.userDataManager.setName(playerUid, playerName);
                    break;
                case AttrType.AttrProfessionId:
                    reader = pbjs.Reader.create(attr.RawData);
                    const professionId = reader.int32();
                    const professionName = getProfessionNameFromId(professionId);
                    this.userDataManager.setProfession(playerUid, professionName);
                    break;
                case AttrType.AttrFightPoint:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerFightPoint = reader.int32();
                    this.userDataManager.setFightPoint(playerUid, playerFightPoint);
                    break;
                case AttrType.AttrLevel:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerLevel = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'level', playerLevel);
                    break;
                case AttrType.AttrRankLevel:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerRankLevel = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'rank_level', playerRankLevel);
                    break;
                case AttrType.AttrCri:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerCri = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'cri', playerCri);
                    break;
                case AttrType.AttrLucky:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerLucky = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'lucky', playerLucky);
                    break;
                case AttrType.AttrHp:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerHp = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'hp', playerHp);
                    break;
                case AttrType.AttrMaxHp:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerMaxHp = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'max_hp', playerMaxHp);
                    break;
                case AttrType.AttrElementFlag:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerElementFlag = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'element_flag', playerElementFlag);
                    break;
                case AttrType.AttrEnergyFlag:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerEnergyFlag = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'energy_flag', playerEnergyFlag);
                    break;
                case AttrType.AttrReductionLevel:
                    reader = pbjs.Reader.create(attr.RawData);
                    const playerReductionLevel = reader.int32();
                    this.userDataManager.setAttrKV(playerUid, 'reduction_level', playerReductionLevel);
                    break;
                default:
                    // this.logger.debug(`Found unknown attrId ${attr.Id} for ${playerUid} ${attr.RawData.toString('base64')}`);
                    break;
            }
        }

        if (!hasName) {
            const nameFromMapAttr = this._extractPlayerNameFromMapAttrs(mapAttrs);
            if (nameFromMapAttr) {
                hasName = true;
                this.userDataManager.setName(playerUid, nameFromMapAttr);
            }
        }


        if (!hasName) {
            const uidStr = String(playerUid);
            if (this.userDataManager.playerMap.has(uidStr)) {
                const cachedName = this.userDataManager.playerMap.get(uidStr);
                // Verificar se o nome atual é genérico antes de substituir
                const currentUser = this.userDataManager.users.get(playerUid);
                const currentName = currentUser ? currentUser.name : '';

                if (!currentName || currentName.startsWith('Player ')) {
                    this.userDataManager.setName(playerUid, cachedName);
                    hasName = true;
                }
            }
        }
    }

    _extractPlayerNameFromMapAttrs(mapAttrs) {
        if (!Array.isArray(mapAttrs) || mapAttrs.length === 0) return null;

        for (const mapAttr of mapAttrs) {
            if (!mapAttr || !Array.isArray(mapAttr.Attrs) || mapAttr.Attrs.length === 0) continue;

            const isNameAttr = mapAttr.Id === AttrType.AttrName;

            for (const entry of mapAttr.Attrs) {
                if (!entry || entry.IsRemove) continue;

                const keyText = this._decodeMapAttrBuffer(entry.Key);
                const keyLooksLikeName = keyText ? keyText.toLowerCase().includes('name') : false;

                if (!isNameAttr && !keyLooksLikeName) continue;

                const valueText = this._decodeMapAttrBuffer(entry.Value);
                if (this._isLikelyPlayerName(valueText)) {
                    return valueText;
                }
            }
        }

        return null;
    }

    _decodeMapAttrBuffer(raw) {
        if (!raw || raw.length === 0) return '';

        try {
            let buffer;
            if (Buffer.isBuffer(raw)) {
                buffer = raw;
            } else if (raw instanceof Uint8Array) {
                buffer = Buffer.from(raw);
            } else if (typeof raw === 'string') {
                buffer = Buffer.from(raw, 'base64');
            } else {
                return '';
            }

            const decoded = buffer.toString('utf8').replace(/\0/g, '').trim();
            return decoded;
        } catch (error) {
            return '';
        }
    }

    _isLikelyPlayerName(candidate) {
        if (!candidate) return false;

        const trimmed = candidate.trim();
        if (trimmed.length < 2 || trimmed.length > 32) return false;
        if (/\r|\n/.test(trimmed)) return false;

        const hasReadableChars = /[A-Za-z0-9\u00C0-\u024F\u3040-\u30FF\u4E00-\u9FFF]/.test(trimmed);
        return hasReadableChars;
    }

    _processEnemyAttrs(enemyUuid, enemyUid, attrs) {
        let attrIdValue = null;

        for (const attr of attrs) {
            if (!attr.Id || !attr.RawData) continue;
            const reader = pbjs.Reader.create(attr.RawData);

            switch (attr.Id) {
                case AttrType.AttrName:
                    const enemyName = reader.string();
                    this.userDataManager.enemyCache.name.set(enemyUuid, enemyName);
                    break;
                case AttrType.AttrId:
                    const attrId = reader.int32();
                    attrIdValue = attrId;
                    this.userDataManager.enemyCache.attrId.set(enemyUuid, attrId);
                    const name = monsterNames[attrId];
                    if (name) {
                        this.userDataManager.enemyCache.name.set(enemyUuid, name);
                    }
                    break;
                case AttrType.AttrHp: {
                    const enemyHp = reader.int32();
                    const maxH = this.userDataManager.enemyCache.maxHp.get(enemyUuid);
                    const monsterId = attrIdValue || this.userDataManager.enemyCache.attrId.get(enemyUuid);

                    // Sempre atualizar o cache de HP
                    this.userDataManager.enemyCache.hp.set(enemyUuid, enemyHp);

                    if (maxH != null && maxH > 0) {
                        const newPct = Math.floor((enemyHp * 100) / maxH);
                        this.userDataManager.enemyCache.hp_pct.set(enemyUuid, newPct);

                        // Reportar para BPTimer se é um boss rastreado
                        // NOTA: O BPTimer client faz sua própria filtragem de cache e intervalos
                        // Não precisamos fazer filtragem local complicada
                        if (monsterId && ALLOWED_BPTIMER_MOB_IDS.has(monsterId)) {
                            this.userDataManager.reportBossHP(enemyUuid, monsterId, enemyHp, maxH);
                        }
                    }
                    break;
                }
                case AttrType.AttrMaxHp: {
                    const enemyMaxHp = reader.int32();
                    this.userDataManager.enemyCache.maxHp.set(enemyUuid, enemyMaxHp);
                    const hp = this.userDataManager.enemyCache.hp.get(enemyUuid);
                    if (hp != null && enemyMaxHp > 0) {
                        const pct = Math.round((hp / enemyMaxHp) * 100);
                        this.userDataManager.enemyCache.hp_pct.set(enemyUuid, pct);

                        // Reportar SEMPRE - BPTimer client faz filtragem automática
                        const monsterId = attrIdValue || this.userDataManager.enemyCache.attrId.get(enemyUuid);
                        if (monsterId && ALLOWED_BPTIMER_MOB_IDS.has(monsterId)) {
                            this.userDataManager.reportBossHP(enemyUuid, monsterId, hp, enemyMaxHp);
                        }
                    }
                    break;
                }
                case AttrType.AttrPos: {
                    try {
                        const vector3 = pb.Vector3.decode(attr.RawData);
                        const pos_x = vector3.X || 0;
                        const pos_y = vector3.Y || 0;
                        const pos_z = vector3.Z || 0;
                        this.userDataManager.enemyCache.pos.set(enemyUuid, { x: pos_x, y: pos_y, z: pos_z });
                    } catch (error) {
                        // Silently ignore position decode errors
                    }
                    break;
                }
                default:
                    // this.logger.debug(`Found unknown attrId ${attr.Id} for E${enemyUid} ${attr.RawData.toString('base64')}`);
                    break;
            }
        }

        // Atualizar timestamp de atividade do inimigo
        if (this.userDataManager.enemyCache.lastSeen) {
            this.userDataManager.enemyCache.lastSeen.set(enemyUuid, Date.now());
        }
    }

    _processSyncNearEntities(payloadBuffer) {
        const syncNearEntities = pb.SyncNearEntities.decode(payloadBuffer);
        // this.logger.debug(JSON.stringify(syncNearEntities, null, 2));

        if (!syncNearEntities.Appear) return;
        for (const entity of syncNearEntities.Appear) {
            const entityUuid = entity.Uuid;
            if (!entityUuid) continue;
            const entityUuidStr = entityUuid.shiftRight(16).toString();
            const entityUid = entityUuid.shiftRight(16).toNumber();
            const attrCollection = entity.Attrs;

            if (attrCollection && (attrCollection.Attrs || attrCollection.MapAttrs)) {
                switch (entity.EntType) {
                    case pb.EEntityType.EntMonster:
                        this._processEnemyAttrs(entityUuidStr, entityUid, attrCollection.Attrs);

                        // Após processar os atributos, tentar enviar reporte se é boss (abordagem mrsnakke)
                        const monsterId = this.userDataManager.enemyCache.attrId.get(entityUuidStr);
                        const hp = this.userDataManager.enemyCache.hp.get(entityUuidStr);
                        const maxHp = this.userDataManager.enemyCache.maxHp.get(entityUuidStr);

                        if (monsterId && ALLOWED_BPTIMER_MOB_IDS.has(monsterId) && hp != null && maxHp != null && maxHp > 0) {
                            this.userDataManager.reportBossHP(entityUuidStr, monsterId, hp, maxHp);
                        }
                        break;
                    case pb.EEntityType.EntChar:
                        this._processPlayerAttrs(entityUid, attrCollection);
                        break;
                    default:
                        // this.logger.debug('Get AttrCollection for Unknown EntType' + entity.EntType);
                        break;
                }
            }
        }
    }

    _processNotifyMsg(reader, isZstdCompressed) {
        const serviceUuid = reader.readUInt64();
        const stubId = reader.readUInt32();
        const methodId = reader.readUInt32();

        if (serviceUuid !== 0x0000000063335342n) {
            return;
        }

        let msgPayload = reader.readRemaining();
        if (isZstdCompressed) {
            msgPayload = this._decompressPayload(msgPayload);
        }
        switch (methodId) {
            case NotifyMethod.SyncNearEntities:
                this._processSyncNearEntities(msgPayload);
                break;
            case NotifyMethod.SyncContainerData:
                this._processSyncContainerData(msgPayload);
                break;
            case NotifyMethod.SyncContainerDirtyData:
                this._processSyncContainerDirtyData(msgPayload);
                break;
            case NotifyMethod.SyncToMeDeltaInfo:
                this._processSyncToMeDeltaInfo(msgPayload);
                break;
            case NotifyMethod.SyncNearDeltaInfo:
                this._processSyncNearDeltaInfo(msgPayload);
                break;
            default:
                // this.logger.warn(`[NOTIFY] ⚠️ Método desconhecido: 0x${methodId.toString(16)}`);
                break;
        }
        return;
    }

    _getMethodName(methodId) {
        const names = {
            0x00000006: 'SyncNearEntities',
            0x00000015: 'SyncContainerData',
            0x00000016: 'SyncContainerDirtyData',
            0x0000002b: 'SyncServerTime',
            0x0000002d: 'SyncNearDeltaInfo',
            0x0000002e: 'SyncToMeDeltaInfo',
        };
        return names[methodId] || 'Unknown';
    }

    _processReturnMsg(reader, isZstdCompressed) {
        // Unimplemented
    }

    processPacket(packets) {
        try {
            const packetsReader = new BinaryReader(packets);

            do {
                let packetSize = packetsReader.peekUInt32();
                if (packetSize < 6) {
                    return;
                }

                const packetReader = new BinaryReader(packetsReader.readBytes(packetSize));
                packetSize = packetReader.readUInt32(); // to advance
                const packetType = packetReader.readUInt16();
                const isZstdCompressed = packetType & 0x8000;
                const msgTypeId = packetType & 0x7fff;

                switch (msgTypeId) {
                    case MessageType.Notify:
                        this._processNotifyMsg(packetReader, isZstdCompressed);
                        break;
                    case MessageType.Return:
                        this._processReturnMsg(packetReader, isZstdCompressed);
                        break;
                    case MessageType.FrameDown:
                        const serverSequenceId = packetReader.readUInt32();
                        if (packetReader.remaining() == 0) break;

                        let nestedPacket = packetReader.readRemaining();

                        if (isZstdCompressed) {
                            nestedPacket = this._decompressPayload(nestedPacket);
                        }

                        this.processPacket(nestedPacket);
                        break;
                    default:
                        // this.logger.debug(`Ignore packet with message type ${msgTypeId}.`);
                        break;
                }
            } while (packetsReader.remaining() > 0);
        } catch (e) {
            this.logger.error(`Fail while parsing data for player ${currentUserUuid.shiftRight(16)}.\nErr: ${e}`);
        }
    }
}

module.exports = PacketProcessor;