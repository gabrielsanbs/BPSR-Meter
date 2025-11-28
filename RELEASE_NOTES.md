# 🎯 BPSR Meter v3.2.6

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português

**✨ NOVIDADES v3.2.6:**

### 🛠️ Correções Críticas no Sniffer (ExitLag & VPNs)
Esta atualização foca em resolver problemas de estabilidade de conexão e contagem de dano, especialmente para usuários de VPNs como ExitLag.

- **Connection-Aware TCP Reassembly:** O sistema de captura de pacotes foi reescrito para separar o tráfego por conexão. Isso resolve o problema onde pacotes de outras aplicações (Discord, Browser) interferiam na leitura do jogo, causando travamentos no DPS.
- **Correção para ExitLag:** Implementado filtro específico para pacotes "Keep-Alive" (41/53 bytes) injetados pelo ExitLag, que anteriormente corrompiam o buffer de dados e travavam o medidor após 1-3 hits.
- **Validação de Protocolo:** Adicionada verificação rigorosa nos cabeçalhos dos pacotes do Blue Protocol para descartar dados corrompidos antes que afetem a contagem.
- **Auto-Recuperação:** Novo sistema de timeout (5s) por conexão que detecta e recupera automaticamente travamentos causados por lag spikes ou perda de pacotes.
- **Correção de Overflow:** Ajuste técnico no cálculo de sequência TCP para evitar erros matemáticos em sessões longas de jogo.

---

## English

**✨ WHAT'S NEW v3.2.6:**

### 🛠️ Critical Sniffer Fixes (ExitLag & VPNs)
This update focuses on resolving connection stability and damage counting issues, especially for VPN users like ExitLag.

- **Connection-Aware TCP Reassembly:** The packet capture system has been rewritten to separate traffic by connection. This resolves the issue where packets from other applications (Discord, Browser) interfered with game reading, causing DPS freezes.
- **ExitLag Fix:** Implemented a specific filter for "Keep-Alive" packets (41/53 bytes) injected by ExitLag, which previously corrupted the data buffer and froze the meter after 1-3 hits.
- **Protocol Validation:** Added rigorous verification on Blue Protocol packet headers to discard corrupted data before it affects counting.
- **Auto-Recovery:** New timeout system (5s) per connection that automatically detects and recovers from freezes caused by lag spikes or packet loss.
- **Overflow Fix:** Technical adjustment in TCP sequence calculation to avoid mathematical errors in long gaming sessions.

---

## Español

**✨ NOVEDADES v3.2.6:**

### 🛠️ Correcciones Críticas en el Sniffer (ExitLag y VPNs)
Esta actualización se centra en resolver problemas de estabilidad de conexión y conteo de daño, especialmente para usuarios de VPNs como ExitLag.

- **Connection-Aware TCP Reassembly:** El sistema de captura de paquetes ha sido reescrito para separar el tráfico por conexión. Esto resuelve el problema donde paquetes de otras aplicaciones (Discord, Navegador) interferían con la lectura del juego, causando congelamientos en el DPS.
- **Corrección para ExitLag:** Implementado filtro específico para paquetes "Keep-Alive" (41/53 bytes) inyectados por ExitLag, que anteriormente corrompían el búfer de datos y congelaban el medidor después de 1-3 golpes.
- **Validación de Protocolo:** Añadida verificación rigurosa en los encabezados de los paquetes de Blue Protocol para descartar datos corruptos antes de que afecten el conteo.
- **Auto-Recuperación:** Nuevo sistema de tiempo de espera (5s) por conexión que detecta y recupera automáticamente congelamientos causados por picos de lag o pérdida de paquetes.
- **Corrección de Overflow:** Ajuste técnico en el cálculo de secuencia TCP para evitar errores matemáticos en sesiones largas de juego.

---

# 🎯 BPSR Meter v3.2.5

[[Português](#português)] | [[English](#english)] | [[Español](#español)]

---

## Português (v3.2.5)

**✨ NOVIDADES v3.2.5:**

### 🎨 Instalador Aprimorado
- **Correção de Fundo Preto (GPU)**: Agora aplica as flags corretamente em todos os atalhos criados.
- **Limpeza Inteligente**: Opção de limpar cache agora remove apenas arquivos essenciais (`user_cache`, `settings`, `fight_history`), preservando o restante.
- **Interface Melhorada**: Opções claras com checkboxes nativas.
- **Sem Perguntas Extras**: Atualização silenciosa e direta, sem perguntas confusas de desinstalação.

### ⚡ Melhorias Gerais
- Atualização de dependências.
- Otimizações no processo de instalação.

---

## English

**✨ NEW IN v3.2.5:**

### 🎨 Enhanced Installer
- **Black Background Fix (GPU)**: Now correctly applies flags to all created shortcuts.
- **Smart Cleanup**: Cache cleanup option now removes only essential files (`user_cache`, `settings`, `fight_history`), preserving the rest.
- **Improved Interface**: Clear options with native checkboxes.
- **No Extra Questions**: Silent and direct update, without confusing uninstallation prompts.

### ⚡ General Improvements
- Dependency updates.
- Installation process optimizations.

---

## Español

**✨ NOVEDADES v3.2.5:**

### 🎨 Instalador Mejorado
- **Corrección de Fondo Negro (GPU)**: Ahora aplica las flags correctamente en todos los accesos directos.
- **Limpieza Inteligente**: La opción de limpiar caché ahora elimina solo archivos esenciales (`user_cache`, `settings`, `fight_history`), preservando el resto.
- **Interfaz Mejorada**: Opciones claras con casillas de verificación nativas.
- **Sin Preguntas Extras**: Actualización silenciosa y directa, sin preguntas confusas de desinstalación.

### ⚡ Mejoras Generales
- Actualización de dependencias.
- Optimizaciones en el proceso de instalación.
