# 🎯 BPSR Meter v3.1.1

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português

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
