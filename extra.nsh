; Mensagem de agradecimento após instalação
!macro customFinish
    MessageBox MB_OK "Obrigado por instalar o BPSR Meter!$\n$\n\
    Desenvolvido por gabrielsanbs$\n\
    Baseado no trabalho original de dmlgzs$\n$\n\
    Discord: https://discord.gg/bpsr$\n\
    GitHub: https://github.com/gabrielsanbs/BPSR-Meter$\n$\n\
    Bom jogo!"
!macroend

; Eliminar carpeta de datos de usuario en Roaming al desinstalar
Section "Remove AppData" SECREMOVEAPPDATA
    RMDir /r "$APPDATA\bpsr-meter"
SectionEnd
