# Sistema RNC Neoformula v2.4

> Sistema completo de gestão de Registros de Não Conformidade (RNC) desenvolvido em Google Apps Script

**Versão:** v2.4 - Deploy 122
**Data de Build:** 2026-01-02
**Plataforma:** Google Apps Script (Runtime V8)
**Licença:** Proprietário - Neoformula

---

## Sobre o Sistema

O **Sistema RNC Neoformula** é uma aplicação web completa para gestão de Registros de Não Conformidade (RNC), desenvolvida para rastrear, analisar e resolver problemas de qualidade de forma eficiente e estruturada.

### Principais Características

- **Interface Web Moderna**: Sistema responsivo acessível via Google Apps Script Web App
- **Gestão Completa de RNCs**: Abertura, edição, acompanhamento e fechamento de não conformidades
- **Dashboard Executivo**: KPIs em tempo real com +30 indicadores estratégicos
- **Sistema de Anexos**: Upload e gestão de arquivos no Google Drive
- **Relatórios Personalizáveis**: Filtros dinâmicos por período, setor, tipo, risco e status
- **Impressão PDF**: Geração de RNCs em PDF diretamente do Google Sheets
- **Notificações Automáticas**: Email automático para criação, atualização e fechamento
- **Auditoria Completa**: Histórico detalhado de todas as alterações
- **Sistema de Permissões**: Controle granular por função e setor
- **Cache Inteligente**: Estratégia TTL para performance otimizada

---

## Início Rápido

### Requisitos

- Conta Google Workspace ou Gmail
- Acesso à planilha principal do sistema (fornecido pelo administrador)
- Permissões configuradas pelo administrador

### Primeiro Acesso

1. **Acesse o sistema web**
   - URL fornecida pelo administrador
   - Faça login com sua conta Google

2. **Configure suas preferências**
   - Acesse **Configurações** no menu
   - Defina seu setor e preferências de notificação

3. **Crie sua primeira RNC**
   - Clique em **Nova RNC**
   - Preencha os campos obrigatórios (marcados com *)
   - Adicione anexos se necessário
   - Clique em **Salvar**

### Estrutura do Projeto

```
NeoRNC/
├── 01.Config.js              # Configurações centralizadas
├── 02.Logger.js              # Sistema de logs e auditoria
├── 03.Database.js            # Operações com planilhas
├── 04.ConfigManager.js       # Gerenciamento de configurações
├── 05.FileManager.js         # Gestão de anexos no Drive
├── 06.RncOperations.js       # CRUD de RNCs
├── 07.Reports.js             # Relatórios e Dashboard
├── 08.Code.js                # Coordenação e API principal
├── 09. Tests.js              # Testes do sistema
├── 10.PermissionsManager.js  # Sistema de permissões
├── 11.PrintRNC.js            # Impressão de RNCs em PDF
├── 12.MenuPlanilha.js        # Menu customizado do Sheets
├── 13.HistoricoManager.js    # Histórico de alterações
├── 14.NotificationManager.js # Notificações por email
├── index.html                # Interface web principal
├── Abrirpdf.html            # Visualizador de PDF
└── appsscript.json          # Configuração do Apps Script
```

---

## Funcionalidades

### 1. Gestão de RNCs

#### Abertura de RNC

**Campos Obrigatórios:**
- Nome do Cliente
- Tipo RNC (Produto, Processo, Serviço, etc.)
- Setor Responsável
- Descrição da Não Conformidade
- Risco (Alto, Médio, Baixo)

**Campos Opcionais:**
- Anexos (fotos, documentos, evidências)
- Produto/Lote afetado
- Custo estimado
- Observações adicionais

**Fluxo:**
1. Clique em **Nova RNC**
2. Preencha o formulário
3. Adicione anexos se necessário
4. Sistema gera número sequencial automaticamente
5. Notificação enviada para responsáveis

#### Edição de RNC

**Permissões:**
- **Criador**: Pode editar RNC aberta
- **Administrador**: Pode editar qualquer RNC
- **Usuário do setor**: Pode editar RNCs do seu setor (configurável)

**Campos Editáveis:**
- Causa Raiz
- Ação Corretiva
- Responsável pela Ação
- Prazo de Implementação
- Status (Aberta, Em Análise, Ação Implementada, Concluída, Cancelada)

**Auditoria:**
- Todas as alterações são registradas no histórico
- Log com data, usuário, campo alterado e valores (antes/depois)

#### Fechamento de RNC

