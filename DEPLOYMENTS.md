# 📦 Gerenciamento de Deployments - NeoRNC

## 🎯 Estrutura Atual

### Deployments Ativos

| Ambiente | Versão | ID | Descrição | Uso |
|----------|--------|-----|-----------|-----|
| **@HEAD** | Latest | `AKfycbwplqsFH8dWwn1f3JwF53CJtI6M4VpYnYJHU28jAphX` | Versão HEAD do código | Editor/Debug |
| **PROD** | @103 | `AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg` | Deploy 51 - Fix SyntaxError | **USUÁRIOS** |
| **DEV** | @109 | `AKfycbzjJyyvIuUZXdZiDE7EQUsBSy9pssYHVIjOAourYArCU0HZ29V25yQVwmIS4DU4bcBP3Q` | Deploy 54 - Security Phase 2 | **TESTES** |

---

## 🚀 Como Usar

### Para USUÁRIOS FINAIS
Use sempre a versão **PROD @103**:
```
https://script.google.com/macros/s/AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg/exec
```

### Para TESTES e DESENVOLVIMENTO
Use a versão **DEV @109**:
```
https://script.google.com/macros/s/AKfycbzjJyyvIuUZXdZiDE7EQUsBSy9pssYHVIjOAourYArCU0HZ29V25yQVwmIS4DU4bcBP3Q/exec
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

### Deploy 54 (Atual - DEV @109)
- **Data**: 05/12/2024
- **Tipo**: Melhorias de Segurança - Phase 2 (High Priority)
- **Vulnerabilidades Corrigidas**:
  - ✅ ALTA-03: Input Validation (5 funções de validação implementadas)
  - ✅ ALTA-04: Fix Equality Comparisons (== para ===, != para !==)
  - ✅ ALTA-05: Sanitize Logs (emails e dados sensíveis redacted)
  - ✅ ALTA-07: Cache with TTL (5 minutos para prevenir dados obsoletos)
- **Arquivos Modificados**: index.html (+85 linhas), 02.Logger.js (+60 linhas), 03.Database.js (+20 linhas), 08.Code.js (+2 linhas)
- **Impacto Funcional**: ZERO - Apenas melhorias de segurança
- **Status**: 🧪 Em testes no DEV @109 - Aguardando validação antes de PROD

### Deploy 53 (Histórico - DEV @108)
- **Data**: 05/12/2024
- **Tipo**: Melhorias de Segurança - Phase 1 (Critical)
- **Vulnerabilidades Corrigidas**:
  - ✅ CRÍTICO-01: XSS via innerHTML não sanitizado (função sanitizeHTML() implementada)
  - ✅ CRÍTICO-02: Emails expostos no frontend removidos
  - ✅ CRÍTICO-03: Admin hardcoded removido (PermissionsManager.js:69)
  - ✅ ALTA-02: Content Security Policy adicionada via meta tag
- **Correções**:
  - ✅ CSP: Adicionado cdn.jsdelivr.net e cdnjs.cloudflare.com ao connect-src (fix source maps)
  - ✅ Favicon: Adicionado emoji 📋 via SVG data URI (fix erro 404)
- **Arquivos Modificados**: index.html (+96 linhas), 08.Code.js, 10.PermissionsManager.js
- **Impacto Funcional**: ZERO - Apenas melhorias de segurança
- **Status**: 🧪 Em testes no DEV @108 - Aguardando validação antes de PROD

### Deploy 51 (Atual - PROD @103)
- **Data**: 05/12/2024
- **Problema Resolvido**: Erro de sintaxe (SyntaxError: Unexpected token '}')
- **Causa**: 368 linhas de código duplicado (linhas 7851-8218)
- **Solução**: Remoção do código duplicado da função exportToPdf()
- **Status**: ✅ Todos os símbolos balanceados corretamente

### Deploy 39 (Histórico)
- **Data**: 04/12/2024
- **Versão Original**: @82
- **Funcionalidades**:
  - PDF Mega Completo (12 páginas)
  - Modal HTML
  - Fix de Encoding
  - Sistema de RNC completo e funcional
- **Problema**: Continha código duplicado que causava erro de sintaxe

---

## 🔗 Links Rápidos

- **GitHub Repository**: https://github.com/lucolicos88/NeoRNC
- **Apps Script Editor**: Use `clasp open` para abrir
- **Documentação**: Ver pasta `/archives` para backups

---

**Última Atualização**: 05/12/2024
**Versão PROD Atual**: @103 (Deploy 51)
**Versão DEV Atual**: @109 (Deploy 54 - Security Phase 2)
