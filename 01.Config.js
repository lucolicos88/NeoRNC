/**
 * ============================================
 * CONFIG.GS - Configurações e Constantes
 * Sistema RNC Neoformula
 * ============================================
 *
 * Configurações centralizadas do sistema:
 * - IDs de recursos (Planilha, Drive)
 * - Timeouts e limites
 * - Mapeamento de campos
 * - Mensagens de erro
 */

/**
 * Configurações centralizadas do sistema RNC Neoformula.
 * Contém IDs de planilhas, configurações de cache, permissões, limites de execução
 * e mensagens padronizadas para garantir consistência em toda a aplicação.
 *
 * @constant {Object}
 * @property {string} SPREADSHEET_ID - ID da planilha principal do Google Sheets
 * @property {string} DRIVE_FOLDER_ID - ID da pasta do Google Drive para armazenamento de anexos
 * @property {string} VERSION - Versão atual do sistema e número do deploy
 * @property {string} BUILD_DATE - Data de build do sistema (formato YYYY-MM-DD)
 * @property {boolean} DEBUG_MODE - Controla exibição de logs de debug no sistema
 * @property {string} ENVIRONMENT - Ambiente de execução (development | production)
 * @property {Object} SHEETS - Nomes das abas da planilha principal
 * @property {Object} FIELD_TYPES - Tipos de campos disponíveis no sistema de formulários
 * @property {Object} STATUS_PIPELINE - Pipeline de status para fluxo de RNCs
 * @property {Object} SYSTEM - Configurações de sistema (tamanhos, tipos permitidos, limites)
 * @property {Object} CACHE - TTLs padronizados para cache em segundos (SHORT, MEDIUM, LONG, VERY_LONG)
 * @property {Object} LIMITS - Limites de execução, batch size, timeouts e locks
 * @property {Object} PRINT - Constantes para configuração de impressão
 * @property {Object} ERROR_MESSAGES - Mensagens de erro padronizadas do sistema
 *
 * @example
 * // Acessar ID da planilha
 * const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
 *
 * @example
 * // Usar TTL de cache apropriado
 * cache.put('key', data, CONFIG.CACHE.MEDIUM);
 *
 * @since Deploy 1
 */
const CONFIG = {
  // ID da Planilha Principal
  SPREADSHEET_ID: '14X1ix2CZ2Exg9qORXF8THluwVoG-NFlfdAlUl2J-Syc',

  // ID da Pasta do Drive para Anexos
  DRIVE_FOLDER_ID: '1Bo5yU-rJtyz-1KVUTIQHlZRv7mFLZ_p6a9TClx0r2w060',

  // Versão do Sistema
  VERSION: 'Sistema RNC v2.4 - Deploy 123 (Documentação Completa)',
  BUILD_DATE: '2026-01-02',

  // Modo de Operação
  DEBUG_MODE: true, // Controle de logs de debug
  ENVIRONMENT: 'development', // development | production

  // Nomes das Planilhas
  SHEETS: {
    RNC: 'RNC',
    LISTAS: 'Listas',
    CONFIG_CAMPOS: 'ConfigCampos',
    CONFIG_SECOES: 'ConfigSecoes',
    PERMISSOES: 'Permissoes',
    PERMISSOES_SECOES: 'PermissoesSecoes',
    ANEXOS: 'Anexos',
    LOGS: 'Logs',
    CONFIG_SISTEMA: 'ConfigSistema',
    HISTORICO: 'Historico' // ✅ Deploy 34: Histórico de alterações
  },

  // Tipos de Campos Disponíveis
  FIELD_TYPES: [
    { value: 'input', label: 'Texto' },
    { value: 'textarea', label: 'Texto Longo' },
    { value: 'select', label: 'Lista Suspensa' },
    { value: 'date', label: 'Data' },
    { value: 'number', label: 'Número' },
    { value: 'label', label: 'Apenas Leitura' },
    { value: 'file', label: 'Upload de Arquivo' }
  ],

  // Pipeline de Status
  STATUS_PIPELINE: {
    ABERTURA: 'Abertura RNC',
    ANALISE_QUALIDADE: 'Análise Qualidade',
    ANALISE_ACAO: 'Análise do problema e Ação Corretiva',
    FINALIZADA: 'Finalizada'
  },

  // Configurações de Sistema
  SYSTEM: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
    MAX_LOG_ENTRIES: 1000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // 1 segundo
  },

  // ✅ DEPLOY 116 - FASE 5: Estratégia Unificada de Cache TTLs
  CACHE: {
    SHORT: 60,       // 1 minuto - Rate limits e operações rápidas
    MEDIUM: 300,     // 5 minutos - Configs, listas, dados moderados
    LONG: 900,       // 15 minutos - Dashboard, relatórios pesados
    VERY_LONG: 3600  // 1 hora - Estruturas, dados raramente alterados
  },

  // ✅ CORRIGIDO: Timeouts e Limites (Problema #5 - Deploy 31)
  // ✅ OTIMIZADO: Lock por operação (Deploy 32)
  LIMITS: {
    BATCH_SIZE: 100,
    MAX_ROWS_PER_OPERATION: 500,
    EXECUTION_TIMEOUT: 270000, // 4.5 minutos
    LOCK_TIMEOUT: 30000, // ✅ Deploy 31: 30 segundos (compatibilidade)
    LOCK_TIMEOUT_WRITE: 10000, // ✅ Deploy 32: 10s para escritas (INSERT/UPDATE/DELETE)
    LOCK_TIMEOUT_READ: 0 // ✅ Deploy 32: Sem lock para leituras (SELECT)
  },

  // ✅ NOVO: Constantes para magic numbers (Problema #13)
  PRINT: {
    RANGE_START: 'A1',
    RANGE_END: 'H26',
    COLUMN_INDEX_PRINT_RANGE: 10 // Coluna K na planilha ConfigCampos
  },

  // Mensagens de Erro Padrão
  ERROR_MESSAGES: {
    SPREADSHEET_NOT_FOUND: 'Planilha não encontrada. Verifique o ID configurado.',
    SHEET_NOT_FOUND: 'Aba não encontrada na planilha.',
    PERMISSION_DENIED: 'Sem permissão para executar esta operação.',
    FILE_TOO_LARGE: 'Arquivo muito grande. Máximo: 10MB.',
    INVALID_FILE_TYPE: 'Tipo de arquivo não permitido.',
    RNC_NOT_FOUND: 'RNC não encontrada.',
    REQUIRED_FIELD: 'Campo obrigatório não preenchido.',
    SYSTEM_ERROR: 'Erro no sistema. Tente novamente.',
    LOCK_FAILED: 'Sistema ocupado. Aguarde e tente novamente.',
    INVALID_DATA: 'Dados inválidos fornecidos.',
    INVALID_EMAIL: 'Email inválido.', // ✅ NOVO (Problema #7)
    INVALID_DATE: 'Data inválida.' // ✅ NOVO (Problema #6)
  }
};