**Requisitos:**
- Ação corretiva implementada
- Evidências anexadas (recomendado)
- Status = "Concluída"

**Validações:**
- Sistema verifica campos obrigatórios para fechamento
- Notificação automática para stakeholders

### 2. Relatórios e Dashboard

#### Dashboard Executivo

**KPIs Disponíveis:**

**Indicadores Estratégicos:**
- ISP (Índice de Severidade Ponderado)
- Taxa de Cumprimento de Prazo
- Taxa de Reincidência
- Custo Total e Médio de RNCs
- Tempo Médio de Resolução

**Análises por Categoria:**
- Top 5 Setores com mais RNCs
- Top 5 Tipos de RNC
- Top 5 Clientes com mais RNCs
- Distribuição por Risco (Alto/Médio/Baixo)
- Distribuição por Status

**Tendências:**
- Evolução mensal de RNCs
- Comparação com período anterior
- Projeções baseadas em histórico

**Filtros Dinâmicos:**
- Período (Data Início/Fim)
- Setor
- Tipo de RNC
- Risco
- Status

#### Relatórios Personalizados

**Tipos de Relatório:**
1. **Relatório Gerencial**: Visão executiva com KPIs
2. **Relatório Detalhado**: Lista completa de RNCs com filtros
3. **Relatório por Setor**: Análise específica de um setor
4. **Relatório de Custos**: Análise financeira de não conformidades

**Exportação:**
- Visualização na tela
- Download em PDF (via impressão do navegador)
- Dados atualizados em tempo real

### 3. Anexos

#### Upload de Arquivos

**Formatos Suportados:**
- Imagens: JPG, PNG, GIF, BMP
- Documentos: PDF, DOC, DOCX, XLS, XLSX
- Outros: TXT, CSV, ZIP

**Limites:**
- Tamanho máximo: Conforme limite do Google Drive
- Quantidade: Ilimitada

**Organização:**
- Pasta específica por RNC no Google Drive
- Nomenclatura padronizada: `RNC-XXXX-YYYY - Nome do Arquivo`

#### Visualização e Download

**Recursos:**
- Visualização inline para imagens e PDFs
- Download direto de qualquer arquivo
- Listagem com nome, tamanho e data de upload

#### Deleção de Anexos

**Permissões:**
- Apenas administradores podem deletar anexos
- Deleção move arquivo para lixeira (recuperável por 30 dias)

### 4. Impressão

#### Impressão de RNC Individual

**Formato:**
- Tamanho: A4
- Orientação: Retrato
- Escala: Ajustar à largura da página

**Conteúdo:**
- Cabeçalho com logo Neoformula
- Número e data da RNC
- Todos os campos preenchidos
- Status atual e histórico resumido

**Fluxo:**
1. Abra a RNC desejada
2. Clique em **Imprimir**
3. Sistema gera PDF no Google Sheets
4. Abre visualizador de PDF
5. Use Ctrl+P para imprimir ou salvar

### 5. Permissões

#### Funções Disponíveis

**Administrador (Admin):**
- Acesso total ao sistema
- Criar, editar e deletar qualquer RNC
- Configurar campos e permissões
- Gerenciar usuários
- Acessar logs de auditoria

**Gestor:**
- Criar e editar RNCs do seu setor
- Visualizar dashboard e relatórios
- Acessar histórico de RNCs

**Usuário:**
- Criar novas RNCs
- Editar apenas RNCs criadas por ele
- Visualizar RNCs do seu setor
- Acessar relatórios básicos

**Visualizador:**
- Apenas visualizar RNCs
- Acessar relatórios
- Sem permissão de criar ou editar

#### Controle por Setor

**Configuração:**
- Cada usuário é vinculado a um ou mais setores
- Usuários veem apenas RNCs do seu setor (exceto Admin)
- Dashboard e relatórios filtram automaticamente por setor

**Setores Típicos:**
- Produção
- Qualidade
- Laboratório
- TI
- Comercial
- Administração

---

## Configurações

### Configurações de Sistema (Somente Admin)

#### Campos Customizáveis

**Gerenciamento de Campos:**
- Adicionar novos campos ao formulário
- Definir tipo (texto, número, data, seleção)
- Marcar como obrigatório ou opcional
- Definir seção de exibição (Abertura, Análise, Ação, Fechamento)

**Tipos de Campo:**
- **text**: Campo de texto livre
- **number**: Apenas números
- **date**: Seletor de data
- **select**: Lista de opções pré-definidas
- **textarea**: Texto longo (múltiplas linhas)
- **email**: Validação de email
- **phone**: Validação de telefone BR

