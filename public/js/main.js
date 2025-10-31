// Estado global para modo Lite
let isLiteMode = false;
let liteModeType = 'dps'; // 'dps' o 'healer'
const professionMap = {
    // Clases Principales
    '雷影剑士': { name: 'Stormblade', icon: 'Stormblade.png', role: 'dps' },
    '冰魔导师': { name: 'Frost Mage', icon: 'Frost Mage.png', role: 'dps' },
    '涤罪恶火·战斧': { name: 'Fire Axe', icon: 'Fire Axe.png', role: 'dps' },
    '青岚骑士': { name: 'Wind Knight', icon: 'Wind Knight.png', role: 'tank' },
    '森语者': { name: 'Verdant Oracle', icon: 'Verdant Oracle.png', role: 'dps' },
    '雷霆一闪·手炮': { name: 'Gunner', icon: 'desconocido.png', role: 'dps' },
    '巨刃守护者': { name: 'Heavy Guardian', icon: 'baluarte_ferreo.png', role: 'tank' },
    '暗灵祈舞·仪刀/仪仗': { name: 'Spirit Dancer', icon: 'desconocido.png', role: 'dps' },
    '神射手': { name: 'Marksman', icon: 'arco_halcon.png', role: 'dps' },
    '神盾骑士': { name: 'Shield Knight', icon: 'guardian.png', role: 'tank' },
    '灵魂乐手': { name: 'Soul Musician', icon: 'sonido_feroz.png', role: 'dps' },

    // Especializaciones
    '居合': { name: 'laido Slash', icon: 'Stormblade.png', role: 'dps' },
    '月刃': { name: 'MoonStrike', icon: 'MoonStrike.png', role: 'dps' },
    '冰矛': { name: 'Icicle', icon: 'lanza_hielo.png', role: 'dps' },
    '射线': { name: 'Frostbeam', icon: 'Frost Mage.png', role: 'dps' },
    '防盾': { name: 'Vanguard', icon: 'guardian.png', role: 'tank' },
    '岩盾': { name: 'Skyward', icon: 'Fire Axe.png', role: 'tank' },
    '惩戒': { name: 'Smite', icon: 'castigo.png', role: 'dps' },
    '愈合': { name: 'Lifebind', icon: 'Verdant Oracle.png', role: 'healer' },
    '格挡': { name: 'Block', icon: 'guardian.png', role: 'tank' },
    '狼弓': { name: 'Wildpack', icon: 'arco_lobo.png', role: 'dps' },
    '鹰弓': { name: 'Falconry', icon: 'arco_halcon.png', role: 'dps' },
    '光盾': { name: 'Shield', icon: 'egida_luz.png', role: 'tank' },
    '协奏': { name: 'Concerto', icon: 'Concierto.png', role: 'dps' },
    '狂音': { name: 'Dissonance', icon: 'sonido_feroz.png', role: 'dps' },
    '空枪': { name: 'Empty Gun', icon: 'francotirador.png', role: 'dps' },
    '重装': { name: 'Heavy Armor', icon: 'Wind Knight.png', role: 'dps' },

};

 const defaultProfession = { name: 'Unknown', icon: 'desconocido.png', role: 'dps' };

    let lastTotalDamage = 0;
    let lastDamageChangeTime = Date.now();
    let currentZoom = 1.0; // Factor de zoom inicial
    let syncTimerInterval;
    let syncCountdown = 0;
    const SYNC_RESET_TIME = 80; // Segundos para el reinicio automático
    let syncTimerDisplayTimeout; // Para el retardo de 200ms
    let isLocked = false; // Estado de bloqueo de la ventana
    let logPreviewTimeout; // Declarar logPreviewTimeout aquí

    const dpsTimerDiv = document.getElementById('dps-timer');
    const playerBarsContainer = document.getElementById('player-bars-container');
    const syncButton = document.getElementById('sync-button');
    const syncIcon = document.querySelector('#sync-button .sync-icon');
    const syncTimerSpan = document.querySelector('#sync-button .sync-timer');
    const lockButton = document.getElementById('lock-button');
    const logsSection = document.getElementById('logs-section'); // Declarar logsSection aquí
    const loadingIndicator = document.getElementById('loading-indicator'); // Indicador de carga

    // Permitir interacción con Alt cuando está bloqueado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            if (document.body.classList.contains('locked')) {
                document.body.classList.add('alt-pressed');
            }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            document.body.classList.remove('alt-pressed');
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                resetDpsMeter();
            });
        }


        // Botón Advanced/Lite
        const advLiteBtn = document.getElementById('advanced-lite-btn');
        const liteDpsHealerBtn = document.getElementById('lite-dps-healer-btn');
        if (advLiteBtn) {
            advLiteBtn.addEventListener('click', () => {
                isLiteMode = !isLiteMode;
                advLiteBtn.classList.toggle('lite', isLiteMode);
                advLiteBtn.textContent = isLiteMode ? 'Lite' : 'Advanced';
                // Mostrar/ocultar el botón DPS/Healer
                if (liteDpsHealerBtn) {
                    liteDpsHealerBtn.style.display = isLiteMode ? 'inline-flex' : 'none';
                }
                fetchDataAndRender();
            });
        }
        if (liteDpsHealerBtn) {
            liteDpsHealerBtn.addEventListener('click', () => {
                liteModeType = (liteModeType === 'dps') ? 'healer' : 'dps';
                liteDpsHealerBtn.textContent = (liteModeType === 'dps') ? 'DPS' : 'Healer';
                liteDpsHealerBtn.classList.toggle('lite', isLiteMode); /* Asegura que el botón Lite/Healer también tenga el estilo 'lite' */
                fetchDataAndRender();
            });
        }
        // Inicializar visibilidad y estilo del botón al cargar
        if (liteDpsHealerBtn) {
            liteDpsHealerBtn.style.display = isLiteMode ? 'inline-flex' : 'none';
            liteDpsHealerBtn.classList.toggle('lite', isLiteMode);
        }

        const zoomInButton = document.getElementById('zoom-in-button');
        const zoomOutButton = document.getElementById('zoom-out-button');

        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => {
                currentZoom = Math.min(2.0, currentZoom + 0.1); // Limitar zoom máximo a 2.0
                applyZoom();
            });
        }

        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => {
                currentZoom = Math.max(0.5, currentZoom - 0.1); // Limitar zoom mínimo a 0.5
                applyZoom();
            });
        }

        if (syncButton) {
            // syncButton.addEventListener('click', syncData); // El botón de sincronización ya no es clicable
        }

        if (lockButton) {
            lockButton.addEventListener('click', () => {
                if (window.electronAPI) {
                    window.electronAPI.toggleLockState();
                }
            });

            // Escuchar cambios de estado del candado desde el proceso principal
            if (window.electronAPI) {
                window.electronAPI.onLockStateChanged((locked) => {
                    isLocked = locked;
                    lockButton.innerHTML = isLocked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
                    lockButton.title = isLocked ? 'Desbloquear posición' : 'Bloquear posición';
                    document.body.classList.toggle('locked', isLocked); // Añadir/quitar clase al body
                });
            }
        }

        const closeButton = document.getElementById('close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (window.electronAPI) {
                    window.electronAPI.closeWindow();
                }
            });
        }
    });

    function applyZoom() {
        if (playerBarsContainer) {
            playerBarsContainer.style.transform = `scale(${currentZoom})`;
            playerBarsContainer.style.transformOrigin = 'top left';
            updateWindowSize(); // Redimensionar la ventana al aplicar zoom
        }
    }

    function updateWindowSize() {
        const dpsMeter = document.querySelector('.dps-meter');
        const container = document.getElementById('player-bars-container');
        if (!dpsMeter || !container || !window.electronAPI) return;

        const baseWidth = 650; // Ancho fijo como se solicitó
        const headerHeight = document.querySelector('.controls')?.offsetHeight || 50; // Altura de la cabecera
        const marginTop = 40; // Margen superior del contenedor de barras
        const borderWidth = 2; // Borde superior e inferior del contenedor
        const barHeight = 55; // Altura de cada barra de jugador
        const barGap = 8;    // Espacio entre barras

        const numPlayers = container.querySelectorAll('.player-bar').length;
        const numPlayersCapped = Math.min(numPlayers, 10); // Limitar a 10 barras

        let barsHeight = 0;
        if (numPlayersCapped > 0) {
            barsHeight = (numPlayersCapped * barHeight) + ((numPlayersCapped - 1) * barGap);
        } else {
            // Altura mínima para el mensaje "Esperando datos..."
            barsHeight = 50;
        }

        // Calcular la altura total sin escalar, incluyendo la cabecera y un búfer
        const totalContentHeightUnscaled = headerHeight + marginTop + borderWidth + barsHeight + 20; // Búfer de 20px

        // Aplicar el zoom actual al ancho y alto de la ventana
        const finalWidth = Math.round(baseWidth * currentZoom);
        const finalHeight = Math.round(totalContentHeightUnscaled * currentZoom);
        
        window.electronAPI.resizeWindow(finalWidth, finalHeight);
    }

    function resetDpsMeter() {
        fetch('/api/clear');
        dpsTimerDiv.style.display = 'none';
        dpsTimerDiv.innerText = '';
        console.log('Medidor reiniciado.');
        lastTotalDamage = 0;
        lastDamageChangeTime = Date.now();
        stopSyncTimer(); // Detener el temporizador de sincronización al reiniciar
    }

    // La función syncData ya no se llama por un clic, pero se mantiene por si se usa internamente
    async function syncData() {
        // No modificar el estado visual aquí, se gestiona en updateSyncButtonState
        try {
            await fetch('/api/sync', { method: 'POST' });
            console.log('Datos sincronizados internamente.');
        } catch (error) {
            console.error('Error al sincronizar datos:', error);
        }
    }

    // Función para actualizar el estado visual del indicador de sincronización
    function updateSyncButtonState() {
        clearTimeout(syncTimerDisplayTimeout); // Limpiar cualquier timeout pendiente

        if (syncTimerInterval) { // Si el temporizador está activo (hay cuenta regresiva)
            if (syncCountdown <= 60) {
                // Mostrar temporizador, ocultar icono
                syncIcon.style.display = 'none';
                syncIcon.classList.remove('spinning');
                syncTimerSpan.innerText = `${syncCountdown}s`;
                syncTimerSpan.style.display = 'block';
            } else {
                // Mostrar icono girando, ocultar temporizador
                syncIcon.style.display = 'block';
                syncIcon.classList.add('spinning'); // Asegura que gire continuamente
                syncTimerSpan.style.display = 'none';
            }
        } else { // Si el temporizador no está activo (no hay cuenta regresiva)
            // Mostrar icono girando, ocultar temporizador
            syncIcon.style.display = 'block';
            syncIcon.classList.add('spinning'); // Asegura que gire continuamente
            syncTimerSpan.style.display = 'none';
            syncTimerSpan.innerText = '';
        }
    }

    function startSyncTimer() {
        if (syncTimerInterval) return; // Evitar múltiples temporizadores
        syncCountdown = SYNC_RESET_TIME;
        updateSyncButtonState(); // Establecer el estado inicial

        syncTimerInterval = setInterval(() => {
            syncCountdown--;
            updateSyncButtonState(); // Actualizar el estado en cada tick

            if (syncCountdown <= 0) {
                stopSyncTimer();
                resetDpsMeter();
            }
        }, 1000);
    }

    function stopSyncTimer() {
        clearInterval(syncTimerInterval);
        syncTimerInterval = null;
        clearTimeout(syncTimerDisplayTimeout); // Limpiar el timeout si existe
        updateSyncButtonState(); // Restablecer el estado del indicador
    }

    function formatTimer(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    async function fetchLogs() {
        const res = await fetch('/logs-dps');
        return await res.json();
    }

    function renderLogs(logs) {
        let html = '';
        if (logs.length === 0) {
            logsSection.style.display = 'none'; // Ocultar la sección si no hay logs
            return;
        } else {
            logsSection.style.display = 'block'; // Mostrar la sección si hay logs
            html = '<select id="logs-dropdown" style="width:100%;padding:6px 4px;border-radius:6px;font-size:1rem;">' +
                `<option value="-1">LOG</option>` +
                logs.map((log, i) => `<option value="${i}">${log.fecha}</option>`).join('') + '</select>';
            html += '<div id="log-preview"></div>';
        }
        logsSection.innerHTML = html;
        if (logs.length > 0) {
            let lastValue = -1;
            const dropdown = document.getElementById('logs-dropdown');
            dropdown.onchange = function() {
                if (this.value == lastValue || this.value == -1) {
                    showLogPreview(null);
                    this.value = -1;
                    lastValue = -1;
                } else {
                    showLogPreview(logs[this.value]);
                    lastValue = this.value;
                }
            };
        }
    }

    function showLogPreview(log) {
        const logPreview = document.getElementById('log-preview');
        if (logPreviewTimeout) {
            clearTimeout(logPreviewTimeout);
        }

        if (!log) {
            logPreview.innerHTML = '';
            return;
        }

        let prof = professionMap && log.icon ? Object.values(professionMap).find(p => p.icon === log.icon) : null;
        let profName = prof ? prof.name : '';
        logPreview.innerHTML = `<div class=\"player-bar\" style=\"margin-top:10px;\">\n            <div class=\"progress-fill\" style=\"width: 100%; background: #444b5a;\"></div>\n            <div class=\"bar-content\">\n                <div class=\"player-info\">\n                    <span class=\"player-name\">${log.nombre}</span>\n                    <span class=\"player-id\">ID: ${log.id}</span>\n                    <span class=\"player-id\">${profName}</span>\n                </div>\n                <div class=\"player-performance\">\n                    <div class=\"stats-list\">\n                        <span class=\"main-stat\">DPS ${formatStat(log.dps)}</span>\n                        <span class=\"secondary-stat\">HPS ${formatStat(log.hps)}</span>\n                        <span class=\"secondary-stat\">DTPS ${formatStat(log.dtps)}</span>\n                    </div>\n                    <img class=\"class-icon\" src=\"icons/${log.icon}\" alt=\"icon\">\n                </div>\n            </div>\n        </div>`;
        logPreviewTimeout = setTimeout(() => { 
            logPreview.innerHTML = '';
        }, 7000);
    }

    async function updateLogsUI() {
        const logs = await fetchLogs();
        renderLogs(logs);
    }

    function getHealthColor(percentage) {
        const r1 = 220, g1 = 53, b1 = 69; // Rojo para HP bajo (#dc3545)
        const r2 = 40, g2 = 167, b2 = 69; // Verde para HP alto (#28a745)

        const r = Math.round(r1 + (r2 - r1) * (percentage / 100));
        const g = Math.round(g1 + (g2 - g1) * (percentage / 100));
        const b = Math.round(b1 + (b2 - b1) * (percentage / 100));

        return `rgb(${r}, ${g}, ${b})`;
    }

    function formatStat(value) {
        if (value >= 1000000000000) {
            return (value / 1000000000000).toFixed(1) + 'T';
        }
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(1) + 'G';
        }
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toFixed(0);
    }

    const playerColors = [
        'rgba(255, 99, 132, 0.7)', // Rojo
        'rgba(54, 162, 235, 0.7)', // Azul
        'rgba(255, 206, 86, 0.7)', // Amarillo
        'rgba(75, 192, 192, 0.7)', // Verde
        'rgba(153, 102, 255, 0.7)', // Morado
        'rgba(255, 159, 64, 0.7)' // Naranja
    ];

    async function fetchDataAndRender() {
        const container = document.getElementById('player-bars-container');
        try {
            const [dataRes, diccRes, settingsRes] = await Promise.all([
                fetch('/api/data'),
                fetch('/api/diccionario'),
                fetch('/api/settings')
            ]);
            const userData = await dataRes.json();
            const diccionarioData = await diccRes.json();
            const currentGlobalSettings = await settingsRes.json();

            let userArray = Object.values(userData.user);
            userArray = userArray.filter(u => u.total_damage && u.total_damage.total > 0);

            if (!userArray || userArray.length === 0) {
                loadingIndicator.style.display = 'flex'; // Mostrar el indicador de carga
                playerBarsContainer.style.display = 'none'; // Ocultar el contenedor de barras
                updateSyncButtonState();
                return;
            }

            loadingIndicator.style.display = 'none'; // Ocultar el indicador de carga
            playerBarsContainer.style.display = 'flex'; // Mostrar el contenedor de barras

            const sumaTotalDamage = userArray.reduce((acc, u) => acc + (u.total_damage && u.total_damage.total ? Number(u.total_damage.total) : 0), 0);

            if (sumaTotalDamage > 0) {
                if (sumaTotalDamage !== lastTotalDamage) {
                    lastTotalDamage = sumaTotalDamage;
                    lastDamageChangeTime = Date.now();
                    stopSyncTimer();
                } else {
                    if (Date.now() - lastDamageChangeTime > SYNC_RESET_TIME * 1000) {
                        resetDpsMeter();
                        return;
                    }
                    if (!syncTimerInterval) {
                        startSyncTimer();
                    }
                }
            } else {
                lastTotalDamage = 0;
                lastDamageChangeTime = Date.now();
                stopSyncTimer();
            }

            // Cálculo de damagePercent para todos los usuarios (base para Advanced y Lite DPS)
            userArray.forEach(u => {
                const userDamage = u.total_damage && u.total_damage.total ? Number(u.total_damage.total) : 0;
                u.damagePercent = sumaTotalDamage > 0 ? Math.max(0, Math.min(100, (userDamage / sumaTotalDamage) * 100)) : 0;
            });

            if (isLiteMode && liteModeType === 'healer') {
                const totalHealingContribution = userArray.reduce((acc, u) => acc + (u.total_healing && u.total_healing.total ? Number(u.total_healing.total) : 0), 0);
                userArray.forEach(u => {
                    const userHealing = u.total_healing && u.total_healing.total ? Number(u.total_healing.total) : 0;
                    u.healingPercent = totalHealingContribution > 0 ? Math.max(0, Math.min(100, (userHealing / totalHealingContribution) * 100)) : 0;
                });
                userArray.sort((a, b) => b.healingPercent - a.healingPercent);
            } else { // Modo DPS (Lite o Advanced)
                userArray.sort((a, b) => (b.total_damage && b.total_damage.total ? Number(b.total_damage.total) : 0) - (a.total_damage && a.total_damage.total ? Number(a.total_damage.total) : 0));
            }
            
            userArray = userArray.slice(0, 20);

            if (isLiteMode) {
                container.innerHTML = userArray.map((u, index) => {
                    const professionParts = u.profession.split('-');
                    const mainProfessionKey = professionParts[0];
                    const subProfessionKey = professionParts[1];
                    const mainProf = professionMap[mainProfessionKey] || defaultProfession;
                    const subProf = professionMap[subProfessionKey];
                    let prof = subProf || mainProf;
                    const nombre = u.name || '';
                    const color = playerColors[index % playerColors.length];
                    let barFillWidth, barFillBackground, value1, value2, iconHtml;

                    if (liteModeType === 'dps') {
                        barFillWidth = u.damagePercent;
                        barFillBackground = u.total_dps > 0 ? `linear-gradient(90deg, transparent, ${color})` : 'none';
                        iconHtml = "<span style='font-size:1.1em;margin-right:2px;'>🔥</span>";
                        value1 = `${formatStat(u.total_damage.total || 0)}`;
                        value2 = `${Math.round(u.damagePercent)}%`;
                    } else { // liteModeType === 'healer'
                        barFillWidth = u.healingPercent;
                        barFillBackground = u.total_healing && u.total_healing.total > 0 ? `linear-gradient(90deg, transparent, #28a745)` : 'none'; // Verde para healer
                        iconHtml = "<span style='font-size:1.1em;margin-right:2px; color: #28a745; text-shadow: 0 0 2px white, 0 0 2px white, 0 0 2px white, 0 0 2px white;'>⛨</span>"; // Icono verde con contorno blanco
                        value1 = `${formatStat((u.total_healing && u.total_healing.total) || 0)}`;
                        value2 = `${Math.round(u.healingPercent)}%`; // Porcentaje de contribución de heal
                    }

                    return `<div class="lite-bar" data-lite="true" data-rank="${u.rank}">
                        <div class="lite-bar-fill" style="width: ${barFillWidth}%; background: ${barFillBackground};"></div>
                        <div class="lite-bar-content" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; justify-content: space-between;">
                            <div class="skill-analysis-button" title="Análisis de Habilidades">
                                <i class="fa-solid fa-chart-bar"></i>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <img class="lite-bar-icon" src="icons/${prof.icon}" alt="icon" style="margin-left:2px; margin-right:5px;" />
                                <span class="lite-bar-name">${nombre}</span>
                            </div>
                            <div class="lite-bar-values">
                                <span class="lite-bar-damage">${value1} ${iconHtml}</span>
                                <span class="lite-bar-percent">${value2}</span>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            } else {
                // ...renderizado original...
                container.innerHTML = userArray.map((u, index) => {
                    const professionParts = u.profession.split('-');
                    const mainProfessionKey = professionParts[0];
                    const subProfessionKey = professionParts[1];
                    const mainProf = professionMap[mainProfessionKey] || defaultProfession;
                    const subProf = professionMap[subProfessionKey];
                    let prof = subProf || mainProf;
                    let professionName = mainProf.name;
                    if (subProf) {
                        professionName += ` - ${subProf.name}`;
                    }
                    const dps = Number(u.total_dps) || 0;
                    const totalHealing = u.total_healing ? (Number(u.total_healing.total) || 0) : 0;
                    const color = playerColors[index % playerColors.length];
                    const dpsColor = dps > 0 ? `linear-gradient(90deg, transparent, ${color})` : 'none';
                    const nombre = u.name || '';
                    const totalHits = u.total_count.total || 0;
                    const crit = (u.total_count.critical !== undefined && totalHits > 0) ? Math.round((u.total_count.critical / totalHits) * 100) : '0';
                    const lucky = (u.total_count.lucky !== undefined && totalHits > 0) ? Math.round((u.total_count.lucky / totalHits) * 100) : '0';
                    const peak = (u.realtime_dps_max !== undefined) ? u.realtime_dps_max : 0;
                    return `<div class="player-bar" data-rank="${u.rank}">
                        <div class="progress-fill" style="width: ${u.damagePercent}%; background: ${dpsColor}"></div>
                        <div class="bar-content">
                            <div class="skill-analysis-button" title="Análisis de Habilidades">
                                <i class="fa-solid fa-chart-bar"></i>
                            </div>
                            <div class="column name-col">
                                <span class="player-name">${nombre}</span>
                                <div class="additional-stat-row" style="height: 18px; margin-top: 1px; margin-bottom: 1px;">
                                    <span class="additional-stat-icon" style="color: #dc3545; position: absolute; left: 4px; z-index: 2;">❤</span>
                                    <div class="hp-bar-background">
                                        <div class="hp-bar-fill" style="width: ${((u.hp || 0) / (u.max_hp || 1)) * 100}%; background-color: ${getHealthColor(((u.hp || 0) / (u.max_hp || 1)) * 100)};"></div>
                                    </div>
                                    <span class="additional-stat-value" style="width: 100%; text-align: center; font-size: 0.8rem; color: white; text-shadow: 1px 1px 1px black;">${formatStat(u.hp || 0)}/${formatStat(u.max_hp || 0)}</span>
                                </div>
                                <span class="player-id">${professionName}</span>
                            </div>
                            <div class="column stats-col" style="margin-left: 40px;">
                                <div class="stats-group">
                                    <div class="stat-row"><span class="stat-value">${formatStat(dps)}</span><span class="stat-label">DPS</span></div>
                                    <div class="stat-row"><span class="stat-value">${formatStat(u.total_hps || 0)}</span><span class="stat-label" style="color: #28a745;">HPS</span></div>
                                    <div class="stat-row"><span class="stat-value">${formatStat(u.taken_damage)}</span><span class="stat-label" style="color: #ffc107;">DT</span></div>
                                </div>
                            </div>
                            <div class="column icon-col" style="flex-direction: column; justify-content: center; align-items: center; text-align: center; min-width: 65px; position: relative; margin-left: -10px;">
                                <img class="class-icon" src="icons/${prof.icon}" alt="icon" style="height: 42px; width: 42px;">
                                <span style="font-size: 0.8rem; font-weight: 600; color: #fff; background: rgba(0, 0, 0, 0.5); padding: 0 4px; border-radius: 5px; position: absolute; top: 12.5px; left: 50%; transform: translateX(-50%); text-shadow: 0 0 2px rgba(0,0,0,0.7);">${Math.round(u.damagePercent)}%</span>
                            </div>
                            <div class="column extra-col" style="margin-left: -10px;">
                                <div class="stats-extra">
                                    <div class="stat-row">
                                        <span class="stat-label">CRIT</span>
                                        <span class="stat-icon"> ✸</span>
                                        <span class="stat-value">${crit}%</span>
                                    </div>
                                    <div class="stat-row">
                                        <span class="stat-label">LUCK</span>
                                        <span class="stat-icon"> ☘</span>
                                        <span class="stat-value">${lucky}%</span>
                                    </div>
                                    <div class="stat-row">
                                        <span class="stat-label">MAX</span>
                                        <span class="stat-icon"> ⚔</span>
                                        <span class="stat-value">${formatStat(peak)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="column additional-stats-col">
                                <div class="additional-stats-group">
                                    <div class="additional-stat-row">
                                        <span class="additional-stat-icon" style="font-weight: bold;">GS</span>
                                        <span class="additional-stat-value">${formatStat(u.fightPoint)}</span>
                                    </div>
                                    <div class="additional-stat-row">
                                        <span class="additional-stat-icon">🔥</span>
                                        <span class="additional-stat-value">${formatStat(u.total_damage.total || 0)}</span>
                                    </div>
                                    <div class="additional-stat-row">
                                        <span class="additional-stat-icon" style="color: #28a745;">⛨</span>
                                        <span class="additional-stat-value">${formatStat(u.total_healing.total || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (err) {
            if (container) {
                container.innerHTML = '<div id="message-display">Error de conexión...</div>';
            }
        } finally {
            updateSyncButtonState();
            updateWindowSize();
        }
    }

    let isPaused = false;
    let updateInterval = null;

    async function setPauseState(paused) {
        try {
            const res = await fetch('/api/pause', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paused }),
            });
            const data = await res.json();
            console.log(data.msg);
            isPaused = data.paused;
            return isPaused;
        } catch (err) {
            console.error('Error al cambiar estado de pausa:', err);
        }
    }

    function startUpdating() {
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(() => {
            if (!isPaused) {
                fetchDataAndRender();
                updateLogsUI();
            }
        }, 50);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const pauseButton = document.getElementById('pause-logs-button');
        if (pauseButton) {
            pauseButton.addEventListener('click', async () => {
                const newState = !isPaused;
                const result = await setPauseState(newState);
                // result (isPaused) comes from the server. When paused === true we should show the PLAY icon
                if (result) {
                    pauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
                    pauseButton.title = 'Reanudar Logs';
                } else {
                    pauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    pauseButton.title = 'Pausar Logs';
                }
            });
        }

        // Consultar estado inicial desde backend
        fetch('/api/pause')
            .then((res) => res.json())
            .then((data) => {
                isPaused = data.paused;
                if (pauseButton) {
                    if (isPaused) {
                        pauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
                        pauseButton.title = 'Reanudar Logs';
                    } else {
                        pauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        pauseButton.title = 'Pausar Logs';
                    }
                }
            })
            .catch((err) => {
                console.error('Error fetching pause state:', err);
            });

        startUpdating();
        fetchDataAndRender();
        updateLogsUI();
    });


    // Script para eliminar el texto de depuración de VSCode
    document.addEventListener('DOMContentLoaded', () => {
        const debugTexts = [
            '# VSCode Visible Files',
            '# VSCode Open Tabs',
            '# Current Time',
            '# Context Window Usage',
            '# Current Mode'
        ];

        // Función para buscar y eliminar nodos de texto o elementos que contengan el texto
        function removeDebugText() {
            const allElements = document.body.querySelectorAll('*');
            allElements.forEach(element => {
                debugTexts.forEach(debugText => {
                    if (element.textContent.includes(debugText)) {
                        // Si el texto está directamente en el elemento, o es un elemento que contiene solo ese texto
                        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE && element.firstChild.textContent.includes(debugText)) {
                            element.remove();
                        } else {
                            // Si el texto es parte de un nodo de texto más grande, intentar eliminar solo el nodo de texto
                            Array.from(element.childNodes).forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(debugText)) {
                                    node.remove();
                                }
                            });
                        }
                    }
                });
            });

            // También buscar directamente en el body si hay nodos de texto sueltos
            Array.from(document.body.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    debugTexts.forEach(debugText => {
                        if (node.textContent.includes(debugText)) {
                            node.remove();
                        }
                    });
                }
            });
        }

        // Ejecutar la función inmediatamente y luego con un pequeño retraso para capturar inyecciones tardías
        removeDebugText();
        setTimeout(removeDebugText, 500); // Reintentar después de 500ms
    });