/**
 * Mapeamento entre nomes de campos do formulário e colunas da planilha.
 * Utilizado para normalizar diferentes variações de nomes de campos e garantir
 * consistência na leitura/escrita de dados entre frontend e backend.
 *
 * @constant {Object}
 * @property {string} [key] - Nome alternativo ou variação do campo
 * @property {string} [value] - Nome canônico do campo na planilha
 *
 * @example
 * // Normalizar nome de campo
 * const fieldName = FIELD_MAPPING['Status'] || 'Status'; // 'Status Geral'
 *
 * @example
 * // Usar com getFormFieldFromColumn()
 * const formField = getFormFieldFromColumn('Data'); // 'Data de Abertura'
 *
 * @since Deploy 1
 */
// ✅ CORRIGIDO: FIELD_MAPPING limpo e consistente (Problema #3)
const FIELD_MAPPING = {
  // Campos do Sistema
  'Nº RNC': 'Nº RNC',
  'Status Geral': 'Status Geral',
  'Status': 'Status Geral',
  'Data Criação': 'Data Criação',
  'Usuário Criação': 'Usuário Criação',
  'Última Edição': 'Última Edição',
  'Editado Por': 'Editado Por',

  // Campos de Abertura
  'Data': 'Data de Abertura',
  'Data de Abertura': 'Data de Abertura',
  'Responsável pela abertura da RNC': 'Responsável pela abertura da RNC',
  'Setor onde foi feita abertura': 'Setor onde foi feita abertura',
  'Nome do Cliente': 'Nome do Cliente',
  'Código do Cliente': 'Código do Cliente',
  'Telefone do Cliente': 'Telefone do Cliente',

  // ✅ CORRIGIDO: Filial de Origem (apenas UMA entrada)
  'Filial de Origem': 'Filial de Origem',

  // ✅ CORRIGIDO: Tipo da RNC (padronizado)
  'Tipo da RNC': 'Tipo da RNC',
  'Tipo RNC': 'Tipo da RNC',

  'Requisição': 'Requisição',
  'Número do pedido': 'Número do pedido',
  'Prescritor': 'Prescritor',
  'Forma Farmacêutica': 'Forma Farmacêutica',
  'Descrição Detalhada da RNC/Reclamação': 'Descrição Detalhada da RNC/Reclamação',
  'Descrição do Problema': 'Descrição do Problema',
  'Prioridade': 'Prioridade',
  'Observações': 'Observações',

  // Qualidade
  'Setor onde ocorreu a não conformidade': 'Setor onde ocorreu a não conformidade',
  'Data da Análise': 'Data da Análise',
  'Risco': 'Risco',
  'Tipo de Falha': 'Tipo de Falha',
  'Análise da Causa Raiz (relatório)': 'Análise da Causa Raiz (relatório)',
  'Ação Corretiva Imediata': 'Ação Corretiva Imediata',
  'Gerou custo de cortesia?': 'Gerou custo de cortesia?',
  'Req de Cortesia': 'Req de Cortesia',
  'Valor': 'Valor',

  // Liderança
  'Plano de ação': 'Plano de ação',
  'Status da Ação Corretiva': 'Status da Ação Corretiva',
  'Data limite para execução': 'Data limite para execução',
  'Data da conclusão da Ação': 'Data da conclusão da Ação',
  'Responsável pela ação corretiva': 'Responsável pela ação corretiva'
};

// ===== FUNÇÕES AUXILIARES DE CONFIGURAÇÃO =====

/**
 * Obtém o nome canônico de um campo a partir de variações de nomes de coluna.
 * Realiza busca direta, busca por valor mapeado e fallback case-insensitive
 * para garantir compatibilidade com diferentes formatos de entrada.
 *
 * @param {string} columnName - Nome da coluna a ser normalizado
 * @return {string} Nome canônico do campo do formulário ou nome limpo da coluna
 *
 * @example
 * getFormFieldFromColumn('Status'); // 'Status Geral'
 * getFormFieldFromColumn('Data'); // 'Data de Abertura'
 * getFormFieldFromColumn('Campo Inexistente'); // 'Campo Inexistente' (limpo)
 *
 * @since Deploy 1
 */
// ✅ MELHORADO: Obtém mapeamento de campo com validação (Problema #12)
function getFormFieldFromColumn(columnName) {
  if (!columnName || typeof columnName !== 'string') {
    Logger.logWarning('getFormFieldFromColumn_INVALID_INPUT', { columnName: columnName });
    return '';
  }

  try {
    // Limpar o nome da coluna
    const cleanColumnName = columnName.replace(/\s+/g, ' ').replace(/\n/g, '').trim();

    // Busca direta no mapeamento
    if (FIELD_MAPPING.hasOwnProperty(cleanColumnName)) {
      return cleanColumnName;
    }

    // Buscar no FIELD_MAPPING por valor
    for (const formField in FIELD_MAPPING) {
      const mappedColumn = FIELD_MAPPING[formField].replace(/\s+/g, ' ').replace(/\n/g, '').trim();

      if (mappedColumn === cleanColumnName) {
        return formField;
      }
    }

    // Busca case-insensitive como fallback
    const lowerColumn = cleanColumnName.toLowerCase();
    for (const formField in FIELD_MAPPING) {
      const mappedColumn = FIELD_MAPPING[formField].replace(/\s+/g, ' ').replace(/\n/g, '').trim();
      if (mappedColumn.toLowerCase() === lowerColumn) {
        Logger.logWarning('getFormFieldFromColumn_CASE_INSENSITIVE_MATCH', {
          formField: formField,
          mappedTo: mappedColumn
        });
        return formField;
      }
    }

    // Nenhum mapeamento encontrado
    Logger.logWarning('getFormFieldFromColumn_NOT_FOUND', {
      columnName: columnName,
      returning: cleanColumnName
    });
    return cleanColumnName;

  } catch (error) {
    Logger.logError('getFormFieldFromColumn', error, { columnName: columnName });
    return columnName;
  }
}

// ============================================
// ✅ MELHORADO: Funções de Data Padronizadas (Problema #6)
// ============================================

/**
 * Converte qualquer formato de data para o padrão brasileiro DD/MM/YYYY.
 * Aceita objetos Date, strings ISO (YYYY-MM-DD), timestamps numéricos e strings DD/MM/YYYY.
 * Inclui validação contra formula injection e ranges de data razoáveis.
 *
 * @param {Date|string|number} dateValue - Valor da data a ser formatado
 * @return {string} Data formatada DD/MM/YYYY ou string vazia se inválida
 *
 * @example
 * formatDateBR(new Date(2025, 0, 15)); // '15/01/2025'
 * formatDateBR('2025-01-15'); // '15/01/2025'
 * formatDateBR('15/01/2025'); // '15/01/2025'
 * formatDateBR(1705276800000); // '15/01/2025'
 *
 * @since Deploy 1
 */
