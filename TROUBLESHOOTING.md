# 🔧 Guia de Solução de Problemas - BPSR Meter

## ❌ Erro: "El servidor no respondió a tiempo"

### 📋 Sintomas
- Tela de erro vermelha após 15 segundos
- Mensagem: "El servidor no respondió a tiempo"
- Programa não abre a interface principal

### 🔍 Causas Comuns

#### 1️⃣ **Porta em Uso (EADDRINUSE)**
**Problema:** Outro programa está usando a porta 8989/8745.

**Soluções:**
```powershell
# Verificar processos na porta
netstat -ano | findstr :8989

# Matar processo específico (substitua PID pelo número da última coluna)
taskkill /PID [número] /F

# Ou simplesmente feche outros BPSR Meters abertos
```

#### 2️⃣ **Npcap Não Instalado/Desatualizado**
**Problema:** BPSR Meter requer Npcap 1.83+ para captura de pacotes.

**Solução:**
1. Baixe: https://npcap.com/#download
2. Execute o instalador
3. ✅ Marque: "Install Npcap in WinPcap API-compatible Mode"
4. Reinicie o computador
5. Abra BPSR Meter como Administrador

#### 3️⃣ **Falta de Permissões (EACCES)**
**Problema:** Windows bloqueando acesso à porta ou captura de rede.

**Solução:**
1. Clique com botão direito no executável
2. Selecione "Executar como Administrador"
3. Sempre use este modo para BPSR Meter

#### 4️⃣ **Antivírus Bloqueando**
**Problema:** Windows Defender ou outro antivírus bloqueando o programa.

**Solução no Windows Defender:**
1. Abra Windows Security
2. Vá em "Vírus & threat protection"
3. "Manage settings"
4. "Add or remove exclusions"
5. Adicione a pasta do BPSR Meter

**Outros Antivírus:**
- Avast: Settings → General → Exclusions
- Kaspersky: Settings → Additional → Threats and Exclusions
- Norton: Settings → Antivirus → Scans and Risks → Exclusions

#### 5️⃣ **Dependências Corrompidas (MODULE_NOT_FOUND)**
**Problema:** Arquivo de instalação corrompido ou incompleto.

**Solução:**
1. Desinstale completamente o BPSR Meter
2. Apague a pasta: `%AppData%\bpsr-meter` (se desejar limpar tudo)
3. Baixe a versão mais recente do GitHub
4. Reinstale
5. Execute como Administrador

#### 6️⃣ **Node.js Incompatível**
**Problema:** BPSR Meter requer Node.js v22.15.0 (já incluído no executável).

**Verificação:**
- Se estiver usando o instalador `.exe`, ignore (Node.js já incluído)
- Se estiver rodando via `npm start`, verifique: `node --version`

### 📝 Analisando o Log

O log detalhado está em:
```
%AppData%\bpsr-meter\iniciar_log.txt
```

**Como abrir:**
1. Pressione `Win + R`
2. Digite: `%AppData%\bpsr-meter`
3. Abra `iniciar_log.txt` com Bloco de Notas

**O que procurar:**
- `EADDRINUSE` → Porta em uso (veja solução 1️⃣)
- `Cannot find module` → Dependência faltando (veja solução 5️⃣)
- `EACCES` → Falta de permissão (veja solução 3️⃣)
- `server stderr:` → Erros do servidor backend
- `ERROR CRÍTICO` → Problema grave identificado

### 🛠️ Solução Rápida (Tente Nesta Ordem)

```powershell
# 1. Matar processos na porta
taskkill /F /IM "BPSR Meter.exe"

# 2. Limpar porta
netstat -ano | findstr :8989

# 3. Reiniciar o programa como Administrador
# (clique com botão direito → "Executar como Administrador")
```

### ✅ Checklist de Diagnóstico

- [ ] Npcap 1.83+ instalado?
- [ ] Executando como Administrador?
- [ ] Nenhum outro BPSR Meter aberto?
- [ ] Porta 8989 livre? (`netstat -ano | findstr :8989`)
- [ ] Antivírus com exceção configurada?
- [ ] Windows Firewall permite o programa?
- [ ] Arquivo `iniciar_log.txt` gerado? (contém erros específicos)

### 🆘 Precisa de Mais Ajuda?

1. **Abra uma Issue no GitHub:**
   https://github.com/gabrielsanbs/BPSR-Meter/issues

2. **Inclua as seguintes informações:**
   - Versão do Windows (Win 10/11)
   - Conteúdo do arquivo `%AppData%\bpsr-meter\iniciar_log.txt`
   - Screenshot da tela de erro
   - Resultado de: `netstat -ano | findstr :8989`
   - Npcap instalado? (`npca --version` ou verifique em Programas)

3. **Discord/Telegram (se houver):**
   - [Adicione links da comunidade aqui]

---

## 🔄 Erros Menos Comuns

### Erro: "server.js no encontrado"
**Causa:** Arquivo principal do servidor não encontrado.
**Solução:** Reinstale o programa completamente.

### Erro: "Processo fork iniciado mas não responde"
**Causa:** Node.js travado ou antivírus bloqueando IPC.
**Solução:** 
1. Desabilite temporariamente o antivírus
2. Adicione exceção para o executável
3. Reinicie o PC

### Erro: "Servidor fechou inesperadamente (código 1)"
**Causa:** Erro fatal no servidor backend.
**Solução:** Verifique `iniciar_log.txt` para erro específico.

---

**📅 Última atualização:** v3.0.3  
**🤖 Criado por:** gabrielsanbs
