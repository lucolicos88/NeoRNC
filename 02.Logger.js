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
 *
 * @namespace Logger
 * @since Deploy 31
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
   * Determina nível de log baseado no ambiente de execução.
   * Em desenvolvimento permite DEBUG, em produção apenas INFO ou superior.
   * Inclui fallback seguro em caso de erro ao acessar CONFIG.
   *
   * @return {number} Nível de log (0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=CRITICAL)
   *
   * @private
   * @since Deploy 31
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
   * Sanitiza dados sensíveis antes de logar para proteção de privacidade.
   * Remove ou mascara campos como email, password, token, apiKey, secret e credential.
   * Para emails, mantém apenas o domínio; outros campos sensíveis são substituídos por REDACTED.
   *
   * @param {Object} data - Objeto com dados a serem sanitizados
   * @return {Object} Objeto sanitizado com campos sensíveis mascarados
   *
   * @example
   * const sanitized = sanitizeLogData({ email: 'user@example.com', password: '123456' });
   * // Retorna: { email: '***@example.com', password: '***REDACTED***' }
   *
   * @private
   * @since Deploy 31
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
   * Registra um evento no sistema com timestamp, usuário, ação e contexto.
   * Grava no console e opcionalmente na planilha de logs (apenas INFO ou superior).
   * Inclui stack trace completo para erros e sanitização automática de dados sensíveis.
   *
   * @param {string} level - Nível do log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   * @param {string} action - Ação sendo executada
   * @param {Object} info - Informações contextuais adicionais
   * @param {Error} error - Objeto de erro (se houver)
   * @return {void}
   *
   * @private
   * @since Deploy 31
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
   * Registra log de nível DEBUG para desenvolvimento e diagnóstico.
   * Apenas registra se DEBUG_MODE estiver ativo ou ambiente for development.
   * Não grava na planilha, apenas no console para evitar poluição de logs.
   *
   * @param {string} action - Ação sendo executada
   * @param {Object} [info] - Informações contextuais adicionais
   * @return {void}
   *
   * @example
   * Logger.logDebug('VALIDATING_INPUT', { formId: 'form-123', fieldCount: 5 });
   *
   * @memberof Logger
   * @since Deploy 31
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
   * Registra log de nível INFO para operações normais do sistema.
   * Grava no console e na planilha de logs para auditoria.
   * Use para ações importantes como criação de RNC, envio de emails, etc.
   *
   * @param {string} action - Ação sendo executada
   * @param {Object} [info] - Informações contextuais adicionais
   * @return {void}
   *
   * @example
   * Logger.logInfo('CREATE_RNC', { rncNumber: 'RNC-2024-001', setor: 'Produção' });
   *
   * @memberof Logger
   * @since Deploy 31
   */
  function logInfo(action, info) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      logEvent('INFO', action, info, null);
    }
  }

  /**
   * Registra log de nível WARNING para situações não ideais mas recuperáveis.
   * Use para alertar sobre operações lentas, dados inconsistentes ou configurações subótimas.
   * Grava no console e na planilha para análise posterior.
   *
   * @param {string} action - Ação sendo executada
   * @param {Object} [info] - Informações contextuais adicionais
   * @return {void}
   *
   * @example
   * Logger.logWarning('SLOW_QUERY', { duration: 6500, query: 'SELECT * FROM rnc' });
   *
   * @memberof Logger
   * @since Deploy 31
   */
  function logWarning(action, info) {
    if (currentLogLevel <= LOG_LEVELS.WARNING) {
      logEvent('WARNING', action, info, null);
    }
  }

  /**
   * Registra log de nível ERROR para erros recuperáveis do sistema.
   * Gera stack trace automaticamente se não existir e grava no console e planilha.
   * Use para falhas em operações que não comprometem o sistema inteiro.
   *
   * @param {string} action - Ação que gerou o erro
   * @param {Error} error - Objeto de erro com mensagem e stack trace
   * @param {Object} [info] - Informações contextuais adicionais
   * @return {void}
   *
   * @example
   * Logger.logError('SEND_EMAIL', new Error('SMTP timeout'), { recipient: 'user@example.com' });
   *
   * @memberof Logger
   * @since Deploy 31
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
   * Registra log de nível CRITICAL para erros que podem comprometer o sistema.
   * Gera stack trace, grava no console e planilha, e envia email de alerta ao admin.
   * Use apenas para falhas graves como perda de dados ou indisponibilidade de serviço.
   *
   * @param {string} action - Ação que gerou o erro crítico
   * @param {Error} error - Objeto de erro com mensagem e stack trace
   * @param {Object} [info] - Informações contextuais adicionais
   * @return {void}
   *
   * @example
   * Logger.logCritical('DATABASE_FAILURE', new Error('Sheet not found'), { sheetName: 'RNC' });
   *
   * @memberof Logger
   * @since Deploy 31
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
   * Notifica administrador sobre erro crítico via email.
   * Inclui detalhes completos do erro, stack trace, timestamp e versão do sistema.
   * Falha silenciosamente se AdminEmail não estiver configurado ou envio falhar.
   *
   * @param {string} action - Ação que gerou o erro crítico
   * @param {Error} error - Objeto de erro com mensagem e stack trace
   * @param {Object} info - Informações contextuais adicionais
   * @return {void}
   *
   * @private
   * @since Deploy 31
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
   * Registra performance de operação medindo tempo de execução.
   * Gera WARNING se duração > 5 segundos, ou DEBUG se em modo desenvolvimento.
   * Adiciona automaticamente duration_ms e duration_seconds ao contexto.
   *
   * @param {string} operation - Nome da operação sendo medida
   * @param {number} startTime - Timestamp de início (new Date().getTime())
   * @param {Object} [info] - Informações contextuais adicionais
   * @return {number} Duração em milissegundos
   *
   * @example
   * const start = new Date().getTime();
   * // ... operação demorada ...
   * Logger.logPerformance('PROCESS_BATCH', start, { recordCount: 1000 });
   *
   * @memberof Logger
   * @since Deploy 31
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
   * MELHORIA-07: Log estruturado em formato JSON
   * Facilita parsing e análise de logs
   *
   * @param {string} level - Nível do log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   * @param {Object} logData - Dados estruturados do log
   * @param {string} logData.action - Ação sendo executada
   * @param {string} [logData.user] - Email do usuário (será sanitizado)
   * @param {Object} [logData.metadata] - Metadados adicionais
   * @param {Error} [logData.error] - Objeto de erro (se houver)
   *
   * @example
   * Logger.logStructured('INFO', {
   *   action: 'CREATE_RNC',
   *   user: 'user@example.com',
   *   metadata: { rncId: 'RNC-001', setor: 'Produção' }
   * });
   *
   * @example
   * Logger.logStructured('ERROR', {
   *   action: 'SAVE_DATA',
   *   user: 'user@example.com',
   *   metadata: { sheetName: 'RNC', operation: 'INSERT' },
   *   error: new Error('Timeout')
   * });
   */
  function logStructured(level, logData) {
    try {
      const structuredLog = {
        timestamp: new Date().toISOString(),
        level: level,
        action: logData.action || 'UNKNOWN',
        user: logData.user ? sanitizeEmail(logData.user) : 'system',
        metadata: sanitizeLogData(logData.metadata || {}),
        version: CONFIG.VERSION,
        environment: CONFIG.ENVIRONMENT
      };

      if (logData.error) {
        structuredLog.error = {
          message: logData.error.message || String(logData.error),
          stack: logData.error.stack || null,
          name: logData.error.name || 'Error'
        };
      }

      // Log JSON no console para fácil parsing
      console.log(JSON.stringify(structuredLog));

      // Chamar função de log tradicional para gravar na planilha
      logEvent(level, structuredLog.action, structuredLog.metadata, logData.error || null);

    } catch (error) {
      console.error('Erro ao criar log estruturado:', error);
      // Fallback para log simples
      logEvent(level, logData.action || 'UNKNOWN', logData, null);
    }
  }

  /**
   * Sanitiza email mantendo apenas o domínio para proteção de privacidade.
   * Substitui a parte local por asteriscos, preservando apenas @dominio.com.
   * Retorna apenas asteriscos se formato de email for inválido.
   *
   * @param {string} email - Email a ser sanitizado
   * @return {string} Email sanitizado (ex: '***@example.com')
   *
   * @private
   * @since Deploy 31
   */
  function sanitizeEmail(email) {
    try {
      const parts = email.split('@');
      return parts.length === 2 ? '***@' + parts[1] : '***';
    } catch (e) {
      return '***';
    }
  }

  /**
   * Obtém logs recentes da planilha de auditoria em ordem decrescente.
   * Retorna array de objetos com timestamp, level, user, action, info, error, stack e version.
   * Limite padrão de 100 logs se não especificado.
   *
   * @param {number} [limit=100] - Número máximo de logs a retornar
   * @return {Array<Object>} Array de objetos de log (mais recentes primeiro)
   *
   * @example
   * const logs = Logger.getRecentLogs(50);
   * logs.forEach(log => console.log(log.action, log.timestamp));
   *
   * @memberof Logger
   * @since Deploy 31
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
   * Limpa logs mais antigos que o período especificado para economizar espaço.
   * Remove linhas da planilha de logs mantendo apenas últimos N dias.
   * Padrão de 30 dias se não especificado.
   *
   * @param {number} [daysToKeep=30] - Número de dias de logs a manter
   * @return {Object} Objeto com success, message e opcionalmente error
   *
   * @example
   * const result = Logger.cleanOldLogs(60);
   * console.log(result.message); // "15 logs antigos removidos"
   *
   * @memberof Logger
   * @since Deploy 31
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
   * Exporta logs para formato CSV filtrado por intervalo de datas.
   * Gera arquivo CSV com todos os campos, escapando valores com vírgulas e aspas.
   * Retorna objeto com success, csv string e filename sugerido.
   *
   * @param {Date|string} [startDate] - Data inicial do filtro (default: início dos tempos)
   * @param {Date|string} [endDate] - Data final do filtro (default: hoje)
   * @return {Object} Objeto com success, csv (string) e filename
   *
   * @example
   * const result = Logger.exportLogs('2024-01-01', '2024-12-31');
   * if (result.success) {
   *   console.log('CSV gerado:', result.filename);
   * }
   *
   * @memberof Logger
   * @since Deploy 31
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
   * Define o nível de log mínimo para o sistema dinamicamente.
   * Valores válidos: DEBUG, INFO, WARNING, ERROR, CRITICAL.
   * Altera comportamento de filtragem de logs sem reiniciar sistema.
   *
   * @param {string} level - Nível de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   * @return {void}
   *
   * @example
   * Logger.setLogLevel('DEBUG'); // Habilita todos os logs
   * Logger.setLogLevel('ERROR'); // Apenas erros e críticos
   *
   * @memberof Logger
   * @since Deploy 31
   */
  function setLogLevel(level) {
    if (LOG_LEVELS.hasOwnProperty(level)) {
      currentLogLevel = LOG_LEVELS[level];
      logInfo('LOG_LEVEL_CHANGED', { newLevel: level });
    }
  }

  /**
   * Obtém estatísticas agregadas dos últimos 1000 logs para análise.
   * Retorna contagens por nível, por usuário, lista de erros e críticos.
   * Útil para dashboards e relatórios de health do sistema.
   *
   * @return {Object|null} Objeto com total, byLevel, byUser, errors, criticals
   *
   * @example
   * const stats = Logger.getLogStats();
   * console.log('Total de logs:', stats.total);
   * console.log('Erros:', stats.byLevel.ERROR);
   *
   * @memberof Logger
   * @since Deploy 31
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
    logStructured: logStructured, // MELHORIA-07: Logging estruturado JSON
    getRecentLogs: getRecentLogs,
    cleanOldLogs: cleanOldLogs,
    exportLogs: exportLogs,
    setLogLevel: setLogLevel,
    getLogStats: getLogStats,
    LOG_LEVELS: LOG_LEVELS
  };
})();

// ===== FUNÇÕES AUXILIARES =====

/**
 * Verifica e exibe os últimos 50 logs no console em formato legível.
 * Função auxiliar para debug e monitoramento rápido do sistema.
 * Mostra timestamp, level, action e info de cada log.
 *
 * @return {void}
 *
 * @example
 * checkLogs(); // Exibe últimos 50 logs no console
 *
 * @since Deploy 31
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
 * Configura trigger semanal para limpeza automática de logs antigos.
 * Cria trigger baseado em tempo que executa cleanOldLogs toda semana.
 * Execute manualmente uma vez para ativar manutenção automática.
 *
 * @return {void}
 *
 * @example
 * setupCleanupTrigger(); // Ativa limpeza semanal automática
 *
 * @since Deploy 31
 */
function setupCleanupTrigger() {
  ScriptApp.newTrigger('cleanOldLogs')
    .timeBased()
    .everyWeeks(1)
    .create();
}
