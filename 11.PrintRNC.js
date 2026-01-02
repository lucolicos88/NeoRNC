/**
 * 11.PrintRNC.js - Sistema de Impressão de RNC em PDF
 *
 * Módulo responsável por gerar PDFs de RNCs preenchendo templates dinâmicos.
 * Gerencia a aba "Print", configurações de impressão, menu RNC e funções de manutenção.
 *
 * Funcionalidades principais:
 * - Preenchimento dinâmico de templates de impressão
 * - Geração de URLs de PDF com configurações personalizadas
 * - Menu RNC com opções de impressão e manutenção
 * - Funções de diagnóstico e debug do sistema
 *
 * @module PrintRNC
 * @since Deploy 37
 */

/**
 * Converte objeto JavaScript para query string para URL
 *
 * Transforma um objeto em parâmetros de URL no formato &key=value.
 * Usado principalmente para construir URLs de exportação de PDF do Google Sheets.
 *
 * @param {Object} obj - Objeto com pares chave-valor
 * @return {string} Query string formatada (ex: "&size=7&portrait=true")
 *
 * @example
 * var params = { size: 7, portrait: true };
 * var query = objectToQueryString(params);
 * // Retorna: "&size=7&portrait=true"
 *
 * @since Deploy 37
 */
function objectToQueryString(obj) {
  return Object.keys(obj).map(function(key) {
    return Utilities.formatString('&%s=%s', key, obj[key]);
  }).join('');
}

/**
 * Configurações de impressão PDF para exportação do Google Sheets
 *
 * Define todos os parâmetros de formatação e layout para geração de PDF.
 * Essas configurações são convertidas em query string e anexadas à URL de exportação.
 *
 * Propriedades principais:
 * - size: 7 (A4)
 * - portrait: true (orientação retrato)
 * - fitw: true (ajustar à largura)
 * - scale: 2 (2 = ajustar à largura, 1 = tamanho real, 0 = ajustar à página)
 * - margens: 0.25 polegadas em todos os lados
 * - gridlines: false (não exibir linhas de grade)
 *
 * @constant {Object}
 * @property {number} size - Tamanho do papel (7 = A4)
 * @property {boolean} fzr - Congelar linhas (false = não congelar)
 * @property {boolean} portrait - Orientação retrato (true) ou paisagem (false)
 * @property {boolean} fitw - Ajustar à largura da página
 * @property {boolean} gridlines - Exibir linhas de grade
 * @property {boolean} printtitle - Imprimir título
 * @property {boolean} sheetnames - Imprimir nome das abas
 * @property {string} pagenum - Numeração de páginas
 * @property {boolean} attachment - Tratar como anexo para download
 * @property {number} top_margin - Margem superior em polegadas
 * @property {number} bottom_margin - Margem inferior em polegadas
 * @property {number} left_margin - Margem esquerda em polegadas
 * @property {number} right_margin - Margem direita em polegadas
 * @property {string} horizontal_alignment - Alinhamento horizontal (CENTER, LEFT, RIGHT)
 * @property {string} vertical_alignment - Alinhamento vertical (TOP, MIDDLE, BOTTOM)
 * @property {number} scale - Escala de impressão (0=ajustar página, 1=real, 2=ajustar largura)
 *
 * @since Deploy 37
 */
var PRINT_OPTIONS = {
  'size': 7,
  'fzr': false,
  'portrait': true,
  'fitw': true,                 // ajustar à largura
  'gridlines': false,
  'printtitle': false,
  'sheetnames': false,
  'pagenum': 'UNDEFINED',
  'attachment': false,
  'top_margin': 0.25,
  'bottom_margin': 0.25,
  'left_margin': 0.25,
  'right_margin': 0.25,
  'horizontal_alignment': 'CENTER',
  'vertical_alignment': 'TOP',
  'scale': 2                    // ✅ 2 = Ajustar à largura (padrão)
                                //    1 = Tamanho real
                                //    0 = Ajustar à página
};

/**
 * Gera URL de exportação PDF da aba Print com todas as configurações
 *
 * Constrói a URL completa para exportar a aba Print como PDF, incluindo:
 * - Configurações de impressão (PRINT_OPTIONS)
 * - Range específico configurado (CONFIG.PRINT.RANGE_START:RANGE_END)
 * - ID da aba (gid)
 *
 * A URL gerada pode ser usada para preview ou download direto do PDF.
 *
 * @param {string} rncNumber - Número da RNC (ex: "0001/2025")
 * @return {string} URL completa para exportação do PDF
 *
 * @throws {Error} Se a aba "Print" não for encontrada
 *
 * @example
 * var pdfUrl = getPrintPdfUrl('0001/2025');
 * // Retorna: https://docs.google.com/.../export?format=pdf&size=7&portrait=true...
 *
 * @since Deploy 37
 */
