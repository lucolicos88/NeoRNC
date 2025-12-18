# 📦 Sistema de Versionamento e Backup Automático

**Data:** 04/12/2025
**Status:** ✅ IMPLEMENTADO

---

## 🎯 OBJETIVO

Criar um sistema automatizado que **arquiva a versão atual** antes de fazer um novo deploy, garantindo:
- Histórico completo de todas as versões
- Capacidade de rollback rápido
- Rastreabilidade de mudanças
- Segurança contra perda de código

---

## 📁 ESTRUTURA DE ARQUIVOS

```
NeoRNC/
├── archives/                          # Pasta com backups
│   ├── README.md                     # Explicação da pasta
│   ├── deploy-37_2025-12-04/        # Backup do Deploy 37
│   │   ├── index.html
│   │   ├── 01.Config.js
│   │   ├── ... (todos os arquivos)
│   │   └── metadata.json            # Info do backup
│   ├── deploy-38_2025-12-05/        # Próximo backup
│   └── ...
│
├── backup-deploy.js                  # Script de automação
├── CHANGELOG.md                      # Histórico de versões
└── VERSIONAMENTO.md                  # Esta documentação
```

---

## 🚀 COMO USAR

### Método Automático (Recomendado):

```bash
node backup-deploy.js "Descrição do que foi feito"
```

**Exemplo:**
```bash
node backup-deploy.js "Adiciona sistema de notificações por email"
```

### O que o script faz automaticamente:

1. ✅ Detecta número do próximo deploy
2. ✅ Cria pasta `archives/deploy-XX_YYYY-MM-DD/`
3. ✅ Copia todos os arquivos atuais
4. ✅ Cria arquivo `metadata.json` com informações
5. ✅ Atualiza `CHANGELOG.md`
6. ✅ Executa `clasp push`
7. ✅ Cria deployment no Apps Script
8. ✅ Faz commit no git

---

## 📋 PROCESSO MANUAL (Se Preferir)

Se quiser fazer manualmente sem o script:

### 1. Criar Backup:
```bash
# Criar pasta do backup
mkdir archives/deploy-38_2025-12-05

# Copiar arquivos
cp index.html 01.Config.js 02.Logger.js ... archives/deploy-38_2025-12-05/
```

### 2. Atualizar CHANGELOG.md:
```markdown
## Deploy 38 - 2025-12-05

Descrição do que foi feito...

**Arquivos Modificados:** lista de arquivos
```

### 3. Deploy Normal:
```bash
clasp push
clasp deploy --description "Deploy 38 - Descrição"
git add -A
git commit -m "Deploy 38 - Descrição"
```

---

## 📊 METADATA.JSON

Cada backup contém um arquivo `metadata.json` com informações:

```json
{
  "deployNumber": 37,
  "date": "2025-12-04",
  "timestamp": "2025-12-04T18:30:00.000Z",
  "description": "Relatório Gerencial em PDF",
  "files": 17,
  "git": {
    "branch": "main",
    "commit": "cbdf802",
    "message": "Deploy 37 - Relatório Gerencial em PDF..."
  }
}
```

---

## 🔍 RECUPERAR VERSÃO ANTERIOR (ROLLBACK)

### Cenário: Deploy 39 deu problema, quero voltar para Deploy 38

```bash
# 1. Ver backups disponíveis
ls archives/

# 2. Copiar arquivos do backup desejado
cp archives/deploy-38_2025-12-05/* .

# 3. Push e deploy
clasp push
clasp deploy --description "Rollback - Reverte para Deploy 38"

# 4. Commit
git add -A
git commit -m "Rollback - Reverte Deploy 39, retorna para Deploy 38"
```

---

## 📝 CHANGELOG.md

O CHANGELOG mantém histórico legível de todas as versões:

```markdown
## Deploy 38 - 2025-12-05

**Notificações por Email**

Implementado sistema de notificações automáticas...

**Arquivos Modificados:**
- 14.NotificationManager.js (novo)
- 06.RncOperations.js (integração)

**Arquivos Modificados:** Ver `archives/deploy-38_2025-12-05/`

---

## Deploy 37 - 2025-12-04

**Relatório Gerencial em PDF**

...
```

---

## 🎨 ARQUIVOS INCLUÍDOS NO BACKUP

O script faz backup dos seguintes arquivos:

```javascript
const FILES_TO_BACKUP = [
    'index.html',
    '01.Config.js',
    '02.Logger.js',
    '03.Database.js',
    '04.ConfigManager.js',
    '05.FileManager.js',
    '06.RncOperations.js',
    '07.Reports.js',
    '08.Code.js',
    '09. Tests.js',
    '10.PermissionsManager.js',
    '11.PrintRNC.js',
    '12.MenuPlanilha.js',
    '13.HistoricoManager.js',
    'Abrirpdf.html',
    'appsscript.json'
];
```