// ============================================
// ✅ MELHORADO: Funções de Data Padronizadas (Problema #6)
// ============================================
function formatDateBR(dateValue) {
  if (!dateValue) return '';

  try {
    let date;

    // Se é objeto Date
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Se é string
    else if (typeof dateValue === 'string') {
      // SEGURANÇA: Validar contra formula injection
      if (/^[=+\-@]/.test(dateValue.trim())) {
        Logger.logWarning('formatDateBR_FORMULA_INJECTION_ATTEMPT', { dateValue: dateValue });
        return '';
      }

      // Verificar se é formato DD/MM/YYYY
      if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateValue; // Já está no formato correto
      }

      // Formato ISO (2025-10-16T03:00:00.000Z) ou YYYY-MM-DD
      if (dateValue.includes('-')) {
        const cleanDate = dateValue.replace('Z', '').split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }

      // Tentar parse direto como último recurso
      if (!date) {
        date = new Date(dateValue);
      }
    }
    // Se é timestamp numérico
    else if (typeof dateValue === 'number') {
      // SEGURANÇA: Validar range razoável (anos 1970-2100)
      if (dateValue < 0 || dateValue > 4102444800000) {
        Logger.logWarning('formatDateBR_INVALID_TIMESTAMP', { dateValue: dateValue });
        return '';
      }
      date = new Date(dateValue);
    }
    else {
      return '';
    }

    // Validar data
    if (!date || isNaN(date.getTime())) {
      Logger.logWarning('formatDateBR_INVALID_DATE', { dateValue: dateValue });
      return '';
    }

    // Formatar DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;

  } catch (error) {
    Logger.logError('formatDateBR', error, { dateValue: dateValue });
    return '';
  }
}

/**
 * Converte data do formato brasileiro DD/MM/YYYY para formato ISO YYYY-MM-DD.
 * Utilizado principalmente para preencher inputs HTML do tipo date que requerem formato ISO.
 *
 * @param {string} dateBR - Data no formato DD/MM/YYYY
 * @return {string} Data no formato YYYY-MM-DD ou string vazia se inválida
 *
 * @example
 * formatDateISO('15/01/2025'); // '2025-01-15'
 * formatDateISO('2025-01-15'); // '2025-01-15' (já em formato ISO)
 *
 * @since Deploy 1
 */
function formatDateISO(dateBR) {
  if (!dateBR) return '';

  try {
    // Se já está em formato ISO
    if (dateBR.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateBR.split('T')[0];
    }

    // Converter DD/MM/YYYY -> YYYY-MM-DD
    const parts = dateBR.split('/');
    if (parts.length !== 3) return '';

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    return `${year}-${month}-${day}`;

  } catch (error) {
    Logger.logError('formatDateISO', error, { dateBR: dateBR });
    return '';
  }
}

/**
 * Obtém data e hora atual formatada para padrão brasileiro.
 * Utiliza o timezone da sessão do Google Apps Script para garantir horário local correto.
 *
 * @return {string} Data e hora no formato DD/MM/YYYY HH:MM:SS
 *
 * @example
 * getCurrentDateTimeBR(); // '02/01/2026 14:30:45'
 *
 * @since Deploy 1
 */
function getCurrentDateTimeBR() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Valida se um valor pode ser convertido para uma data válida.
 * Utiliza formatDateBR() internamente para testar a conversão.
 *
 * @param {*} dateValue - Valor a ser validado como data
 * @return {boolean} true se é uma data válida, false caso contrário
 *
 * @example
 * isValidDate('15/01/2025'); // true
 * isValidDate('32/01/2025'); // false
 * isValidDate(new Date()); // true
 * isValidDate('texto inválido'); // false
 *
 * @since Deploy 1
 */
// ✅ NOVO: Valida se uma data é válida (Problema #6)
function isValidDate(dateValue) {
  if (!dateValue) return false;

  const formatted = formatDateBR(dateValue);
  return formatted !== '';
}

// ============================================
// ✅ NOVO: Validações de Entrada (Problema #12)
// ============================================

// ✅ DEPLOY 115 - FASE 4: Função isValidEmail() removida (duplicada)
// Use a versão unificada mais abaixo (linha ~870) que suporta ambos os modos de retorno

/**
 * Sanitiza string removendo caracteres perigosos e potencialmente maliciosos.
 * Remove tags HTML (<>), limita tamanho e normaliza espaços para prevenir
 * injeção de código e corrupção de dados.
 *
 * @param {string} str - String a ser sanitizada
 * @return {string} String sanitizada e segura ou string vazia se inválida
 *
 * @example
 * sanitizeString('<script>alert("xss")</script>'); // ''
 * sanitizeString('Texto normal'); // 'Texto normal'
 * sanitizeString('   espaços extras   '); // 'espaços extras'
 *
 * @since Deploy 121
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 5000); // Limita tamanho
}

/**
 * Valida se um valor é um número válido e finito.
 * Rejeita null, undefined, strings vazias, NaN e Infinity.
 *
 * @param {*} value - Valor a ser validado como número
 * @return {boolean} true se é um número válido e finito, false caso contrário
 *
 * @example
 * isValidNumber(42); // true
 * isValidNumber('42'); // true
 * isValidNumber('abc'); // false
 * isValidNumber(null); // false
 * isValidNumber(Infinity); // false
 *
 * @since Deploy 121
 */
function isValidNumber(value) {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// ============================================
// Validação de Configuração do Sistema
// ============================================

/**
 * Valida as configurações essenciais do sistema (IDs de planilha e pasta Drive).
 * Tenta acessar os recursos para confirmar permissões e disponibilidade.
 * Retorna objeto detalhado com status de validação e mensagens de erro/aviso.
 *
 * @return {Object} Resultado da validação com propriedades:
 *   - valid {boolean} - true se todas as validações críticas passaram
 *   - errors {Array<string>} - Lista de erros críticos encontrados
 *   - warnings {Array<string>} - Lista de avisos não-críticos
 *   - spreadsheetName {string} - Nome da planilha se acessível
 *   - folderName {string} - Nome da pasta Drive se acessível
 *
 * @example
 * const validation = validateSystemConfig();
 * if (!validation.valid) {
 *   console.error('Erros:', validation.errors);
 * }
 *
 * @since Deploy 121
 */
function validateSystemConfig() {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    // Verificar ID da planilha
    if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID.length < 20) {
      validation.valid = false;
      validation.errors.push('ID da planilha inválido ou não configurado');
    }

    // Verificar ID da pasta do Drive
    if (!CONFIG.DRIVE_FOLDER_ID || CONFIG.DRIVE_FOLDER_ID.length < 20) {
      validation.warnings.push('ID da pasta do Drive não configurado - uploads podem falhar');
    }

    // Tentar acessar a planilha
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      validation.spreadsheetName = ss.getName();
    } catch (e) {
      validation.valid = false;
      validation.errors.push(`Não foi possível acessar a planilha: ${e.toString()}`);
    }

    // Tentar acessar a pasta do Drive
    if (CONFIG.DRIVE_FOLDER_ID) {
      try {
        const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        validation.folderName = folder.getName();
      } catch (e) {
        validation.warnings.push(`Não foi possível acessar a pasta do Drive: ${e.toString()}`);
      }
    }

  } catch (error) {
    validation.valid = false;
    validation.errors.push(`Erro ao validar configurações: ${error.toString()}`);
  }

  return validation;
}

