# 📦 Gerenciamento de Deployments - NeoRNC

## 🎯 Estrutura Atual

### Deployments Ativos

| Ambiente | Versão | ID | Descrição | Uso |
|----------|--------|-----|-----------|-----|
| **@HEAD** | Latest | `AKfycbwplqsFH8dWwn1f3JwF53CJtI6M4VpYnYJHU28jAphX` | Versão HEAD do código | Editor/Debug |
| **PROD** | @103 | `AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg` | Deploy 51 - Fix SyntaxError | **USUÁRIOS** |
| **DEV** | @118 | `AKfycbwe0XZ7Sd6bGkt-TMFAyujHQG5Ms7XJXmmfVU350EIm5JLv82XyZeFaqFGSy49MrmJu` | Deploy 63 - PDF Profissional | **TESTES** |

---

## 🚀 Como Usar

### Para USUÁRIOS FINAIS
Use sempre a versão **PROD @103**:
```
https://script.google.com/macros/s/AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg/exec
```

### Para TESTES e DESENVOLVIMENTO
Use a versão **DEV @118**:
```
https://script.google.com/macros/s/AKfycbwe0XZ7Sd6bGkt-TMFAyujHQG5Ms7XJXmmfVU350EIm5JLv82XyZeFaqFGSy49MrmJu/exec
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

### Deploy 63 (Atual - DEV @118)
- **Data**: 10/12/2024
- **Tipo**: UX - Relatório PDF Nível Corporativo
- **Melhorias Implementadas**:
  - ✅ **Logo NEOFORMULA VISÍVEL E DESTACADO**:
    * Box branco maior (70x22mm)
    * Borda dupla verde para destaque máximo
    * "N" grande + "EOFORMULA" médio
    * Subtítulo "Sistema de Gestão"
    * **AGORA APARECE NO PDF!**
  - ✅ **Gráficos Pizza - Estilo Donut Moderno**:
    * Sombra 3D offset para profundidade
    * 24-40 segmentos por fatia (super suave)
    * Círculo branco central (estilo donut)
    * Total exibido no centro do donut
    * Legenda com círculos coloridos
    * Paleta brand: Teal como cor principal
    * Bordas brancas grossas (1pt) entre fatias
  - ✅ **Gráficos Barras - Estilo Material Design**:
    * Trilho cinza de fundo (track completo)
    * Gradiente 3 camadas (escuro→médio→brilho)
    * Números de ranking (1, 2, 3...)
    * Valores dentro da barra (se couber)
    * Percentual relativo ao máximo
    * Barras mais altas (12mm) com espaço (16mm)
    * Labels expandidos (30 caracteres)
- **Arquivos Modificados**: index.html (+200 linhas de código visual)
- **Impacto**: **RELATÓRIO NÍVEL CORPORATIVO PROFISSIONAL** 🎨
- **Status**: 🧪 DEV @118

### Deploy 62 (Histórico - DEV @117)
- **Data**: 09/12/2024
- **Tipo**: UX - Visual do Relatório PDF
- **Melhorias Implementadas**:
  - ✅ **Logo Neoformula CORRIGIDO**:
    * Substituído `roundedRect` (não suportado) por `rect` padrão
    * Box branco com borda verde visível
    * Logo agora aparece corretamente na capa
  - ✅ **Gráficos de Pizza MUITO MELHORADOS**:
    * Arcos suavizados com 16-30 segmentos (antes: 1 triângulo)
    * Círculos começam no topo (12h) ao invés de 3h
    * Bordas brancas finas entre fatias
    * Visual muito mais profissional e suave
  - ✅ **Gráficos de Barras MELHORADOS**:
    * Adicionada sombra (offset cinza)
    * Bordas escuras nas barras
    * Linha de highlight branca no topo
    * Altura aumentada (8mm → 10mm)
    * Espaçamento aumentado (12mm → 14mm)
- **Arquivos Modificados**: index.html (+50 linhas melhorias visuais)
- **Impacto Visual**: Relatório muito mais profissional e polido
- **Status**: 🧪 DEV @117

### Deploy 61 (Histórico - DEV @116)
- **Data**: 09/12/2024
- **Tipo**: Correção Completa - Relatório PDF
- **Correções Implementadas**:
  - ✅ **Formato de datas corrigido**: yyyy-mm-dd → dd/mm/yyyy
    * Adicionada função `formatarData()` em index.html
    * Período exibe "01/12/2025 até 09/12/2025"
  - ✅ **Textos truncados corrigidos**:
    * Labels aumentados de 18 para 25 caracteres
  - ✅ **Páginas TOP 5 preenchidas**:
    * `top5Setores` e `top5TiposFalha` calculados
  - ✅ **KPIs faltantes adicionados** (07.Reports.js):
    * finalizadas, abertas, criticas, rncsPrazo, rncsVencidas
    * maiorTempoResolucao, menorTempoResolucao, maiorCusto
- **Arquivos Modificados**: index.html, 07.Reports.js (+40 linhas)
- **Status**: 🧪 DEV @116

### Deploy 60 (Histórico - DEV @115)
- **Data**: 09/12/2024
- **Tipo**: Correção - UX (Relatório Gerencial)
- **Correções Implementadas**:
  - ✅ Corrigida acentuação em todo o relatório gerencial PDF
    * "RELATORIO" → "RELATÓRIO"
    * "Gestao de Nao Conformidades" → "Gestão de Não Conformidades"
    * "Periodo", "Geracao", "Finalizacao" → "Período", "Geração", "Finalização"
    * "Distribuicao", "Analise", "Acoes" → "Distribuição", "Análise", "Ações"
    * "Custo Medio", "Tempo Medio" → "Custo Médio", "Tempo Médio"
    * "Nivel", "Indice", "Metrica" → "Nível", "Índice", "Métrica"
    * "Resolucao", "Deteccao", "Reincidencia" → "Resolução", "Detecção", "Reincidência"
    * "Criticas", "Tendencias", "incidencia" → "Críticas", "Tendências", "incidência"
    * "atencao", "Atencao", "Satisfatoria" → "atenção", "Atenção", "Satisfatória"
    * Rodapé corrigido: "Sistema de Gestão de Não Conformidades"
  - ✅ Logo Neoformula já presente (confirmado)
- **Arquivos Modificados**: index.html (30+ edições)
- **Total de Correções**: ~40 palavras corrigidas
- **Impacto Funcional**: Melhoria na apresentação profissional do relatório
- **Status**: 🧪 Em testes no DEV @115

### Deploy 59 (Histórico - DEV @114)
- **Data**: 09/12/2024
- **Tipo**: Melhorias - Phase 4 (Improvements - Documentation)
- **Melhorias Implementadas**:
  - ✅ MELHORIA-06: JSDoc completo nos módulos principais
    * ApiResponse: Documentação com @module, exemplos de uso
    * CSRFProtection: Documentação detalhada com @example
    * Constante TOKEN_TTL extraída (1800s = 30min)
    * Tipos de retorno documentados para melhor IDE support
  - ✅ MELHORIA-07: Logging estruturado em JSON
    * Nova função Logger.logStructured() para logs em formato JSON
    * Facilita parsing automático e análise de logs
    * Sanitização automática de emails e dados sensíveis
    * Inclui timestamp, level, action, user, metadata, error
    * Console.log em JSON + gravação na planilha
    * Helper sanitizeEmail() para proteção de dados
- **Arquivos Modificados**: 02.Logger.js (+75 linhas), 08.Code.js (+35 linhas)
- **Total Linhas Adicionadas**: +110 linhas de documentação e logging
- **Impacto Funcional**: ZERO - Apenas melhoria de DX (Developer Experience)
- **Status**: 🧪 Em testes no DEV @114

### Deploy 58 (Histórico - DEV @113)
- **Data**: 09/12/2024
- **Tipo**: Melhorias - Phase 3 (Medium Priority)
- **Melhorias Implementadas**:
  - ✅ MÉDIA-05: Limpeza de comentários desatualizados
    * Removidas referências a "Deploy XX" nos headers
    * Atualizada versão do sistema para "v2.0"
    * Comentários focados em funcionalidade, não em histórico
  - ✅ MÉDIA-06: Substituição de magic numbers por constantes
    * Criado namespace window.NeoRNC.constants
    * Constantes para delays: ANIMATION_DELAY (300ms), RELOAD_DELAY (2s), APP_INIT_DELAY (500ms)
    * Constantes para PDF: margins, line heights, page dimensions
    * Constantes para limites: MAX_FILE_SIZE, CACHE_TTL
    * 6+ magic numbers substituídos por constantes nomeadas
- **Arquivos Modificados**: 01.Config.js, 08.Code.js, index.html (+30 linhas)
- **Total Linhas Adicionadas**: +30 linhas
- **Impacto Funcional**: ZERO - Apenas melhoria de manutenibilidade
- **Status**: 🧪 Em testes no DEV @113

### Deploy 57 (Histórico - DEV @112)
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
**Versão DEV Atual**: @114 (Deploy 59 - Phase 4: Documentation & Structured Logging)
