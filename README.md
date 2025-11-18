<div align="center">
  <img src="portada_v31.png" alt="BPSR Meter splash" width="820" />

  # BPSR Meter v3.2.1
  ### Monitor de DPS/HPS em tempo real para Blue Protocol (PT • EN • ES)

  [![Download](https://img.shields.io/badge/Download-Latest-1abc9c?style=for-the-badge)](../../releases)
  [![Report Issue](https://img.shields.io/badge/Issues-GitHub-5865f2?style=for-the-badge&logo=github)](../../issues)
</div>

---

## Capturas / Gallery / Galería

| Interface Principal | Overlay Completo | Guia de Controles |
|:--:|:--:|:--:|
| <img src="BPSR_Meter_Main_v31.png" alt="Main UI" width="280"/> | <img src="BPSR_Meter_Window_v31.png" alt="Overlay" width="280"/> | <img src="Controles.png" alt="Controls" width="280"/> |

| Advanced | DPS | Lite |
|:--:|:--:|:--:|
| <img src="Advanced_v31.png" alt="Advanced mode" width="200"/> | <img src="DPS_v31.png" alt="DPS mode" width="200"/> | <img src="Lite_v31.png" alt="Lite mode" width="200"/> |

| Configurações | Histórico | Mini overlay |
|:--:|:--:|:--:|
| <img src="BPSR_Meter_Settings_v31.png" alt="Settings" width="280"/> | <img src="BPSR_Meter_History_v31.png" alt="History" width="280"/> | <img src="medidor.png" alt="Mini overlay" width="280"/> |

---

## Português

### Essencial
- Overlay transparente com modos **Advanced, DPS e Lite/Healer** (toggle com um clique).
- Histórico independente e tela de configurações em tempo real; tudo sincronizado via Electron + Socket.IO.
- Compatível com VPNs gamers (ExitLag, NoPing, WTFast, Mudfish…) quando o adaptador estiver em **Legacy NDIS / WinPcap Mode**.
- v3.2.1: correções de vazamento ao abrir/fechar janelas, zoom persistente e container inteligente por jogador.

### Instalação Express
1. Instale o [Npcap](https://npcap.com/#download) marcando **WinPcap API-compatible Mode**.
2. Baixe `BPSR Meter (by gabrielsanbs) Setup 3.2.1.exe` na aba [Releases](../../releases) e execute.
3. Inicie o programa **como Administrador** após abrir o Blue Protocol.

### Uso Rápido
- Arraste pelas setas, faça zoom com `+ / -`, trave/destrave para deixar cliques passarem ao jogo.
- `F10` limpa o combate atual; 📜 abre a janela `/history`; ⚙️ abre configurações.
- Modo Lite alterna entre DPS e Healer exibindo DPS/s ou HPS/s. Aviso amarelo lembra de trocar de mapa.

### Requisitos & Ajuda
- Windows 10+, Npcap 1.83+, rede IPv4 ativa.
- Logs em `%APPDATA%/bpsr-meter/iniciar_log.txt` ajudam a diagnosticar.
- Dúvidas ou bugs? Abra uma [Issue](../../issues) ou leia o [RELEASE_NOTES.md](RELEASE_NOTES.md).

---

## English

### Essentials
- Real-time **Advanced / DPS / Lite** overlay with persistent zoom and transparent drag-friendly UI.
- Dedicated **Settings** and **History** windows share the same theme, include language selector (PT/EN/ES) and auto-save fights.
- Full VPN compatibility (ExitLag, NoPing, WTFast, Mudfish). Enable *Legacy NDIS / WinPcap Mode* inside your VPN client.
- v3.2.1 fixes: child-window memory cleanup, auto GC, Socket.IO namespaces, container sized by live player count.

### Quick Install
1. Install [Npcap](https://npcap.com/#download) with *WinPcap API-compatible Mode* checked.
2. Download `BPSR Meter (by gabrielsanbs) Setup 3.2.1.exe` from [Releases](../../releases) and run it.
3. Launch as **Administrator**, then open Blue Protocol.

### Quick Use
- Drag by the arrows, lock to let clicks pass through, zoom with the header buttons.
- `F10` resets DPS; 🔔 toggles the map notice; 📜 shows the `/history` window.
- Lite mode switches DPS↔Healer (shows DPS/s or HPS/s). History sorts by DPS, Total DMG, HPS, or Healing.

### Need Help?
- Requirements: Windows 10+, Npcap 1.83+, outbound internet.
- Troubleshooting: check `%APPDATA%/bpsr-meter` logs, ensure antivirus allows Electron.
- Support & roadmap live in [Issues](../../issues) and [Releases](../../releases).

---

## Español

### Esencial
- Medidor transparente con modos **Advanced, DPS y Lite/Healer**, zoom persistente y controles flotantes.
- Ventanas de **Configuración** e **Historial** en vivo con selector de idioma (PT/EN/ES) y guardado automático de peleas.
- Compatible con VPNs gamers (ExitLag, NoPing, WTFast, Mudfish) cuando el adaptador usa *Legacy NDIS / WinPcap*.
- v3.2.1 corrige consumo de RAM al cerrar ventanas, añade GC manual y ajuste dinámico del contenedor por jugador.

### Instalación Rápida
1. Instala [Npcap](https://npcap.com/#download) activando **WinPcap API-compatible Mode**.
2. Descarga `BPSR Meter (by gabrielsanbs) Setup 3.2.1.exe` desde [Releases](../../releases) y ejecútalo.
3. Abre el medidor como **Administrador** después de iniciar Blue Protocol.

### Uso Rápido
- Arrastra con las flechas, bloquea para que los clics pasen al juego y usa `+ / -` para el zoom.
- `F10` limpia el combate; el botón 📜 abre el historial; ⚙️ ajusta todo en tiempo real.
- En modo Lite puedes alternar entre DPS y Healer para mostrar DPS/s u HPS/s.

### Ayuda
- Requisitos: Windows 10+, Npcap 1.83+, Internet estable.
- Soporte: revisa logs en `%APPDATA%/bpsr-meter` o crea un ticket en [Issues](../../issues).
- Consulta detalles técnicos en [RELEASE_NOTES.md](RELEASE_NOTES.md).

---

## Créditos & Licença / Credits & License / Créditos y Licencia

- **Autor:** [gabrielsanbs](https://github.com/gabrielsanbs)
- **Fork:** [MrSnakeVT](https://github.com/mrsnakke/BPSR-Meter) • **Original:** [dmlgzs](https://github.com/dmlgzs/StarResonanceDamageCounter)
- Código licenciado sob AGPL-3.0 (veja [LICENSE](LICENSE)).

<div align="center">
  <sub>Se este projeto ajudou, deixe uma ⭐ e compartilhe com sua party!</sub>
</div>