/**
 * Obtém configuração dinâmica do sistema armazenada na planilha ConfigSistema.
 * Utiliza cache para otimizar performance em leituras repetidas.
 * Inicializa configurações padrão se a planilha estiver vazia.
 *
 * @param {string} key - Chave da configuração a ser obtida
 * @param {*} defaultValue - Valor padrão retornado se a chave não existir
 * @return {*} Valor da configuração ou defaultValue se não encontrado
 *
 * @example
 * const pastaId = getSystemConfig('PastaGID', CONFIG.DRIVE_FOLDER_ID);
 * const debugMode = getSystemConfig('DebugMode', 'Não');
 *
 * @since Deploy 1
 */
function getSystemConfig(key, defaultValue) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = `config_${key}`;
    const cached = cache.get(cacheKey);

    if (cached !== null) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return cached;
      }
    }

    const configSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_SISTEMA, ['Chave', 'Valor', 'Descrição']);

    // Inicializar configurações padrão se necessário
    if (configSheet.getLastRow() <= 1) {
      const defaultConfigs = [
        ['PastaGID', CONFIG.DRIVE_FOLDER_ID, 'ID da pasta do Google Drive para anexos'],
        ['StatusPipeline', Object.values(CONFIG.STATUS_PIPELINE).join(','), 'Pipeline de status das RNCs'],
        ['RenomearArquivos', 'Sim', 'Renomear arquivos anexados'],
        ['MaxFileSize', CONFIG.SYSTEM.MAX_FILE_SIZE, 'Tamanho máximo de arquivo em bytes'],
        ['Version', CONFIG.VERSION, 'Versão do sistema'],
        ['DebugMode', CONFIG.DEBUG_MODE ? 'Sim' : 'Não', 'Modo de debug ativado'],
        ['Environment', CONFIG.ENVIRONMENT, 'Ambiente de execução']
      ];

      defaultConfigs.forEach(function(config) {
        configSheet.appendRow(config);
      });
    }

    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        let value = data[i][1];
        // Remover apóstrofo inicial se existir (adicionado para forçar texto)
        if (value && typeof value === 'string' && value.charAt(0) === "'") {
          value = value.substring(1);
        }
        // ✅ DEPLOY 117 - HOTFIX: Usar CONFIG.CACHE.MEDIUM (FASE 5 removeu SYSTEM.CACHE_DURATION)
        cache.put(cacheKey, JSON.stringify(value), CONFIG.CACHE.MEDIUM);
        return value;
      }
    }

    return defaultValue;
  } catch (error) {
    Logger.logError('getSystemConfig', error, { key: key });
    return defaultValue;
  }
}

/**
 * Define ou atualiza configuração dinâmica do sistema na planilha ConfigSistema.
 * Utiliza apóstrofo (') para forçar armazenamento como texto e prevenir conversão automática.
 * Limpa cache automaticamente após atualização.
 *
 * @param {string} key - Chave da configuração a ser definida
 * @param {*} value - Valor a ser armazenado (será convertido para string)
 * @param {string} [description] - Descrição opcional da configuração
 * @return {Object} Resultado com propriedades:
 *   - success {boolean} - true se operação bem-sucedida
 *   - error {string} - Mensagem de erro se success=false
 *
 * @example
 * setSystemConfig('DebugMode', 'Sim', 'Ativar logs de debug');
 * setSystemConfig('MaxFileSize', 10485760, 'Tamanho máximo de arquivo em bytes');
 *
 * @since Deploy 1
 */
function setSystemConfig(key, value, description) {
  try {
    const configSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_SISTEMA, ['Chave', 'Valor', 'Descrição']);
    const data = configSheet.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        // SOLUÇÃO COM APÓSTROFO: Método nativo do Sheets para forçar texto
        const valueRange = configSheet.getRange(i + 1, 2);
        valueRange.clearContent();
        SpreadsheetApp.flush();
        // Adicionar apóstrofo ' para forçar texto (invisível no Sheets)
        valueRange.setValue("'" + String(value));
        SpreadsheetApp.flush();
        if (description) {
          configSheet.getRange(i + 1, 3).setValue(description);
        }
        found = true;
        break;
      }
    }

    if (!found) {
      // Nova linha com apóstrofo para forçar texto
      configSheet.appendRow([key, "'" + String(value), description || '']);
      SpreadsheetApp.flush();
    }

    // Limpar cache
    const cache = CacheService.getScriptCache();
    cache.remove(`config_${key}`);

    Logger.logInfo('setSystemConfig', { key: key, value: value });
    return { success: true };

  } catch (error) {
    Logger.logError('setSystemConfig', error, { key: key, value: value });
    return { success: false, error: error.toString() };
  }
}

/**
 * Retorna a URL do web app implantado do Google Apps Script.
 * Utilizado para gerar links e callbacks para o frontend.
 *
 * @return {string} URL do script implantado ou string vazia se erro
 *
 * @example
 * const url = getScriptUrl();
 * console.log('App URL:', url);
 *
 * @since Deploy 1
 */
function getScriptUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (error) {
    return '';
  }
}

/**
 * ============================================
 * SANITIZAÇÃO E SEGURANÇA - Deploy 32
 * ============================================
 */

/**
 * Sanitiza input do usuário para prevenir injeções e corrupção de dados.
 * Remove scripts maliciosos, tags HTML, fórmulas Excel/Sheets perigosas e caracteres de controle.
 * Limita tamanho da string para prevenir overflow e DoS.
 *
 * @param {*} value - Valor a ser sanitizado (será convertido para string)
 * @param {number} [maxLength=5000] - Tamanho máximo permitido em caracteres
 * @return {string} Valor sanitizado e seguro para armazenamento
 *
 * @example
 * sanitizeUserInput('<script>alert("xss")</script>'); // ''
 * sanitizeUserInput('=SUM(A1:A10)'); // "'=SUM(A1:A10)" (fórmula neutralizada)
 * sanitizeUserInput('Texto normal', 100); // 'Texto normal'
 *
 * @since Deploy 32
 */
function sanitizeUserInput(value, maxLength) {
  maxLength = maxLength || 5000;

  // Se valor vazio ou null, retornar string vazia
  if (value === null || value === undefined) {
    return '';
  }

  // Converter para string
  var str = String(value).trim();

  // Se string vazia, retornar
  if (str === '') {
    return '';
  }

  // Remover tags <script>
  str = str.replace(/<script[^>]*>.*?<\/script>/gi, '');

  // Remover todas as tags HTML
  str = str.replace(/<[^>]+>/g, '');

  // Remover caracteres que podem iniciar fórmulas do Excel/Sheets
  // =, +, -, @ no início da string são perigosos
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str; // Adiciona apóstrofo para forçar texto
  }

  // Remover caracteres de controle (exceto quebras de linha e tabs)
  str = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Limitar tamanho
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  return str;
}