function getPrintPdfUrl(rncNumber) {
  try {
    Logger.logInfo('GET_PRINT_PDF_URL_START', { rncNumber: rncNumber });
    
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var printSheet = ss.getSheetByName('Print');
    
    if (!printSheet) {
      throw new Error('Aba "Print" não encontrada');
    }
    
    var gid = printSheet.getSheetId();
    
    // ✅ OPÇÃO 1: RANGE AUTOMÁTICO (toda área com dados)
    // var lastRow = printSheet.getLastRow();
    // var lastCol = printSheet.getLastColumn();
    
    // ✅ OPÇÃO 2: RANGE FIXO (ex: A1:H50)
    var rangeNotation = CONFIG.PRINT.RANGE_START + ':' + CONFIG.PRINT.RANGE_END; // AJUSTE CONFORME NECESSÁRIO
    var range = printSheet.getRange(rangeNotation);
    
    var printRange = objectToQueryString({
      'c1': range.getColumn() - 1,
      'r1': range.getRow() - 1,
      'c2': range.getColumn() + range.getWidth() - 1,
      'r2': range.getRow() + range.getHeight() - 1
    });
    
    var baseUrl = ss.getUrl().replace(/edit.*$/, '');
    var pdfUrl = baseUrl + 'export?format=pdf' + 
                 objectToQueryString(PRINT_OPTIONS) + 
                 printRange + 
                 '&gid=' + gid;
    
    Logger.logInfo('GET_PRINT_PDF_URL_SUCCESS', {
      rncNumber: rncNumber,
      gid: gid,
      range: rangeNotation
    });
    
    return pdfUrl;
    
  } catch (error) {
    Logger.logError('GET_PRINT_PDF_URL_ERROR', error, { rncNumber: rncNumber });
    throw error;
  }
}


/**
 * PrintManager - Módulo de Gerenciamento de Impressão
 *
 * Padrão Module Pattern que encapsula todas as funções de impressão e gerenciamento do menu RNC.
 * Expõe apenas as funções necessárias através do objeto de retorno.
 *
 * @namespace PrintManager
 * @since Deploy 37
 */

