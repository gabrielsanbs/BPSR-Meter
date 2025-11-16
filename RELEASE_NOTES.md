# 🎯 BPSR Meter v3.1.2

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português

**🔥 HOTFIX v3.1.2:**

### 🐛 Correção REAL - ExitLag e VPNs
- **CORRIGIDO (FOR REAL):** Loop infinito de detecção de servidor com ExitLag
- **CORRIGIDO:** Geração massiva de entradas no histórico (centenas por segundo)
- **CORRIGIDO:** Mensagem "Servidor de juego detectado" repetindo infinitamente
- **CORRIGIDO:** Reset constante de estatísticas ao usar VPNs de jogo
- **CORRIGIDO:** Cada hit do jogador resetava a conexão
- Aplicação agora estável com ExitLag, NoPing, WTFast e outras VPNs

**Problema real:** VPNs mudam a **porta de origem** a cada pacote. O código verificava `IP_origem:PORTA_origem -> IP_destino:PORTA_destino`, então cada pacote parecia vir de uma "nova conexão".

**Solução definitiva:** Agora verifica apenas `IP_destino:PORTA_destino` (servidor do jogo), ignorando origem (cliente/VPN) que muda constantemente.

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

**🔥 HOTFIX v3.1.2:**

### 🐛 REAL Fix - ExitLag and VPNs
- **FIXED (FOR REAL):** Infinite server detection loop with ExitLag
- **FIXED:** Massive history entry generation (hundreds per second)
- **FIXED:** "Servidor de juego detectado" message repeating infinitely
- **FIXED:** Constant stats reset when using gaming VPNs
- **FIXED:** Every player hit was resetting the connection
- Application now stable with ExitLag, NoPing, WTFast and other VPNs

**Real problem:** VPNs change the **source port** on every packet. Code was checking `source_IP:source_PORT -> dest_IP:dest_PORT`, so every packet looked like a "new connection".

**Definitive solution:** Now only checks `dest_IP:dest_PORT` (game server), ignoring source (client/VPN) which changes constantly.

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

**🔥 HOTFIX v3.1.2:**

### 🐛 Corrección REAL - ExitLag y VPNs
- **CORREGIDO (DE VERDAD):** Bucle infinito de detección de servidor con ExitLag
- **CORREGIDO:** Generación masiva de entradas en historial (cientos por segundo)
- **CORREGIDO:** Mensaje "Servidor de juego detectado" repitiéndose infinitamente
- **CORREGIDO:** Reseteo constante de estadísticas al usar VPNs de juego
- **CORREGIDO:** Cada golpe del jugador reseteaba la conexión
- Aplicación ahora estable con ExitLag, NoPing, WTFast y otras VPNs

**Problema real:** VPNs cambian el **puerto de origen** en cada paquete. El código verificaba `IP_origen:PUERTO_origen -> IP_destino:PUERTO_destino`, entonces cada paquete parecía venir de una "nueva conexión".

**Solución definitiva:** Ahora solo verifica `IP_destino:PUERTO_destino` (servidor del juego), ignorando origen (cliente/VPN) que cambia constantemente.

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
