/**
 * ============================================
 * LOGGER.GS - Sistema de Logs Aprimorado
 * Sistema RNC Neoformula - Deploy 31
 * ============================================
 *
 * CHANGELOG Deploy 31:
 * - ✅ Adicionado controle de debug mode por ambiente (Problema #8)
 * - ✅ Migrado var para const/let (Problema #16)
 * - ✅ Melhorado tratamento de erros com stack trace (Problema #15)
 */

const Logger = (function() {
  'use strict';

  // Níveis de log
  const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4
  };

  // ✅ NOVO: Nível de log determinado por ambiente (Problema #8)
  let currentLogLevel = determineLogLevel();

  /**
   * ✅ NOVO: Determina nível de log baseado no ambiente
   * @private
   */
  function determineLogLevel() {
    try {
      // Em desenvolvimento, permitir DEBUG
      if (CONFIG.ENVIRONMENT === 'development' || CONFIG.DEBUG_MODE === true) {
        return LOG_LEVELS.DEBUG;
      }

      // Em produção, apenas INFO ou superior
      return LOG_LEVELS.INFO;

    } catch (error) {
      // Fallback seguro
      return LOG_LEVELS.INFO;
    }
  }

  /**
   * TASK-008: Sanitiza dados sensíveis antes de logar
   * @private
   */
  function sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = {};
    const sensitiveFields = ['email', 'password', 'token', 'apiKey', 'secret', 'credential'];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(function(field) {
          return lowerKey.indexOf(field) !== -1;
        });

        if (isSensitive) {
          // Sanitizar: mostrar apenas domínio do email, ocultar outros dados
          if (lowerKey.indexOf('email') !== -1 && typeof data[key] === 'string') {
            const parts = data[key].split('@');
            sanitized[key] = parts.length === 2 ? '***@' + parts[1] : '***';
          } else {
            sanitized[key] = '***REDACTED***';
          }
        } else {
          sanitized[key] = data[key];
        }
      }
    }

    return sanitized;
  }

  /**
   * Registra um evento no sistema
   * @private
   */
  function logEvent(level, action, info, error) {
    try {
      const timestamp = new Date();
      let user = '';

      try {
        const email = Session.getActiveUser().getEmail();
        // TASK-008: Sanitizar email no log (mostrar apenas domínio)
        const parts = email.split('@');
        user = parts.length === 2 ? '***@' + parts[1] : '***';
      } catch(e) {
        user = 'system';
      }

      // TASK-008: Sanitizar dados sensíveis antes de logar
      const sanitizedInfo = info ? sanitizeLogData(info) : null;

      // Log no console
      let consoleMsg = `[${timestamp.toISOString()}] [${level}] ${action}`;
      if (sanitizedInfo && Object.keys(sanitizedInfo).length > 0) {
        consoleMsg += ` | Info: ${JSON.stringify(sanitizedInfo)}`;
      }
      if (error) {
        consoleMsg += ` | Error: ${error.message || String(error)}`;
      }

      console.log(consoleMsg);

      // ✅ MELHORADO: Gravar na planilha apenas se for INFO ou superior
      // E se não estiver em modo DEBUG excessivo
      const shouldLogToSheet = LOG_LEVELS[level] >= LOG_LEVELS.INFO;

      if (shouldLogToSheet) {
        try {
          const logSheet = Database.getSheet(CONFIG.SHEETS.LOGS, [
            'Timestamp', 'Level', 'User', 'Action', 'Info', 'Error', 'Stack', 'Version'
          ]);

          // ✅ MELHORADO: Incluir stack trace completo (Problema #15)
          const logRow = [
            timestamp,
            level,
            user,
            action,
            JSON.stringify(info || {}),
            error ? (error.message || String(error)) : '',
            error ? (error.stack || '') : '', // ✅ Stack trace completo
            CONFIG.VERSION
          ];

          logSheet.appendRow(logRow);

          // Manter apenas últimas N entradas
          if (logSheet.getLastRow() > CONFIG.SYSTEM.MAX_LOG_ENTRIES + 1) {
            const rowsToDelete = logSheet.getLastRow() - CONFIG.SYSTEM.MAX_LOG_ENTRIES - 1;
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
   * ✅ MELHORADO: Respeita configuração de ambiente
   */
  function logDebug(action, info) {
    // ✅ NOVO: Só loga debug se estiver em modo desenvolvimento
    if (CONFIG.DEBUG_MODE === true || CONFIG.ENVIRONMENT === 'development') {
      if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        logEvent('DEBUG', action, info, null);
      }
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
   * ✅ MELHORADO: Log de erro com stack trace completo (Problema #15)
   */
  function logError(action, error, info) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      // ✅ NOVO: Garantir que error tenha stack trace
      if (error && !error.stack && error.message) {
        try {
          throw new Error(error.message);
        } catch(e) {
          error = e;
        }
      }

      logEvent('ERROR', action, info, error);
    }
  }

  /**
   * Log crítico (erros que podem comprometer o sistema)
   */
  function logCritical(action, error, info) {
    // ✅ MELHORADO: Sempre garantir stack trace em erros críticos
    if (error && !error.stack && error.message) {
      try {
        throw new Error(error.message);
      } catch(e) {
        error = e;
      }
    }

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
      const adminEmail = getSystemConfig('AdminEmail', null);
      if (!adminEmail) return;

      const subject = `[RNC CRÍTICO] Erro no Sistema - ${action}`;
      const body = `Erro crítico detectado no sistema RNC:

Ação: ${action}
Erro: ${error.message || String(error)}
Informações: ${JSON.stringify(info || {}, null, 2)}
Stack: ${error.stack || 'N/A'}

Timestamp: ${new Date().toISOString()}
Versão: ${CONFIG.VERSION}
Ambiente: ${CONFIG.ENVIRONMENT}`;

      MailApp.sendEmail(adminEmail, subject, body);
    } catch(e) {
      console.error('Não foi possível enviar email de alerta:', e);
    }
  }

  /**
   * Registra performance de operação
   */
  function logPerformance(operation, startTime, info) {
    const duration = new Date().getTime() - startTime;
    const performanceInfo = Object.assign({}, info || {}, {
      duration_ms: duration,
      duration_seconds: (duration / 1000).toFixed(2)
    });

    if (duration > 5000) { // Mais de 5 segundos
      logWarning(`${operation}_SLOW`, performanceInfo);
    } else if (CONFIG.DEBUG_MODE === true) {
      // Só loga performance em debug mode
      logDebug(`${operation}_PERFORMANCE`, performanceInfo);
    }

    return duration;
  }

  /**
   * Obtém logs recentes
   */
  function getRecentLogs(limit) {
    limit = limit || 100;

    try {
      const logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);

      if (logSheet.getLastRow() <= 1) {
        return [];
      }

      const numRows = Math.min(limit, logSheet.getLastRow() - 1);
      const startRow = Math.max(2, logSheet.getLastRow() - numRows + 1);

      const data = logSheet.getRange(startRow, 1, numRows, 8).getValues();
      const logs = [];

      for (let i = data.length - 1; i >= 0; i--) { // Mais recentes primeiro
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
      const logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);

      if (logSheet.getLastRow() <= 1) {
        return { success: true, message: 'Nenhum log para limpar' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const data = logSheet.getDataRange().getValues();
      const rowsToDelete = [];

      for (let i = 1; i < data.length; i++) {
        const logDate = data[i][0];
        if (logDate instanceof Date && logDate < cutoffDate) {
          rowsToDelete.push(i + 1);
        }
      }

      // Deletar de baixo para cima para manter índices
      for (let j = rowsToDelete.length - 1; j >= 0; j--) {
        logSheet.deleteRow(rowsToDelete[j]);
      }

      logInfo('CLEAN_LOGS', {
        daysKept: daysToKeep,
        rowsDeleted: rowsToDelete.length
      });

      return {
        success: true,
        message: `${rowsToDelete.length} logs antigos removidos`
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
      const logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);

      if (logSheet.getLastRow() <= 1) {
        return { success: false, message: 'Nenhum log para exportar' };
      }

      const data = logSheet.getDataRange().getValues();
      const headers = data[0];
      const filteredData = [headers];

      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();

      for (let i = 1; i < data.length; i++) {
        const logDate = data[i][0];
        if (logDate instanceof Date && logDate >= start && logDate <= end) {
          filteredData.push(data[i]);
        }
      }

      // Converter para CSV
      const csv = filteredData.map(function(row) {
        return row.map(function(cell) {
          let value = cell instanceof Date ? cell.toISOString() : String(cell || '');
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
        filename: `logs_rnc_${new Date().toISOString().split('T')[0]}.csv`
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

  /**
   * ✅ NOVO: Obtém estatísticas de logs (Problema #19)
   */
  function getLogStats() {
    try {
      const logs = getRecentLogs(1000);
      const stats = {
        total: logs.length,
        byLevel: {},
        byUser: {},
        errors: [],
        criticals: []
      };

      logs.forEach(function(log) {
        // Contar por nível
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

        // Contar por usuário
        stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;

        // Coletar erros
        if (log.level === 'ERROR') {
          stats.errors.push({
            action: log.action,
            error: log.error,
            timestamp: log.timestamp
          });
        }

        // Coletar críticos
        if (log.level === 'CRITICAL') {
          stats.criticals.push({
            action: log.action,
            error: log.error,
            timestamp: log.timestamp
          });
        }
      });

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas de logs:', error);
      return null;
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
    getLogStats: getLogStats, // ✅ NOVO
    LOG_LEVELS: LOG_LEVELS
  };
})();

// ===== FUNÇÕES AUXILIARES =====

/**
 * Verifica logs recentes no console
 */
function checkLogs() {
  const logs = Logger.getRecentLogs(50);
  logs.forEach(function(log) {
    console.log([
      log.timestamp,
      log.level,
      log.action,
      log.info
    ].join(' | '));
  });
}

/**
 * Configura trigger para limpeza automática de logs
 */
function setupCleanupTrigger() {
  ScriptApp.newTrigger('cleanOldLogs')
    .timeBased()
    .everyWeeks(1)
    .create();
}
