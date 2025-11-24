/**
 * ============================================
 * LOGGER.GS - Sistema de Logs Aprimorado
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 */

var Logger = (function() {
  'use strict';
  
  // Níveis de log
  var LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4
  };
  
  // Nível atual de log (pode ser configurado)
  var currentLogLevel = LOG_LEVELS.INFO;
  
  /**
   * Registra um evento no sistema
   * @private
   */
  function logEvent(level, action, info, error) {
    try {
      var timestamp = new Date();
      var user = '';
      
      try { 
        user = Session.getActiveUser().getEmail(); 
      } catch(e) { 
        user = 'system'; 
      }
      
      // Log no console
      var consoleMsg = '[' + timestamp.toISOString() + '] [' + level + '] ' + action;
      if (info && Object.keys(info).length > 0) {
        consoleMsg += ' | Info: ' + JSON.stringify(info);
      }
      if (error) {
        consoleMsg += ' | Error: ' + (error.message || String(error));
      }
      
      console.log(consoleMsg);
      
      // Só gravar na planilha se for INFO ou superior
      if (LOG_LEVELS[level] >= LOG_LEVELS.INFO) {
        try {
          var logSheet = Database.getSheet(CONFIG.SHEETS.LOGS, [
            'Timestamp', 'Level', 'User', 'Action', 'Info', 'Error', 'Stack', 'Version'
          ]);
          
          var logRow = [
            timestamp,
            level,
            user,
            action,
            JSON.stringify(info || {}),
            error ? (error.message || String(error)) : '',
            error ? (error.stack || '') : '',
            CONFIG.VERSION
          ];
          
          logSheet.appendRow(logRow);
          
          // Manter apenas últimas N entradas
          if (logSheet.getLastRow() > CONFIG.SYSTEM.MAX_LOG_ENTRIES + 1) {
            var rowsToDelete = logSheet.getLastRow() - CONFIG.SYSTEM.MAX_LOG_ENTRIES - 1;
            logSheet.deleteRows(2, rowsToDelete);
          }
        } catch(logError) {
          console.error('Erro ao gravar log na planilha:', logError);
        }
      }
      
    } catch(e) {
      console.error('Erro crítico no sistema de log:', e);
    }
  }
  
  /**
   * Log de debug (desenvolvimento)
   */
  function logDebug(action, info) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      logEvent('DEBUG', action, info, null);
    }
  }
  
  /**
   * Log de informação (operações normais)
   */
  function logInfo(action, info) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      logEvent('INFO', action, info, null);
    }
  }
  
  /**
   * Log de aviso (situações não ideais mas recuperáveis)
   */
  function logWarning(action, info) {
    if (currentLogLevel <= LOG_LEVELS.WARNING) {
      logEvent('WARNING', action, info, null);
    }
  }
  
  /**
   * Log de erro (erros recuperáveis)
   */
  function logError(action, error, info) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      logEvent('ERROR', action, info, error);
    }
  }
  
  /**
   * Log crítico (erros que podem comprometer o sistema)
   */
  function logCritical(action, error, info) {
    logEvent('CRITICAL', action, info, error);
    
    // Em erros críticos, podemos enviar email de alerta
    try {
      notifyAdminOfCriticalError(action, error, info);
    } catch(e) {
      console.error('Falha ao notificar admin:', e);
    }
  }
  
  /**
   * Notifica administrador sobre erro crítico
   * @private
   */
  function notifyAdminOfCriticalError(action, error, info) {
    try {
      var adminEmail = getSystemConfig('AdminEmail', null);
      if (!adminEmail) return;
      
      var subject = '[RNC CRÍTICO] Erro no Sistema - ' + action;
      var body = 'Erro crítico detectado no sistema RNC:\n\n' +
                'Ação: ' + action + '\n' +
                'Erro: ' + (error.message || String(error)) + '\n' +
                'Informações: ' + JSON.stringify(info || {}, null, 2) + '\n' +
                'Stack: ' + (error.stack || 'N/A') + '\n\n' +
                'Timestamp: ' + new Date().toISOString() + '\n' +
                'Versão: ' + CONFIG.VERSION;
      
      MailApp.sendEmail(adminEmail, subject, body);
    } catch(e) {
      console.error('Não foi possível enviar email de alerta:', e);
    }
  }
  
  /**
   * Registra performance de operação
   */
  function logPerformance(operation, startTime, info) {
    var duration = new Date().getTime() - startTime;
    var performanceInfo = Object.assign({}, info || {}, {
      duration_ms: duration,
      duration_seconds: (duration / 1000).toFixed(2)
    });
    
    if (duration > 5000) { // Mais de 5 segundos
      logWarning(operation + '_SLOW', performanceInfo);
    } else {
      logDebug(operation + '_PERFORMANCE', performanceInfo);
    }
    
    return duration;
  }
  
  /**
   * Obtém logs recentes
   */
  function getRecentLogs(limit) {
    limit = limit || 100;
    
    try {
      var logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);
      
      if (logSheet.getLastRow() <= 1) {
        return [];
      }
      
      var numRows = Math.min(limit, logSheet.getLastRow() - 1);
      var startRow = Math.max(2, logSheet.getLastRow() - numRows + 1);
      
      var data = logSheet.getRange(startRow, 1, numRows, 8).getValues();
      var logs = [];
      
      for (var i = data.length - 1; i >= 0; i--) { // Mais recentes primeiro
        logs.push({
          timestamp: data[i][0],
          level: data[i][1],
          user: data[i][2],
          action: data[i][3],
          info: data[i][4],
          error: data[i][5],
          stack: data[i][6],
          version: data[i][7]
        });
      }
      
      return logs;
      
    } catch (error) {
      console.error('Erro ao obter logs:', error);
      return [];
    }
  }
  
  /**
   * Limpa logs antigos
   */
  function cleanOldLogs(daysToKeep) {
    daysToKeep = daysToKeep || 30;
    
    try {
      var logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);
      
      if (logSheet.getLastRow() <= 1) {
        return { success: true, message: 'Nenhum log para limpar' };
      }
      
      var cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      var data = logSheet.getDataRange().getValues();
      var rowsToDelete = [];
      
      for (var i = 1; i < data.length; i++) {
        var logDate = data[i][0];
        if (logDate instanceof Date && logDate < cutoffDate) {
          rowsToDelete.push(i + 1);
        }
      }
      
      // Deletar de baixo para cima para manter índices
      for (var j = rowsToDelete.length - 1; j >= 0; j--) {
        logSheet.deleteRow(rowsToDelete[j]);
      }
      
      logInfo('CLEAN_LOGS', { 
        daysKept: daysToKeep, 
        rowsDeleted: rowsToDelete.length 
      });
      
      return { 
        success: true, 
        message: rowsToDelete.length + ' logs antigos removidos' 
      };
      
    } catch (error) {
      logError('CLEAN_LOGS_ERROR', error);
      return { 
        success: false, 
        error: error.toString() 
      };
    }
  }
  
  /**
   * Exporta logs para CSV
   */
  function exportLogs(startDate, endDate) {
    try {
      var logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);
      
      if (logSheet.getLastRow() <= 1) {
        return { success: false, message: 'Nenhum log para exportar' };
      }
      
      var data = logSheet.getDataRange().getValues();
      var headers = data[0];
      var filteredData = [headers];
      
      var start = startDate ? new Date(startDate) : new Date(0);
      var end = endDate ? new Date(endDate) : new Date();
      
      for (var i = 1; i < data.length; i++) {
        var logDate = data[i][0];
        if (logDate instanceof Date && logDate >= start && logDate <= end) {
          filteredData.push(data[i]);
        }
      }
      
      // Converter para CSV
      var csv = filteredData.map(function(row) {
        return row.map(function(cell) {
          var value = cell instanceof Date ? cell.toISOString() : String(cell || '');
          // Escapar aspas duplas e adicionar aspas se necessário
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        }).join(',');
      }).join('\n');
      
      logInfo('EXPORT_LOGS', { 
        startDate: start.toISOString(), 
        endDate: end.toISOString(),
        rowsExported: filteredData.length - 1
      });
      
      return { 
        success: true, 
        csv: csv,
        filename: 'logs_rnc_' + new Date().toISOString().split('T')[0] + '.csv'
      };
      
    } catch (error) {
      logError('EXPORT_LOGS_ERROR', error);
      return { 
        success: false, 
        error: error.toString() 
      };
    }
  }
  
  /**
   * Define o nível de log
   */
  function setLogLevel(level) {
    if (LOG_LEVELS.hasOwnProperty(level)) {
      currentLogLevel = LOG_LEVELS[level];
      logInfo('LOG_LEVEL_CHANGED', { newLevel: level });
    }
  }
  
  // API Pública
  return {
    logDebug: logDebug,
    logInfo: logInfo,
    logWarning: logWarning,
    logError: logError,
    logCritical: logCritical,
    logPerformance: logPerformance,
    getRecentLogs: getRecentLogs,
    cleanOldLogs: cleanOldLogs,
    exportLogs: exportLogs,
    setLogLevel: setLogLevel,
    LOG_LEVELS: LOG_LEVELS
  };
})();

function checkLogs() {
  var logs = Logger.getRecentLogs(50);
  logs.forEach(function(log) {
    console.log([
      log.timestamp,
      log.level,
      log.action,
      log.info
    ].join(' | '));
  });
}

function setupCleanupTrigger() {
  ScriptApp.newTrigger('cleanOldLogs')
    .timeBased()
    .everyWeeks(1)
    .create();
}