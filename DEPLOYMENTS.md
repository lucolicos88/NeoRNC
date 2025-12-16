# 📦 Gerenciamento de Deployments - NeoRNC

## 🎯 Estrutura Atual

### Deployments Ativos

| Ambiente | Versão | ID | Descrição | Uso |
|----------|--------|-----|-----------|-----|
| **@HEAD** | Latest | `AKfycbwplqsFH8dWwn1f3JwF53CJtI6M4VpYnYJHU28jAphX` | Versão HEAD do código | Editor/Debug |
| **PROD** | @103 | `AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg` | Deploy 51 - Fix SyntaxError | **USUÁRIOS** |
| **DEV** | @125 | `AKfycbwCZF4SIWxa-u_Yl0ZPbjxL59v-adRHjGMZVfrJ8RPI190MKyZBGDrX-sUo5f6V7Pzy` | Deploy 69 - Debug tabs admin | **TESTES** |

---

## 🚀 Como Usar

### Para USUÁRIOS FINAIS
Use sempre a versão **PROD @103**:
```
https://script.google.com/macros/s/AKfycbwj2tyYak0ZKI8TXl1PHmunf5s0ABX0T31RzG-6w1r38iQDLRwisopzKAPGfgWREBb6Hg/exec
```

### Para TESTES e DESENVOLVIMENTO
Use a versão **DEV @125**:
```
https://script.google.com/macros/s/AKfycbwCZF4SIWxa-u_Yl0ZPbjxL59v-adRHjGMZVfrJ8RPI190MKyZBGDrX-sUo5f6V7Pzy/exec
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

### Deploy 69 (Atual - DEV @125)
- **Data**: 16/12/2024
- **Tipo**: Debug - Adição de logs para diagnóstico de tabs admin
- **Funcionalidades Implementadas**:
  - ✅ **Debug de Visibilidade de Tabs**:
    * Adicionado console.log detalhado ao verificar appContext.isAdmin
    * Logs mostram valores de: isAdmin, canConfig, roles, email
    * Logs indicam se tabs estão sendo mostradas ou ocultadas
    * Facilita diagnóstico de problemas de visibilidade
  - ✅ **Melhoria na Lógica de Tabs**:
    * Adicionada verificação explícita para ocultar tabs quando não-admin
    * Garantia de que tabs iniciam ocultas e só aparecem se admin
- **Arquivos Modificados**:
  - 01.Config.js (versão Deploy 69)
  - index.html (logs de debug na verificação de tabs)
- **Versão**: Sistema RNC v2.2 - Deploy 69
- **Impacto**: Facilita diagnóstico de problemas com visibilidade de tabs
- **Status**: 🧪 DEV @125

### Deploy 68.1 (Histórico - DEV @124 - REMOVIDO)
- **Data**: 16/12/2024
- **Tipo**: UX - Restrição de Acesso a Abas Administrativas
- **Funcionalidades Implementadas**:
  - ✅ **Abas Restritas para Admins**:
    * Aba "Relatórios" agora visível apenas para administradores
    * Aba "Configurações" continua visível apenas para administradores
    * Usuários não-admin não veem essas abas na interface
    * Verificação baseada em `appContext.isAdmin`
- **Arquivos Modificados**:
  - index.html (controle de visibilidade das abas)
- **Versão**: Sistema RNC v2.2 - Deploy 68.1
- **Impacto**: Melhor segurança e UX mais limpa para usuários não-admin
- **Status**: 🧪 DEV @124 - REMOVIDO

### Deploy 68 (Histórico - DEV @123 - REMOVIDO)
- **Data**: 16/12/2024
- **Tipo**: Fix + Feature - Filtros Personalizados por Setor + Setores Centralizados
- **Funcionalidades Corrigidas/Implementadas**:
  - ✅ **Filtros de Setor Personalizados por Usuário**:
    * Usuários não-admin veem APENAS seu próprio setor nos filtros
    * Admins continuam vendo todos os setores
    * Opção "Todos os Setores" removida para usuários não-admin
    * Aplicado em: Editar RNC, Kanban e Dashboard
  - ✅ **Setores da Planilha Listas**:
    * Modais de novo usuário e editar usuário agora buscam setores da planilha "Listas"
    * Antes: usavam `getSetoresUnicos()` (derivado de RNCs existentes)
    * Agora: usam `getSetoresFromListas()` (lista configurável e centralizada)
    * Garante consistência e permite gestão centralizada de setores
  - ✅ **Nova Função Backend - getSetoresFromListas()**:
    * Implementada em ConfigManager.js
    * Lê diretamente da coluna "Setores" da planilha "Listas"
    * Usa cache para melhor performance
    * Exposta via API para o frontend
  - ✅ **Setor do Usuário no Contexto**:
    * appContext.setor agora disponível no frontend
    * getUserContextOptimized() retorna setor do usuário
    * Permite verificações de setor em tempo real
- **Arquivos Modificados**:
  - 01.Config.js (v2.2 - Deploy 68)
  - 04.ConfigManager.js (getSetoresFromListas)
  - 08.Code.js (API getSetoresFromListas, setor no contexto)
  - index.html (filtros personalizados, modais usando Listas)
- **Versão**: Sistema RNC v2.2 - Deploy 68
- **Impacto**: Melhor segurança (usuários veem apenas seu setor) + Gestão centralizada de setores
- **Status**: 🧪 DEV @123

### Deploy 67 (Histórico - DEV @122 - REMOVIDO)
- **Data**: 16/12/2024
- **Tipo**: Fix + Feature - Correção de Notificações + Gestão de Setores
- **Funcionalidades Corrigidas/Implementadas**:
  - ✅ **Sistema de Notificações CORRIGIDO**:
    * Ao CRIAR RNC: notifica setor de ABERTURA + Admins
    * Ao MUDAR STATUS: notifica setor ABERTURA + setor NÃO CONFORMIDADE + Admins
    * Correção: agora usa campos corretos (antes usava apenas setor não conformidade)
  - ✅ **Filtro de RNCs Aprimorado**:
    * Usuários veem RNCs onde estão no setor de ABERTURA **OU** setor da NÃO CONFORMIDADE
    * Sistema filtra corretamente ambos os setores
    * Admins continuam vendo todas as RNCs
  - ✅ **Modal de Novo Usuário - Campo Setor**:
    * Adicionado select de setor no modal de adicionar usuário
    * Lista de setores carregada dinamicamente via `getSetoresUnicos()`
    * Campo obrigatório para criar novo usuário
  - ✅ **Modal de Editar Usuário - Campo Setor**:
    * Adicionado select de setor no modal de editar usuário
    * Setor atual do usuário pré-selecionado automaticamente
    * Atualização de setor reflete em todas as roles do usuário
  - ✅ **Nova Função Backend - updateUserSetor()**:
    * Atualiza setor de todas as permissões do usuário simultaneamente
    * Garante consistência de dados
- **Arquivos Modificados**:
  - 01.Config.js (v2.2)
  - 06.RncOperations.js (filtro duplo setor)
  - 10.PermissionsManager.js (updateUserSetor)
  - 14.NotificationManager.js (lógica de notificações corrigida)
  - index.html (modais com campo setor)
- **Versão**: Sistema RNC v2.2 - Deploy 67
- **Impacto**: Correção crítica de notificações + UX melhorado para gestão de setores
- **Status**: 🧪 DEV @122

### Deploy 66 (Histórico - DEV @121 - REMOVIDO)
- **Data**: 16/12/2024
- **Tipo**: Feature - Sistema de Notificações + Filtro por Setor
- **Funcionalidades Implementadas**:
  - ✅ **Sistema de Notificações por Email**:
    * Notificação automática ao criar nova RNC
    * Notificação ao atualizar RNC
    * Notificação específica para mudança de status
    * Emails enviados para usuários do setor onde ocorreu a não conformidade
    * Emails enviados para Admins em todas as notificações
    * Corpo do email contém: dados da RNC, alterações, link para o aplicativo
  - ✅ **Filtro de RNCs por Setor do Usuário**:
    * Nova coluna "Setor" na tabela Permissões
    * Usuários vinculados a setores específicos
    * Filtro automático: usuários veem apenas RNCs do seu setor
    * Admins continuam vendo todas as RNCs
    * Usa campo "Setor onde ocorreu a não conformidade" (não "abertura")
  - ✅ **Novo Módulo NotificationManager (14.NotificationManager.js)**:
    * `getUsersBySetor()` - Busca usuários de um setor
    * `getAdminUsers()` - Busca administradores
    * `getRncLink()` - Gera link da RNC
    * `notifyRncCreated()` - Notifica criação
    * `notifyRncUpdated()` - Notifica atualização
    * `notifyStatusChanged()` - Notifica mudança de status
  - ✅ **Melhorias no PermissionsManager**:
    * Nova função `getUserSetor(email)` - Retorna setor do usuário
    * `getUserPermissions()` agora inclui campo `setor`
  - ✅ **Melhorias no RncOperations**:
    * `getRncsBySetor()` usa campo correto de não conformidade
    * Nova função `getRncsByUserSetor(email)`
    * Integração automática de notificações em `saveRnc()` e `updateRnc()`
  - ✅ **Nova API para Frontend (08.Code.js)**:
    * `getRncsByUserSetor()` - Retorna RNCs filtradas por setor do usuário
- **Arquivos Criados**: 14.NotificationManager.js
- **Arquivos Modificados**: 01.Config.js, 06.RncOperations.js, 08.Code.js, 10.PermissionsManager.js
- **Versão**: Sistema RNC v2.1 - Deploy 66
- **Impacto**: Sistema de comunicação + Segmentação por setor
- **Status**: 🧪 DEV @121 (Deploy completo com NotificationManager incluído)
- **Nota**: Deploy @120 foi removido por estar incompleto (faltava 14.NotificationManager.js)

### Deploy 65 (Histórico - DEV @119 - REMOVIDO)
- **Data**: 10/12/2024
- **Tipo**: UX - Logo Real PNG + Gráficos Executivos
- **Melhorias Implementadas**:
  - ✅ **LOGO NEOFORMULA - IMAGEM PNG REAL**:
    * Logo oficial baixado de https://neoformula.com.br
    * Convertido para base64 (26.86 KB)
    * Inserido como imagem PNG no PDF via doc.addImage()
    * Fallback para texto caso imagem falhe
    * **LOGO AGORA APARECE PERFEITAMENTE!** 🎯
  - ✅ **Gráficos Pizza - Qualidade Executiva**:
    * Bordas brancas GROSSAS (2pt) entre fatias
    * Sombra 3D com offset maior (2mm)
    * 40-60 segmentos ultra-suaves
    * Cores vibrantes e profissionais
    * Total no centro em Teal (16pt bold)
    * Legenda com caixas coloridas + bordas
  - ✅ **Legendas Profissionais**:
    * Caixas coloridas 4x4mm com bordas escuras
    * Valor em negrito (9pt)
    * Percentual em cinza (8pt)
    * Labels descritivos (7pt, 22 chars)
    * Espaçamento aumentado (11mm entre itens)
- **Arquivos Modificados**:
  * index.html (logo PNG + gráficos redesenhados)
  * download-logo.js (novo script Node.js)
  * neoformula-logo.png (26.86 KB)
- **Impacto**: **RELATÓRIO PRONTO PARA DIRETORIA** 📊🏢
- **Status**: 🧪 DEV @119

### Deploy 63 (Histórico - DEV @118)
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

**Última Atualização**: 16/12/2024
**Versão PROD Atual**: @103 (Deploy 51)
**Versão DEV Atual**: @122 (Deploy 67 - Notificações Corrigidas + Gestão de Setores)