**Não incluído no backup:**
- Arquivos de documentação (.md)
- Pasta node_modules
- Arquivos temporários
- .git/ (já versionado)

---

## 🔧 PERSONALIZAR O SCRIPT

### Adicionar mais arquivos ao backup:

Edite `backup-deploy.js`:

```javascript
const FILES_TO_BACKUP = [
    // ... arquivos existentes ...
    '14.NovoModulo.js',  // Adicionar aqui
    'outro-arquivo.html'
];
```

### Mudar pasta de backup:

```javascript
const ARCHIVES_DIR = 'meus-backups';  // Mudar aqui
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Não foi possível detectar número do deploy"

**Causa:** Git não encontrou commits com "Deploy XX"

**Solução:**
1. O script usa Deploy 38 como fallback
2. Ou edite manualmente no script:
```javascript
return 38;  // Mudar para número desejado
```

### Erro: "clasp: command not found"

**Causa:** Apps Script CLI não instalado

**Solução:**
```bash
npm install -g @google/clasp
clasp login
```

### Backup não está sendo criado

**Causa:** Permissões de arquivo

**Solução:**
```bash
chmod +x backup-deploy.js
node backup-deploy.js "Teste"
```

### CHANGELOG não atualiza

**Causa:** Arquivo CHANGELOG.md não existe

**Solução:**
```bash
# Criar arquivo inicial
echo "# CHANGELOG" > CHANGELOG.md
```

---

## 📅 CRONOGRAMA DE BACKUPS

### Quando fazer backup?

- ✅ **Sempre** antes de novo deploy
- ✅ Antes de refatorações grandes
- ✅ Antes de mudanças em arquivos core (Config, Database)
- ✅ Após deploys bem-sucedidos (já é automático)

### Quando NÃO precisa backup?

- ❌ Correção de typo em documentação
- ❌ Mudanças apenas em .md
- ❌ Testes locais

---

## 🗂️ ORGANIZAÇÃO DOS BACKUPS

### Nomenclatura:
```
deploy-{NÚMERO}_{DATA}/
```

**Exemplos:**
- `deploy-37_2025-12-04/` - Deploy 37 de 04/12/2025
- `deploy-38_2025-12-05/` - Deploy 38 de 05/12/2025

### Limpeza de Backups Antigos:

Recomendado manter:
- ✅ Últimos 10 deploys sempre
- ✅ Backups de versões "major" (30, 40, 50...)
- ❌ Deletar backups muito antigos (>6 meses)

```bash
# Ver tamanho dos backups
du -sh archives/*

# Deletar backups antigos (exemplo)
rm -rf archives/deploy-20_*
rm -rf archives/deploy-21_*
```

---

## 🎯 BOAS PRÁTICAS

### 1. Descrições Claras:
```bash
# ✅ BOM
node backup-deploy.js "Adiciona notificações por email com templates HTML"

# ❌ RUIM
node backup-deploy.js "fix"
```

### 2. Testar Antes:
Sempre teste localmente antes de rodar o script de deploy.

### 3. Atualizar CHANGELOG Manualmente (Se Necessário):
O script adiciona entrada básica, mas você pode editar para detalhar:
```markdown
## Deploy 38 - 2025-12-05

**Notificações por Email**

### Adicionado:
- Sistema de templates HTML
- Envio em background
- Fila de emails

### Modificado:
- RncOperations.js - Integração com notificações
- Config.js - Configurações de SMTP

### Arquivos Adicionados:
- 14.NotificationManager.js
- 15.EmailTemplates.js
```

### 4. Commit Semântico:
O script já usa formato padronizado, mas você pode melhorar:
```
Deploy 38 - Notificações por Email

✨ Features:
- Sistema de notificações automáticas
- Templates HTML personalizáveis

🔧 Melhorias:
- Performance do envio em batch

📚 Documentação:
- DEPLOY-38-NOTIFICACOES.md
```

---

## 📊 ESTATÍSTICAS

Com este sistema você terá:

- ✅ **100% de backups** antes de deploys
- ✅ **Rollback em < 2 minutos**
- ✅ **Histórico completo** de mudanças
- ✅ **Rastreabilidade** total
- ✅ **Segurança** contra perda de código

---

## 🎓 RESUMO

### Para próximo deploy:

1. **Fazer mudanças no código**
2. **Testar localmente**
3. **Rodar:** `node backup-deploy.js "Descrição clara"`
4. **Pronto!** Script faz tudo automaticamente

### Em caso de problema:

1. **Ver backups:** `ls archives/`
2. **Recuperar:** `cp archives/deploy-XX_DATE/* .`
3. **Deploy:** `clasp push && clasp deploy`
4. **Commit:** `git add -A && git commit`

---

**🎉 Sistema de Versionamento Configurado!**

A partir de agora, toda vez que for fazer um novo deploy, basta usar:

```bash
node backup-deploy.js "Descrição do que foi implementado"
```

E o sistema cuidará de tudo automaticamente! 🚀
