# 🚀 Guia Rápido de Deploy

## ✅ PRONTO PARA USAR!

Seu ambiente de desenvolvimento agora está **atualizado com o Deploy 31**!

### 📊 Status Atual das Implantações

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUÇÃO - @51 (NÃO MODIFICADO)                             │
│ https://script.google.com/macros/s/                        │
│ AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A/exec
│                                                              │
│ Status: ATIVO - Usuários usando                             │
│ Versão: Deploy 30                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DESENVOLVIMENTO - @55 (ATUALIZADO AGORA!)                   │
│ https://script.google.com/macros/s/                        │
│ AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg/exec
│                                                              │
│ Status: PRONTO PARA TESTE                                   │
│ Versão: Deploy 31 - Correções Críticas                      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Forma Mais Prática de Deploy

### Método 1: Scripts Automáticos (RECOMENDADO!)

Criei 2 scripts para você:

#### 📁 `deploy-dev.bat` - Deploy para Desenvolvimento

**Como usar:**
1. Faça suas alterações no VS Code
2. Dê duplo clique em `deploy-dev.bat`
3. Digite a mensagem do commit
4. Pronto!

**O que ele faz:**
- ✅ Envia código para Google Apps Script (`clasp push`)
- ✅ Atualiza versão de Desenvolvimento
- ✅ Faz commit no Git
- ✅ Envia para GitHub

#### 📁 `deploy-prod.bat` - Deploy para Produção

**Como usar:**
1. Teste MUITO em desenvolvimento primeiro!
2. Dê duplo clique em `deploy-prod.bat`
3. Confirme com "S"
4. Pronto!

**O que ele faz:**
- ⚠️ Pede confirmação (segurança)
- ✅ Envia código para Google Apps Script
- ✅ Atualiza versão de Produção
- ✅ Cria tag no Git (backup automático)

### Método 2: Linha de Comando (Terminal VS Code)

Pressione **Ctrl + `** no VS Code para abrir o terminal:

```bash
# Deploy Desenvolvimento (comando único)
clasp push --force && clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Dev - Atualizado"

# Deploy Produção (quando estiver pronto)
clasp push --force && clasp deploy --deploymentId AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A --description "Prod - Atualizado"
```

## 🎓 O que Significa Cada Comando

### `clasp push --force`
- **O que faz:** Envia seu código do VS Code para o Google Apps Script
- **Quando usar:** Sempre que alterar arquivos localmente
- **Importante:** Isso NÃO atualiza as URLs públicas ainda!

### `clasp deploy --deploymentId XXXXX`
- **O que faz:** Atualiza uma URL específica com o código atual
- **Quando usar:** Depois do `clasp push`
- **Importante:** A URL permanece a mesma! (usuários não precisam atualizar)

### `clasp deployments`
- **O que faz:** Lista todas as versões disponíveis
- **Quando usar:** Para verificar qual versão está em cada URL

## 📝 Workflow Diário Recomendado

### Dia a Dia (Pequenas Alterações):

```
1. Edite arquivo no VS Code (ex: 01.Config.js)
2. Duplo clique em deploy-dev.bat
3. Digite mensagem: "Ajuste no timeout"
4. Teste na URL de Desenvolvimento
5. Se OK, deixa rodando alguns dias
```

### Grande Atualização (Como Deploy 31):

```
1. Faça várias alterações no VS Code
2. Duplo clique em deploy-dev.bat
3. Digite: "Deploy 31 - Correções críticas"
4. Teste MUITO na URL de Desenvolvimento
5. Monitore logs por 2-3 dias
6. Se estável, duplo clique em deploy-prod.bat
7. Monitore produção por 24h
```

## 🎯 Teste Agora o Deploy 31!

Sua URL de Desenvolvimento já está com todas as correções:

**URL Desenvolvimento (Deploy 31):**
```
https://script.google.com/macros/s/AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg/exec
```

**URL Produção (Deploy 30 - não alterado):**
```
https://script.google.com/macros/s/AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A/exec
```

### ✅ Checklist de Teste Rápido:

```
[ ] Abrir URL de Desenvolvimento
[ ] Fazer login
[ ] Criar uma RNC de teste
[ ] Editar a RNC
[ ] Anexar um arquivo
[ ] Mudar status
[ ] Imprimir RNC
[ ] Verificar console (F12) - não deve ter erros
```

## 🔄 Entendendo as Versões

### No Google Apps Script você tem:

1. **@HEAD** - Código em rascunho (após clasp push)
2. **@51, @52, @53...** - Versões numeradas (após clasp deploy)
3. **Deployment IDs** - URLs fixas que apontam para versões

### Analogia Simples:

```
VS Code (seu código local)
    ↓ clasp push
@HEAD (rascunho no Google)
    ↓ clasp deploy --deploymentId XXXXX
URL pública (usuários acessam)
```

## 🎨 Controle de Versões no GAS via VS Code

### Opção 1: Manual (Web)
- Acesse https://script.google.com/home
- Clique em "Implantar" → "Gerenciar implantações"
- Visualize e edite versões

### Opção 2: Clasp (Terminal) - MELHOR!
```bash
# Ver todas as versões
clasp deployments

# Ver versão atual do código
clasp version

# Criar nova versão numerada
clasp version "Descrição da versão"

# Ver logs em tempo real
clasp logs --watch

# Abrir no navegador
clasp open --webapp
```

## 🆘 Troubleshooting

### Problema: "Unknown deployment"
```bash
# Verifique os IDs disponíveis
clasp deployments
```

### Problema: "Push was rejected"
```bash
# Use --force
clasp push --force
```

### Problema: Código não atualiza na URL
```bash
# Certifique-se de fazer o deploy após o push
clasp push --force
clasp deploy --deploymentId XXXXX
```

### Problema: Não sei qual versão está ativa
```bash
# Liste todas
clasp deployments

# A versão @XX mais alta é a mais recente
```

## 📚 Comandos Úteis

```bash
# Navegar até a pasta do projeto
cd c:\Users\Usuario\OneDrive\Documents\GitHub\NeoRNC

# Ver status do Git
git status

# Ver últimos commits
git log --oneline -5

# Ver diferenças do código
git diff

# Listar arquivos do projeto
dir

# Abrir VS Code na pasta atual
code .
```

## 🎯 Resumo Final

### Para Deploy Desenvolvimento:
1. **Edite** → Altere arquivos no VS Code
2. **Deploy** → Duplo clique em `deploy-dev.bat`
3. **Teste** → Acesse URL de desenvolvimento
4. **Monitore** → Veja logs por alguns dias

### Para Deploy Produção:
1. **Confirme** → Deploy 31 estável em desenvolvimento?
2. **Deploy** → Duplo clique em `deploy-prod.bat`
3. **Monitore** → Fique atento primeiras 24h
4. **Valide** → Confirme com usuários que está OK

---

## ✨ Vantagens Dessa Configuração

✅ **Sempre mesma URL** - Usuários não precisam atualizar links
✅ **Controle total** - Dev e Prod separados
✅ **Segurança** - Produção exige confirmação
✅ **Rastreável** - Git guarda histórico completo
✅ **Rápido** - Um clique para deploy completo
✅ **Backup automático** - Tags no Git

---

**Dica:** Favorita a URL de Desenvolvimento no navegador para testar rapidamente!

**Próximo passo:** Teste o Deploy 31 na URL de Desenvolvimento agora! 🚀
