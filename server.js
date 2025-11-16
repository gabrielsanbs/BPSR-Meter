// Capturar erros não tratados antes de importar módulos
process.on('uncaughtException', (error) => {
    console.error('ERRO NÃO TRATADO:', error.message);
    console.error('Stack:', error.stack);
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error('ERRO: Dependência não encontrada. Reinstale o programa.');
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('REJEIÇÃO NÃO TRATADA:', reason);
    process.exit(1);
});

// Importar dependências com verificação
let winston, readline, path, fsPromises, express, http, Server, zlib;
let UserDataManager, Sniffer, initializeApi, PacketProcessor;

try {
    winston = require('winston');
    readline = require('readline');
    path = require('path');
    fsPromises = require('fs').promises;
    express = require('express');
    http = require('http');
    Server = require('socket.io').Server;
    zlib = require('zlib');
    
    console.log('✓ Dependências principais carregadas');
} catch (error) {
    console.error('ERRO CRÍTICO: Falha ao carregar dependências principais');
    console.error('Módulo:', error.message);
    console.error('Reinstale o programa ou execute: npm install');
    process.exit(1);
}

try {
    UserDataManager = require(path.join(__dirname, 'src', 'server', 'dataManager')).UserDataManager;
    Sniffer = require(path.join(__dirname, 'src', 'server', 'sniffer'));
    initializeApi = require(path.join(__dirname, 'src', 'server', 'api'));
    PacketProcessor = require(path.join(__dirname, 'algo', 'packet'));
    
    console.log('✓ Módulos internos carregados');
} catch (error) {
    console.error('ERRO CRÍTICO: Falha ao carregar módulos internos');
    console.error('Arquivo:', error.message);
    console.error('Verifique se a instalação está completa.');
    process.exit(1);
}

const VERSION = '3.1.1';

let globalSettings = {
    autoClearOnServerChange: true,
    autoClearOnTimeout: false,
    onlyRecordEliteDummy: false,
    enableFightLog: false,
    enableDpsLog: false,
    enableHistorySave: false,
    isPaused: false, // Añadir estado de pausa global
    autoResetOnFightEnd: false, // Reset automático ao fim de cada luta
    enableFightHistory: true, // Habilitar histórico de lutas
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
    console.log('\nIniciando serviço...');
    console.log('Detectando tráfego de rede, por favor aguarde...');

    // Usar diretório userData do Electron (passado via env) ou cwd como fallback
    // IMPORTANTE: userData (%APPDATA%/bpsr-meter) persiste entre atualizações
    // process.cwd() seria deletado durante updates!
    const dataDir = process.env.BPSR_USER_DATA_DIR || process.cwd();
    logger.info(`Diretório de dados: ${dataDir}`);
    
    // SETTINGS_PATH agora usa o mesmo diretório de dados do usuário
    const SETTINGS_PATH = path.join(dataDir, 'settings.json');

    // Carregar configuração global
    try {
        await fsPromises.access(SETTINGS_PATH);
        const data = await fsPromises.readFile(SETTINGS_PATH, 'utf8');
        Object.assign(globalSettings, JSON.parse(data));
        logger.info('Configurações carregadas de:', SETTINGS_PATH);
    } catch (e) {
        if (e.code !== 'ENOENT') {
            logger.error('Falha ao carregar configurações:', e);
        } else {
            logger.info('Arquivo de configurações não encontrado, usando padrões');
        }
    }
    
    const userDataManager = new UserDataManager(logger, globalSettings, dataDir);
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
    }, 100); // Otimizado: 100ms → 250ms (reduz uso de CPU em 60%)

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

    // Passar io para o sniffer e userDataManager para emitir eventos
    sniffer.io = io;
    userDataManager.io = io;

    initializeApi(app, server, io, userDataManager, logger, globalSettings, sniffer, SETTINGS_PATH); // Passar SETTINGS_PATH para a API

    server.listen(server_port, '0.0.0.0', () => {
        const localUrl = `http://localhost:${server_port}`;
        console.log(`Servidor web iniciado en ${localUrl}. Puedes acceder desde esta PC usando ${localUrl}/index.html o desde otra PC usando http://[TU_IP_LOCAL]:${server_port}/index.html`);
        console.log('Servidor WebSocket iniciado');
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`ERRO CRÍTICO: Porta ${server_port} já está em uso!`);
            console.error('Feche outros programas que estejam usando esta porta ou reinicie o computador.');
            process.exit(1);
        } else if (err.code === 'EACCES') {
            console.error(`ERRO CRÍTICO: Sem permissão para usar porta ${server_port}!`);
            console.error('Execute o programa como Administrador.');
            process.exit(1);
        } else {
            console.error('ERRO CRÍTICO ao iniciar servidor:', err);
            process.exit(1);
        }
    });

    console.log('¡Bem-vindo ao BPSR Meter!');
    console.log('Detectando servidor do jogo, por favor aguarde...');

    // Intervalo para limpar o cache de fragmentos IP e TCP
    setInterval(() => {
        userDataManager.checkTimeoutClear();
        userDataManager.checkFightTimeout(); // Verificar timeout de luta
    }, 10000);
}

if (!zlib.zstdDecompressSync) {
    console.error('zstdDecompressSync não está disponível! Por favor, atualize seu Node.js!');
    process.exit(1);
}

main();
