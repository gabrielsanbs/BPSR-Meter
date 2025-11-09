
const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const { exec, fork } = require('child_process');
const net = require('net'); // Necesario para checkPort
const fs = require('fs');

// Função para registrar em arquivo seguro para ambiente empacotado
function logToFile(msg) {
    try {
        const userData = app.getPath('userData');
        const logPath = path.join(userData, 'iniciar_log.txt');
        const timestamp = new Date().toISOString();
        fs.mkdirSync(userData, { recursive: true });
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        // Se houver erro, mostrar no console
        console.error('Erro ao escrever log:', e);
    }
}


let mainWindow;
let historyWindow = null;
let serverProcess;
let server_port = 8989; // Porta inicial
let isLocked = false; // Estado inicial do cadeado: desbloqueado
logToFile('==== INÍCIO DO ELECTRON ====');

// Força a janela a se comportar como overlay mesmo sobre apps em tela cheia
function promoteOverlayWindow(win, { focus = false } = {}) {
    if (!win) return;
    win.setAlwaysOnTop(true, 'screen-saver', 1);
    if (typeof win.setVisibleOnAllWorkspaces === 'function') {
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }
    if (typeof win.setFullScreenable === 'function') {
        win.setFullScreenable(false);
    }
    win.setSkipTaskbar(false);
    if (typeof win.moveTop === 'function') {
        win.moveTop();
    }
    if (focus) {
        win.focus();
    }
}

    // Função para verificar se uma porta está em uso
    const checkPort = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close(() => resolve(true));
            });
            server.listen(port);
        });
    };

    async function findAvailablePort() {
        let port = server_port;
        while (true) {
            if (await checkPort(port)) {
                return port;
            }
            console.warn(`Porta ${port} já está em uso, tentando próxima...`);
            port++;
        }
    }

    // Função para matar o processo que está usando uma porta específica
    async function killProcessUsingPort(port) {
        return new Promise((resolve) => {
            exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
                if (stdout) {
                    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
                    if (lines.length > 0) {
                        const pid = lines[0].trim().split(/\s+/).pop();
                        if (pid) {
                            console.log(`Matando processo ${pid} usando porta ${port}...`);
                            exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
                                if (killError) {
                                    console.error(`Erro ao matar processo ${pid}: ${killError.message}`);
                                } else {
                                    console.log(`Processo ${pid} encerrado com sucesso.`);
                                }
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            });
        });
    }

    async function createWindow() {
        logToFile('Tentando encerrar processos na porta 8989...');
        await killProcessUsingPort(8989);

        server_port = await findAvailablePort();
        logToFile('Porta disponível encontrada: ' + server_port);

        mainWindow = new BrowserWindow({
            width: 650,
            height: 600,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            resizable: false,
            backgroundColor: '#00000000', // Transparente RGBA para evitar fundo preto
            hasShadow: false, // Remover sombra que pode causar fundo preto
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
                backgroundThrottling: false, // Evitar throttling que causa re-rendering
            },
            icon: path.join(__dirname, 'icon.ico'),
        });

        // Configurar estado inicial: cadeado ABERTO = permite eventos (pode arrastar)
        mainWindow.setIgnoreMouseEvents(false);
        // REMOVIDO: setMovable() - drag será manual via JavaScript

        promoteOverlayWindow(mainWindow);

        mainWindow.once('ready-to-show', () => {
            promoteOverlayWindow(mainWindow, { focus: true });
        });

        mainWindow.on('show', () => promoteOverlayWindow(mainWindow));
        mainWindow.on('focus', () => promoteOverlayWindow(mainWindow));
        mainWindow.on('restore', () => promoteOverlayWindow(mainWindow, { focus: true }));

        // Iniciar o servidor Node.js, passando a porta como argumento

        // Determinar caminho absoluto para server.js de acordo com ambiente
        let serverPath;
        if (process.defaultApp || process.env.NODE_ENV === 'development') {
            // Modo desenvolvimento
            serverPath = path.join(__dirname, 'server.js');
        } else {
            // Modo empacotado: usar app.getAppPath() para acessar dentro do asar
            serverPath = path.join(app.getAppPath(), 'server.js');
        }
        logToFile('Iniciando server.js na porta ' + server_port + ' com caminho: ' + serverPath);
        logToFile('Node.js versão: ' + process.version);
        logToFile('Electron versão: ' + process.versions.electron);
        logToFile('Plataforma: ' + process.platform + ' ' + process.arch);
        
        // Verificar se o arquivo existe
        if (!fs.existsSync(serverPath)) {
            logToFile('ERRO CRÍTICO: server.js não encontrado em: ' + serverPath);
            const errorHtml = `
                <h1 style="color:red;">Erro Crítico: Arquivo server.js não encontrado</h1>
                <p>Caminho esperado: <code>${serverPath}</code></p>
                <p>Reinstale o programa.</p>
            `;
            mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
            return;
        }

        // Usar fork para iniciar o servidor como processo filho
        const { fork } = require('child_process');
        logToFile('Iniciando fork do processo Node.js...');
        
        try {
            // Passar userData via variável de ambiente para persistir entre updates
            const userData = app.getPath('userData');
            logToFile('Diretório userData (persistente): ' + userData);
            
            serverProcess = fork(serverPath, [server_port], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                execArgv: [],
                env: { 
                    ...process.env, 
                    ELECTRON_RUN_AS_NODE: '1',
                    BPSR_USER_DATA_DIR: userData // Passa o userData para o server.js
                }
            });
            logToFile('Processo fork iniciado com PID: ' + serverProcess.pid);
        } catch (forkError) {
            logToFile('ERRO CRÍTICO ao fazer fork: ' + forkError.message);
            logToFile('Stack: ' + forkError.stack);
            const errorHtml = `
                <h1 style="color:red;">Erro ao iniciar processo Node.js</h1>
                <p>Erro: <code>${forkError.message}</code></p>
                <p>Execute como Administrador e verifique se o antivírus não está bloqueando.</p>
            `;
            mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
            return;
        }

        // Mostrar tela de carregamento
        const loadingHtml = `
            <html>
            <head>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: white;
                    }
                    .loader-container { text-align: center; }
                    .spinner { 
                        border: 8px solid #f3f3f3; 
                        border-top: 8px solid #3498db; 
                        border-radius: 50%; 
                        width: 60px; 
                        height: 60px; 
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    h1 { font-size: 2em; margin: 10px 0; }
                    p { font-size: 1.2em; opacity: 0.9; }
                    .status { margin-top: 20px; font-size: 0.9em; opacity: 0.7; }
                </style>
            </head>
            <body>
                <div class="loader-container">
                    <div class="spinner"></div>
                    <h1>🎯 BPSR Meter</h1>
                    <p>Inicializando servidor backend...</p>
                    <div class="status">Porta: ${server_port} | Aguardando resposta...</div>
                </div>
            </body>
            </html>
        `;
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loadingHtml));
        
        // Variables para controlar el arranque del servidor
        if (typeof createWindow.serverLoaded === 'undefined') createWindow.serverLoaded = false;
        if (typeof createWindow.serverTimeout === 'undefined') createWindow.serverTimeout = null;
        createWindow.serverLoaded = false;
        createWindow.serverTimeout = setTimeout(() => {
            if (!createWindow.serverLoaded) {
               const errorHtml = `
                    <h1 style="color:red; font-size:2em;">
                        Erro: Servidor não respondeu a tempo (15s)
                    </h1>
                    <h2 style="color:orange; font-size:1.2em;">
                        <p><strong>O que aconteceu?</strong></p>
                        <p>O servidor backend (porta ${server_port}) não iniciou dentro do tempo esperado.</p>
                        
                        <p><strong>Causas comuns:</strong></p>
                        <ul style="text-align:left;">
                            <li>❌ Porta ${server_port} já está em uso (outro BPSR Meter rodando)</li>
                            <li>❌ Npcap não instalado ou versão antiga (&lt; 1.83)</li>
                            <li>❌ Antivírus bloqueando o programa</li>
                            <li>❌ Sem permissões de Administrador</li>
                            <li>❌ Dependências corrompidas</li>
                        </ul>
                        
                        <p><strong>Soluções (tente nesta ordem):</strong></p>
                        <ol style="text-align:left;">
                            <li>✅ Feche todos os BPSR Meters abertos</li>
                            <li>✅ Instale/Atualize Npcap: <a href="https://npcap.com/#download">npcap.com</a></li>
                            <li>✅ Clique com botão direito → "Executar como Administrador"</li>
                            <li>✅ Adicione exceção no Windows Defender/Antivírus</li>
                            <li>✅ Reinicie o computador</li>
                        </ol>
                        
                        <p><strong>Log detalhado:</strong></p>
                        <code style="background:#333;padding:5px;border-radius:3px;">%AppData%\\bpsr-meter\\iniciar_log.txt</code>
                        
                        <p style="margin-top:20px;">
                            <strong>Precisa de ajuda?</strong> 
                            <a href="https://github.com/gabrielsanbs/BPSR-Meter/issues" target="_blank">
                                Abra uma issue no GitHub
                            </a>
                        </p>
                    </h2>
                `;
                logToFile('ERRO: O servidor não respondeu a tempo após 15 segundos.');
                logToFile('Possíveis causas: porta em uso, Npcap não instalado, falta de permissões, antivírus bloqueando.');
                mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml)
                );
            }
        }, 15000); // 15 segundos de espera (aumentado de 10s)

        // Handler de erros não capturados do processo
        serverProcess.on('error', (error) => {
            logToFile('ERRO no processo do servidor: ' + error.message);
            logToFile('Stack: ' + error.stack);
            const errorHtml = `
                <h1 style="color:red;">Erro no processo do servidor</h1>
                <p>Erro: <code>${error.message}</code></p>
                <p>Verifique o log em <code>%AppData%\\bpsr-meter\\iniciar_log.txt</code></p>
            `;
            mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
        });

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            logToFile('server stdout: ' + output);
            
            // Detectar mensagem de sucesso
            const match = output.match(/Servidor web iniciado en (http:\/\/localhost:\d+)/);
            if (match && match[1]) {
                const serverUrl = match[1];
                logToFile('✓ Servidor iniciado com sucesso! Carregando URL: ' + serverUrl + '/index.html');
                mainWindow.loadURL(`${serverUrl}/index.html`);
                createWindow.serverLoaded = true;
                clearTimeout(createWindow.serverTimeout);
            }
            
            // Detectar outras mensagens importantes
            if (output.includes('EADDRINUSE')) {
                logToFile('⚠ DETECTADO: Porta já em uso!');
            }
            if (output.includes('Cannot find module')) {
                logToFile('⚠ DETECTADO: Módulo faltando!');
            }
        });
        serverProcess.stderr.on('data', (data) => {
            const errorMsg = data.toString();
            logToFile('server stderr: ' + errorMsg);
            
            // Detectar erros específicos
            if (errorMsg.includes('EADDRINUSE')) {
                logToFile(`ERRO CRÍTICO: Porta ${server_port} já está em uso por outro processo.`);
                const errorHtml = `
                    <h1 style="color:red; font-size:2em;">Erro: Porta ${server_port} em uso</h1>
                    <h2 style="color:orange; font-size:1.2em;">
                        <p>Outro programa já está usando esta porta.</p>
                        <p><strong>Soluções:</strong></p>
                        <ul style="text-align:left;">
                            <li>Feche outros BPSR Meters em execução</li>
                            <li>Reinicie o computador</li>
                            <li>Execute: <code>netstat -ano | findstr :${server_port}</code> para identificar o processo</li>
                        </ul>
                        <p>Log: <code>%AppData%\\bpsr-meter\\iniciar_log.txt</code></p>
                    </h2>
                `;
                mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
            } else if (errorMsg.includes('Cannot find module')) {
                const moduleName = errorMsg.match(/Cannot find module '([^']+)'/)?.[1] || 'desconhecido';
                logToFile(`ERRO CRÍTICO: Dependência faltando: ${moduleName}`);
                const errorHtml = `
                    <h1 style="color:red; font-size:2em;">Erro: Dependência faltando</h1>
                    <h2 style="color:orange; font-size:1.2em;">
                        <p>Módulo não encontrado: <code>${moduleName}</code></p>
                        <p><strong>Soluções:</strong></p>
                        <ul style="text-align:left;">
                            <li>Reinstale o programa baixando a versão mais recente</li>
                            <li>Verifique se o antivírus não bloqueou arquivos</li>
                            <li>Execute como Administrador</li>
                        </ul>
                        <p>Log: <code>%AppData%\\bpsr-meter\\iniciar_log.txt</code></p>
                    </h2>
                `;
                mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
            }
        });
        serverProcess.on('close', (code) => {
            logToFile('Processo do servidor encerrado com código ' + code);
            if (code !== 0 && !createWindow.serverLoaded) {
                logToFile('ERRO: O servidor terminou inesperadamente antes de iniciar.');
                const errorHtml = `
                    <h1 style="color:red; font-size:2em;">Erro: Servidor fechou inesperadamente</h1>
                    <h2 style="color:orange; font-size:1.2em;">
                        <p>Código de saída: ${code}</p>
                        <p><strong>Possíveis causas:</strong></p>
                        <ul style="text-align:left;">
                            <li>Dependência faltando (Node.js, Npcap)</li>
                            <li>Antivírus bloqueando o programa</li>
                            <li>Permissões insuficientes</li>
                        </ul>
                        <p><strong>Soluções:</strong></p>
                        <ul style="text-align:left;">
                            <li>Instale Npcap 1.83+</li>
                            <li>Execute como Administrador</li>
                            <li>Adicione exceção no antivírus</li>
                        </ul>
                        <p>Log completo: <code>%AppData%\\bpsr-meter\\iniciar_log.txt</code></p>
                    </h2>
                `;
                mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
            }
        });

        /* Simplificado: agora usamos variáveis estáticas na função createWindow
        let serverLoaded = false;
        let serverTimeout = setTimeout(() => {
            if (!serverLoaded) {
                logToFile('ERRO: O servidor não respondeu a tempo.');
                mainWindow.loadURL('data:text/html;charset=utf-8,' +
                encodeURIComponent('<h2 style="color:red">Erro: O servidor não respondeu a tempo.<br>Revise iniciar_log.txt para mais detalhes.</h2>')
                );

            }
        }, 10000); // 10 segundos de espera
        */
        serverProcess.stdout.on('data', (data) => {
            logToFile('server stdout: ' + data);
            const match = data.toString().match(/Servidor web iniciado en (http:\/\/localhost:\d+)/);
            if (match && match[1]) {
                const serverUrl = match[1];
                logToFile('Cargando URL en ventana: ' + serverUrl + '/index.html');
                mainWindow.loadURL(`${serverUrl}/index.html`);
                createWindow.serverLoaded = true;
                clearTimeout(createWindow.serverTimeout);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            logToFile('server stderr: ' + data);
        });

        serverProcess.on('close', (code) => {
            logToFile('server process exited with code ' + code);
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
            if (serverProcess) {
                // Enviar SIGTERM para un cierre limpio
                serverProcess.kill('SIGTERM');
                // Forzar la terminación si no se cierra después de un tiempo
                setTimeout(() => {
                    if (!serverProcess.killed) {
                        serverProcess.kill('SIGKILL');
                    }
                }, 5000);
            }
        });

    // Manejar el evento para hacer la ventana movible/no movible
    ipcMain.on('set-window-movable', (event, movable) => {
        if (mainWindow) {
            mainWindow.setMovable(movable);
        }
    });

    // Manejar el evento para cerrar la ventana
    ipcMain.on('close-window', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });

    // Manejar drag manual da janela (solução para overlays transparentes)
    ipcMain.on('window-drag-move', (event, deltaX, deltaY) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !isLocked) {
            // Obter posição atual da janela
            const bounds = win.getBounds();
            
            // Calcular nova posição adicionando o delta
            const newX = bounds.x + deltaX;
            const newY = bounds.y + deltaY;
            
            // Mover janela para nova posição
            win.setPosition(newX, newY, false); // false = sem animação para movimento suave
        }
    });

    // Manejar el evento para minimizar la ventana (principal o histórico)
    ipcMain.on('minimize-window', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            win.minimize();
        }
    });

    // Manejar el evento para redimensionar la ventana
    let resizeTimeout;
    let lastWidth = 0;
    let lastHeight = 0;
    ipcMain.on('resize-window', (event, width, height) => {
        if (mainWindow) {
            // Pular se dimensões não mudaram (evita fundo preto)
            if (width === lastWidth && height === lastHeight) {
                return;
            }
            
            lastWidth = width;
            lastHeight = height;
            
            // Debounce agressivo para evitar fundo preto durante resize constante
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Usar setSize ao invés de setContentSize para evitar flash preto
                mainWindow.setSize(width, height, false); // animate=false para evitar flash
            }, 100); // 100ms de debounce
        }
    });

    // Manejar el evento para alternar el estado del candado
    ipcMain.on('toggle-lock-state', () => {
        if (mainWindow) {
            isLocked = !isLocked;
            
            if (isLocked) {
                // Quando TRAVADO: começar ignorando eventos (cliques passam pro jogo)
                mainWindow.setIgnoreMouseEvents(true, { forward: true });
            } else {
                // Quando DESTRAVADO: processar todos os eventos normalmente
                mainWindow.setIgnoreMouseEvents(false);
            }
            
            promoteOverlayWindow(mainWindow);
            mainWindow.webContents.send('lock-state-changed', isLocked);
            console.log(`Candado: ${isLocked ? 'Cerrado (TRAVADO)' : 'Abierto (PODE ARRASTAR)'}`);
        }
    });

    // Listener para detectar quando mouse está sobre área clicável (header)
    ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
        if (mainWindow) {
            mainWindow.setIgnoreMouseEvents(ignore, options);
        }
    });

    // Polling para verificar posição do cursor e controlar setIgnoreMouseEvents automaticamente
    let mouseCheckInterval = null;
    const HEADER_HEIGHT = 50; // Altura aproximada do header em pixels
    
    function startMousePositionPolling() {
        if (mouseCheckInterval) return;
        
        mouseCheckInterval = setInterval(() => {
            if (!mainWindow || !isLocked) return;
            
            try {
                const cursorPos = screen.getCursorScreenPoint();
                const windowBounds = mainWindow.getBounds();
                
                // Verificar se cursor está dentro dos bounds da janela
                const isInsideWindow = cursorPos.x >= windowBounds.x && 
                                      cursorPos.x <= windowBounds.x + windowBounds.width &&
                                      cursorPos.y >= windowBounds.y && 
                                      cursorPos.y <= windowBounds.y + windowBounds.height;
                
                if (isInsideWindow) {
                    // Cursor está sobre a janela
                    const relativeY = cursorPos.y - windowBounds.y;
                    const isOverHeader = relativeY <= HEADER_HEIGHT;
                    
                    if (isOverHeader) {
                        // Mouse sobre o header: permitir eventos
                        mainWindow.setIgnoreMouseEvents(false);
                    } else {
                        // Mouse fora do header: ignorar eventos (passam pro jogo)
                        mainWindow.setIgnoreMouseEvents(true, { forward: true });
                    }
                } else {
                    // Cursor fora da janela: ignorar eventos
                    mainWindow.setIgnoreMouseEvents(true, { forward: true });
                }
            } catch (error) {
                console.error('Erro ao verificar posição do cursor:', error);
            }
        }, 50); // Verificar a cada 50ms para resposta rápida
    }
    
    function stopMousePositionPolling() {
        if (mouseCheckInterval) {
            clearInterval(mouseCheckInterval);
            mouseCheckInterval = null;
        }
    }
    
    // Listener para iniciar/parar polling quando lock state mudar
    ipcMain.on('start-mouse-polling', () => {
        if (isLocked) {
            startMousePositionPolling();
        }
    });
    
    ipcMain.on('stop-mouse-polling', () => {
        stopMousePositionPolling();
    });

    // Enviar el estado inicial del candado al renderizador una vez que la ventana esté lista
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('lock-state-changed', isLocked);
    });

    // Manejar el evento para abrir la ventana de histórico
    ipcMain.on('open-history-window', () => {
        if (historyWindow) {
            historyWindow.focus();
            return;
        }

        historyWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            transparent: false,
            frame: false, // Remove menu bar e bordas
            alwaysOnTop: true,
            resizable: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'), // ADICIONAR preload para IPC funcionar
                nodeIntegration: false,
                contextIsolation: true,
            },
            icon: path.join(__dirname, 'icon.ico'),
            title: 'Histórico de Lutas - BPSR Meter'
        });

        historyWindow.loadURL(`http://localhost:${server_port}/history.html`);

        historyWindow.on('closed', () => {
            historyWindow = null;
        });
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
