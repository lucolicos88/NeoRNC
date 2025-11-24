/**
 * Converte objeto para query string
 */
function objectToQueryString(obj) {
  return Object.keys(obj).map(function(key) {
    return Utilities.formatString('&%s=%s', key, obj[key]);
  }).join('');
}

/**
 * Configurações de impressão PDF
 */
/**
 * Configurações de impressão PDF
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
 * Gera URL do PDF com preview de impressão
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
    var rangeNotation = 'A1:H26'; // AJUSTE CONFORME NECESSÁRIO
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
 * PrintRNC.gs - Módulo de Impressão
 */

var PrintManager = (function() {
  
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
    var printRangeColumnIndex = 10; // Coluna K
    
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
      htmlTemplate.url = result.printUrl;
      
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
  
  function createPrintMenu() {
    try {
      var ui = SpreadsheetApp.getUi();
      ui.createMenu('🖨️ Impressão RNC')
        .addItem('🖨️ Imprimir RNC...', 'printCurrentRncFromSheet')
        .addToUi();
        
      Logger.logInfo('PRINT_MENU_CREATED');
      
    } catch (error) {
      Logger.logError('CREATE_PRINT_MENU_ERROR', error);
    }
  }
  
  return {
    fillPrintTemplateAndGetUrl: fillPrintTemplateAndGetUrl,
    printCurrentRncFromSheet: printCurrentRncFromSheet,
    createPrintMenu: createPrintMenu
  };
  
})();

function fillPrintTemplateAndGetUrl(rncNumber) {
  return PrintManager.fillPrintTemplateAndGetUrl(rncNumber);
}

function printCurrentRncFromSheet() {
  return PrintManager.printCurrentRncFromSheet();
}

function onOpen(e) {
  try {
    PrintManager.createPrintMenu();
  } catch (error) {
    Logger.logError('ONOPEN_ERROR', error);
  }
}



/**
 * Configura margens e layout da aba Print
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