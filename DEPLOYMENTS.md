# 📦 Gerenciamento de Deployments - NeoRNC

## 🎯 Estrutura Atual

### Deployments Ativos

| Ambiente | Versão | ID | Descrição | Uso |
|----------|--------|-----|-----------|-----|
| **@HEAD** | Latest | `AKfycbwplqsFH8dWwn1f3JwF53CJtI6M4VpYnYJHU28jAphX` | Versão HEAD do código | Editor/Debug |
| **PROD** | @103 | `AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg` | Deploy 51 - Fix SyntaxError | **USUÁRIOS** |
| **DEV** | @112 | `AKfycbxL3L2sP5Go3lemiEWCsxIX8XErn8vheHhJrVP_HFR7ePoMJwH-V2M6Es0WOlEQWx8g2Q` | Deploy 57 - Phase 3: Error Handling + Global Namespace | **TESTES** |

---

## 🚀 Como Usar

### Para USUÁRIOS FINAIS
Use sempre a versão **PROD @103**:
```
https://script.google.com/macros/s/AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg/exec
```

### Para TESTES e DESENVOLVIMENTO
Use a versão **DEV @112**:
```
https://script.google.com/macros/s/AKfycbxL3L2sP5Go3lemiEWCsxIX8XErn8vheHhJrVP_HFR7ePoMJwH-V2M6Es0WOlEQWx8g2Q/exec
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

### Deploy 57 (Atual - DEV @112)
- **Data**: 09/12/2024
- **Tipo**: Melhorias - Phase 3 (Medium Priority)
- **Melhorias Implementadas**:
  - ✅ MÉDIA-01: Padronização de tratamento de erros
    * Módulo ApiResponse para respostas consistentes
    * Funções: success(), error(), validationError(), forbidden(), notFound()
    * Wrapper tryCatch() para capturar erros automaticamente
    * Estrutura padronizada com códigos de erro e timestamps
  - ✅ MÉDIA-02: Refatoração de variáveis globais
    * Criado namespace window.NeoRNC para evitar colisões
    * Encapsulamento de estado global em NeoRNC.state
    * Aliases mantidos para compatibilidade com código existente
    * Redução de poluição do namespace global
- **Arquivos Modificados**: 08.Code.js (+130 linhas), index.html (+15 linhas)
- **Total Linhas Adicionadas**: +145 linhas de código
- **Impacto Funcional**: ZERO - Apenas melhorias de arquitetura interna
- **Status**: 🧪 Em testes no DEV @112

### Deploy 56 (Histórico - DEV @111)
- **Data**: 05/12/2024
- **Tipo**: Melhorias - Phase 3 (Medium Priority)
- **Melhorias Implementadas**:
  - ✅ MÉDIA-11: Validação robusta de tamanho de arquivo
    * Validar arquivo inválido (null check + typeof)
    * Validar arquivo vazio (size === 0)
    * Limite configurável via systemConfig.maxFileSize
    * Sanitizar file.name nas mensagens de erro
- **Arquivos Modificados**: index.html (+20 linhas)
- **Impacto Funcional**: ZERO - Apenas melhorias de validação
- **Status**: 🧪 Em testes no DEV @111

### Deploy 55 (Histórico - DEV @110)
- **Data**: 05/12/2024
- **Tipo**: Melhorias de Segurança - Phase 2 COMPLETA (High Priority)
- **Vulnerabilidades Corrigidas**:
  - ✅ ALTA-03: Input Validation (5 funções)
  - ✅ ALTA-04: Fix Equality Comparisons (strict equality)
  - ✅ ALTA-05: Sanitize Logs (emails e dados sensíveis redacted)
  - ✅ ALTA-06: Rate Limiting (60 req/min geral, 10 writes/min)
  - ✅ ALTA-07: Cache with TTL (5 minutos)
  - ✅ ALTA-08: CSRF Protection (tokens com TTL 30 min)
- **Arquivos Modificados**: index.html (+85), 02.Logger.js (+60), 03.Database.js (+20), 08.Code.js (+169)
- **Total Linhas Adicionadas**: +334 linhas de código de segurança
- **Impacto Funcional**: ZERO - Apenas melhorias de segurança
- **Status**: 🧪 Phase 2 COMPLETA - Em testes no DEV @110

### Deploy 54 (Histórico - DEV @109)
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

**Última Atualização**: 09/12/2024
**Versão PROD Atual**: @103 (Deploy 51)
**Versão DEV Atual**: @112 (Deploy 57 - Phase 3 Partial: Error Handling + Global Namespace)