/**
 * Sanitiza objeto completo de dados do formulário aplicando limites inteligentes.
 * Aplica limites de tamanho específicos baseados no tipo de campo (email, telefone, descrição, etc).
 * Sanitiza cada campo individualmente usando sanitizeUserInput().
 *
 * @param {Object} formData - Objeto com dados do formulário (chave: valor)
 * @param {Object} [fieldLimits] - Limites personalizados por campo (chave: maxLength)
 * @return {Object} Objeto com todos os dados sanitizados
 *
 * @example
 * const dados = {
 *   'Email': 'user@example.com',
 *   'Descrição': '<script>xss</script>Texto longo...'
 * };
 * const limpo = sanitizeFormData(dados);
 * // { 'Email': 'user@example.com', 'Descrição': 'Texto longo...' }
 *
 * @since Deploy 32
 */
function sanitizeFormData(formData, fieldLimits) {
  fieldLimits = fieldLimits || {};
  var sanitized = {};

  // Limites padrão por tipo de campo
  var defaultLimits = {
    'email': 100,
    'telefone': 20,
    'cpf': 14,
    'cnpj': 18,
    'cep': 10,
    'número': 50,
    'código': 50,
    'nome': 200,
    'descrição': 5000,
    'observação': 5000,
    'observações': 5000,
    'comentário': 5000,
    'comentários': 5000,
    'plano': 5000,
    'ação': 5000
  };

  for (var field in formData) {
    var value = formData[field];
    var limit = fieldLimits[field];

    // Se não tem limite específico, tentar inferir pelo nome do campo
    if (!limit) {
      var fieldLower = field.toLowerCase();
      for (var key in defaultLimits) {
        if (fieldLower.includes(key)) {
          limit = defaultLimits[key];
          break;
        }
      }
    }

    // Limite padrão se não encontrou nenhum
    if (!limit) {
      limit = 5000;
    }

    // Sanitizar valor
    sanitized[field] = sanitizeUserInput(value, limit);
  }

  return sanitized;
}

/**
 * Valida se um valor é seguro para armazenamento no banco de dados.
 * Detecta scripts maliciosos, fórmulas suspeitas e padrões de SQL injection.
 * Retorna resultado detalhado com motivo da rejeição se aplicável.
 *
 * @param {*} value - Valor a ser validado (será convertido para string)
 * @return {Object} Resultado com propriedades:
 *   - safe {boolean} - true se valor é seguro
 *   - reason {string} - Motivo da rejeição se safe=false, vazio se safe=true
 *
 * @example
 * validateSafeInput('Texto normal'); // { safe: true, reason: '' }
 * validateSafeInput('<script>alert()</script>'); // { safe: false, reason: 'Contém tags de script...' }
 * validateSafeInput("' OR 1=1 --"); // { safe: false, reason: 'Contém padrões de SQL injection' }
 *
 * @since Deploy 32
 */
function validateSafeInput(value) {
  var result = { safe: true, reason: '' };

  if (value === null || value === undefined || value === '') {
    return result;
  }

  var str = String(value);

  // Verificar tags script
  if (/<script[^>]*>/i.test(str)) {
    result.safe = false;
    result.reason = 'Contém tags de script não permitidas';
    return result;
  }

  // Verificar múltiplas fórmulas suspeitas
  var formulaCount = (str.match(/^[=+\-@]/gm) || []).length;
  if (formulaCount > 1) {
    result.safe = false;
    result.reason = 'Contém múltiplas fórmulas suspeitas';
    return result;
  }

  // Verificar SQL injection básico
  var sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(OR\s+1\s*=\s*1)/gi,
    /(';|'--|\*\/|\/\*)/g
  ];

  for (var i = 0; i < sqlPatterns.length; i++) {
    if (sqlPatterns[i].test(str)) {
      result.safe = false;
      result.reason = 'Contém padrões de SQL injection';
      return result;
    }
  }

  return result;
}

/**
 * ============================================
 * DEPLOY 33: Mensagens de Erro Amigáveis
 * ============================================
 */

/**
 * Converte erro técnico em mensagem amigável e compreensível para o usuário final.
 * Detecta padrões comuns de erro (lock, permissão, validação, rede, arquivo, etc)
 * e retorna mensagem apropriada com orientações de ação.
 *
 * @param {Error|string} error - Erro técnico a ser convertido
 * @param {string} [context] - Contexto da operação (save, update, delete, load)
 * @return {string} Mensagem amigável e orientadora para o usuário
 *
 * @example
 * getUserFriendlyError(new Error('Lock timeout'));
 * // 'O sistema está ocupado no momento. Por favor, aguarde alguns segundos...'
 *
 * @example
 * getUserFriendlyError('Permission denied', 'save');
 * // 'Você não tem permissão para realizar esta operação...'
 *
 * @since Deploy 33
 */
