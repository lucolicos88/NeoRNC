/**
 * ============================================
 * DATABASE.GS - Operações com Planilhas
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 */

var Database = (function() {
  'use strict';
  
  // Cache de planilhas para evitar múltiplas aberturas
  var sheetCache = {};
  var spreadsheetCache = null;
  
  /**
   * Obtém a planilha principal com cache
   * @private
   */
  function getSpreadsheet() {
    try {
      if (!spreadsheetCache) {
        spreadsheetCache = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      }
      return spreadsheetCache;
    } catch (error) {
      Logger.logError('getSpreadsheet', error);
      throw new Error(CONFIG.ERROR_MESSAGES.SPREADSHEET_NOT_FOUND);
    }
  }
  
  /**
   * Obtém uma aba da planilha, criando se não existir
   * @param {string} name - Nome da aba
   * @param {Array} headers - Headers para criar se não existir
   * @return {Sheet} Objeto da aba
   */
  function getSheet(name, headers) {
    try {
      // Verificar cache
      if (sheetCache[name]) {
        return sheetCache[name];
      }
      
      var ss = getSpreadsheet();
      var sheet = ss.getSheetByName(name);
      
      if (!sheet) {
        Logger.logInfo('Creating new sheet', { sheetName: name });
        sheet = ss.insertSheet(name);
        
        if (headers && headers.length > 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length)
            .setFontWeight('bold')
            .setBackground('#009688')
            .setFontColor('#ffffff');
          
          // Auto-resize columns
          for (var i = 1; i <= headers.length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }
      
      // Adicionar ao cache
      sheetCache[name] = sheet;
      return sheet;
      
    } catch (error) {
      Logger.logError('getSheet', error, { sheetName: name });
      throw error;
    }
  }
  
  /**
   * Busca dados com filtros
   * @param {string} sheetName - Nome da aba
   * @param {Object} filters - Filtros a aplicar
   * @param {Object} options - Opções de busca
   * @return {Array} Dados filtrados
   */
  function findData(sheetName, filters, options) {
    options = options || {};
    
    try {
      var sheet = getSheet(sheetName);
      
      if (sheet.getLastRow() <= 1) {
        return [];
      }
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var results = [];
      
      // Criar índice de colunas
      var columnIndex = {};
      for (var i = 0; i < headers.length; i++) {
        columnIndex[headers[i]] = i;
      }
      
      // Aplicar filtros
      for (var row = 1; row < data.length; row++) {
        var includeRow = true;
        
        for (var field in filters) {
          if (filters.hasOwnProperty(field)) {
            var colIdx = columnIndex[field];
            if (colIdx === undefined) continue;
            
            var cellValue = data[row][colIdx];
            var filterValue = filters[field];
            
            // Suporte a diferentes tipos de filtro
            if (filterValue !== null && filterValue !== undefined) {
              if (typeof filterValue === 'object' && filterValue.operator) {
                // Filtro com operador
                includeRow = applyOperator(cellValue, filterValue.operator, filterValue.value);
              } else {
                // Filtro de igualdade simples
                includeRow = cellValue === filterValue;
              }
              
              if (!includeRow) break;
            }
          }
        }
        
        if (includeRow) {
          // Converter linha em objeto
          var rowObj = {};
          for (var j = 0; j < headers.length; j++) {
            rowObj[headers[j]] = data[row][j];
          }
          results.push(rowObj);
        }
      }
      
      // Aplicar ordenação se especificada
      if (options.orderBy) {
        results.sort(function(a, b) {
          var aVal = a[options.orderBy];
          var bVal = b[options.orderBy];
          
          if (aVal < bVal) return options.orderDesc ? 1 : -1;
          if (aVal > bVal) return options.orderDesc ? -1 : 1;
          return 0;
        });
      }
      
      // Aplicar limite se especificado
      if (options.limit && options.limit > 0) {
        results = results.slice(0, options.limit);
      }
      
      Logger.logDebug('findData', { 
        sheet: sheetName, 
        filtersCount: Object.keys(filters).length,
        resultsCount: results.length 
      });
      
      return results;
      
    } catch (error) {
      Logger.logError('findData', error, { sheetName: sheetName, filters: filters });
      return [];
    }
  }
  
  /**
   * Aplica operador de comparação
   * @private
   */
  function applyOperator(value, operator, compareValue) {
    switch (operator) {
      case '=':
      case '==':
        return value == compareValue;
      case '!=':
        return value != compareValue;
      case '>':
        return value > compareValue;
      case '>=':
        return value >= compareValue;
      case '<':
        return value < compareValue;
      case '<=':
        return value <= compareValue;
      case 'contains':
        return String(value).toLowerCase().indexOf(String(compareValue).toLowerCase()) !== -1;
      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(compareValue).toLowerCase());
      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(compareValue).toLowerCase());
      case 'in':
        return compareValue.indexOf(value) !== -1;
      default:
        return value == compareValue;
    }
  }
  
  /**
   * Insere dados na planilha
   * Deploy 32 - Lock otimizado (10s para escrita)
   * @param {string} sheetName - Nome da aba
   * @param {Object|Array} data - Dados a inserir
   * @return {Object} Resultado da operação
   */
  function insertData(sheetName, data) {
    var lock = LockService.getScriptLock();

    try {
      // ✅ DEPLOY 32: Lock reduzido para escritas (10s)
      var lockTimeout = CONFIG.LIMITS.LOCK_TIMEOUT_WRITE || 10000;
      var hasLock = lock.tryLock(lockTimeout);
      if (!hasLock) {
        throw new Error('Sistema ocupado. Aguarde alguns segundos e tente novamente.');
      }
      
      var sheet = getSheet(sheetName);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Converter objeto em array baseado nos headers
      var rows = [];
      var dataArray = Array.isArray(data) ? data : [data];
      
      for (var i = 0; i < dataArray.length; i++) {
        var row = [];
        for (var j = 0; j < headers.length; j++) {
          var value = dataArray[i][headers[j]];
          
          // Tratar valores especiais
          if (value === undefined || value === null) {
            row.push('');
          } else if (value instanceof Date) {
            row.push(value);
          } else {
            row.push(String(value));
          }
        }
        rows.push(row);
      }
      
      // Inserir dados
      if (rows.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
      }
      
      Logger.logInfo('insertData', { 
        sheet: sheetName, 
        rowsInserted: rows.length 
      });
      
      return { 
        success: true, 
        rowsInserted: rows.length,
        lastRow: sheet.getLastRow()
      };
      
    } catch (error) {
      Logger.logError('insertData', error, { sheetName: sheetName });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }
  
  /**
   * Atualiza dados na planilha
   * Deploy 32 - Lock otimizado (10s para escrita)
   * @param {string} sheetName - Nome da aba
   * @param {Object} filters - Filtros para encontrar as linhas
   * @param {Object} updates - Campos a atualizar
   * @return {Object} Resultado da operação
   */
  function updateData(sheetName, filters, updates) {
    var lock = LockService.getScriptLock();

    try {
      // ✅ DEPLOY 32: Lock reduzido para escritas (10s)
      var lockTimeout = CONFIG.LIMITS.LOCK_TIMEOUT_WRITE || 10000;
      var hasLock = lock.tryLock(lockTimeout);
      if (!hasLock) {
        throw new Error('Sistema ocupado. Aguarde alguns segundos e tente novamente.');
      }
      
      var sheet = getSheet(sheetName);
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var updatedCount = 0;
      
      // Criar índice de colunas
      var columnIndex = {};
      for (var i = 0; i < headers.length; i++) {
        columnIndex[headers[i]] = i;
      }
      
      // Encontrar e atualizar linhas
      for (var row = 1; row < data.length; row++) {
        var match = true;
        
        // Verificar filtros
        for (var field in filters) {
          if (filters.hasOwnProperty(field)) {
            var colIdx = columnIndex[field];
            if (colIdx !== undefined && data[row][colIdx] !== filters[field]) {
              match = false;
              break;
            }
          }
        }
        
        // Atualizar se match
        if (match) {
          for (var updateField in updates) {
            if (updates.hasOwnProperty(updateField)) {
              var updateColIdx = columnIndex[updateField];
              if (updateColIdx !== undefined) {
                var newValue = updates[updateField];
                
                // Atualizar na planilha
                sheet.getRange(row + 1, updateColIdx + 1).setValue(newValue);
                
                // Atualizar no array local para consistência
                data[row][updateColIdx] = newValue;
              }
            }
          }
          updatedCount++;
        }
      }
      
      Logger.logInfo('updateData', { 
        sheet: sheetName, 
        rowsUpdated: updatedCount 
      });
      
      return { 
        success: true, 
        rowsUpdated: updatedCount 
      };
      
    } catch (error) {
      Logger.logError('updateData', error, { sheetName: sheetName, filters: filters });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }
  
  /**
   * Deleta dados da planilha
   * Deploy 32 - Lock otimizado (10s para escrita)
   * @param {string} sheetName - Nome da aba
   * @param {Object} filters - Filtros para encontrar as linhas
   * @return {Object} Resultado da operação
   */
  function deleteData(sheetName, filters) {
    var lock = LockService.getScriptLock();

    try {
      // ✅ DEPLOY 32: Lock reduzido para escritas (10s)
      var lockTimeout = CONFIG.LIMITS.LOCK_TIMEOUT_WRITE || 10000;
      var hasLock = lock.tryLock(lockTimeout);
      if (!hasLock) {
        throw new Error('Sistema ocupado. Aguarde alguns segundos e tente novamente.');
      }
      
      var sheet = getSheet(sheetName);
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rowsToDelete = [];
      
      // Criar índice de colunas
      var columnIndex = {};
      for (var i = 0; i < headers.length; i++) {
        columnIndex[headers[i]] = i;
      }
      
      // Encontrar linhas para deletar
      for (var row = 1; row < data.length; row++) {
        var match = true;
        
        for (var field in filters) {
          if (filters.hasOwnProperty(field)) {
            var colIdx = columnIndex[field];
            if (colIdx !== undefined && data[row][colIdx] !== filters[field]) {
              match = false;
              break;
            }
          }
        }
        
        if (match) {
          rowsToDelete.push(row + 1); // +1 porque sheet rows são 1-indexed
        }
      }
      
      // Deletar de baixo para cima para manter índices
      for (var i = rowsToDelete.length - 1; i >= 0; i--) {
        sheet.deleteRow(rowsToDelete[i]);
      }
      
      Logger.logInfo('deleteData', { 
        sheet: sheetName, 
        rowsDeleted: rowsToDelete.length 
      });
      
      return { 
        success: true, 
        rowsDeleted: rowsToDelete.length 
      };
      
    } catch (error) {
      Logger.logError('deleteData', error, { sheetName: sheetName, filters: filters });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }
  
  /**
   * Executa operação em batch
   * @param {string} sheetName - Nome da aba
   * @param {Function} operation - Função a executar para cada batch
   * @param {Object} options - Opções do batch
   * @return {Object} Resultado da operação
   */
  function batchOperation(sheetName, operation, options) {
    options = options || {};
    var batchSize = options.batchSize || CONFIG.LIMITS.BATCH_SIZE;
    
    try {
      var sheet = getSheet(sheetName);
      var totalRows = sheet.getLastRow() - 1; // Excluir header
      var processedRows = 0;
      var results = [];
      
      for (var startRow = 2; startRow <= totalRows + 1; startRow += batchSize) {
        var numRows = Math.min(batchSize, totalRows - processedRows + 1);
        
        if (numRows <= 0) break;
        
        var batchData = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
        var batchResult = operation(batchData, startRow);
        
        results.push(batchResult);
        processedRows += numRows;
        
        // Yield para evitar timeout
        Utilities.sleep(100);
      }
      
      Logger.logInfo('batchOperation', { 
        sheet: sheetName, 
        totalProcessed: processedRows,
        batches: results.length
      });
      
      return { 
        success: true, 
        processedRows: processedRows,
        results: results
      };
      
    } catch (error) {
      Logger.logError('batchOperation', error, { sheetName: sheetName });
      throw error;
    }
  }
  
  /**
   * Limpa o cache de planilhas
   */
  function clearCache() {
    sheetCache = {};
    spreadsheetCache = null;
    Logger.logDebug('clearCache', { message: 'Sheet cache cleared' });
  }
  
  /**
   * Valida estrutura da planilha
   * @param {string} sheetName - Nome da aba
   * @param {Array} requiredHeaders - Headers obrigatórios
   * @return {Object} Resultado da validação
   */
  function validateSheetStructure(sheetName, requiredHeaders) {
    try {
      var sheet = getSheet(sheetName);
      
      if (sheet.getLastRow() === 0) {
        return { 
          valid: false, 
          error: 'Planilha vazia' 
        };
      }
      
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var missingHeaders = [];
      
      for (var i = 0; i < requiredHeaders.length; i++) {
        if (headers.indexOf(requiredHeaders[i]) === -1) {
          missingHeaders.push(requiredHeaders[i]);
        }
      }
      
      if (missingHeaders.length > 0) {
        return { 
          valid: false, 
          error: 'Headers faltando: ' + missingHeaders.join(', '),
          missingHeaders: missingHeaders
        };
      }
      
      return { 
        valid: true,
        headers: headers
      };
      
    } catch (error) {
      Logger.logError('validateSheetStructure', error, { sheetName: sheetName });
      return { 
        valid: false, 
        error: error.toString() 
      };
    }
  }
  
  // API Pública
  return {
    getSheet: getSheet,
    findData: findData,
    insertData: insertData,
    updateData: updateData,
    deleteData: deleteData,
    batchOperation: batchOperation,
    clearCache: clearCache,
    validateSheetStructure: validateSheetStructure
  };
})();