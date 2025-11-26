; NÃO incluir MUI2 ou LogicLib aqui.
!include "nsDialogs.nsh"
!include "FileFunc.nsh"

; Variáveis
Var Checkbox_GPU
Var Checkbox_ClearCache
Var GPU_Fix_Enabled
Var Clear_Cache_Enabled

; Página Customizada
Function OptionsPageCreate
    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
        Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 0 100% 20u "Opções Adicionais:"
    Pop $0

    ${NSD_CreateCheckbox} 0 30u 100% 10u "DPS com fundo preto? (Correção GPU)"
    Pop $Checkbox_GPU
    ${NSD_SetState} $Checkbox_GPU ${BST_UNCHECKED}

    ${NSD_CreateLabel} 15u 42u 90% 20u "Adiciona flags --disable-gpu aos atalhos."
    Pop $0
    SetCtlColors $0 0x666666 transparent

    ${NSD_CreateCheckbox} 0 70u 100% 10u "Limpar cache e configurações"
    Pop $Checkbox_ClearCache
    ${NSD_SetState} $Checkbox_ClearCache ${BST_UNCHECKED}

    ${NSD_CreateLabel} 15u 82u 90% 20u "Apaga apenas configurações e histórico."
    Pop $0
    SetCtlColors $0 0xFF6600 transparent

    nsDialogs::Show
FunctionEnd

Function OptionsPageLeave
    ${NSD_GetState} $Checkbox_GPU $GPU_Fix_Enabled
    ${NSD_GetState} $Checkbox_ClearCache $Clear_Cache_Enabled

    SetShellVarContext current

    ; --- APLICAR CORREÇÃO DE GPU ---
    ${If} $GPU_Fix_Enabled == ${BST_CHECKED}
        DetailPrint "Aplicando correção de GPU..."
        
        StrCpy $R0 "--disable-gpu --disable-direct-composition --disable-features=UseSkiaRenderer"
        
        ; Atualiza TODOS os atalhos
        CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "$R0" "$INSTDIR\${PRODUCT_NAME}.exe" 0
        CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
        CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "$R0" "$INSTDIR\${PRODUCT_NAME}.exe" 0
    ${EndIf}

    ; --- LIMPEZA ESPECÍFICA ---
    ${If} $Clear_Cache_Enabled == ${BST_CHECKED}
        DetailPrint "Limpando arquivos de configuração..."
        
        ; Apaga APENAS os arquivos solicitados
        Delete "$APPDATA\bpsr-meter\user_cache.json"
        Delete "$APPDATA\bpsr-meter\settings.json"
        Delete "$APPDATA\bpsr-meter\fight_history.json"
        
        ; Opcional: Apagar logs se desejar limpar "sujeira", mas mantendo a pasta
        ; Delete "$APPDATA\bpsr-meter\*.log"
    ${EndIf}
FunctionEnd

; Macros do Builder
!macro customHeader
    Page custom OptionsPageCreate OptionsPageLeave
!macroend

!macro customInstall
    SetShellVarContext current
    
    ; Atalhos padrão (sem flags)
    CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "" "$INSTDIR\${PRODUCT_NAME}.exe" 0
    
    CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "" "$INSTDIR\${PRODUCT_NAME}.exe" 0
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Desinstalar.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\${PRODUCT_NAME}.exe" 0
!macroend

!macro customUnInstall
    SetShellVarContext current
    Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
    RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"
!macroend