function getUserFriendlyError(error, context) {
  var errorStr = (error && error.toString) ? error.toString().toLowerCase() : String(error).toLowerCase();

  // Erros de Lock/Concorrência
  if (errorStr.includes('lock') || errorStr.includes('ocupado') || errorStr.includes('busy')) {
    return 'O sistema está ocupado no momento. Por favor, aguarde alguns segundos e tente novamente.';
  }

  // Erros de Permissão
  if (errorStr.includes('permission') || errorStr.includes('permissão') || errorStr.includes('denied') || errorStr.includes('não autorizado')) {
    return 'Você não tem permissão para realizar esta operação. Entre em contato com o administrador.';
  }

  // Erros de Validação
  if (errorStr.includes('validação') || errorStr.includes('validation') || errorStr.includes('obrigatório') || errorStr.includes('required')) {
    if (errorStr.includes('campos obrigatórios')) {
      return 'Alguns campos obrigatórios não foram preenchidos. Por favor, verifique o formulário.';
    }
    return 'Os dados fornecidos não são válidos. Por favor, verifique e tente novamente.';
  }

  // Erros de Status
  if (errorStr.includes('status') && errorStr.includes('transição')) {
    return 'Não é possível mudar para este status. Preencha os campos obrigatórios da etapa atual primeiro.';
  }

  // Erros de RNC não encontrada
  if (errorStr.includes('não foi encontrada') || errorStr.includes('not found') || errorStr.includes('não existe')) {
    return 'A RNC solicitada não foi encontrada. Ela pode ter sido excluída ou o número está incorreto.';
  }

  // Erros de Rede/Timeout
  if (errorStr.includes('timeout') || errorStr.includes('time out') || errorStr.includes('timed out')) {
    return 'A operação demorou muito tempo. Por favor, tente novamente. Se o problema persistir, contate o suporte.';
  }

  if (errorStr.includes('network') || errorStr.includes('rede') || errorStr.includes('connection')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Erros de Arquivo/Upload
  if (errorStr.includes('arquivo') || errorStr.includes('file') || errorStr.includes('upload')) {
    if (errorStr.includes('size') || errorStr.includes('tamanho') || errorStr.includes('large')) {
      return 'O arquivo é muito grande. O tamanho máximo permitido é 10MB.';
    }
    if (errorStr.includes('type') || errorStr.includes('tipo')) {
      return 'Tipo de arquivo não suportado. Por favor, use PDF, imagens ou documentos.';
    }
    return 'Erro ao processar o arquivo. Verifique o arquivo e tente novamente.';
  }

  // Erros de Quota/Limite
  if (errorStr.includes('quota') || errorStr.includes('limit') || errorStr.includes('limite')) {
    return 'Limite de armazenamento ou uso atingido. Entre em contato com o administrador do sistema.';
  }

  // Erros de Banco de Dados
  if (errorStr.includes('database') || errorStr.includes('planilha') || errorStr.includes('spreadsheet')) {
    return 'Erro ao acessar os dados. Por favor, tente novamente. Se o problema persistir, contate o suporte.';
  }

  // Erros de Dados Inválidos
  if (errorStr.includes('invalid') || errorStr.includes('inválido')) {
    if (errorStr.includes('email')) {
      return 'O email fornecido não é válido. Por favor, verifique e tente novamente.';
    }
    if (errorStr.includes('date') || errorStr.includes('data')) {
      return 'A data fornecida não é válida. Use o formato DD/MM/YYYY.';
    }
    if (errorStr.includes('number') || errorStr.includes('número')) {
      return 'O número fornecido não é válido. Por favor, use apenas números.';
    }
    return 'Dados inválidos. Por favor, verifique as informações fornecidas.';
  }

  // Erros de Duplicação
  if (errorStr.includes('duplicate') || errorStr.includes('duplicado') || errorStr.includes('já existe')) {
    return 'Este registro já existe no sistema. Por favor, verifique os dados.';
  }

  // Erro genérico com contexto
  if (context) {
    switch(context) {
      case 'save':
      case 'salvar':
        return 'Erro ao salvar os dados. Por favor, tente novamente.';
      case 'update':
      case 'atualizar':
        return 'Erro ao atualizar os dados. Por favor, tente novamente.';
      case 'delete':
      case 'excluir':
        return 'Erro ao excluir o registro. Por favor, tente novamente.';
      case 'load':
      case 'carregar':
        return 'Erro ao carregar os dados. Por favor, recarregue a página.';
      default:
        return 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.';
    }
  }

  // Mensagem genérica
  return 'Ocorreu um erro inesperado. Por favor, tente novamente. Se o problema persistir, contate o suporte.';
}

/**
 * Formata erro para exibição ao usuário incluindo código de rastreamento.
 * Gera mensagem amigável, preserva erro técnico original e cria código único
 * para facilitar troubleshooting e suporte.
 *
 * @param {Error|string} error - Erro original a ser formatado
 * @param {string} [context] - Contexto da operação que gerou o erro
 * @return {Object} Objeto com propriedades:
 *   - message {string} - Mensagem amigável para o usuário
 *   - technicalError {string} - Erro técnico original
 *   - errorCode {string} - Código único de rastreamento (formato: ERR-XXXXX)
 *   - timestamp {string} - ISO timestamp de quando o erro ocorreu
 *
 * @example
 * const formatted = formatErrorForUser(new Error('Database timeout'), 'save');
 * // {
 * //   message: 'A operação demorou muito tempo...',
 * //   technicalError: 'Error: Database timeout',
 * //   errorCode: 'ERR-K3N9X',
 * //   timestamp: '2026-01-02T14:30:45.123Z'
 * // }
 *
 * @since Deploy 33
 */
function formatErrorForUser(error, context) {
  var friendlyMessage = getUserFriendlyError(error, context);
  var technicalError = error.toString();

  // Gerar código de erro para referência
  var errorCode = 'ERR-' + Date.now().toString(36).toUpperCase();

  return {
    message: friendlyMessage,
    technicalError: technicalError,
    errorCode: errorCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * ========================================
 * FIELD-LEVEL VALIDATION FUNCTIONS
 * Deploy 33 - Melhoria #11
 * ========================================
 */

/**
 * Valida formato de endereço de email usando regex rigoroso.
 * Suporta dois modos de retorno: objeto detalhado (padrão) ou boolean simples.
 * Valida comprimento máximo (100 caracteres) e caracteres permitidos.
 *
 * @param {string} email - Endereço de email a ser validado
 * @param {boolean} [simpleReturn=false] - Se true retorna boolean, se false retorna objeto
 * @return {boolean|Object} Boolean (se simpleReturn=true) ou objeto com propriedades:
 *   - valid {boolean} - true se email válido
 *   - error {string|null} - Mensagem de erro descritiva ou null se válido
 *
 * @example
 * isValidEmail('user@example.com'); // { valid: true, error: null }
 * isValidEmail('invalid'); // { valid: false, error: 'Email inválido...' }
 * isValidEmail('user@example.com', true); // true
 * isValidEmail('invalid', true); // false
 *
 * @since Deploy 115
 */
// ✅ DEPLOY 115 - FASE 4: Validates email format (versão unificada)
function isValidEmail(email, simpleReturn) {
  // Validação: email vazio
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return simpleReturn ? false : { valid: false, error: 'Email não pode estar vazio' };
  }

  // Regex mais rigoroso: permite apenas letras, números, . _ - no local e domínio
  var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validação: formato inválido
  if (!emailRegex.test(email.trim())) {
    return simpleReturn ? false : { valid: false, error: 'Email inválido. Use o formato: exemplo@dominio.com' };
  }

  // Validação: comprimento máximo
  if (email.length > 100) {
    return simpleReturn ? false : { valid: false, error: 'Email muito longo (máximo 100 caracteres)' };
  }

  // Email válido
  return simpleReturn ? true : { valid: true, error: null };
}

/**
 * Valida formato de telefone brasileiro (fixo ou celular).
 * Aceita telefones com 10 dígitos (fixo) ou 11 dígitos (celular).
 * Valida DDD (código de área) entre 11-99.
 *
 * @param {string} phone - Telefone a ser validado (aceita formatação)
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se telefone válido
 *   - error {string|null} - Mensagem de erro descritiva ou null se válido
 *
 * @example
 * isValidPhone('(11) 98765-4321'); // { valid: true, error: null }
 * isValidPhone('11987654321'); // { valid: true, error: null }
 * isValidPhone('123456'); // { valid: false, error: 'Telefone inválido...' }
 *
 * @since Deploy 33
 */
function isValidPhone(phone) {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Telefone não pode estar vazio' };
  }

  // Remove formatting characters
  var digits = phone.replace(/\D/g, '');

  // Brazilian phones: 10 digits (landline) or 11 digits (mobile)
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, error: 'Telefone inválido. Use o formato: (XX) XXXXX-XXXX' };
  }

  // Check if DDD (area code) is valid (11-99)
  var ddd = parseInt(digits.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { valid: false, error: 'DDD inválido. Use um código de área válido (11-99)' };
  }

  return { valid: true, error: null };
}

