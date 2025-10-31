const winston = require('winston');
const readline = require('readline');
const path = require('path');
const fsPromises = require('fs').promises;
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const zlib = require('zlib');

const { UserDataManager } = require(path.join(__dirname, 'src', 'server', 'dataManager'));
const Sniffer = require(path.join(__dirname, 'src', 'server', 'sniffer'));
const initializeApi = require(path.join(__dirname, 'src', 'server', 'api'));
const PacketProcessor = require(path.join(__dirname, 'algo', 'packet')); // Asegúrate de que esta ruta sea correcta

const VERSION = '3.1';
const SETTINGS_PATH = path.join(__dirname, 'settings.json');

let globalSettings = {
    autoClearOnServerChange: true,
    autoClearOnTimeout: false,
    onlyRecordEliteDummy: false,
    enableFightLog: false,
    enableDpsLog: false,
    enableHistorySave: false,
    isPaused: false, // Añadir estado de pausa global
};

let server_port;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf((info) => {
                return `[${info.timestamp}] [${info.level}] ${info.message}`;
            }),
        ),
        transports: [new winston.transports.Console()],
    });

    console.clear();
    console.log('###################################################');
    console.log('#                                                 #');
    console.log('#             BPSR Meter - Iniciando              #');
    console.log('#                                                 #');
    console.log('###################################################');
    console.log('\nIniciando servicio...');
    console.log('Detectando tráfico de red, por favor espera...');

    // Cargar configuración global
    try {
        await fsPromises.access(SETTINGS_PATH);
        const data = await fsPromises.readFile(SETTINGS_PATH, 'utf8');
        Object.assign(globalSettings, JSON.parse(data));
    } catch (e) {
        if (e.code !== 'ENOENT') {
            logger.error('Failed to load settings:', e);
        }
    }

    const userDataManager = new UserDataManager(logger, globalSettings);
    await userDataManager.initialize();

    const sniffer = new Sniffer(logger, userDataManager, globalSettings); // Pasar globalSettings al sniffer

    // Obtener número de dispositivo y nivel de log desde los argumentos de la línea de comandos
    const args = process.argv.slice(2);
    let current_arg_index = 0;

    if (args[current_arg_index] && !isNaN(parseInt(args[current_arg_index]))) {
        server_port = parseInt(args[current_arg_index]);
        current_arg_index++;
    }

    let deviceNum = args[current_arg_index];

    try {
        await sniffer.start(deviceNum, PacketProcessor);
    } catch (error) {
        logger.error(`Error al iniciar el sniffer: ${error.message}`);
        rl.close();
        process.exit(1);
    }

    logger.level = 'error';

    process.on('SIGINT', async () => {
        console.log('\nCerrando aplicación...');
        rl.close();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\nCerrando aplicación...');
        rl.close();
        process.exit(0);
    });

    setInterval(() => {
        if (!globalSettings.isPaused) {
            userDataManager.updateAllRealtimeDps();
        }
    }, 100);

    if (server_port === undefined || server_port === null) {
        server_port = 8989;
    }

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    initializeApi(app, server, io, userDataManager, logger, globalSettings, sniffer); // Inicializar API con globalSettings y sniffer

    server.listen(server_port, '0.0.0.0', () => {
        const localUrl = `http://localhost:${server_port}`;
        console.log(`Servidor web iniciado en ${localUrl}. Puedes acceder desde esta PC usando ${localUrl}/index.html o desde otra PC usando http://[TU_IP_LOCAL]:${server_port}/index.html`);
        console.log('Servidor WebSocket iniciado');
    });

    console.log('¡Bienvenido a BPSR Meter!');
    console.log('Detectando servidor de juego, por favor espera...');

    // Intervalo para limpiar la caché de fragmentos IP y TCP
    setInterval(() => {
        userDataManager.checkTimeoutClear();
    }, 10000);
}

if (!zlib.zstdDecompressSync) {
    console.log('zstdDecompressSync is not available! Please update your Node.js!');
    process.exit(1);
}

main();