#### Listas de Opções

**Listas Configuráveis:**
- Tipos de RNC
- Setores
- Riscos
- Status
- Tipos de Falha
- Ações Corretivas Padrão

**Edição:**
- Adicionar novas opções
- Remover opções (se não estiverem em uso)
- Reordenar opções

#### Notificações

**Configurações de Email:**
- Habilitar/desabilitar notificações por evento
- Definir destinatários padrão
- Customizar templates de email (em desenvolvimento)

**Eventos com Notificação:**
- Criação de RNC
- Atualização de RNC
- Fechamento de RNC
- Prazo próximo ao vencimento (em desenvolvimento)
- RNC vencida (em desenvolvimento)

#### Cache e Performance

**Estratégia de Cache:**
- **SHORT** (60s): Dados voláteis (configurações)
- **MEDIUM** (5min): Listas de RNCs
- **LONG** (15min): Dashboard e relatórios
- **VERY_LONG** (1h): Dados estáticos (listas de opções)

**Limpeza de Cache:**
- Automática ao salvar configurações
- Manual via menu **Ferramentas > Limpar Cache**

---

## Para Desenvolvedores

### Arquitetura do Sistema

#### Padrão de Módulos (IIFE)

Todos os módulos principais usam Immediately Invoked Function Expression (IIFE) para encapsulamento:

```javascript
/**
 * @namespace ModuleName
 */
var ModuleName = (function() {

  /** @private */
  function privateFunction() {
    // Lógica interna
  }

  /**
   * @memberof ModuleName
   * @public
   */
  function publicFunction() {
    return privateFunction();
  }

  return {
    publicFunction: publicFunction
  };
})();
```

#### Camada de Coordenação (08.Code.js)

O arquivo [08.Code.js](08.Code.js) atua como **coordenador** e **API pública**:

```javascript
// Funções públicas delegam para módulos especializados
function saveRnc(formData, files) {
  return RncOperations.saveRnc(formData, files);
}

function getDashboardData(forceRefresh, filteredRncs) {
  return Reports.getDashboardData(forceRefresh, filteredRncs);
}
```

#### Sistema de Cache

**Implementação:**
- Cache nativo do Apps Script (`CacheService.getScriptCache()`)
- TTL configurável por tipo de dado
- Invalidação automática em operações de escrita

**Exemplo de Uso:**
```javascript
var cache = CacheService.getScriptCache();
var cached = cache.get('dashboard_data');
if (cached) {
  return JSON.parse(cached);
}

var data = calculateDashboardData();
cache.put('dashboard_data', JSON.stringify(data), CONFIG.CACHE.LONG);
return data;
```

#### Sistema de Logs

**Níveis de Log:**
- DEBUG: Depuração (apenas em desenvolvimento)
- INFO: Operações normais
- WARNING: Avisos (não bloqueiam operação)
- ERROR: Erros recuperáveis
- CRITICAL: Erros graves (requerem atenção)

**Uso:**
```javascript
Logger.logInfo('RNC criada com sucesso', { rncNumber: 'RNC-2024-001' });
Logger.logError('Falha ao enviar notificação', { error: e.message });
Logger.logPerformance('getDashboardData', startTime, endTime);
```

### Desenvolvimento e Deploy

#### Pré-requisitos

- Node.js 14+
- clasp (Google Apps Script CLI)
- Conta Google com acesso ao projeto Apps Script

#### Setup Local

```bash
# Clonar repositório
git clone https://github.com/lucolicos88/NeoRNC.git
cd NeoRNC

# Instalar clasp globalmente
npm install -g @google/clasp

# Login no Google
clasp login

# Clonar projeto Apps Script (se ainda não feito)
clasp clone <SCRIPT_ID>
```

#### Workflow de Desenvolvimento

