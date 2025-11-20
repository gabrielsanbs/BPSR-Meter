# 🎯 BPSR Meter v3.2.4

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português

**✨ NOVIDADES v3.2.4:**

### ⚡ Otimizações VPN/ExitLag
- **Grace Period reduzido**: 3s/8s → 1.5s/4s (transições mais rápidas)
- **Extra Buffer reduzido**: 2s → 0.5s (menos delay ao trocar mapa)
- **Limpeza preventiva de cache TCP**: evita acúmulo de pacotes antes de sincronização
- **Resultado**: Troca de mapa ~7 segundos mais rápida! 🚀

### 👤 Nomes Aparecem Instantaneamente
- **Cache agressivo centralizado** em `_processPlayerAttrs()`
- **Tripla busca de nome**: Attrs padrão → MapAttrs → Histórico (player_map.json)
- **Com ExitLag**: Mostra nome do histórico imediatamente se já conhece o jogador
- **Sem mais "Player 1234"** esperando pacotes fragmentados

### 💻 Performance
- **Reader otimizado** - criado apenas quando necessário (lazy initialization)
- **Código limpo** - removido código redundante de cache lookup em 2 métodos
- **Menos alocações de memória** - processamento mais eficiente

### 🐛 Correções
- **Histórico**: cores dos 3 primeiros lugares agora usam getClassColor() correto
- **Limite de 20 lutas**: histórico trunca automaticamente ao carregar
- **Dados de classe corrigidos**: "未知" (Unknown) prioriza especialização

**📥 Como atualizar:**
1. Baixe: `BPSR Meter (by gabrielsanbs) Setup 3.2.4.exe`
2. Execute o instalador (sobrescreve versões anteriores)
3. Suas configurações serão mantidas automaticamente

**ℹ️ Nota para usuários de VPN:**
- Use **Legacy NDIS (NDIS 5)** no ExitLag/NoPing para melhor performance
- Windows entregará pacotes já ordenados, eliminando delay

---

## English

**✨ NEW IN v3.2.4:**

### ⚡ VPN/ExitLag Optimizations
- **Grace Period reduced**: 3s/8s → 1.5s/4s (faster transitions)
- **Extra Buffer reduced**: 2s → 0.5s (less map change delay)
- **Preventive TCP cache cleanup**: prevents packet accumulation before sync
- **Result**: Map changes ~7 seconds faster! 🚀

### 👤 Player Names Appear Instantly
- **Centralized aggressive caching** in `_processPlayerAttrs()`
- **Triple name lookup**: Standard Attrs → MapAttrs → History (player_map.json)
- **With ExitLag**: Shows name from history immediately if already known
- **No more "Player 1234"** waiting for fragmented packets

### 💻 Performance
- **Optimized reader** - created only when needed (lazy initialization)
- **Clean code** - removed redundant cache lookup code in 2 methods
- **Fewer memory allocations** - more efficient processing

### 🐛 Fixes
- **History**: top 3 places now use correct getClassColor()
- **20 fight limit**: history auto-truncates on load
- **Class data fixed**: "Unknown" (未知) prioritizes specialization

**📥 How to update:**
1. Download: `BPSR Meter (by gabrielsanbs) Setup 3.2.4.exe`
2. Run installer (overwrites previous versions)
3. Your settings will be preserved automatically

**ℹ️ Note for VPN users:**
- Use **Legacy NDIS (NDIS 5)** on ExitLag/NoPing for best performance
- Windows will deliver packets already ordered, eliminating delay

---

## Español

**✨ NOVEDADES v3.2.4:**

### ⚡ Optimizaciones VPN/ExitLag
- **Grace Period reducido**: 3s/8s → 1.5s/4s (transiciones más rápidas)
- **Extra Buffer reducido**: 2s → 0.5s (menos delay al cambiar mapa)
- **Limpieza preventiva de caché TCP**: evita acumulación de paquetes antes de sincronización
- **Resultado**: ¡Cambios de mapa ~7 segundos más rápidos! 🚀