var PrintManager = (function() {

  /**
   * Preenche template de impressão com dados da RNC e retorna URL do PDF
   *
   * Processo completo:
   * 1. Busca dados da RNC pelo número
   * 2. Limpa ranges anteriores da aba Print
   * 3. Preenche campos configurados em ConfigCampos
   * 4. Formata datas (DD/MM/YYYY) e números (formato brasileiro)
   * 5. Gera URL do PDF para preview/download
   *
   * Formatações aplicadas:
   * - Datas: Convertidas para DD/MM/YYYY
   * - Números: Formato brasileiro (vírgula como decimal)
   * - Valores vazios: Preenchidos com string vazia
   *
   * @param {string} rncNumber - Número da RNC (ex: "0001/2025")
   * @return {Object} Objeto com resultado da operação
   * @return {boolean} return.success - True se operação bem-sucedida
   * @return {string} return.rncNumber - Número da RNC processada
   * @return {string} return.printUrl - URL do PDF gerado
   * @return {number} return.printSheetId - ID da aba Print
   * @return {string} return.printSheetUrl - URL da aba Print
   * @return {number} return.fieldsProcessed - Quantidade de campos preenchidos
   * @return {number} return.fieldsSkipped - Quantidade de campos ignorados
   * @return {string} return.message - Mensagem descritiva do resultado
   * @return {string} [return.error] - Mensagem de erro (se houver)
   *
   * @example
   * var result = fillPrintTemplateAndGetUrl('0001/2025');
   * if (result.success) {
   *   console.log('PDF gerado: ' + result.printUrl);
   *   console.log('Campos preenchidos: ' + result.fieldsProcessed);
   * } else {
   *   console.error('Erro: ' + result.error);
   * }
   *
   * @since Deploy 37
   */
  function fillPrintTemplateAndGetUrl(rncNumber) {
  try {
    Logger.logInfo('PRINT_START', { rncNumber: rncNumber });
    
    var rncData = RncOperations.getRncByNumber(rncNumber);
    
    if (!rncData || Object.keys(rncData).length === 0) {
      throw new Error('RNC não encontrada: ' + rncNumber);
    }
    
    Logger.logDebug('PRINT_RNC_DATA', { 
      rncNumber: rncNumber,
      hasData: !!rncData,
      keys: Object.keys(rncData).slice(0, 5)
    });
    
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var printSheet = ss.getSheetByName('Print');
    var configCamposSheet = ss.getSheetByName('ConfigCampos');
    
    if (!printSheet) {
      throw new Error('Aba "Print" não encontrada');
    }
    
    if (!configCamposSheet) {
      throw new Error('Aba "ConfigCampos" não encontrada');
    }
    
    var configData = configCamposSheet.getDataRange().getValues();
    var printRangeColumnIndex = CONFIG.PRINT.COLUMN_INDEX_PRINT_RANGE; // Coluna K
    
    var rangesToClear = [];
    
    for (var i = 1; i < configData.length; i++) {
      var printRange = configData[i][printRangeColumnIndex];
      var isActive = configData[i][7];
      
      if (isActive === 'Sim' && printRange && printRange !== '') {
        rangesToClear.push(printRange);
      }
    }
    
    Logger.logDebug('PRINT_CLEARING_RANGES', { 
      totalRanges: rangesToClear.length
    });
    
    for (var j = 0; j < rangesToClear.length; j++) {
      try {
        var rangeToClean = printSheet.getRange(rangesToClear[j]);
        rangeToClean.clearContent();
      } catch (clearError) {
        Logger.logWarning('PRINT_CLEAR_ERROR', { 
          range: rangesToClear[j], 
          error: clearError.toString() 
        });
      }
    }
    
    var fieldsProcessed = 0;
    var fieldsSkipped = 0;
    
    for (var i = 1; i < configData.length; i++) {
      var fieldName = configData[i][1];
      var fieldType = configData[i][2]; // Coluna C - Tipo
      var printRange = configData[i][printRangeColumnIndex];
      var isActive = configData[i][7];
      
      if (isActive !== 'Sim' || !printRange || printRange === '') {
        fieldsSkipped++;
        continue;
      }
      
      var fieldValue = rncData[fieldName];
      
      if (fieldValue === undefined || fieldValue === null) {
        fieldValue = '';
      }
      
      // ✅ FORMATAR DATAS - Deploy 37
      if (fieldValue instanceof Date) {
        fieldValue = formatDateBR(fieldValue);
      } 
      else if (typeof fieldValue === 'string') {
        // Tentar converter qualquer formato de data
        var converted = formatDateBR(fieldValue);
        if (converted && converted !== fieldValue) {
          fieldValue = converted;
        }
      }
      
      // ✅ FORMATAR NÚMEROS (valores monetários)
      if (fieldType === 'number' && typeof fieldValue === 'number') {
        // Formatar como moeda brasileira: 120.23 → 120,23
        fieldValue = fieldValue.toFixed(2).replace('.', ',');
      } else if (typeof fieldValue === 'string' && fieldValue.match(/^\d+\.\d{2}$/)) {
        // Se vier como string "120.23"
        fieldValue = fieldValue.replace('.', ',');
      }
      
      try {
        var range = printSheet.getRange(printRange);
        range.setValue(fieldValue);
        fieldsProcessed++;
        
        Logger.logDebug('PRINT_FIELD_FILLED', { 
          field: fieldName, 
          range: printRange, 
          value: String(fieldValue).substring(0, 50),
          type: fieldType
        });
        
      } catch (rangeError) {
        Logger.logWarning('PRINT_FIELD_ERROR', { 
          field: fieldName, 
          range: printRange, 
          error: rangeError.toString() 
        });
      }
    }
    
    SpreadsheetApp.flush();
    
    var spreadsheetUrl = ss.getUrl();
    var printSheetId = printSheet.getSheetId();
    
    // Gerar URL do PDF com preview
    var pdfUrl = getPrintPdfUrl(rncNumber);

    Logger.logInfo('PRINT_SUCCESS', {
      rncNumber: rncNumber,
      fieldsProcessed: fieldsProcessed,
      fieldsSkipped: fieldsSkipped,
      rangesCleared: rangesToClear.length
    });

    return {
      success: true,
      rncNumber: rncNumber,
      printUrl: pdfUrl,
      printSheetId: printSheetId,
      printSheetUrl: spreadsheetUrl + '#gid=' + printSheetId,
      fieldsProcessed: fieldsProcessed,
      fieldsSkipped: fieldsSkipped,
      message: 'Template preenchido! ' + fieldsProcessed + ' campos processados.'
    };
    
  } catch (error) {
    Logger.logError('PRINT_ERROR', error, { rncNumber: rncNumber });
    return {
      success: false,
      error: error.toString(),
      message: 'Erro ao preparar impressão: ' + error.message
    };
  }
}
  
  /**
   * Solicita número da RNC via prompt e abre preview de impressão
   *
   * Interface interativa que:
   * 1. Exibe prompt solicitando número da RNC
   * 2. Valida entrada do usuário
   * 3. Preenche template de impressão
   * 4. Abre preview do PDF em modal (via Abrirpdf.html)
   * 5. Sanitiza URL para prevenir XSS (Deploy 114)
   *
   * Exibe alertas de sucesso/erro conforme resultado.
   *
   * @return {void}
   *
   * @example
   * // Chamado via menu: RNC > Imprimir RNC...
   * printCurrentRncFromSheet();
   *
   * @since Deploy 37
   */
  function printCurrentRncFromSheet() {
  try {
    var ui = SpreadsheetApp.getUi();
    
    var response = ui.prompt(
      '🖨️ Imprimir RNC',
      'Digite o número da RNC (ex: 0001/2025):',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() !== ui.Button.OK) {
      return;
    }
    
    var rncNumber = response.getResponseText().trim();
    
    if (!rncNumber || rncNumber === '') {
      ui.alert('❌ Erro', 'Número da RNC inválido!', ui.ButtonSet.OK);
      return;
    }
    
    // Preencher template
    var result = fillPrintTemplateAndGetUrl(rncNumber);
    
    if (result.success) {
      // ✅ ABRIR PREVIEW DO PDF EM NOVA ABA
      var htmlTemplate = HtmlService.createTemplateFromFile('Abrirpdf');

      // ✅ DEPLOY 114 - FASE 1: Sanitizar URL para prevenir XSS Template Injection
      var sanitizedUrl = encodeURI(result.printUrl)
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '');

      htmlTemplate.url = sanitizedUrl;
      
      ui.showModalDialog(
        htmlTemplate.evaluate().setHeight(10).setWidth(100), 
        '🖨️ Abrindo Preview de Impressão...'
      );
      
      Logger.logInfo('PRINT_FROM_SHEET_SUCCESS', {
        rncNumber: rncNumber,
        fieldsProcessed: result.fieldsProcessed
      });
      
    } else {
      ui.alert('❌ Erro', result.error, ui.ButtonSet.OK);
    }
    
  } catch (error) {
    Logger.logError('PRINT_FROM_SHEET_ERROR', error);
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
  
  /**
   * Cria menu completo RNC na interface do Google Sheets
   *
   * Estrutura do menu:
   * - RNC (principal)
   *   - Imprimir RNC...
   *   - Manutenção (submenu)
   *     - Limpar Cache do Sistema
   *     - Limpar Aba de Logs
   *     - Mapear Colunas da Aba RNC
   *     - Pintar Colunas por Seção
   *     - Formatar Aba RNC
   *   - Diagnóstico (submenu)
   *     - Verificar Sistema
   *     - Mostrar Informações
   *     - Debug Setores
   *
   * @return {void}
   *
   * @example
   * // Chamado automaticamente no onOpen
   * createPrintMenu();
   *
   * @since Deploy 74.5.2
   */
  function createPrintMenu() {
    try {
      var ui = SpreadsheetApp.getUi();

      ui.createMenu('📋 RNC')
        // Impressão
        .addItem('🖨️ Imprimir RNC...', 'printCurrentRncFromSheet')
        .addSeparator()

        // Manutenção
        .addSubMenu(ui.createMenu('🔧 Manutenção')
          .addItem('🗑️ Limpar Cache do Sistema', 'menuLimparCache')
          .addItem('📋 Limpar Aba de Logs', 'menuLimparLogs')
          .addSeparator()
          .addItem('🗺️ Mapear Colunas da Aba RNC', 'menuMapearColunas')
          .addItem('🎨 Pintar Colunas por Seção', 'menuPintarColunas')
          .addItem('📐 Formatar Aba RNC', 'menuFormatarAbaRNC'))

        // Diagnóstico
        .addSubMenu(ui.createMenu('🔍 Diagnóstico')
          .addItem('✅ Verificar Sistema', 'menuVerificarSistema')
          .addItem('📊 Mostrar Informações', 'menuMostrarInfo')
          .addItem('🔍 Debug Setores', 'menuDebugSetores'))

        .addToUi();

      Logger.logInfo('RNC_MENU_CREATED');

    } catch (error) {
      Logger.logError('CREATE_MENU_ERROR', error);
    }
  }
  
  // Expõe funções públicas do módulo
  return {
    fillPrintTemplateAndGetUrl: fillPrintTemplateAndGetUrl,
    printCurrentRncFromSheet: printCurrentRncFromSheet,
    createPrintMenu: createPrintMenu
  };

})();

/**
 * Função wrapper para fillPrintTemplateAndGetUrl do PrintManager
 *
 * Permite chamada direta sem precisar acessar PrintManager.
 *
 * @param {string} rncNumber - Número da RNC (ex: "0001/2025")
 * @return {Object} Resultado da operação de impressão
 *
 * @since Deploy 37
 */
function fillPrintTemplateAndGetUrl(rncNumber) {
  return PrintManager.fillPrintTemplateAndGetUrl(rncNumber);
}

/**
 * Função wrapper para printCurrentRncFromSheet do PrintManager
 *
 * Permite chamada direta sem precisar acessar PrintManager.
 *
 * @return {void}
 *
 * @since Deploy 37
 */
function printCurrentRncFromSheet() {
  return PrintManager.printCurrentRncFromSheet();
}

/**
 * Trigger onOpen - Executado automaticamente ao abrir a planilha
 *
 * Cria o menu RNC com todas as opções de impressão e manutenção.
 * Tratamento de erros com log para garantir que falhas não afetem a abertura da planilha.
 *
 * @param {Object} e - Objeto de evento do trigger
 * @return {void}
 *
 * @since Deploy 37
 */
function onOpen(e) {
  try {
    PrintManager.createPrintMenu();
  } catch (error) {
    Logger.logError('ONOPEN_ERROR', error);
  }
}

// ===== FUNÇÕES DO MENU RNC (Deploy 74.5.2) =====

/**
 * Menu: Limpar Cache do Sistema
 *
 * Limpa todos os caches do sistema (RNC, Dashboard, Script).
 * Solicita confirmação antes de executar.
 * Exibe resultado detalhado da limpeza.
 *
 * Caches limpos:
 * - Cache de RNCs (CacheService)
 * - Cache do Dashboard (CacheService)
 * - Cache do Script (ScriptCache)
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Manutenção > Limpar Cache do Sistema
 * menuLimparCache();
 *
 * @since Deploy 74.5.2
 */
function menuLimparCache() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '🗑️ Limpar Cache',
      'Tem certeza que deseja limpar todo o cache do sistema?\n\nIsso vai forçar o recarregamento de todos os dados.',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      var result = limparTodosCaches();

      if (result.success) {
        ui.alert(
          '✅ Sucesso',
          'Cache limpo com sucesso!\n\n' +
          '• Cache de RNCs: ' + (result.details.rncCache ? '✅' : '❌') + '\n' +
          '• Cache do Dashboard: ' + (result.details.dashboardCache ? '✅' : '❌') + '\n' +
          '• Cache do Script: ' + (result.details.scriptCache ? '✅' : '❌'),
          ui.ButtonSet.OK
        );
      } else {
        ui.alert('❌ Erro', 'Erro ao limpar cache: ' + result.message, ui.ButtonSet.OK);
      }
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Limpar Aba de Logs
 *
 * Remove todos os registros de log da aba Logs (exceto cabeçalho).
 * Solicita DUPLA confirmação devido à natureza irreversível da operação.
 * Exibe quantidade de logs removidos.
 *
 * ATENÇÃO: Esta operação não pode ser desfeita!
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Manutenção > Limpar Aba de Logs
 * menuLimparLogs();
 *
 * @since Deploy 74.5.2
 */
function menuLimparLogs() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '⚠️ ATENÇÃO',
      'Você está prestes a DELETAR TODOS OS LOGS da planilha!\n\nEsta ação NÃO PODE SER DESFEITA!\n\nDeseja continuar?',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      // Segunda confirmação
      var response2 = ui.alert(
        '⚠️ Confirmação Final',
        'Tem certeza ABSOLUTA?\n\nTodos os logs serão permanentemente removidos!',
        ui.ButtonSet.YES_NO
      );

      if (response2 === ui.Button.YES) {
        var result = limparAbaLogs();

        if (result.success) {
          ui.alert(
            '✅ Sucesso',
            'Aba de Logs limpa com sucesso!\n\n' +
            result.logsRemovidos + ' registro(s) foram removidos.',
            ui.ButtonSet.OK
          );
        } else {
          ui.alert('❌ Erro', 'Erro ao limpar logs: ' + result.message, ui.ButtonSet.OK);
        }
      }
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Verificar Sistema
 *
 * Executa verificação de todos os componentes críticos do sistema.
 * Verifica disponibilidade dos módulos:
 * - CONFIG
 * - Database
 * - Logger
 * - RncOperations
 * - Reports
 *
 * Exibe status de cada componente e resultado geral.
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Diagnóstico > Verificar Sistema
 * menuVerificarSistema();
 *
 * @since Deploy 74.5.2
 */
function menuVerificarSistema() {
  try {
    var ui = SpreadsheetApp.getUi();

    // Verificar componentes
    var checks = {
      config: typeof CONFIG !== 'undefined',
      database: typeof Database !== 'undefined',
      logger: typeof Logger !== 'undefined',
      rncOps: typeof RncOperations !== 'undefined',
      reports: typeof Reports !== 'undefined'
    };

    var allOk = checks.config && checks.database && checks.logger && checks.rncOps && checks.reports;

    var message = '🔍 Verificação do Sistema:\n\n' +
      '• CONFIG: ' + (checks.config ? '✅' : '❌') + '\n' +
      '• Database: ' + (checks.database ? '✅' : '❌') + '\n' +
      '• Logger: ' + (checks.logger ? '✅' : '❌') + '\n' +
      '• RncOperations: ' + (checks.rncOps ? '✅' : '❌') + '\n' +
      '• Reports: ' + (checks.reports ? '✅' : '❌') + '\n\n' +
      (allOk ? '✅ Sistema funcionando normalmente' : '❌ Alguns componentes apresentam problemas');

    ui.alert('🔍 Diagnóstico', message, ui.ButtonSet.OK);

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Mostrar Informações do Sistema
 *
 * Exibe informações técnicas do sistema:
 * - Versão atual
 * - Data do build
 * - ID da planilha
 * - Usuário logado
 * - Timezone do script
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Diagnóstico > Mostrar Informações
 * menuMostrarInfo();
 *
 * @since Deploy 74.5.2
 */
function menuMostrarInfo() {
  try {
    var ui = SpreadsheetApp.getUi();

    var info = '📊 Informações do Sistema:\n\n' +
      '• Versão: ' + CONFIG.VERSION + '\n' +
      '• Data Build: ' + CONFIG.BUILD_DATE + '\n' +
      '• Planilha ID: ' + CONFIG.SPREADSHEET_ID.substring(0, 20) + '...\n' +
      '• Usuário: ' + Session.getActiveUser().getEmail() + '\n' +
      '• Timezone: ' + Session.getScriptTimeZone();

    ui.alert('📊 Informações do Sistema', info, ui.ButtonSet.OK);

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Debug Setores
 *
 * Executa diagnóstico completo sobre os setores registrados nas RNCs.
 * Útil para identificar problemas com separação de múltiplos setores.
 *
 * Informações coletadas:
 * - Total de RNCs
 * - Lista de setores únicos
 * - Teste de split com diferentes separadores (ponto-vírgula, vírgula)
 * - Logs detalhados na aba Logs
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Diagnóstico > Debug Setores
 * menuDebugSetores();
 *
 * @since Deploy 74.7
 */
function menuDebugSetores() {
  try {
    var ui = SpreadsheetApp.getUi();

    // Mostrar loading
    ui.alert('🔍 Executando Debug...', 'Aguarde enquanto coletamos informações sobre os setores...', ui.ButtonSet.OK);

    var resultado = debugSetores();

    if (resultado.error) {
      ui.alert('❌ Erro no Debug', resultado.error, ui.ButtonSet.OK);
      return;
    }

    // Montar mensagem com resultado
    var msg = '🔍 Debug de Setores:\n\n' +
      '📋 Total de RNCs: ' + resultado.totalRncs + '\n' +
      '📊 Setores Únicos (' + resultado.setoresUnicos.length + '):\n' +
      '   ' + resultado.setoresUnicos.join(', ') + '\n\n' +
      '🧪 Teste de Split:\n' +
      '   "Laboratório; Conferência Farmacêutica" → ' + resultado.testeSplit.exemplo1.length + ' setores\n' +
      '   "Laboratório, Conferência Farmacêutica" → ' + resultado.testeSplit.exemplo2.length + ' setores\n' +
      '   "TI" → ' + resultado.testeSplit.exemplo3.length + ' setor\n\n' +
      '💡 Veja a aba Logs para mais detalhes';

    ui.alert('🔍 Debug de Setores', msg, ui.ButtonSet.OK);

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Mapear Colunas da Aba RNC
 *
 * Sincroniza ConfigCampos com a estrutura real da aba RNC.
 * Para cada campo em ConfigCampos, encontra sua posição (coluna) na aba RNC
 * e preenche a coluna OrdemRNC automaticamente.
 *
 * Processo:
 * 1. Lê headers da aba RNC
 * 2. Para cada campo em ConfigCampos
 * 3. Busca header correspondente na aba RNC
 * 4. Preenche OrdemRNC com o índice da coluna
 *
 * Exibe estatísticas:
 * - Total de colunas na aba RNC
 * - Campos mapeados com sucesso
 * - Campos não encontrados
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Manutenção > Mapear Colunas da Aba RNC
 * menuMapearColunas();
 *
 * @since Deploy 75
 */
function menuMapearColunas() {
  try {
    var ui = SpreadsheetApp.getUi();

    var response = ui.alert(
      '🗺️ Mapear Colunas da Aba RNC',
      'Esta função irá:\n\n' +
      '1. Ler todas as colunas da aba RNC\n' +
      '2. Para cada campo em ConfigCampos, encontrar sua posição na aba RNC\n' +
      '3. Preencher a coluna OrdemRNC com o número da coluna\n\n' +
      'Deseja continuar?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    ui.alert('⏳ Processando...', 'Mapeando colunas. Aguarde...', ui.ButtonSet.OK);

    var resultado = mapearColunasRNC();

    if (resultado.success) {
      var msg = '✅ Mapeamento Concluído!\n\n' +
        '📊 Total de colunas na aba RNC: ' + resultado.totalHeaders + '\n' +
        '✅ Campos mapeados: ' + resultado.mapeamentos + '\n';

      if (resultado.naoEncontrados.length > 0) {
        msg += '\n⚠️ Campos não encontrados (' + resultado.naoEncontrados.length + '):\n' +
          resultado.naoEncontrados.slice(0, 5).join(', ');
        if (resultado.naoEncontrados.length > 5) {
          msg += '...';
        }
      }

      ui.alert('🗺️ Mapeamento Completo', msg, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Erro', 'Erro ao mapear colunas:\n' + resultado.error, ui.ButtonSet.OK);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Pintar Headers por Seção
 *
 * Aplica cores aos headers da aba RNC baseado na seção de cada campo.
 * Facilita identificação visual das seções na planilha.
 *
 * Cores por seção:
 * - Abertura: Azul claro
 * - Qualidade: Verde claro
 * - Liderança: Laranja claro
 * - Análise: Roxo claro
 *
 * IMPORTANTE: Execute "Mapear Colunas" antes de usar esta função!
 *
 * Formatação aplicada:
 * - Background: Cor da seção
 * - Font: Negrito
 * - Apenas linha 1 (headers) é afetada
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Manutenção > Pintar Colunas por Seção
 * menuPintarColunas();
 *
 * @since Deploy 75.1
 */
function menuPintarColunas() {
  try {
    var ui = SpreadsheetApp.getUi();

    var response = ui.alert(
      '🎨 Pintar Headers por Seção',
      'Esta função irá:\n\n' +
      '1. Ler a Seção de cada campo (ConfigCampos)\n' +
      '2. Pintar o HEADER da coluna na aba RNC com a cor da seção\n' +
      '3. Deixar os headers em negrito\n\n' +
      '⚠️ IMPORTANTE: Execute "Mapear Colunas" antes!\n\n' +
      '🎨 Cores por seção:\n' +
      '  • Abertura = Azul claro\n' +
      '  • Qualidade = Verde claro\n' +
      '  • Liderança = Laranja claro\n' +
      '  • Análise = Roxo claro\n\n' +
      'Deseja continuar?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    ui.alert('⏳ Processando...', 'Pintando headers. Aguarde...', ui.ButtonSet.OK);

    var resultado = pintarColunasPorSecao();

    if (resultado.success) {
      var msg = '✅ Pintura Concluída!\n\n' +
        '🎨 Headers pintados: ' + resultado.headersPintados + '\n' +
        '📋 Seções usadas:\n';

      // Mostrar contagem por seção
      for (var secao in resultado.secoesUsadas) {
        msg += '  • ' + secao + ': ' + resultado.secoesUsadas[secao] + ' campos\n';
      }

      msg += '\n💡 Agora os headers da aba RNC estão coloridos por seção!';

      ui.alert('🎨 Pintura Completa', msg, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Erro', 'Erro ao pintar headers:\n' + resultado.error, ui.ButtonSet.OK);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu: Formatar Aba RNC
 *
 * Aplica formatação profissional completa na aba RNC.
 *
 * CABEÇALHO (linha 1):
 * - Alinhamento: Centro (horizontal e vertical)
 * - Quebra de texto: Ativada
 * - Bordas: Todas (preto)
 * - Altura: 60px
 * - Linha congelada
 *
 * DADOS (linhas 2+):
 * - Alinhamento: Esquerda (H) + Centro (V)
 * - Quebra de texto: Ativada
 * - Bordas: Todas (cinza claro)
 * - Altura: 30px
 *
 * COLUNAS:
 * - Largura: Auto-ajustada (100-400px)
 *
 * Esta operação pode demorar alguns segundos dependendo do tamanho da planilha.
 *
 * @return {void}
 *
 * @example
 * // Chamado via menu: RNC > Manutenção > Formatar Aba RNC
 * menuFormatarAbaRNC();
 *
 * @since Deploy 75.2
 */
function menuFormatarAbaRNC() {
  try {
    var ui = SpreadsheetApp.getUi();

    var response = ui.alert(
      '📐 Formatar Aba RNC',
      'Esta função irá formatar TODA a aba RNC:\n\n' +
      '📋 CABEÇALHO (linha 1):\n' +
      '  • Alinhamento: Centro (H e V)\n' +
      '  • Quebra de texto: Ativada\n' +
      '  • Bordas: Todas (preto)\n' +
      '  • Altura: 60px\n' +
      '  • Congelado\n\n' +
      '📊 DADOS (linhas 2+):\n' +
      '  • Alinhamento: Esquerda (H) + Centro (V)\n' +
      '  • Quebra de texto: Ativada\n' +
      '  • Bordas: Todas (cinza)\n' +
      '  • Altura: 30px\n\n' +
      '📏 COLUNAS:\n' +
      '  • Largura: Auto-ajustada (100-400px)\n\n' +
      '⚠️ Esta operação pode demorar alguns segundos.\n\n' +
      'Deseja continuar?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    ui.alert('⏳ Processando...', 'Formatando aba RNC. Aguarde...', ui.ButtonSet.OK);

    var resultado = formatarAbaRNC();

    if (resultado.success) {
      var msg = '✅ Formatação Concluída!\n\n' +
        '📊 Total de linhas: ' + resultado.linhas + '\n' +
        '📋 Total de colunas: ' + resultado.colunas + '\n' +
        '✅ Linhas de dados formatadas: ' + resultado.linhasFormatadas + '\n' +
        '📏 Colunas redimensionadas: ' + resultado.colunasRedimensionadas + '\n\n' +
        '💡 A aba RNC agora está formatada profissionalmente!';

      ui.alert('📐 Formatação Completa', msg, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Erro', 'Erro ao formatar aba RNC:\n' + resultado.error, ui.ButtonSet.OK);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Configura margens e layout de impressão da aba Print
 *
 * Define configurações de página para impressão profissional:
 * - Margens: 0.5cm (36 pontos) em todos os lados
 * - Tamanho: A4
 * - Orientação: Retrato
 * - Ajuste: Largura da página
 * - Centralização: Horizontal
 *
 * Nota: 1 ponto = 0.0139 cm, logo 36 pontos ≈ 0.5 cm
 *
 * @return {Object} Objeto com resultado da operação
 * @return {boolean} return.success - True se configuração bem-sucedida
 * @return {string} [return.error] - Mensagem de erro (se houver)
 *
 * @throws {Error} Se a aba "Print" não for encontrada
 *
 * @example
 * var result = configurarLayoutPrint();
 * if (result.success) {
 *   console.log('Layout configurado com sucesso');
 * }
 *
 * @since Deploy 37
 */
function configurarLayoutPrint() {
  try {
    Logger.logInfo('CONFIGURAR_LAYOUT_PRINT_START');
    
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var printSheet = ss.getSheetByName('Print');
    
    if (!printSheet) {
      throw new Error('Aba "Print" não encontrada');
    }
    
    // ✅ Configurar margens (em pontos: 1 ponto = 0.0139 cm)
    // 0.5 cm = 36 pontos aproximadamente
    printSheet.setPageSettings({
      topMargin: 36,      // 0.5 cm
      bottomMargin: 36,   // 0.5 cm
      leftMargin: 36,     // 0.5 cm
      rightMargin: 36,    // 0.5 cm
      pageSize: 'A4',
      orientation: 'PORTRAIT',  // ou 'LANDSCAPE' para paisagem
      fitToWidth: true,
      fitToHeight: false,
      centerHorizontally: true,
      centerVertically: false
    });
    
    Logger.logInfo('CONFIGURAR_LAYOUT_PRINT_SUCCESS');
    
    return { success: true };
    
  } catch (error) {
    Logger.logError('CONFIGURAR_LAYOUT_PRINT_ERROR', error);
    return { success: false, error: error.toString() };
  }
}