**Branch Strategy:**
- `main`: Produção estável
- `feat/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `docs/*`: Apenas documentação

**Deploy:**
```bash
# 1. Fazer alterações no código
# 2. Testar localmente (funções de teste em 09. Tests.js)
# 3. Fazer backup
node backup-deploy.js "Deploy XXX - Descrição"

# 4. Push para Apps Script
clasp push

# 5. Criar novo deployment
clasp deploy -d "Deploy XXX - Descrição"

# 6. Atualizar PRODUÇÃO
clasp deploy -d "PRODUÇÃO - v2.4 Deploy XXX" -i <PROD_DEPLOYMENT_ID>

# 7. Commit e push
git add .
git commit -m "feat: Deploy XXX - Descrição"
git push origin feat/nome-da-feature
```

#### Testes

**Funções de Teste Principais:**
```javascript
// Teste completo do sistema
fullSystemTest();

// Teste de módulo específico
testBasicSystem();
testAll_SistemaImpressao();
testarSistemaPermissoes();
testarNovosKPIs();
```

**Executar no Apps Script Editor:**
1. Abra o projeto no Apps Script Editor
2. Selecione a função de teste
3. Clique em **Executar**
4. Verifique logs em **Execuções**

### Estrutura de Dados

#### Planilha RNC

**Headers (Primeira Linha):**
```
Número RNC | Data Abertura | Nome do Cliente | Tipo RNC | Setor |
Descrição | Risco | Produto/Lote | Status | Causa Raiz |
Ação Corretiva | Responsável Ação | Prazo | Data Implementação |
Custo | Observações | Criado Por | Anexos | Última Modificação
```

#### Planilha Configurações

**Colunas:**
```
Seção | Campo | Tipo | Obrigatório | Opções | Ordem | Ativo
```

#### Planilha Histórico

**Colunas:**
```
Data/Hora | RNC | Usuário | Seção | Campo | Valor Anterior |
Valor Novo | IP | Tipo Ação
```

### API Reference

#### RncOperations

```javascript
/**
 * Salvar nova RNC
 * @param {Object} formData - Dados do formulário
 * @param {Array} files - Arquivos anexados
 * @return {Object} {success, rncNumber, message, fileErrors}
 */
RncOperations.saveRnc(formData, files)

/**
 * Atualizar RNC existente
 * @param {string} rncNumber - Número da RNC
 * @param {Object} updates - Campos a atualizar
 * @param {Array} files - Novos anexos
 * @return {Object} {success, message, changes}
 */
RncOperations.updateRnc(rncNumber, updates, files)

/**
 * Obter RNC por número
 * @param {string} rncNumber - Número da RNC
 * @return {Object|null} Dados da RNC ou null
 */
RncOperations.getRncByNumber(rncNumber)
```

#### Reports

```javascript
/**
 * Obter dados do dashboard
 * @param {boolean} forceRefresh - Ignorar cache
 * @param {Array<Object>} filteredRncs - RNCs pré-filtradas
 * @return {Object} Dados completos do dashboard com KPIs
 */
Reports.getDashboardData(forceRefresh, filteredRncs)

/**
 * Gerar relatório personalizado
 * @param {Object} filters - Filtros a aplicar
 * @return {Object} {stats, rncs, chartData}
 */
Reports.generateReport(filters)
```

#### FileManager

```javascript
/**
 * Upload de arquivos
 * @param {string} rncNumber - Número da RNC
 * @param {Array<Object>} files - Arquivos a enviar
 * @param {string} section - Seção de origem
 * @return {Object} {uploaded, failed, files, errors}
 */
FileManager.uploadFiles(rncNumber, files, section)

/**
 * Obter anexos de uma RNC
 * @param {string} rncNumber - Número da RNC
 * @return {Array<Object>} Lista de anexos
 */
FileManager.getAnexosRnc(rncNumber)
```

### Segurança

#### Sanitização de Inputs

**Prevenção de Ataques:**
- XSS (Cross-Site Scripting)
- SQL Injection (não aplicável, mas previne em lógica)
- Formula Injection (Google Sheets)
- Command Injection

**Funções de Sanitização:**
```javascript
// Sanitizar string genérica
var safe = sanitizeString(userInput);

// Sanitizar dados de formulário
var safeData = sanitizeFormData(formData);

// Validar input com whitelist
var validation = validateSafeInput(userInput, {
  allowedChars: /^[a-zA-Z0-9\s\-\_]+$/,
  maxLength: 100
});
```

#### Validação de Email

```javascript
// Retorno de objeto com detalhes
var result = isValidEmail('user@example.com');
// {valid: true, error: null}

// Retorno booleano simples
var isValid = isValidEmail('user@example.com', true);
// true
```

#### Controle de Permissões

```javascript
// Verificar se usuário é admin
if (!PermissionsManager.isAdmin(userEmail)) {
  throw new Error('Acesso negado');
}

