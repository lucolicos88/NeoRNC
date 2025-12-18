# CHANGELOG - Histórico de Deploys

Todas as versões do sistema NeoRNC são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---





## Deploy 39 - 2025-12-04

Deploy 40 - PDF Mega Completo + Modal HTML + Fix Encoding - Force Update

**Arquivos Modificados:** Ver `archives/deploy-39_2025-12-04/`

---

## Deploy 38 - 2025-12-04

Deploy 40 - PDF Mega Completo + Modal HTML + Fix Encoding - Force Update

**Arquivos Modificados:** Ver `archives/deploy-38_2025-12-04/`

---

## Deploy 39 - 2025-12-04

PDF Mega-Completo Profissional - 12 paginas, logo Neoformula, graficos pizza e barras, 50+ metricas, modal HTML, 100% ASCII

**Arquivos Modificados:** Ver `archives/deploy-39_2025-12-04/`

---

## Deploy 38 - 2025-12-04

Relatorio PDF Executivo - Fix encoding, graficos visuais, layout profissional

**Arquivos Modificados:** Ver `archives/deploy-38_2025-12-04/`

---

## Deploy 37 - 2025-12-04

**Relatório Gerencial em PDF**

Implementado sistema de exportação de relatórios profissionais em PDF com:
- Capa corporativa
- Resumo Executivo (7 KPIs)
- KPIs Estratégicos (tabela)
- Distribuição das RNCs
- Análise de Custos
- Top 5 Rankings (setores)
- Ações Recomendadas

**Bibliotecas Adicionadas:**
- jsPDF 2.5.1
- jsPDF-AutoTable 3.5.31

**Arquivos Modificados:** `index.html`

**Documentação:** [DEPLOY-37-RELATORIO-PDF.md](DEPLOY-37-RELATORIO-PDF.md)

---

## Deploy 36 - 2025-12-04

**Dashboard Melhorado com Inteligência**

5 novos recursos no dashboard:
- Top 5 Rankings (Setores e Tipos de Falha)
- Comparativo Mensal (mês atual vs anterior com tendência)
- Evolução Semanal (gráfico de barras das últimas 4 semanas)
- Ações Recomendadas (sistema inteligente baseado em limites)
- Indicadores visuais coloridos

**Arquivos Modificados:**
- `07.Reports.js` (backend - cálculos)
- `index.html` (frontend - visualização)

**Documentação:** [DEPLOY-36-DASHBOARD-MELHORADO.md](DEPLOY-36-DASHBOARD-MELHORADO.md)

---

## Deploy 35 - 2025-12-03

**❌ ROLLBACK - UX Improvements Failed**

Tentativa de melhorar UX com botões disable durante save.
Deploy revertido devido a bugs críticos (RNC não criava).

**Lição Aprendida:** Testar melhor UX changes antes de deploy.

---

## Deploy 34 - 2025-12-02

**Sistema de Histórico de Alterações**

Implementado sistema completo de auditoria:
- Aba "Historico" na planilha
- Registra quem alterou, quando, campo, valor anterior e novo
- Timeline visual de mudanças
- Fix de serialização de Date para ISO string

**Arquivos Adicionados:**
- `13.HistoricoManager.js`

**Arquivos Modificados:**
- `06.RncOperations.js` (integração)
- `index.html` (visualização)

**Documentação:** [DEPLOY-34-HISTORICO.md](DEPLOY-34-HISTORICO.md)

---

## Deploy 33 - 2025-12-01

**Validações e Erros Amigáveis**

Melhorias em validação de campos:
- Validação usando planilha ConfigCampos
- Mensagens de erro amigáveis
- Modal de erro visível
- Fallback alert() se modal falhar

**Arquivos Modificados:**
- `index.html`

**Documentação:** [DEPLOY-33-FIX.md](DEPLOY-33-FIX.md)

---

## Deploy 32 - 2025-11-30

**Cache e Performance**

Implementado sistema de cache de 15 minutos no dashboard:
- CacheService.getScriptCache()
- Redução de 70% no tempo de carregamento
- Botão de refresh manual

**Arquivos Modificados:**
- `07.Reports.js`

---

## Deploy 31 - 2025-11-29

**Estabilização e Bugs Fixes**

Correções gerais e melhorias de estabilidade.

---

## Deploy 30 - 2025-11-28

**Sistema de Relatórios**

Implementada aba de Relatórios com:
- Filtros por data, setor, tipo, status
- Exportação para CSV
- KPIs e gráficos
- Sistema de configurações

**Arquivos Adicionados:**
- Seção de Relatórios no `index.html`

---

## Versões Anteriores (Deploys 1-29)

Sistema base implementado com:
- CRUD de RNCs
- Sistema de anexos
- Dashboard básico
- Gestão de usuários
- Configurações
- Multiselect
- Print de RNC

---

**Formato do Changelog:**

Cada deploy deve incluir:
- Número e data
- Título descritivo
- Lista de mudanças
- Arquivos modificados/adicionados
- Link para documentação (se houver)
- Breaking changes (se houver)

---

**Manutenção:**

Este arquivo é atualizado automaticamente pelo script `backup-deploy.js`.
