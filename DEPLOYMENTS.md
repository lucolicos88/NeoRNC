# 📦 Gerenciamento de Deployments - NeoRNC

## 🎯 Estrutura Atual

### Deployments Ativos

| Ambiente | Versão | ID | Descrição | Uso |
|----------|--------|-----|-----------|-----|
| **@HEAD** | Latest | `AKfycbwplqsFH8dWwn1f3JwF53CJtI6M4VpYnYJHU28jAphX` | Versão HEAD do código | Editor/Debug |
| **PROD** | @101 | `AKfycbxCzuxxSOw5h1ibOUAbVaUf68dX3s6qsC-d1R09k7kQ2hq8c1679JdamktEXmh1sicR-Q` | Deploy 39 - Versão Estável | **USUÁRIOS** |
| **DEV** | @102 | `AKfycbzCPNEOLLeEyqRwefm8xlyEDQmDiC42b_5pNV0ZZiojUO5HwwH7Q0lYoMVLnql_OifSjA` | Ambiente de Desenvolvimento | **TESTES** |

---

## 🚀 Como Usar

### Para USUÁRIOS FINAIS
Use sempre a versão **PROD @101**:
```
https://script.google.com/macros/s/AKfycbxCzuxxSOw5h1ibOUAbVaUf68dX3s6qsC-d1R09k7kQ2hq8c1679JdamktEXmh1sicR-Q/exec
```

### Para TESTES e DESENVOLVIMENTO
Use a versão **DEV @102**:
```
https://script.google.com/macros/s/AKfycbzCPNEOLLeEyqRwefm8xlyEDQmDiC42b_5pNV0ZZiojUO5HwwH7Q0lYoMVLnql_OifSjA/exec
```

---

## 📋 Comandos Úteis

### Listar todos os deployments
```bash
clasp deployments
```

### Criar novo deployment para PROD
```bash
clasp deploy --description "PROD - [Descrição da versão]"
```

### Criar novo deployment para DEV
```bash
clasp deploy --description "DEV - [Descrição dos testes]"
```

### Remover deployment antigo
```bash
clasp undeploy [DEPLOYMENT_ID]
```

### Ver versões no Apps Script Editor
```bash
clasp versions
```

---

## 🔄 Workflow de Deploy

### 1. Desenvolvimento
- Faça alterações no código localmente
- Teste usando `@HEAD` ou crie um deployment DEV temporário

### 2. Push para DEV
```bash
# Push do código
clasp push --force

# Criar/atualizar deployment DEV
clasp deploy --description "DEV - [Descrição do teste]"
```

### 3. Teste na Versão DEV
- Compartilhe o link DEV com testadores
- Valide todas as funcionalidades
- Corrija bugs se necessário

### 4. Promover para PROD
Quando a versão DEV estiver estável:
```bash
# Criar nova versão PROD
clasp deploy --description "PROD - Deploy XX - [Descrição]"

# Opcional: Remover versão PROD antiga
clasp undeploy [OLD_PROD_ID]

# Atualizar este documento com os novos IDs
```

### 5. Commit no GitHub
```bash
git add -A
git commit -m "Deploy XX - [Descrição]"
git push origin main
```

---

## ⚠️ IMPORTANTE

### ❌ NÃO FAÇA:
- Não delete a versão PROD sem antes ter uma nova versão funcionando
- Não faça push direto para PROD sem testar em DEV
- Não force push sem necessidade

### ✅ SEMPRE FAÇA:
- Teste em DEV antes de promover para PROD
- Mantenha sempre 2 versões: PROD (estável) e DEV (testes)
- Documente mudanças no CHANGELOG
- Faça backup antes de mudanças críticas

---

## 📝 Histórico de Versões

### Deploy 39 (Atual - PROD @101)
- **Data**: 05/12/2024
- **Versão Original**: @82
- **Funcionalidades**:
  - PDF Mega Completo (12 páginas)
  - Modal HTML
  - Fix de Encoding
  - Sistema de RNC completo e funcional

### Rollback Realizado
- **Data**: 05/12/2024
- **Motivo**: Erro de sintaxe nas versões 48-49 (3 chaves `}` extras no código)
- **Ação**: Rollback para versão estável @82 (Deploy 39)

---

## 🔗 Links Rápidos

- **GitHub Repository**: https://github.com/lucolicos88/NeoRNC
- **Apps Script Editor**: Use `clasp open` para abrir
- **Documentação**: Ver pasta `/archives` para backups

---

**Última Atualização**: 05/12/2024
**Versão PROD Atual**: @101 (Deploy 39)
**Versão DEV Atual**: @102
