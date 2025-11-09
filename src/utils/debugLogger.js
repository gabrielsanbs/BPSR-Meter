const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFileName = 'bpsr-meter-debug.log') {
        this.logPath = path.join(process.cwd(), logFileName);
        this.writeLog('=== BPSR METER DEBUG LOG INICIADO ===');
        this.writeLog(`Data/Hora: ${new Date().toISOString()}`);
        this.writeLog(`Diretório: ${process.cwd()}`);
        this.writeLog('=====================================\n');
    }

    writeLog(message, category = 'INFO') {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] [${category}] ${message}\n`;
        
        try {
            fs.appendFileSync(this.logPath, logLine, 'utf8');
            console.log(logLine.trim());
        } catch (error) {
            console.error('Erro ao escrever log:', error);
        }
    }

    info(message) {
        this.writeLog(message, 'INFO');
    }

    debug(message) {
        this.writeLog(message, 'DEBUG');
    }

    warn(message) {
        this.writeLog(message, 'WARN');
    }

    error(message, error = null) {
        this.writeLog(message, 'ERROR');
        if (error) {
            this.writeLog(`Stack: ${error.stack}`, 'ERROR');
        }
    }

    cache(message) {
        this.writeLog(message, 'CACHE');
    }

    player(message) {
        this.writeLog(message, 'PLAYER');
    }

    drag(message) {
        this.writeLog(message, 'DRAG');
    }

    connection(message) {
        this.writeLog(message, 'CONNECTION');
    }
}

module.exports = new Logger();