### 👤 Nombres Aparecen Instantáneamente
- **Caché agresivo centralizado** en `_processPlayerAttrs()`
- **Búsqueda triple de nombre**: Attrs estándar → MapAttrs → Historial (player_map.json)
- **Con ExitLag**: Muestra nombre del historial inmediatamente si ya lo conoce
- **No más "Player 1234"** esperando paquetes fragmentados

### 💻 Rendimiento
- **Reader optimizado** - creado solo cuando es necesario (lazy initialization)
- **Código limpio** - eliminado código redundante de búsqueda de caché en 2 métodos
- **Menos asignaciones de memoria** - procesamiento más eficiente

### 🐛 Correcciones
- **Historial**: los 3 primeros lugares ahora usan getClassColor() correcto
- **Límite de 20 luchas**: el historial se trunca automáticamente al cargar
- **Datos de clase corregidos**: "Unknown" (未知) prioriza especialización

# 🎯 BPSR Meter v3.2.3

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português

**✨ NOVIDADES v3.2.3:**

### 🎨 Cores Fixas por Classe
- **Cada classe tem cor própria** no medidor e histórico de lutas
- **Heavy Guardian**: laranja (#eca41c)
- **Stormblade**: roxo (#8000bc)
- **Shield Knight**: amarelo (#ece51c)
- **Wind Knight**: ciano (#00aeb8)
- **Frost Mage**: azul (#1c91ec)
- **Marksmanship**: vermelho (#ec1c29)
- **Verdant Oracle**: verde (#00bc07)
- **Beat Performer**: verde escuro (#017d06)
- **Especialização detectada primeiro** - se jogador usa especialização, cor é baseada nela

### 🐛 Correção de Escopo
- **Crash ao fechar corrigido** - `stopMousePositionPolling` movido para escopo global
- **Função acessível em `will-quit`** - não mais erro "is not defined"
- **Variáveis de polling globalizadas** - `mouseCheckInterval` e `HEADER_HEIGHT` agora globais

**📥 Como atualizar:**
1. Baixe: `BPSR Meter (by gabrielsanbs) Setup 3.2.3.exe`
2. Execute o instalador (sobrescreve versões anteriores)
3. Suas configurações serão mantidas automaticamente

---

## English

**✨ NEW IN v3.2.3:**

### 🎨 Fixed Colors by Class
- **Each class has its own color** in meter and fight history
- **Heavy Guardian**: orange (#eca41c)
- **Stormblade**: purple (#8000bc)
- **Shield Knight**: yellow (#ece51c)
- **Wind Knight**: cyan (#00aeb8)
- **Frost Mage**: blue (#1c91ec)
- **Marksmanship**: red (#ec1c29)
- **Verdant Oracle**: green (#00bc07)
- **Beat Performer**: dark green (#017d06)
- **Specialization detected first** - if player uses specialization, color is based on it

### 🐛 Scope Fix
- **Crash on close fixed** - `stopMousePositionPolling` moved to global scope
- **Function accessible in `will-quit`** - no more "is not defined" error
- **Polling variables globalized** - `mouseCheckInterval` and `HEADER_HEIGHT` now global

**📥 How to update:**
1. Download: `BPSR Meter (by gabrielsanbs) Setup 3.2.3.exe`
2. Run installer (overwrites previous versions)
3. Your settings will be kept automatically

---

## Español

**✨ NOVEDADES v3.2.3:**

### 🎨 Colores Fijos por Clase
- **Cada clase tiene su propio color** en el medidor e historial de combates
- **Heavy Guardian**: naranja (#eca41c)
- **Stormblade**: morado (#8000bc)
- **Shield Knight**: amarillo (#ece51c)
- **Wind Knight**: cian (#00aeb8)
- **Frost Mage**: azul (#1c91ec)
- **Marksmanship**: rojo (#ec1c29)
- **Verdant Oracle**: verde (#00bc07)
- **Beat Performer**: verde oscuro (#017d06)
- **Especialización detectada primero** - si el jugador usa especialización, el color se basa en ella

### 🐛 Corrección de Ámbito
- **Crash al cerrar corregido** - `stopMousePositionPolling` movido al ámbito global
- **Función accesible en `will-quit`** - no más error "is not defined"
- **Variables de polling globalizadas** - `mouseCheckInterval` y `HEADER_HEIGHT` ahora globales

**📥 Cómo actualizar:**
1. Descarga: `BPSR Meter (by gabrielsanbs) Setup 3.2.3.exe`
2. Ejecuta el instalador (sobrescribe versiones anteriores)
3. Tus configuraciones se mantendrán automáticamente

---

# 🎯 BPSR Meter v3.2.2

## Português

**✨ NOVIDADES v3.2.2:**

### 🛡️ Correção Crítica de Estabilidade
- **Crash "Object has been destroyed" CORRIGIDO** - aplicação não trava mais ao fechar
- **Limpeza completa de timers** em todos os módulos (Electron, backend Node.js e frontend)
- **7+ vazamentos de timer eliminados** que causavam tentativas de acesso a objetos destruídos
- **Proteção contra janelas destruídas** em todos os callbacks de timer

### 🔧 Melhorias no Atalho Global F10
- **Re-registro automático do F10** a cada 30 segundos se perder o registro
- **Proteção robusta** contra falhas quando o Blue Protocol tem foco
- **Logs de erro detalhados** para diagnóstico de problemas com atalhos

### 💾 Persistência de Zoom Aprimorada
- **Zoom aplicado imediatamente** ao iniciar (não espera mais interação do usuário)
- **Chamada de `applyZoom()` no DOMContentLoaded** para restauração instantânea

### 🧹 Limpeza de Recursos Implementada
- **`cleanup()` em dataManager.js** - limpa cacheSaveTimer e playerMapSaveTimer
- **`cleanup()` em sniffer.js** - limpa fragmentCleanupInterval
- **`cleanup()` em api.js** - limpa dataEmitInterval (100ms)
- **`beforeunload` em main.js** - limpa 5+ timers do frontend
- **Handlers SIGTERM/SIGINT otimizados** em server.js para shutdown gracioso

**📥 Como atualizar:**
1. Baixe: `BPSR Meter (by gabrielsanbs) Setup 3.2.2.exe`
2. Execute o instalador (sobrescreve versões anteriores)
3. Suas configurações serão mantidas automaticamente

**🔍 Detalhes Técnicos:**
- Todos os `setInterval/setTimeout` agora são rastreados e limpos
- `f10CheckInterval` e `mouseCheckInterval` limpos no evento `will-quit`
- Proteção contra `mainWindow.isDestroyed()` antes de qualquer acesso
- 6 arquivos modificados: electron-main.js, server.js, api.js, dataManager.js, sniffer.js, main.js
- 154 linhas adicionadas para gerenciamento robusto de lifecycle

---

## English

**✨ NEW IN v3.2.2:**

### 🛡️ Critical Stability Fix
- **"Object has been destroyed" crash FIXED** - app no longer crashes on close
- **Complete timer cleanup** across all modules (Electron, Node.js backend, and frontend)
- **7+ timer leaks eliminated** that caused attempts to access destroyed objects
- **Protection against destroyed windows** in all timer callbacks

### 🔧 Global F10 Shortcut Improvements
- **Automatic F10 re-registration** every 30 seconds if registration is lost
- **Robust protection** against failures when Blue Protocol has focus
- **Detailed error logging** for shortcut troubleshooting

### 💾 Enhanced Zoom Persistence
- **Zoom applied immediately** on startup (no longer waits for user interaction)
- **`applyZoom()` called on DOMContentLoaded** for instant restoration

### 🧹 Resource Cleanup Implemented
- **`cleanup()` in dataManager.js** - clears cacheSaveTimer and playerMapSaveTimer
- **`cleanup()` in sniffer.js** - clears fragmentCleanupInterval
- **`cleanup()` in api.js** - clears dataEmitInterval (100ms)
- **`beforeunload` in main.js** - clears 5+ frontend timers
- **Optimized SIGTERM/SIGINT handlers** in server.js for graceful shutdown

**📥 How to update:**
1. Download: `BPSR Meter (by gabrielsanbs) Setup 3.2.2.exe`
2. Run installer (overwrites previous versions)
3. Your settings will be kept automatically

---

## Español

**✨ NOVEDADES v3.2.2:**

### 🛡️ Corrección Crítica de Estabilidad
- **Crash "Object has been destroyed" CORREGIDO** - la app ya no se cuelga al cerrar
- **Limpieza completa de timers** en todos los módulos (Electron, backend Node.js y frontend)
- **7+ fugas de timer eliminadas** que causaban intentos de acceso a objetos destruidos
- **Protección contra ventanas destruidas** en todos los callbacks de timer

### 🔧 Mejoras en Atajo Global F10
- **Re-registro automático de F10** cada 30 segundos si pierde el registro
- **Protección robusta** contra fallos cuando Blue Protocol tiene foco
- **Logs de error detallados** para diagnóstico de problemas con atajos

### 💾 Persistencia de Zoom Mejorada
- **Zoom aplicado inmediatamente** al iniciar (ya no espera interacción del usuario)
- **Llamada de `applyZoom()` en DOMContentLoaded** para restauración instantánea

### 🧹 Limpieza de Recursos Implementada
- **`cleanup()` en dataManager.js** - limpia cacheSaveTimer y playerMapSaveTimer
- **`cleanup()` en sniffer.js** - limpia fragmentCleanupInterval
- **`cleanup()` en api.js** - limpia dataEmitInterval (100ms)
- **`beforeunload` en main.js** - limpia 5+ timers del frontend
- **Handlers SIGTERM/SIGINT optimizados** en server.js para apagado limpio

**📥 Cómo actualizar:**
1. Descarga: `BPSR Meter (by gabrielsanbs) Setup 3.2.2.exe`
2. Ejecuta el instalador (sobrescribe versiones anteriores)
3. Tus configuraciones se mantendrán automáticamente

---

# 🎯 BPSR Meter v3.2.1

## Português

**✨ NOVIDADES v3.2.1:**

### 🔧 Otimizações de Performance e Memória
- **Correção de vazamento de memória** ao abrir/fechar janelas Settings e History
- **Limpeza automática de recursos** com Garbage Collection manual após fechar janelas
- **Remoção de event listeners** órfãos que causavam acúmulo de RAM
- **Largura padrão ajustada** (620px) para melhor alinhamento visual

### 💾 Persistência de Configurações
- **Zoom salvo automaticamente** - suas preferências de tamanho são mantidas entre sessões
- **Configuração de zoom persistente** no localStorage

### 🐛 Correções de Bugs
- **Fundo preto eliminado** em janelas transparentes do Electron
- **Container dinâmico** que se ajusta ao número real de jogadores
- **Prevenção de efeitos DWM** do Windows em janelas overlay
- **Cache de inimigos com TTL** (2 minutos) para evitar crescimento ilimitado

**📥 Como atualizar:**
1. Baixe: `BPSR Meter (by gabrielsanbs) Setup 3.2.1.exe`
2. Execute o instalador (sobrescreve v3.2.0)
3. Suas configurações serão mantidas automaticamente

**📋 Melhorias Técnicas:**
- Hooks de mensagens do Windows (WM_ACTIVATE, WM_NCACTIVATE)
- Socket.IO namespace `/history` para isolamento de eventos
- CSS GPU rendering com `isolation: isolate` e `transform: translateZ(0)`
- MutationObserver para ajuste dinâmico de altura

**🔍 Changelog Detalhado:**
- Adicionado `--expose_gc` para controle manual de memória
- `cleanupChildWindowResources()` remove listeners, hooks e limpa cache/storage
- `preventWindowBlur()` evita sombras pretas em janelas transparentes
- Container ajusta altura baseado em número real de jogadores renderizados
- Zoom persistente com `localStorage.getItem('dpsMeterZoom')`

---

## English

**✨ NEW IN v3.2.1:**

### 🔧 Performance and Memory Optimizations
- **Memory leak fixed** when opening/closing Settings and History windows
- **Automatic resource cleanup** with manual Garbage Collection after closing windows
- **Orphaned event listeners removal** that caused RAM accumulation
- **Default width adjusted** (620px) for better visual alignment

### 💾 Settings Persistence
- **Zoom saved automatically** - your size preferences are kept between sessions
- **Persistent zoom configuration** in localStorage

### 🐛 Bug Fixes
- **Black background eliminated** in Electron transparent windows
- **Dynamic container** that adjusts to actual number of players
- **Windows DWM effects prevention** in overlay windows
- **Enemy cache with TTL** (2 minutes) to prevent unlimited growth

**📥 How to update:**
1. Download: `BPSR Meter (by gabrielsanbs) Setup 3.2.1.exe`
2. Run installer (overwrites v3.2.0)
3. Your settings will be kept automatically

---

## Español

**✨ NOVEDADES v3.2.1:**

### 🔧 Optimizaciones de Rendimiento y Memoria
- **Fuga de memoria corregida** al abrir/cerrar ventanas Settings e History
- **Limpieza automática de recursos** con Garbage Collection manual después de cerrar ventanas
- **Eliminación de event listeners** huérfanos que causaban acumulación de RAM
- **Ancho predeterminado ajustado** (620px) para mejor alineación visual

### 💾 Persistencia de Configuraciones
- **Zoom guardado automáticamente** - tus preferencias de tamaño se mantienen entre sesiones
- **Configuración de zoom persistente** en localStorage

### 🐛 Correcciones de Errores
- **Fondo negro eliminado** en ventanas transparentes de Electron
- **Contenedor dinámico** que se ajusta al número real de jugadores
- **Prevención de efectos DWM** de Windows en ventanas overlay
- **Caché de enemigos con TTL** (2 minutos) para evitar crecimiento ilimitado

**📥 Cómo actualizar:**
1. Descarga: `BPSR Meter (by gabrielsanbs) Setup 3.2.1.exe`
2. Ejecuta el instalador (sobrescribe v3.2.0)
3. Tus configuraciones se mantendrán automáticamente

---

# 🎯 BPSR Meter v3.2.0

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português

**✨ NOVIDADES v3.2.0:**

### 🎨 Personalização Visual Completa
- **Cores personalizadas** para medidor e janelas
- **Controles de transparência** independentes para cada área
- **Seletor de cores** intuitivo com visualização em tempo real
- **Tema padrão** azul ou escolha sua própria paleta

### 🕐 Integração BPTimer
- **Reportar HP de bosses** automaticamente para a comunidade
- **Coordenadas precisas** (X, Y, Z) dos bosses
- **Detecção de linhas/canais** via SceneData do jogo
- **Configuração opcional** - ative/desative quando quiser

**📥 Como instalar:**
1. Baixe: `BPSR Meter (by gabrielsanbs) Setup 3.2.0.exe`
2. Execute o instalador
3. Configure cores em **⚙️ Configurações**
4. (Opcional) Ative BPTimer para contribuir com a comunidade

**📋 Requisitos:**
- Windows 10+
- Npcap 1.83+

**❓ Dúvidas?**
- Como personalizar cores? Acesse **⚙️ Configurações → Personalização**
- O que é BPTimer? Sistema comunitário que rastreia HP de bosses em tempo real
- DPS resetando sempre? Ative "Detecção rápida de servidor" nas configurações
- Histórico duplicado? Corrigido na v3.2.0 - agora salva apenas uma vez por luta

**🙏 Créditos:**
- gabrielsanbs (desenvolvedor)
- MrSnakeVT (fork original)
- dmlgzs (projeto original)
- Comunidade BPTimer

**💬 Suporte:** [Issues](https://github.com/gabrielsanbs/BPSR-Meter/issues)

---

## English

**✨ WHAT'S NEW v3.2.0:**

### 🎨 Complete Visual Customization
- **Custom colors** for meter and windows
- **Independent transparency controls** for each area
- **Intuitive color picker** with real-time preview
- **Default blue theme** or choose your own palette

### 🕐 BPTimer Integration
- **Auto-report boss HP** to the community
- **Precise coordinates** (X, Y, Z) of bosses
- **Line/channel detection** via game's SceneData
- **Optional configuration** - enable/disable anytime

**📥 How to Install:**
1. Download: `BPSR Meter (by gabrielsanbs) Setup 3.2.0.exe`
2. Run the installer
3. Configure colors in **⚙️ Settings**
4. (Optional) Enable BPTimer to contribute to the community

**📋 Requirements:**
- Windows 10+
- Npcap 1.83+

**❓ FAQ:**
- How to customize colors? Access **⚙️ Settings → Customization**
- What is BPTimer? Community system that tracks boss HP in real-time
- DPS constantly resetting? Enable "Fast server detection" in settings
- Duplicate history? Fixed in v3.2.0 - now saves only once per fight

**🙏 Credits:**
- gabrielsanbs (developer)
- MrSnakeVT (original fork)
- dmlgzs (original project)
- BPTimer Community

**💬 Support:** [Issues](https://github.com/gabrielsanbs/BPSR-Meter/issues)

---

## Español

**✨ NOVEDADES v3.2.0:**

### 🎨 Personalización Visual Completa
- **Colores personalizados** para medidor y ventanas
- **Controles de transparencia independientes** para cada área
- **Selector de colores intuitivo** con vista previa en tiempo real
- **Tema azul predeterminado** o elige tu propia paleta

### 🕐 Integración BPTimer
- **Reportar HP de jefes** automáticamente a la comunidad
- **Coordenadas precisas** (X, Y, Z) de los jefes
- **Detección de líneas/canales** vía SceneData del juego
- **Configuración opcional** - activa/desactiva cuando quieras

**📥 Cómo instalar:**
1. Descarga: `BPSR Meter (by gabrielsanbs) Setup 3.2.0.exe`
2. Ejecuta el instalador
3. Configura colores en **⚙️ Configuración**
4. (Opcional) Activa BPTimer para contribuir con la comunidad

**📋 Requisitos:**
- Windows 10+
- Npcap 1.83+

**❓ Preguntas Frecuentes:**
- ¿Cómo personalizar colores? Accede a **⚙️ Configuración → Personalización**
- ¿Qué es BPTimer? Sistema comunitario que rastrea HP de jefes en tiempo real
- ¿DPS se resetea siempre? Activa "Detección rápida de servidor" en configuración
- ¿Historial duplicado? Corregido en v3.2.0 - ahora guarda solo una vez por combate

**🙏 Créditos:**
- gabrielsanbs (desarrollador)
- MrSnakeVT (fork original)
- dmlgzs (proyecto original)
- Comunidad BPTimer

**💬 Soporte:** [Issues](https://github.com/gabrielsanbs/BPSR-Meter/issues)

---

<details>
<summary>📜 Versões Anteriores / Previous Versions / Versiones Anteriores</summary>

## v3.1.1

### Português

**🔥 CORREÇÕES IMPORTANTES v3.1.1:**

### 🎮 Compatibilidade Total com ExitLag e VPNs
- **CORRIGIDO:** Reset constante de DPS ao usar ExitLag e VPNs de jogo
- **CORRIGIDO:** Alternância de portas do jogo causando múltiplos resets
- **SIMPLIFICADO:** Sistema de detecção agora ignora mudanças de IP/porta durante o jogo
- **MELHORADO:** Histórico gerado apenas por timeout (inatividade), não por mudança de servidor
- **LOGS:** Console limpo sem spam de detecções

**Como funciona:** O sistema detecta o primeiro servidor e ignora todas as flutuações de IP/porta. O histórico é salvo automaticamente quando fica sem receber dados (timeout configurável).

---

**✨ NOVIDADES v3.1.0:**

### ⚙️ Tela de Configurações Completa
- **Configurações em tempo real** sem necessidade de reiniciar
- **Limite de jogadores** (1-20 visíveis)
- **Reset automático** de lutas
- **Limpeza de cache** de usuários
- **Seletor de idioma** integrado (PT-BR 🇧🇷, EN 🇺🇸, ES 🇪🇸)

### 📜 Histórico com 4 Modos de Ordenação
- **DPS** - Ordernar por dano por segundo
- **DMG Total** - Ordenar por dano total
- **HPS** - Ordenar por cura por segundo
- **Healing Total** - Ordenar por cura total
- Numeração sequencial em todas as lutas (#1, #2, #3...)
- Ícones de classe para 27 especializações
- Auto-salvamento ao trocar mapas

### 🌐 Suporte Completo a VPNs de Jogos
- **ExitLag** ✅
- **NoPing** ✅
- **WTFast** ✅
- **Mudfish** ✅
- **PingZapper, PingEnhancer, Haste, Outfox, BattlePing** ✅
- Detecção automática de adaptadores TAP
- Sem configuração manual necessária

### 🎯 Melhorias de Interface
- ✅ **Ícone spinning removido** quando sem luta ativa
- ✅ **Botões sem efeito de seleção** após clique
- ✅ Tela de loading redesenhada com ícone principal
- ✅ Interface ajusta automaticamente ao número de jogadores
- ✅ Transições suaves e responsivas

### � Correções de Bugs
- 🔥 **Corrigido:** Erro de conexão (`app is not defined`) ao atualizar status
- 🔥 **Corrigido:** Combate não salvava ao trocar mapas rapidamente
- � **Corrigido:** Adaptadores TAP agora funcionam com VPNs de jogos

**📥 Como instalar:**
1. Baixe: `BPSR Meter (by gabrielsanbs) Setup 3.1.0.exe`
2. Execute o instalador
3. Pronto! Programa detecta o jogo automaticamente

**📋 Requisitos:**
- Windows 10+
- Npcap 1.83+

**❓ Dúvidas?**
- Não aparece? Instale Npcap 1.83+ e execute como Administrador
- Como mudo idioma? Use o seletor nas **Configurações** ou **Histórico**
- Posso ordenar por HPS? Sim! 4 modos: **DPS**, **DMG Total**, **HPS**, **Healing Total**
- Funciona com ExitLag/NoPing? Sim, suporte automático para todas as VPNs gaming
- **Erro ao iniciar?** Veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**🙏 Créditos:**
- gabrielsanbs (desenvolvedor)
- MrSnakeVT (fork original)
- dmlgzs (projeto original)

**💬 Suporte:** [Issues](https://github.com/gabrielsanbs/BPSR-Meter/issues)

---

## English

**🔥 IMPORTANT FIXES v3.1.1:**

### 🎮 Full Compatibility with ExitLag and VPNs
- **FIXED:** Constant DPS reset when using ExitLag and gaming VPNs
- **FIXED:** Game port alternation causing multiple resets
- **SIMPLIFIED:** Detection system now ignores IP/port changes during gameplay
- **IMPROVED:** History generated only by timeout (inactivity), not server changes
- **LOGS:** Clean console without detection spam

**How it works:** The system detects the first server and ignores all IP/port fluctuations. History is automatically saved when no data is received (configurable timeout).

---

**✨ WHAT'S NEW v3.1.0:**

### ⚙️ Complete Settings Screen
- **Real-time settings** without restart needed
- **Player limit** (1-20 visible)
- **Auto-reset** fights
- **User cache cleanup**
- **Integrated language selector** (PT-BR 🇧🇷, EN 🇺🇸, ES 🇪🇸)

### 📜 History with 4 Sorting Modes
- **DPS** - Sort by damage per second
- **Total DMG** - Sort by total damage
- **HPS** - Sort by healing per second
- **Total Healing** - Sort by total healing
- Sequential numbering in all fights (#1, #2, #3...)
- Class icons for 27 specializations
- Auto-save when changing maps

### 🌐 Full Gaming VPN Support
- **ExitLag** ✅
- **NoPing** ✅
- **WTFast** ✅
- **Mudfish** ✅
- **PingZapper, PingEnhancer, Haste, Outfox, BattlePing** ✅
- Automatic TAP adapter detection
- No manual configuration needed

### 🎯 Interface Improvements
- ✅ **Spinning icon removed** when no active fight
- ✅ **Buttons without selection effect** after click
- ✅ Loading screen redesigned with main icon
- ✅ Interface automatically adjusts to player count
- ✅ Smooth and responsive transitions

### � Bug Fixes
- 🔥 **Fixed:** Connection error (`app is not defined`) when updating status
- 🔥 **Fixed:** Fight not saving when changing maps quickly
- � **Fixed:** TAP adapters now work with gaming VPNs

**📥 How to Install:**
1. Download: `BPSR Meter (by gabrielsanbs) Setup 3.1.0.exe`
2. Run the installer
3. Done! Program auto-detects the game

**📋 Requirements:**
- Windows 10+
- Npcap 1.83+

**❓ FAQ:**
- Not appearing? Install Npcap 1.83+ and run as Administrator
- How to change language? Use the selector in **Settings** or **History**
- Can I sort by HPS? Yes! 4 modes: **DPS**, **Total DMG**, **HPS**, **Total Healing**
- Works with ExitLag/NoPing? Yes, automatic support for all gaming VPNs
- **Startup errors?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**🙏 Credits:**
- gabrielsanbs (developer)
- MrSnakeVT (original fork)
- dmlgzs (original project)

**💬 Support:** [Issues](https://github.com/gabrielsanbs/BPSR-Meter/issues)

---

## Español

**🔥 CORRECCIONES IMPORTANTES v3.1.1:**

### 🎮 Compatibilidad Total con ExitLag y VPNs
- **CORREGIDO:** Reseteo constante de DPS al usar ExitLag y VPNs de juego
- **CORREGIDO:** Alternancia de puertos del juego causando múltiples reseteos
- **SIMPLIFICADO:** Sistema de detección ahora ignora cambios de IP/puerto durante el juego
- **MEJORADO:** Historial generado solo por timeout (inactividad), no por cambios de servidor
- **LOGS:** Consola limpia sin spam de detecciones

**Cómo funciona:** El sistema detecta el primer servidor e ignora todas las fluctuaciones de IP/puerto. El historial se guarda automáticamente cuando no se reciben datos (timeout configurable).

---

**✨ NOVEDADES v3.1.0:**

### ⚙️ Pantalla de Configuración Completa
- **Configuración en tiempo real** sin necesidad de reiniciar
- **Límite de jugadores** (1-20 visibles)
- **Reset automático** de combates
- **Limpieza de caché** de usuarios
- **Selector de idioma** integrado (PT-BR 🇧🇷, EN 🇺🇸, ES 🇪🇸)

### 📜 Historial con 4 Modos de Ordenación
- **DPS** - Ordenar por daño por segundo
- **DMG Total** - Ordenar por daño total
- **HPS** - Ordenar por cura por segundo
- **Healing Total** - Ordenar por cura total
- Numeración secuencial en todos los combates (#1, #2, #3...)
- Iconos de clase para 27 especializaciones
- Auto-guardado al cambiar mapas

### 🌐 Soporte Completo para VPNs Gaming
- **ExitLag** ✅
- **NoPing** ✅
- **WTFast** ✅
- **Mudfish** ✅
- **PingZapper, PingEnhancer, Haste, Outfox, BattlePing** ✅
- Detección automática de adaptadores TAP
- Sin configuración manual necesaria

### 🎯 Mejoras de Interfaz
- ✅ **Icono giratorio removido** cuando no hay combate activo
- ✅ **Botones sin efecto de selección** después del clic
- ✅ Pantalla de carga rediseñada con icono principal
- ✅ La interfaz se ajusta automáticamente al número de jugadores
- ✅ Transiciones suaves y responsivas

### 🔧 Correcciones de Bugs
- 🔥 **Corregido:** Error de conexión (`app is not defined`) al actualizar estado
- 🔥 **Corregido:** Combate no se guardaba al cambiar mapas rápidamente
- � **Corregido:** Los adaptadores TAP ahora funcionan con VPNs gaming

**📥 Cómo instalar:**
1. Descarga: `BPSR Meter (by gabrielsanbs) Setup 3.1.0.exe`
2. Ejecuta el instalador
3. ¡Listo! El programa detecta el juego automáticamente

**📋 Requisitos:**
- Windows 10+
- Npcap 1.83+

**❓ Preguntas Frecuentes:**
- ¿No aparece? Instala Npcap 1.83+ y ejecuta como Administrador
- ¿Cómo cambio el idioma? Usa el selector en **Configuración** o **Historial**
- ¿Puedo ordenar por HPS? ¡Sí! 4 modos: **DPS**, **DMG Total**, **HPS**, **Healing Total**
- ¿Funciona con ExitLag/NoPing? Sí, soporte automático para todas las VPNs gaming
- **¿Errores al iniciar?** Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**🙏 Créditos:**
- gabrielsanbs (desarrollador)
- MrSnakeVT (fork original)
- dmlgzs (proyecto original)

**💬 Soporte:** [Issues](https://github.com/gabrielsanbs/BPSR-Meter/issues)
