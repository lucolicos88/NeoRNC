/**
 * ============================================
 * CONFIG.GS - Configurações e Constantes
 * Sistema RNC Neoformula - Deploy 31
 * ============================================
 *
 * CHANGELOG Deploy 31:
 * - ✅ Aumentado LOCK_TIMEOUT de 10s para 30s (Problema #5)
 * - ✅ Corrigido FIELD_MAPPING inconsistente (Problema #3)
 * - ✅ Migrado var para const (Problema #16)
 * - ✅ Adicionado modo DEBUG para controle de logs (Problema #8)
 * - ✅ Melhorada validação de dados (Problema #12)
 */

// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
  // ID da Planilha Principal
  SPREADSHEET_ID: '14X1ix2CZ2Exg9qORXF8THluwVoG-NFlfdAlUl2J-Syc',

  // ID da Pasta do Drive para Anexos
  DRIVE_FOLDER_ID: '1Bo5yU-rJtyz-1KVUTIQHlZRv7mFLZ_p6a9TClx0r2w060',

  // Versão do Sistema
  VERSION: 'Deploy 31 - Correções Críticas',
  BUILD_DATE: '2025-12-01',

  // Modo de Operação
  DEBUG_MODE: false, // ✅ NOVO: Controle de logs de debug
  ENVIRONMENT: 'development', // ✅ NOVO: development | production

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
    CONFIG_SISTEMA: 'ConfigSistema'
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