/**
 * Valida CPF brasileiro usando algoritmo de dígitos verificadores.
 * Verifica comprimento, rejeita sequências repetidas (111.111.111-11) e
 * valida ambos os dígitos verificadores conforme algoritmo oficial.
 *
 * @param {string} cpf - CPF a ser validado (aceita formatação)
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se CPF válido
 *   - error {string|null} - Mensagem de erro descritiva ou null se válido
 *
 * @example
 * isValidCPF('123.456.789-09'); // { valid: true, error: null }
 * isValidCPF('12345678909'); // { valid: true, error: null }
 * isValidCPF('111.111.111-11'); // { valid: false, error: 'CPF inválido' }
 *
 * @since Deploy 33
 */
function isValidCPF(cpf) {
  if (!cpf || cpf.trim() === '') {
    return { valid: false, error: 'CPF não pode estar vazio' };
  }

  // Remove formatting
  var digits = cpf.replace(/\D/g, '');

  // CPF must have 11 digits
  if (digits.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos' };
  }

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, error: 'CPF inválido' };
  }

  // Validate checksum digits
  var sum = 0;
  var remainder;

  // First digit
  for (var i = 1; i <= 9; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(9, 10))) {
    return { valid: false, error: 'CPF inválido' };
  }

  // Second digit
  sum = 0;
  for (var i = 1; i <= 10; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(10, 11))) {
    return { valid: false, error: 'CPF inválido' };
  }

  return { valid: true, error: null };
}

/**
 * Valida CNPJ brasileiro usando algoritmo de dígitos verificadores.
 * Verifica comprimento (14 dígitos), rejeita sequências repetidas e
 * valida ambos os dígitos verificadores conforme algoritmo oficial.
 *
 * @param {string} cnpj - CNPJ a ser validado (aceita formatação)
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se CNPJ válido
 *   - error {string|null} - Mensagem de erro descritiva ou null se válido
 *
 * @example
 * isValidCNPJ('11.222.333/0001-81'); // { valid: true, error: null }
 * isValidCNPJ('11222333000181'); // { valid: true, error: null }
 * isValidCNPJ('11.111.111/1111-11'); // { valid: false, error: 'CNPJ inválido' }
 *
 * @since Deploy 33
 */
function isValidCNPJ(cnpj) {
  if (!cnpj || cnpj.trim() === '') {
    return { valid: false, error: 'CNPJ não pode estar vazio' };
  }

  // Remove formatting
  var digits = cnpj.replace(/\D/g, '');

  // CNPJ must have 14 digits
  if (digits.length !== 14) {
    return { valid: false, error: 'CNPJ deve ter 14 dígitos' };
  }

  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1{13}$/.test(digits)) {
    return { valid: false, error: 'CNPJ inválido' };
  }

  // Validate first checksum digit
  var size = digits.length - 2;
  var numbers = digits.substring(0, size);
  var digits_check = digits.substring(size);
  var sum = 0;
  var pos = size - 7;

  for (var i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  var result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits_check.charAt(0))) {
    return { valid: false, error: 'CNPJ inválido' };
  }

  // Validate second checksum digit
  size = size + 1;
  numbers = digits.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (var i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits_check.charAt(1))) {
    return { valid: false, error: 'CNPJ inválido' };
  }

  return { valid: true, error: null };
}

/**
 * Valida formato e range de data com opções configuráveis.
 * Suporta formatos DD/MM/YYYY e YYYY-MM-DD com validação de valores numéricos.
 * Permite restrições de datas futuras, passadas e ranges customizados.
 *
 * @param {string} dateStr - String de data a ser validada
 * @param {string} [format='DD/MM/YYYY'] - Formato esperado ('DD/MM/YYYY' ou 'YYYY-MM-DD')
 * @param {Object} [options] - Opções de validação:
 *   - minDate {Date|string} - Data mínima permitida
 *   - maxDate {Date|string} - Data máxima permitida
 *   - allowFuture {boolean} - Permite datas futuras (padrão: true)
 *   - allowPast {boolean} - Permite datas passadas (padrão: true)
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se data válida
 *   - error {string|null} - Mensagem de erro descritiva ou null se válida
 *
 * @example
 * isValidDate('15/01/2025'); // { valid: true, error: null }
 * isValidDate('2025-01-15', 'YYYY-MM-DD'); // { valid: true, error: null }
 * isValidDate('15/01/2030', 'DD/MM/YYYY', { allowFuture: false });
 * // { valid: false, error: 'Data não pode ser no futuro' }
 *
 * @since Deploy 33
 */
function isValidDate(dateStr, format, options) {
  options = options || {};
  format = format || 'DD/MM/YYYY';

  if (!dateStr || dateStr.trim() === '') {
    return { valid: false, error: 'Data não pode estar vazia' };
  }

  var date;

  // Parse date based on format
  if (format === 'DD/MM/YYYY') {
    var parts = dateStr.split('/');
    if (parts.length !== 3) {
      return { valid: false, error: 'Data inválida. Use o formato DD/MM/AAAA' };
    }

    var day = parseInt(parts[0]);
    var month = parseInt(parts[1]);
    var year = parseInt(parts[2]);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, error: 'Data contém valores não numéricos' };
    }

    date = new Date(year, month - 1, day);
  } else if (format === 'YYYY-MM-DD') {
    date = new Date(dateStr);
  } else {
    return { valid: false, error: 'Formato de data não suportado: ' + format };
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Data inválida' };
  }

  // Check date ranges
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  if (options.allowFuture === false && date > today) {
    return { valid: false, error: 'Data não pode ser no futuro' };
  }

  if (options.allowPast === false && date < today) {
    return { valid: false, error: 'Data não pode ser no passado' };
  }

  if (options.minDate) {
    var minDate = new Date(options.minDate);
    if (date < minDate) {
      return { valid: false, error: 'Data anterior ao mínimo permitido' };
    }
  }

  if (options.maxDate) {
    var maxDate = new Date(options.maxDate);
    if (date > maxDate) {
      return { valid: false, error: 'Data posterior ao máximo permitido' };
    }
  }

  return { valid: true, error: null };
}

/**
 * Valida valor numérico com opções de range e tipo.
 * Verifica se valor é número válido, finito e atende restrições de
 * tipo inteiro, positividade e ranges mínimo/máximo.
 *
 * @param {*} value - Valor a ser validado como número
 * @param {Object} [options] - Opções de validação:
 *   - min {number} - Valor mínimo permitido
 *   - max {number} - Valor máximo permitido
 *   - integer {boolean} - Requer número inteiro
 *   - positive {boolean} - Requer número positivo (> 0)
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se número válido
 *   - error {string|null} - Mensagem de erro descritiva ou null se válido
 *
 * @example
 * isValidNumber(42); // { valid: true, error: null }
 * isValidNumber(3.14, { integer: true }); // { valid: false, error: 'Valor deve ser inteiro' }
 * isValidNumber(-5, { positive: true }); // { valid: false, error: 'Valor deve ser positivo' }
 * isValidNumber(150, { min: 0, max: 100 }); // { valid: false, error: 'Valor máximo...' }
 *
 * @since Deploy 33
 */
