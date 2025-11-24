/**
 * ============================================
 * CONFIG.GS - Configurações e Constantes
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 */

// ===== CONFIGURAÇÕES GLOBAIS =====
var CONFIG = {
  // ID da Planilha Principal (ALTERE PARA O SEU ID)
  SPREADSHEET_ID: '14X1ix2CZ2Exg9qORXF8THluwVoG-NFlfdAlUl2J-Syc',
  
  // ID da Pasta do Drive para Anexos (ALTERE PARA O SEU ID)
  DRIVE_FOLDER_ID: '1Bo5yU-rJtyz-1KVUTIQHlZRv7mFLZ_p6a9TClx0r2w060',
  
  // Versão do Sistema
  VERSION: 'Deploy 30 Modular',
  BUILD_DATE: '2024-12-28',
  
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
  
  // Timeouts e Limites
  LIMITS: {
    BATCH_SIZE: 100,
    MAX_ROWS_PER_OPERATION: 500,
    EXECUTION_TIMEOUT: 270000, // 4.5 minutos
    LOCK_TIMEOUT: 10000 // 10 segundos
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
    INVALID_DATA: 'Dados inválidos fornecidos.'
  }
};

// ===== MAPEAMENTO DE CAMPOS =====
var FIELD_MAPPING = {
  // Campos do Sistema
  'Nº RNC': 'Nº RNC',
  'Status Geral': 'Status Geral',
  'Status': 'Status Geral',
  'Data Criação': 'Data Criação',
  'Usuário Criação': 'Usuário Criação',
  'Última Edição': 'Última Edição',
  'Editado Por': 'Editado Por',
  
  // === MAPEAMENTO DIRETO 1:1 (SEM TRANSFORMAÇÃO) ===
  'Data': 'Data de Abertura',
  'Responsável pela abertura da RNC': 'Responsável pela abertura da RNC',
  'Setor onde foi feita abertura': 'Setor onde foi feita abertura',
  'Nome do Cliente': 'Nome do Cliente',
  'Código do Cliente': 'Código do Cliente',
  'Telefone do Cliente': 'Telefone do Cliente',
  
  // === ESTES SÃO OS CAMPOS PROBLEMÁTICOS - MAPEAMENTO EXATO ===
  'Filial de Origem': 'Filial de Origem',  // SEM transformação
  'FilialOrigem': 'Filial de Origem',
  'Filial de origem': 'Filial de Origem',  // minúscula
  'Tipo da RNC': 'Tipo da RNC',                // Aqui SIM tem transformação
  
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
 * Obtém o mapeamento de campo do formulário para coluna da planilha
 * @param {string} columnName - Nome da coluna
 * @return {string} Nome do campo do formulário
 */
/**
 * Obtém o mapeamento de campo do formulário para coluna da planilha
 * VERSÃO CORRIGIDA - DEPLOY 31
 */
function getFormFieldFromColumn(columnName) {
  try {
    // Limpar o nome da coluna (remover espaços extras e quebras de linha)
    var cleanColumnName = columnName.replace(/\s+/g, ' ').replace(/\n/g, '').trim();
    
    Logger.logDebug('getFormFieldFromColumn_INPUT', { 
      original: columnName, 
      cleaned: cleanColumnName 
    });
    
    // Buscar no FIELD_MAPPING
    for (var formField in FIELD_MAPPING) {
      var mappedColumn = FIELD_MAPPING[formField].replace(/\s+/g, ' ').replace(/\n/g, '').trim();
      
      if (mappedColumn === cleanColumnName || FIELD_MAPPING[formField] === columnName) {
        Logger.logDebug('getFormFieldFromColumn_FOUND', { 
          formField: formField, 
          mappedTo: mappedColumn 
        });
        return formField;
      }
    }
    
    // Se não encontrou, tentar busca case-insensitive
    var lowerColumn = cleanColumnName.toLowerCase();
    for (var formField in FIELD_MAPPING) {
      var mappedColumn = FIELD_MAPPING[formField].replace(/\s+/g, ' ').replace(/\n/g, '').trim();
      if (mappedColumn.toLowerCase() === lowerColumn) {
        Logger.logWarning('getFormFieldFromColumn_FOUND_CASE_INSENSITIVE', { 
          formField: formField, 
          mappedTo: mappedColumn 
        });
        return formField;
      }
    }
    
    // Fallback: retornar o nome limpo
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
// FUNÇÕES UTILITÁRIAS DE DATA - DEPLOY 37
// Formatação padronizada PT-BR
// ============================================

/**
 * Converte qualquer formato de data para DD/MM/YYYY
 * @param {Date|String|Number} dateValue - Valor da data
 * @return {String} Data formatada DD/MM/YYYY ou string vazia
 */
function formatDateBR(dateValue) {
  if (!dateValue) return '';
  
  try {
    var date;
    
    // Se é objeto Date
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Se é string ISO (2025-10-16T03:00:00.000Z) ou YYYY-MM-DD
    else if (typeof dateValue === 'string') {
      // Remove timezone e converte
      var cleanDate = dateValue.replace('Z', '').split('T')[0];
      var parts = cleanDate.split('-');
      if (parts.length === 3) {
        date = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
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
    if (isNaN(date.getTime())) {
      Logger.logWarning('formatDateBR_INVALID_DATE', { dateValue: dateValue });
      return '';
    }
    
    // Formatar DD/MM/YYYY
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    
    return day + '/' + month + '/' + year;
    
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
      return dateBR.split('T')[0]; // Remove parte de hora se tiver
    }
    
    // Converter DD/MM/YYYY -> YYYY-MM-DD
    var parts = dateBR.split('/');
    if (parts.length !== 3) return '';
    
    var day = parts[0].padStart(2, '0');
    var month = parts[1].padStart(2, '0');
    var year = parts[2];
    
    return year + '-' + month + '-' + day;
    
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
  var now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
}






/**
 * Valida as configurações do sistema
 * @return {Object} Resultado da validação
 */
function validateSystemConfig() {
  var validation = {
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
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      validation.spreadsheetName = ss.getName();
    } catch (e) {
      validation.valid = false;
      validation.errors.push('Não foi possível acessar a planilha: ' + e.toString());
    }
    
    // Tentar acessar a pasta do Drive
    if (CONFIG.DRIVE_FOLDER_ID) {
      try {
        var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        validation.folderName = folder.getName();
      } catch (e) {
        validation.warnings.push('Não foi possível acessar a pasta do Drive: ' + e.toString());
      }
    }
    
  } catch (error) {
    validation.valid = false;
    validation.errors.push('Erro ao validar configurações: ' + error.toString());
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
    var cache = CacheService.getScriptCache();
    var cacheKey = 'config_' + key;
    var cached = cache.get(cacheKey);
    
    if (cached !== null) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return cached;
      }
    }
    
    var configSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_SISTEMA, ['Chave', 'Valor', 'Descrição']);
    
    // Inicializar configurações padrão se necessário
    if (configSheet.getLastRow() <= 1) {
      var defaultConfigs = [
        ['PastaGID', CONFIG.DRIVE_FOLDER_ID, 'ID da pasta do Google Drive para anexos'],
        ['StatusPipeline', Object.values(CONFIG.STATUS_PIPELINE).join(','), 'Pipeline de status das RNCs'],
        ['RenomearArquivos', 'Sim', 'Renomear arquivos anexados'],
        ['MaxFileSize', CONFIG.SYSTEM.MAX_FILE_SIZE, 'Tamanho máximo de arquivo em bytes'],
        ['Version', CONFIG.VERSION, 'Versão do sistema']
      ];
      
      defaultConfigs.forEach(function(config) {
        configSheet.appendRow(config);
      });
    }
    
    var data = configSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        var value = data[i][1];
        // Cache por 5 minutos
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
    var configSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_SISTEMA, ['Chave', 'Valor', 'Descrição']);
    var data = configSheet.getDataRange().getValues();
    var found = false;
    
    for (var i = 1; i < data.length; i++) {
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
    var cache = CacheService.getScriptCache();
    cache.remove('config_' + key);
    
    Logger.logInfo('setSystemConfig', { key: key, value: value });
    return { success: true };
    
  } catch (error) {
    Logger.logError('setSystemConfig', error, { key: key, value: value });
    return { success: false, error: error.toString() };
  }
}