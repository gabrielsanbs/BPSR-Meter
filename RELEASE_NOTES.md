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
