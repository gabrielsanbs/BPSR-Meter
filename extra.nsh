; Mensagem de agradecimento após instalação
!macro customFinish
    MessageBox MB_OK "Obrigado por instalar o BPSR Meter!$\n$\n\
    Desenvolvido por gabrielsanbs$\n\
    Baseado no trabalho original de dmlgzs$\n$\n\
    Discord: https://discord.gg/bpsr$\n\
    GitHub: https://github.com/gabrielsanbs/BPSR-Meter$\n$\n\
    Bom jogo!"
!macroend

; Ao desinstalar: perguntar se quer remover dados de usuário (cache e histórico)
!macro customUnInstall
    MessageBox MB_YESNO "Deseja remover seus dados salvos?$\n\
    (Histórico de lutas, cache de jogadores, configurações)$\n$\n\
    Selecione NÃO se planeja reinstalar o BPSR Meter." IDNO KeepData
    
    ; Se o usuário escolheu SIM, deletar tudo
    RMDir /r "$APPDATA\bpsr-meter"
    Goto Done
    
    KeepData:
        ; Se o usuário escolheu NÃO, deletar apenas logs temporários
        Delete "$APPDATA\bpsr-meter\iniciar_log.txt"
        Delete "$APPDATA\bpsr-meter\bpsr-meter-debug.log"
        ; Manter user_cache.json e fight-history.json
    
    Done:
!macroend