// Verificar permissão para editar seção
if (!PermissionsManager.canEditSection(userEmail, 'Abertura')) {
  return {success: false, message: 'Sem permissão'};
}
```

### Performance

#### Otimizações Implementadas

**1. Cache Estratégico:**
- Dashboard: 15min TTL
- Listas de RNCs: 5min TTL
- Configurações: 1min TTL

**2. Batch Operations:**
- Leitura de múltiplas RNCs em uma única operação
- Escrita em lote de histórico

**3. Lazy Loading:**
- Anexos carregados sob demanda
- Dashboard calcula KPIs apenas quando necessário

**4. Índices e Lookups:**
- Map de RNCs por número para busca O(1)
- Cache de permissões de usuário

#### Benchmarks

**Operações Típicas:**
- Abertura de RNC: ~2-3s
- Edição de RNC: ~1-2s
- Carregamento de Dashboard: ~1-2s (com cache)
- Geração de Relatório: ~2-4s (100-500 RNCs)
- Upload de Anexo (1MB): ~3-5s

---

## Suporte

### Troubleshooting

#### Sistema Lento

**Soluções:**
1. Limpar cache: **Ferramentas > Limpar Cache**
2. Fechar outras abas do Google
3. Verificar conexão com internet
4. Contatar administrador se persistir

#### Erro ao Salvar RNC

**Possíveis Causas:**
- Campos obrigatórios não preenchidos
- Arquivo muito grande (anexo)
- Sessão expirada (faça login novamente)
- Sem permissão para salvar

**Solução:**
1. Verifique mensagem de erro específica
2. Corrija campos indicados
3. Tente novamente
4. Se persistir, contate administrador

#### Notificações Não Enviadas

**Verificar:**
1. Email do destinatário está correto?
2. Destinatário tem permissão no sistema?
3. Caixa de spam do destinatário
4. Contate administrador para verificar logs

#### Anexo Não Abre

**Soluções:**
1. Verifique se tem permissão no Google Drive
2. Solicite acesso ao criador da RNC
3. Tente fazer download ao invés de visualizar
4. Verifique se arquivo foi deletado

### Logs de Auditoria

**Acesso (Somente Admin):**
1. Abra planilha principal
2. Aba **Logs**
3. Filtre por data, usuário ou ação

**Informações Registradas:**
- Data/hora da operação
- Usuário que executou
- Tipo de operação (CREATE, UPDATE, DELETE)
- RNC afetada
- Campos alterados (antes/depois)

### Contato

**Suporte Técnico:**
- Email: suporte@neoformula.com.br
- Telefone: (XX) XXXX-XXXX

**Desenvolvedor:**
- GitHub: [@lucolicos88](https://github.com/lucolicos88)
- Repositório: [NeoRNC](https://github.com/lucolicos88/NeoRNC)

**Reportar Bugs:**
- Abra uma issue no GitHub com:
  - Descrição detalhada do problema
  - Passos para reproduzir
  - Mensagens de erro (se houver)
  - Screenshots (se aplicável)

---

## Changelog

### v2.4 - Deploy 122 (2026-01-02)

**Documentação:**
- Criado README.md completo
- Adicionado modal de ajuda no sistema web
- JSDoc completo em todos os 14 arquivos backend

### v2.4 - Deploy 121 (2026-01-02)

**Documentação:**
- Refinamento JSDoc em 5 arquivos (01, 02, 03, 05, 10)
- 71 funções + 2 constantes documentadas
- Padrão uniforme de documentação

### v2.4 - Deploy 120 (2026-01-02)

**Documentação:**
- JSDoc completo em arquivos média prioridade (04, 06, 07, 13, 14)
- 69 funções documentadas

### v2.4 - Deploy 119 (2026-01-02)

**Documentação:**
- JSDoc completo em arquivos críticos (08, 09, 11)
- 97 funções documentadas

### v2.4 - Deploy 118 (2026-01-02)

**Organização:**
- Sincronização de versões no backend e frontend
- Atualização de BUILD_DATE

### v2.3 - Deploy 117 HOTFIX (2026-01-01)

**Correções:**
- Corrigido upload de anexos (cache TTL)

### v2.3 - Deploy 116 (2026-01-01)

**Performance:**
- Padronização de cache TTLs
- Otimização de consultas

### v2.3 - Deploy 115 (2025-12-31)

**Segurança:**
- Unificação de isValidEmail()
- Validações consistentes

### v2.3 - Deploy 114 (2025-12-31)

**Segurança:**
- Correção de XSS e Template Injection
- Sanitização de inputs

---

**Sistema RNC Neoformula** - Gestão de Qualidade com Excelência
© 2024-2026 Neoformula. Todos os direitos reservados.
