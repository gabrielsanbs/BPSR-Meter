# Configuração do BPTimer

## Para Usuários Normais

Não precisa configurar nada! O medidor já vem com integração BPTimer ativada e funcionando.

Você pode ligar/desligar a contribuição de dados nas **Configurações** → **Integração BPTimer**.

---

## Para Desenvolvedores / Super Users

Se você tem uma API key própria do BPTimer (obtida em https://bptimer.com/api-key), pode configurá-la seguindo os passos:

### 1. Crie o arquivo `.env`

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

### 2. Configure sua API Key

Edite o arquivo `.env` e adicione sua key:
```env
BPTIMER_API_KEY=sua-api-key-aqui
```

### 3. Reinicie o aplicativo

O medidor irá detectar automaticamente e usar sua API key customizada.

---

## Verificando qual API key está sendo usada

Ao iniciar o servidor, você verá no log:
- **"usando custom API key"** - Está usando a key do `.env`
- **"usando public API key"** - Está usando a key pública padrão

---

## Segurança

- ✅ O arquivo `.env` está no `.gitignore` e nunca será commitado
- ✅ A API key nunca é exposta na interface do usuário
- ✅ Usuários comuns não precisam se preocupar com isso
