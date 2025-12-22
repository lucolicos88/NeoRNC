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

// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
  // ID da Planilha Principal
  SPREADSHEET_ID: '14X1ix2CZ2Exg9qORXF8THluwVoG-NFlfdAlUl2J-Syc',

  // ID da Pasta do Drive para Anexos
  DRIVE_FOLDER_ID: '1Bo5yU-rJtyz-1KVUTIQHlZRv7mFLZ_p6a9TClx0r2w060',

  // Versão do Sistema
  VERSION: 'Sistema RNC v2.2 - Deploy 77 (Sistema de Backup Completo)',
  BUILD_DATE: '2025-12-22',

  // Modo de Operação
  DEBUG_MODE: false, // Controle de logs de debug
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
    CACHE_DURATION: 300, // 5 minutos
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // 1 segundo
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
 * ✅ MELHORADO: Obtém mapeamento de campo com validação (Problema #12)
 * @param {string} columnName - Nome da coluna
 * @return {string} Nome do campo do formulário
 */
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
 * Converte qualquer formato de data para DD/MM/YYYY
 * @param {Date|String|Number} dateValue - Valor da data
 * @return {String} Data formatada DD/MM/YYYY ou string vazia
 */
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
 * Converte DD/MM/YYYY para YYYY-MM-DD (para inputs HTML)
 * @param {String} dateBR - Data no formato DD/MM/YYYY
 * @return {String} Data no formato YYYY-MM-DD
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
 * Obtém data/hora atual formatada para PT-BR
 * @return {String} Data e hora no formato DD/MM/YYYY HH:MM:SS
 */
function getCurrentDateTimeBR() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
}

/**
 * ✅ NOVO: Valida se uma data é válida (Problema #6)
 * @param {*} dateValue - Valor a validar
 * @return {boolean} True se é data válida
 */
function isValidDate(dateValue) {
  if (!dateValue) return false;

  const formatted = formatDateBR(dateValue);
  return formatted !== '';
}

// ============================================
// ✅ NOVO: Validações de Entrada (Problema #12)
// ============================================

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @return {boolean} True se válido
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param {string} str - String a sanitizar
 * @return {string} String sanitizada
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 5000); // Limita tamanho
}

/**
 * Valida número
 * @param {*} value - Valor a validar
 * @return {boolean} True se é número válido
 */
function isValidNumber(value) {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// ============================================
// Validação de Configuração do Sistema
// ============================================

/**
 * Valida as configurações do sistema
 * @return {Object} Resultado da validação
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
 * Obtém configuração do sistema da planilha
 * @param {string} key - Chave da configuração
 * @param {*} defaultValue - Valor padrão se não encontrar
 * @return {*} Valor da configuração
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
        const value = data[i][1];
        cache.put(cacheKey, JSON.stringify(value), CONFIG.SYSTEM.CACHE_DURATION);
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
 * Define configuração do sistema
 * @param {string} key - Chave da configuração
 * @param {*} value - Valor a definir
 * @param {string} description - Descrição opcional
 * @return {Object} Resultado da operação
 */
function setSystemConfig(key, value, description) {
  try {
    const configSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_SISTEMA, ['Chave', 'Valor', 'Descrição']);
    const data = configSheet.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        configSheet.getRange(i + 1, 2).setValue(value);
        if (description) {
          configSheet.getRange(i + 1, 3).setValue(description);
        }
        found = true;
        break;
      }
    }

    if (!found) {
      configSheet.appendRow([key, value, description || '']);
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
 * ============================================
 * SANITIZAÇÃO E SEGURANÇA - Deploy 32
 * ============================================
 */

/**
 * Sanitiza input do usuário para prevenir injeções e corrupção de dados
 * Remove scripts, HTML tags, fórmulas Excel e limita tamanho
 * @param {*} value - Valor a ser sanitizado
 * @param {number} maxLength - Tamanho máximo permitido (padrão: 5000)
 * @return {string} Valor sanitizado
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
 * Sanitiza objeto completo de dados do formulário
 * @param {Object} formData - Dados do formulário
 * @param {Object} fieldLimits - Limites específicos por campo (opcional)
 * @return {Object} Dados sanitizados
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
 * Valida se um valor é seguro para armazenamento
 * @param {*} value - Valor a validar
 * @return {Object} { safe: boolean, reason: string }
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
 * Converte erro técnico em mensagem amigável para o usuário
 * @param {Error|string} error - Erro a converter
 * @param {string} context - Contexto da operação (opcional)
 * @return {string} Mensagem amigável
 */
function getUserFriendlyError(error, context) {
  var errorStr = (error && error.toString) ? error.toString().toLowerCase() : String(error).toLowerCase();
  var friendlyMessage = '';

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
 * Formata erro para exibição ao usuário
 * Inclui código de erro técnico para suporte
 * @param {Error|string} error - Erro original
 * @param {string} context - Contexto da operação
 * @return {Object} { message: string, technicalError: string }
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
 * Validates email format
 * @param {string} email - Email to validate
 * @return {Object} - { valid: boolean, error: string }
 */
function isValidEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email não pode estar vazio' };
  }

  var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido. Use o formato: exemplo@dominio.com' };
  }

  if (email.length > 100) {
    return { valid: false, error: 'Email muito longo (máximo 100 caracteres)' };
  }

  return { valid: true, error: null };
}

/**
 * Validates Brazilian phone format
 * @param {string} phone - Phone to validate
 * @return {Object} - { valid: boolean, error: string }
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
 * Validates Brazilian CPF
 * @param {string} cpf - CPF to validate
 * @return {Object} - { valid: boolean, error: string }
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
 * Validates Brazilian CNPJ
 * @param {string} cnpj - CNPJ to validate
 * @return {Object} - { valid: boolean, error: string }
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
 * Validates date format and range
 * @param {string} dateStr - Date string to validate
 * @param {string} format - Expected format ('DD/MM/YYYY' or 'YYYY-MM-DD')
 * @param {Object} options - { minDate, maxDate, allowFuture, allowPast }
 * @return {Object} - { valid: boolean, error: string }
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
 * Validates numeric value and range
 * @param {*} value - Value to validate
 * @param {Object} options - { min, max, integer, positive }
 * @return {Object} - { valid: boolean, error: string }
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
 * Validates Brazilian CEP (postal code)
 * @param {string} cep - CEP to validate
 * @return {Object} - { valid: boolean, error: string }
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
 * Validates field based on its type
 * @param {string} fieldName - Name of the field
 * @param {*} value - Value to validate
 * @param {string} fieldType - Type of validation (email, phone, cpf, cnpj, date, number, cep)
 * @param {Object} options - Additional validation options
 * @return {Object} - { valid: boolean, error: string, fieldName: string }
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
 * Validates multiple fields at once
 * @param {Object} data - Object with field names and values
 * @param {Object} fieldValidations - Object mapping field names to validation configs
 *   Example: { 'Email': { type: 'email', required: true }, 'Telefone': { type: 'phone' } }
 * @return {Object} - { valid: boolean, errors: Array, fieldErrors: Object }
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
