/**
 * ============================================
 * DATABASE.GS - Operações com Planilhas
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 *
 * Módulo responsável por gerenciar todas as operações de leitura e escrita
 * nas planilhas do Google Sheets com cache TTL, locks otimizados e validação.
 *
 * @namespace Database
 * @since Deploy 30
 */

var Database = (function() {
  'use strict';

  // TASK-010: Cache com TTL (Time-To-Live) para prevenir dados obsoletos
  var sheetCache = {};
  var sheetCacheTimestamps = {}; // Timestamps para controle de TTL
  var spreadsheetCache = null;
  var spreadsheetCacheTimestamp = null;

  // TTL do cache: 5 minutos (300000ms)
  var CACHE_TTL = 5 * 60 * 1000;
  
  /**
   * Verifica se o cache da planilha expirou baseado no TTL configurado.
   * Compara o timestamp fornecido com o tempo atual menos o TTL (5 minutos).
   *
   * @param {number|null} timestamp - Timestamp Unix em milissegundos da última atualização do cache
   * @return {boolean} True se o cache expirou ou não existe, false caso contrário
   *
   * @example
   * var expired = isCacheExpired(sheetCacheTimestamps['RNC']);
   * // Returns: true (se passou mais de 5 minutos)
   *
   * @private
   * @since Deploy 116
   */
  function isCacheExpired(timestamp) {
    if (!timestamp) return true;
    var now = new Date().getTime();
    return (now - timestamp) > CACHE_TTL;
  }

  /**
   * Obtém a planilha principal do sistema com cache TTL de 5 minutos.
   * Utiliza cache para evitar múltiplas chamadas ao Google Sheets e melhorar performance.
   *
   * @return {Spreadsheet} Objeto Spreadsheet do Google Sheets
   * @throws {Error} Se a planilha não for encontrada ou ID inválido
   *
   * @example
   * var ss = getSpreadsheet();
   * // Returns: Spreadsheet object
   *
   * @private
   * @since Deploy 30
   */
  function getSpreadsheet() {
    try {
      // TASK-010: Verificar se o cache expirou
      if (!spreadsheetCache || isCacheExpired(spreadsheetCacheTimestamp)) {
        spreadsheetCache = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
        spreadsheetCacheTimestamp = new Date().getTime();
      }
      return spreadsheetCache;
    } catch (error) {
      Logger.logError('getSpreadsheet', error);
      throw new Error(CONFIG.ERROR_MESSAGES.SPREADSHEET_NOT_FOUND);
    }
  }
  
  /**
   * Obtém uma aba da planilha pelo nome, criando automaticamente se não existir.
   * Utiliza cache TTL de 5 minutos e formata headers com estilo padrão se criar nova aba.
   *
   * @param {string} name - Nome da aba a buscar ou criar
   * @param {Array<string>} [headers] - Array com nomes dos headers para criar se a aba não existir
   * @return {Sheet} Objeto Sheet do Google Sheets
   * @throws {Error} Se houver erro ao acessar a planilha
   *
   * @example
   * var sheet = getSheet('RNC', ['Número', 'Data', 'Cliente', 'Status']);
   * // Returns: Sheet object (cria aba com headers se não existir)
   *
   * @memberof Database
   * @since Deploy 30
   */
  function getSheet(name, headers) {
    try {
      // TASK-010: Verificar cache com TTL
      if (sheetCache[name] && !isCacheExpired(sheetCacheTimestamps[name])) {
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
      
      // TASK-010: Adicionar ao cache com timestamp
      sheetCache[name] = sheet;
      sheetCacheTimestamps[name] = new Date().getTime();
      return sheet;
      
    } catch (error) {
      Logger.logError('getSheet', error, { sheetName: name });
      throw error;
    }
  }
  
  /**
   * Busca dados na planilha aplicando filtros e opções de ordenação/limite.
   * Suporta operadores avançados (=, !=, >, <, contains, startsWith, in) e retorna array de objetos.
   *
   * @param {string} sheetName - Nome da aba da planilha
   * @param {Object} filters - Objeto com pares campo:valor para filtrar (ex: {Status: 'Aberto'})
   * @param {Object} [options] - Opções adicionais de busca
   * @param {string} [options.orderBy] - Campo para ordenar resultados
   * @param {boolean} [options.orderDesc] - Se true, ordena em ordem decrescente
   * @param {number} [options.limit] - Limite máximo de resultados a retornar
   * @return {Array<Object>} Array de objetos com dados filtrados (cada objeto é uma linha)
   *
   * @example
   * var rncs = findData('RNC', {Status: 'Aberto'}, {orderBy: 'Data', limit: 10});
   * // Returns: [{Número: 'RNC-001', Status: 'Aberto', ...}, ...]
   *
   * @memberof Database
   * @since Deploy 30
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
   * Aplica operador de comparação entre dois valores para filtros avançados.
   * Suporta operadores: =, !=, >, >=, <, <=, contains, startsWith, endsWith, in.
   *
   * @param {*} value - Valor da célula a comparar
   * @param {string} operator - Operador de comparação (=, !=, >, <, contains, etc)
   * @param {*} compareValue - Valor de comparação do filtro
   * @return {boolean} True se a comparação é verdadeira, false caso contrário
   *
   * @example
   * var match = applyOperator('RNC-2024-001', 'startsWith', 'RNC-2024');
   * // Returns: true
   *
   * @private
   * @since Deploy 30
   */
  function applyOperator(value, operator, compareValue) {
    // TASK-007: Usar strict equality (===) ao invés de loose equality (==)
    switch (operator) {
      case '=':
      case '==':
        return value === compareValue;
      case '!=':
        return value !== compareValue;
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
        return value === compareValue;
    }
  }
  
  /**
   * Insere uma ou várias linhas de dados na planilha com lock de 10 segundos.
   * Converte objetos em arrays baseado nos headers da planilha e adiciona no final.
   *
   * @param {string} sheetName - Nome da aba da planilha
   * @param {Object|Array<Object>} data - Objeto ou array de objetos com dados (campos devem corresponder aos headers)
   * @return {Object} Resultado da operação
   * @return {boolean} return.success - True se inserção bem-sucedida
   * @return {number} return.rowsInserted - Quantidade de linhas inseridas
   * @return {number} return.lastRow - Número da última linha após inserção
   * @throws {Error} Se sistema ocupado (lock timeout) ou erro de escrita
   *
   * @example
   * var result = insertData('RNC', {Número: 'RNC-001', Data: new Date(), Status: 'Aberto'});
   * // Returns: {success: true, rowsInserted: 1, lastRow: 15}
   *
   * @memberof Database
   * @since Deploy 32
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
   * Atualiza linhas na planilha que correspondem aos filtros com lock de 10 segundos.
   * Busca linhas pelos filtros e atualiza apenas os campos especificados no objeto updates.
   *
   * @param {string} sheetName - Nome da aba da planilha
   * @param {Object} filters - Objeto com pares campo:valor para encontrar linhas (ex: {Número: 'RNC-001'})
   * @param {Object} updates - Objeto com campos a atualizar e novos valores (ex: {Status: 'Fechado'})
   * @return {Object} Resultado da operação
   * @return {boolean} return.success - True se atualização bem-sucedida
   * @return {number} return.rowsUpdated - Quantidade de linhas atualizadas
   * @throws {Error} Se sistema ocupado (lock timeout) ou erro de escrita
   *
   * @example
   * var result = updateData('RNC', {Número: 'RNC-001'}, {Status: 'Fechado', DataFechamento: new Date()});
   * // Returns: {success: true, rowsUpdated: 1}
   *
   * @memberof Database
   * @since Deploy 32
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
   * Deleta linhas da planilha que correspondem aos filtros com lock de 10 segundos.
   * Remove permanentemente as linhas de baixo para cima para manter índices corretos.
   *
   * @param {string} sheetName - Nome da aba da planilha
   * @param {Object} filters - Objeto com pares campo:valor para encontrar linhas a deletar (ex: {Status: 'Cancelado'})
   * @return {Object} Resultado da operação
   * @return {boolean} return.success - True se deleção bem-sucedida
   * @return {number} return.rowsDeleted - Quantidade de linhas deletadas
   * @throws {Error} Se sistema ocupado (lock timeout) ou erro de escrita
   *
   * @example
   * var result = deleteData('RNC', {Número: 'RNC-001', Status: 'Cancelado'});
   * // Returns: {success: true, rowsDeleted: 1}
   *
   * @memberof Database
   * @since Deploy 32
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
   * Executa operação customizada em lotes (batches) para processar grandes volumes de dados.
   * Divide dados em batches com sleep entre eles para evitar timeout do Apps Script.
   *
   * @param {string} sheetName - Nome da aba da planilha
   * @param {Function} operation - Função callback a executar para cada batch (recebe batchData e startRow)
   * @param {Object} [options] - Opções de configuração do batch
   * @param {number} [options.batchSize] - Tamanho de cada batch (padrão: CONFIG.LIMITS.BATCH_SIZE)
   * @return {Object} Resultado da operação
   * @return {boolean} return.success - True se processamento bem-sucedido
   * @return {number} return.processedRows - Total de linhas processadas
   * @return {Array} return.results - Array com resultado de cada batch
   * @throws {Error} Se houver erro durante processamento
   *
   * @example
   * var result = batchOperation('RNC', function(batch, row) {
   *   return batch.length; // processa batch
   * }, {batchSize: 100});
   * // Returns: {success: true, processedRows: 500, results: [100, 100, 100, 100, 100]}
   *
   * @memberof Database
   * @since Deploy 30
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
   * Limpa todo o cache de planilhas forçando reload na próxima chamada.
   * Útil após operações que modificam estrutura ou quando detecta-se dados desatualizados.
   *
   * @return {void}
   *
   * @example
   * Database.clearCache();
   * // Returns: undefined (cache limpo)
   *
   * @memberof Database
   * @since Deploy 30
   */
  function clearCache() {
    sheetCache = {};
    sheetCacheTimestamps = {};
    spreadsheetCache = null;
    spreadsheetCacheTimestamp = null;
    Logger.logDebug('clearCache', { message: 'Sheet cache cleared' });
  }
  
  /**
   * Valida se a estrutura da planilha possui todos os headers obrigatórios.
   * Verifica se a planilha não está vazia e se contém todas as colunas necessárias.
   *
   * @param {string} sheetName - Nome da aba da planilha
   * @param {Array<string>} requiredHeaders - Array com nomes dos headers obrigatórios
   * @return {Object} Resultado da validação
   * @return {boolean} return.valid - True se estrutura válida, false caso contrário
   * @return {string} [return.error] - Mensagem de erro se inválida
   * @return {Array<string>} [return.missingHeaders] - Headers faltando se inválida
   * @return {Array<string>} [return.headers] - Headers encontrados se válida
   *
   * @example
   * var validation = validateSheetStructure('RNC', ['Número', 'Data', 'Cliente']);
   * // Returns: {valid: true, headers: ['Número', 'Data', 'Cliente', 'Status', ...]}
   *
   * @memberof Database
   * @since Deploy 30
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