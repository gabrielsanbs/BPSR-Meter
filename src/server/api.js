const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const fsPromises = require('fs').promises;
const fs = require('fs');

const LOGS_DPS_PATH = path.join('./logs_dps.json');

function initializeApi(app, server, io, userDataManager, logger, globalSettings, sniffer, settingsPath) {
    // settingsPath agora é passado como parâmetro
    const SETTINGS_PATH = settingsPath;
    
    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '..', '..', 'public'))); // Ajustar la ruta

    app.get('/icon.png', (req, res) => {
        res.sendFile(path.join(__dirname, '..', '..', 'icon.png')); // Ajustar la ruta
    });

    app.get('/favicon.ico', (req, res) => {
        res.sendFile(path.join(__dirname, '..', '..', 'icon.ico')); // Ajustar la ruta
    });

    app.get('/api/data', (req, res) => {
        const userData = userDataManager.getAllUsersData();
        const data = {
            code: 0,
            user: userData,
        };
        res.json(data);
    });

    app.get('/api/enemies', (req, res) => {
        const enemiesData = userDataManager.getAllEnemiesData();
        const data = {
            code: 0,
            enemy: enemiesData,
        };
        res.json(data);
    });

    app.get('/api/clear', async (req, res) => {
        await userDataManager.clearAll(globalSettings); // Pasar globalSettings
        console.log('¡Estadísticas limpiadas!');
        res.json({
            code: 0,
            msg: '¡Estadísticas limpiadas!',
        });
    });

    app.post('/api/clear-logs', async (req, res) => {
        const logsBaseDir = path.join(__dirname, '..', '..', 'logs'); // Ajustar la ruta
        try {
            const files = await fsPromises.readdir(logsBaseDir);
            for (const file of files) {
                const filePath = path.join(logsBaseDir, file);
                await fsPromises.rm(filePath, { recursive: true, force: true });
            }
            if (fs.existsSync(LOGS_DPS_PATH)) {
                await fsPromises.unlink(LOGS_DPS_PATH);
            }
            console.log('¡Todos los archivos y directorios de log han sido limpiados!');
            res.json({
                code: 0,
                msg: '¡Todos los archivos y directorios de log han sido limpiados!',
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('El directorio de logs no existe, no hay logs que limpiar.');
                res.json({
                    code: 0,
                    msg: 'El directorio de logs no existe, no hay logs que limpiar.',
                });
            } else {
                logger.error('Failed to clear log files:', error);
                res.status(500).json({
                    code: 1,
                    msg: 'Failed to clear log files.',
                    error: error.message,
                });
            }
        }
    });

    app.post('/api/pause', (req, res) => {
        const { paused } = req.body;
        globalSettings.isPaused = paused; // Actualizar el estado de pausa en globalSettings
        // Si se pasó una referencia al sniffer, actualizar su estado interno
        try {
            if (sniffer && typeof sniffer.setPaused === 'function') {
                sniffer.setPaused(paused);
            }
        } catch (e) {
            logger && logger.error && logger.error('Failed to set sniffer paused state:', e);
        }
        console.log(`¡Estadísticas ${globalSettings.isPaused ? 'pausadas' : 'reanudadas'}!`);
        res.json({
            code: 0,
            msg: `¡Estadísticas ${globalSettings.isPaused ? 'pausadas' : 'reanudadas'}!`,
            paused: globalSettings.isPaused,
        });
    });

    app.get('/api/pause', (req, res) => {
        res.json({
            code: 0,
            paused: globalSettings.isPaused,
        });
    });

    app.post('/api/set-username', (req, res) => {
        const { uid, name } = req.body;
        if (uid && name) {
            const userId = parseInt(uid, 10);
            if (!isNaN(userId)) {
                userDataManager.setName(userId, name);
                console.log(`Manualmente se asignó el nombre '${name}' al UID ${userId}`);
                res.json({ code: 0, msg: 'Nombre de usuario actualizado correctamente.' });
            } else {
                res.status(400).json({ code: 1, msg: 'UID inválido.' });
            }
        } else {
            res.status(400).json({ code: 1, msg: 'Faltan UID o nombre.' });
        }
    });

    app.get('/api/skill/:uid', (req, res) => {
        const uid = parseInt(req.params.uid);
        const skillData = userDataManager.getUserSkillData(uid);

        if (!skillData) {
            return res.status(404).json({
                code: 1,
                msg: 'User not found',
            });
        }

        res.json({
            code: 0,
            data: skillData,
        });
    });

    app.get('/api/history/:timestamp/summary', async (req, res) => {
        const { timestamp } = req.params;
        const historyFilePath = path.join('./logs', timestamp, 'summary.json'); // Ajustar la ruta

        try {
            const data = await fsPromises.readFile(historyFilePath, 'utf8');
            const summaryData = JSON.parse(data);
            res.json({
                code: 0,
                data: summaryData,
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('History summary file not found:', error);
                res.status(404).json({
                    code: 1,
                    msg: 'History summary file not found',
                });
            } else {
                logger.error('Failed to read history summary file:', error);
                res.status(500).json({
                    code: 1,
                    msg: 'Failed to read history summary file',
                });
            }
        }
    });

    app.get('/api/history/:timestamp/data', async (req, res) => {
        const { timestamp } = req.params;
        const historyFilePath = path.join('./logs', timestamp, 'allUserData.json'); // Ajustar la ruta

        try {
            const data = await fsPromises.readFile(historyFilePath, 'utf8');
            const userData = JSON.parse(data);
            res.json({
                code: 0,
                user: userData,
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('History data file not found:', error);
                res.status(404).json({
                    code: 1,
                    msg: 'History data file not found',
                });
            } else {
                logger.error('Failed to read history data file:', error);
                res.status(500).json({
                    code: 1,
                    msg: 'Failed to read history data file',
                });
            }
        }
    });

    app.get('/api/history/:timestamp/skill/:uid', async (req, res) => {
        const { timestamp, uid } = req.params;
        const historyFilePath = path.join('./logs', timestamp, 'users', `${uid}.json`); // Ajustar la ruta

        try {
            const data = await fsPromises.readFile(historyFilePath, 'utf8');
            const skillData = JSON.parse(data);
            res.json({
                code: 0,
                data: skillData,
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('History skill file not found:', error);
                res.status(404).json({
                    code: 1,
                    msg: 'History skill file not found',
                });
            } else {
                logger.error('Failed to read history skill file:', error);
                res.status(500).json({
                    code: 1,
                    msg: 'Failed to load history skill file',
                });
            }
        }
    });

    app.get('/api/history/:timestamp/download', async (req, res) => {
        const { timestamp } = req.params;
        const historyFilePath = path.join('./logs', timestamp, 'fight.log'); // Ajustar la ruta
        res.download(historyFilePath, `fight_${timestamp}.log`);
    });

    app.get('/api/history/list', async (req, res) => {
        try {
            const data = (await fsPromises.readdir('./logs', { withFileTypes: true })) // Ajustar la ruta
                .filter((e) => e.isDirectory() && /^\d+$/.test(e.name))
                .map((e) => e.name);
            res.json({
                code: 0,
                data: data,
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('History path not found:', error);
                res.status(404).json({
                    code: 1,
                    msg: 'History path not found',
                });
            } else {
                logger.error('Failed to load history path:', error);
                res.status(500).json({
                    code: 1,
                    msg: 'Failed to load history path',
                });
            }
        }
    });

    app.get('/api/settings', async (req, res) => {
        res.json({ code: 0, data: globalSettings });
    });

    app.post('/api/settings', async (req, res) => {
        const newSettings = req.body;
        Object.assign(globalSettings, newSettings); // Actualizar globalSettings directamente
        await fsPromises.writeFile(SETTINGS_PATH, JSON.stringify(globalSettings, null, 2), 'utf8');
        res.json({ code: 0, data: globalSettings });
    });

    app.get('/api/diccionario', async (req, res) => {
        const diccionarioPath = path.join(__dirname, '..', '..', 'diccionario.json'); // Ajustar la ruta
        try {
            const data = await fsPromises.readFile(diccionarioPath, 'utf8');
            if (data.trim() === '') {
                res.json({});
            } else {
                res.json(JSON.parse(data));
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('diccionario.json not found, returning empty object.');
                res.json({});
            } else {
                logger.error('Failed to read or parse diccionario.json:', error);
                res.status(500).json({ code: 1, msg: 'Failed to load diccionario', error: error.message });
            }
        }
    });

    function guardarLogDps(log) {
        if (!globalSettings.enableDpsLog) return;

        let logs = [];
        if (fs.existsSync(LOGS_DPS_PATH)) {
            logs = JSON.parse(fs.readFileSync(LOGS_DPS_PATH, 'utf8'));
        }
        logs.unshift(log);
        fs.writeFileSync(LOGS_DPS_PATH, JSON.stringify(logs, null, 2));
    }

    app.post('/guardar-log-dps', (req, res) => {
        const log = req.body;
        guardarLogDps(log);
        res.sendStatus(200);
    });

    app.get('/logs-dps', (req, res) => {
        let logs = [];
        if (fs.existsSync(LOGS_DPS_PATH)) {
            logs = JSON.parse(fs.readFileSync(LOGS_DPS_PATH, 'utf8'));
        }
        res.json(logs);
    });

    // Endpoints para histórico de lutas
    app.get('/api/fight-history', (req, res) => {
        const history = userDataManager.getFightHistory();
        res.json({
            code: 0,
            data: history
        });
    });

    app.get('/api/fight-history/:id', (req, res) => {
        const fightId = parseInt(req.params.id);
        const history = userDataManager.getFightHistory();
        const fight = history.find(f => f.id === fightId);
        
        if (!fight) {
            return res.status(404).json({
                code: 1,
                msg: 'Fight not found'
            });
        }
        
        res.json({
            code: 0,
            data: fight
        });
    });

    app.post('/api/fight-history/clear', async (req, res) => {
        await userDataManager.clearFightHistory();
        res.json({
            code: 0,
            msg: 'Histórico de lutas limpo com sucesso!'
        });
    });

    // Alias para limpar histórico (usado em settings.html)
    app.post('/api/clear-history', async (req, res) => {
        await userDataManager.clearFightHistory();
        res.json({
            code: 0,
            msg: 'Histórico de lutas limpo com sucesso!'
        });
    });

    // Limpar cache de usuários
    app.post('/api/clear-cache', async (req, res) => {
        try {
            await userDataManager.clearUserCache();
            res.json({
                code: 0,
                msg: 'Cache de usuários limpo com sucesso!'
            });
        } catch (error) {
            logger.error('Erro ao limpar cache:', error);
            res.status(500).json({
                code: -1,
                msg: 'Erro ao limpar cache de usuários'
            });
        }
    });

    app.post('/api/fight/end', async (req, res) => {
        await userDataManager.endFight();
        res.json({
            code: 0,
            msg: 'Luta finalizada e salva no histórico!'
        });
    });

    // Endpoint para verificar se uma luta terminou
    app.get('/api/fight-status', (req, res) => {
        const status = {
            fightActive: userDataManager.fightActive,
            fightEnded: userDataManager.fightEnded
        };
        
        // Resetar flag após verificar
        if (userDataManager.fightEnded) {
            userDataManager.fightEnded = false;
        }
        
        res.json(status);
    });

    io.on('connection', (socket) => {
        console.log('Cliente WebSocket conectado: ' + socket.id);

        socket.on('disconnect', () => {
            console.log('Cliente WebSocket desconectado: ' + socket.id);
        });
    });

    setInterval(() => {
        if (!globalSettings.isPaused) {
            const userData = userDataManager.getAllUsersData();
            const data = {
                code: 0,
                user: userData,
            };
            io.emit('data', data);
        }
    }, 100);
}

module.exports = initializeApi;