function isValidNumber(value, options) {
  options = options || {};

  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Valor numérico não pode estar vazio' };
  }

  var num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: 'Valor não é um número válido' };
  }

  if (options.integer === true && !Number.isInteger(num)) {
    return { valid: false, error: 'Valor deve ser um número inteiro' };
  }

  if (options.positive === true && num <= 0) {
    return { valid: false, error: 'Valor deve ser positivo' };
  }

  if (options.min !== undefined && num < options.min) {
    return { valid: false, error: 'Valor mínimo permitido: ' + options.min };
  }

  if (options.max !== undefined && num > options.max) {
    return { valid: false, error: 'Valor máximo permitido: ' + options.max };
  }

  return { valid: true, error: null };
}

/**
 * Valida CEP (Código de Endereçamento Postal) brasileiro.
 * Verifica comprimento (8 dígitos) e rejeita sequências repetidas.
 * Aceita CEP com ou sem formatação (XXXXX-XXX ou XXXXXXXX).
 *
 * @param {string} cep - CEP a ser validado (aceita formatação)
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se CEP válido
 *   - error {string|null} - Mensagem de erro descritiva ou null se válido
 *
 * @example
 * isValidCEP('01310-100'); // { valid: true, error: null }
 * isValidCEP('01310100'); // { valid: true, error: null }
 * isValidCEP('00000-000'); // { valid: false, error: 'CEP inválido' }
 * isValidCEP('123'); // { valid: false, error: 'CEP deve ter 8 dígitos...' }
 *
 * @since Deploy 33
 */
function isValidCEP(cep) {
  if (!cep || cep.trim() === '') {
    return { valid: false, error: 'CEP não pode estar vazio' };
  }

  // Remove formatting
  var digits = cep.replace(/\D/g, '');

  // CEP must have 8 digits
  if (digits.length !== 8) {
    return { valid: false, error: 'CEP deve ter 8 dígitos. Use o formato: XXXXX-XXX' };
  }

  // Check if all digits are the same (invalid CEP)
  if (/^(\d)\1{7}$/.test(digits)) {
    return { valid: false, error: 'CEP inválido' };
  }

  return { valid: true, error: null };
}

/**
 * Valida campo individual baseado em seu tipo e opções configuráveis.
 * Suporta validação de campos obrigatórios e tipos: email, phone, cpf, cnpj, date, number, cep.
 * Retorna resultado detalhado incluindo nome do campo para facilitar feedback ao usuário.
 *
 * @param {string} fieldName - Nome do campo sendo validado (para mensagens de erro)
 * @param {*} value - Valor a ser validado
 * @param {string} fieldType - Tipo de validação: 'email', 'phone', 'cpf', 'cnpj', 'date', 'number', 'cep'
 * @param {Object} [options] - Opções de validação:
 *   - required {boolean} - Campo obrigatório
 *   - format {string} - Formato esperado (para datas)
 *   - min, max, integer, positive {*} - Opções específicas de cada validador
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se campo válido
 *   - error {string|null} - Mensagem de erro ou null se válido
 *   - fieldName {string} - Nome do campo (echo do parâmetro)
 *
 * @example
 * validateField('Email', 'user@example.com', 'email', { required: true });
 * // { valid: true, error: null, fieldName: 'Email' }
 *
 * @example
 * validateField('Idade', 'abc', 'number', { min: 18, max: 100 });
 * // { valid: false, error: 'Campo "Idade": Valor não é um número válido', ... }
 *
 * @since Deploy 33
 */
function validateField(fieldName, value, fieldType, options) {
  options = options || {};

  var result = { valid: true, error: null, fieldName: fieldName };

  // Skip validation if field is empty and not required
  if ((value === null || value === undefined || value === '') && !options.required) {
    return result;
  }

  // Check required fields
  if (options.required && (value === null || value === undefined || value === '')) {
    result.valid = false;
    result.error = 'Campo "' + fieldName + '" é obrigatório';
    return result;
  }

  // Skip further validation if empty (and not required)
  if (value === null || value === undefined || value === '') {
    return result;
  }

  // Validate based on type
  var validation;

  switch (fieldType) {
    case 'email':
      validation = isValidEmail(value);
      break;
    case 'phone':
    case 'telefone':
      validation = isValidPhone(value);
      break;
    case 'cpf':
      validation = isValidCPF(value);
      break;
    case 'cnpj':
      validation = isValidCNPJ(value);
      break;
    case 'cep':
      validation = isValidCEP(value);
      break;
    case 'date':
    case 'data':
      validation = isValidDate(value, options.format, options);
      break;
    case 'number':
    case 'numero':
      validation = isValidNumber(value, options);
      break;
    default:
      // Unknown type, skip validation
      return result;
  }

  if (!validation.valid) {
    result.valid = false;
    result.error = 'Campo "' + fieldName + '": ' + validation.error;
  }

  return result;
}

/**
 * Valida múltiplos campos de uma vez usando configurações por campo.
 * Executa validateField() para cada campo e agrega os resultados.
 * Retorna arrays de erros globais e mapa de erros por campo.
 *
 * @param {Object} data - Objeto com dados do formulário (campo: valor)
 * @param {Object} fieldValidations - Mapa de configurações de validação por campo
 *   Formato: { 'NomeDoCampo': { type: 'email', options: { required: true } } }
 * @return {Object} Objeto com propriedades:
 *   - valid {boolean} - true se todos os campos válidos
 *   - errors {Array<string>} - Array com todas as mensagens de erro
 *   - fieldErrors {Object} - Mapa campo->erro para feedback específico
 *
 * @example
 * const dados = { 'Email': 'invalid', 'Telefone': '123' };
 * const config = {
 *   'Email': { type: 'email', options: { required: true } },
 *   'Telefone': { type: 'phone' }
 * };
 * const resultado = validateFields(dados, config);
 * // {
 * //   valid: false,
 * //   errors: ['Campo "Email": Email inválido...', 'Campo "Telefone": Telefone inválido...'],
 * //   fieldErrors: { 'Email': '...', 'Telefone': '...' }
 * // }
 *
 * @since Deploy 33
 */
function validateFields(data, fieldValidations) {
  var result = {
    valid: true,
    errors: [],
    fieldErrors: {}
  };

  for (var fieldName in fieldValidations) {
    var config = fieldValidations[fieldName];
    var value = data[fieldName];

    var validation = validateField(
      fieldName,
      value,
      config.type,
      config.options || {}
    );

    if (!validation.valid) {
      result.valid = false;
      result.errors.push(validation.error);
      result.fieldErrors[fieldName] = validation.error;
    }
  }

  return result;
}
