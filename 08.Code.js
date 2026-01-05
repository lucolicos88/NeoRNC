/**
 * ============================================
 * CODE.GS - Arquivo Principal de Coordenação
 * Sistema RNC Neoformula
 * ============================================
 *
 * ORDEM DE CARREGAMENTO DOS ARQUIVOS NO GAS:
 * 1. Config.gs
 * 2. Logger.gs
 * 3. Database.gs
 * 4. ConfigManager.gs
 * 5. FileManager.gs
 * 6. RncOperations.gs
 * 7. Reports.gs
 * 8. Code.gs (este arquivo)
 *
 * ============================================
 */

// ===== MÉDIA-01: STANDARDIZED RESPONSE MODULE =====

/**
 * MELHORIA-06: Módulo para padronizar respostas de API
 * Garante consistência em todas as respostas do sistema
 *
 * @module ApiResponse
 * @description Fornece métodos para criar respostas padronizadas
 * @example
 * // Sucesso com dados
 * return ApiResponse.success({ id: 123, name: 'RNC-001' }, 'RNC criada com sucesso');
 *
 * // Erro de validação
 * return ApiResponse.validationError({ email: 'Email inválido', nome: 'Nome obrigatório' });
 *
 * // Uso do tryCatch
 * return ApiResponse.tryCatch(() => createRnc(data), 'createRnc');
 */
var ApiResponse = (function() {
  'use strict';

  /**
   * Cria resposta de sucesso padronizada
   * @param {*} [data] - Dados da resposta (opcional)
   * @param {string} [message] - Mensagem opcional de sucesso
   * @returns {{success: boolean, timestamp: string, data?: *, message?: string}} Resposta padronizada
   * @example
   * ApiResponse.success({ count: 5 }, 'Operação concluída')
   * // Returns: { success: true, timestamp: '2024-12-09T...', data: { count: 5 }, message: '...' }
   */
  function success(data, message) {
    var response = {
      success: true,
      timestamp: new Date().toISOString()
    };

    if (data !== undefined && data !== null) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    return response;
  }

  /**
   * Cria resposta de erro padronizada
   * @param {string} errorCode - Código do erro (ex: 'VALIDATION_ERROR', 'NOT_FOUND')
   * @param {string} message - Mensagem de erro amigável
   * @param {Object} details - Detalhes adicionais do erro (opcional)
   * @returns {Object} Resposta de erro padronizada
   */
  function error(errorCode, message, details) {
    var response = {
      success: false,
      error: {
        code: errorCode || 'UNKNOWN_ERROR',
        message: message || 'Ocorreu um erro inesperado',
        timestamp: new Date().toISOString()
      }
    };

    if (details) {
      response.error.details = details;
    }

    return response;
  }

  /**
   * Cria resposta de erro de validação
   * @param {Object} validationErrors - Mapa de erros de validação {campo: mensagem}
   * @returns {Object} Resposta de erro de validação
   */
  function validationError(validationErrors) {
    return error(
      'VALIDATION_ERROR',
      'Dados inválidos',
      { fields: validationErrors }
    );
  }

  /**
   * Cria resposta de erro de permissão
   * @param {string} message - Mensagem de erro
   * @returns {Object} Resposta de erro de permissão
   */
  function forbidden(message) {
    return error(
      'FORBIDDEN',
      message || 'Você não tem permissão para executar esta ação'
    );
  }

  /**
   * Cria resposta de erro de não encontrado
   * @param {string} resource - Recurso não encontrado
   * @returns {Object} Resposta de erro de não encontrado
   */
  function notFound(resource) {
    return error(
      'NOT_FOUND',
      resource ? resource + ' não encontrado(a)' : 'Recurso não encontrado'
    );
  }

  /**
   * Wrapper para capturar erros de funções e retornar resposta padronizada
   * @param {Function} fn - Função a ser executada
   * @param {string} operationName - Nome da operação (para log)
   * @returns {Object} Resposta padronizada (sucesso ou erro)
   */
  function tryCatch(fn, operationName) {
    try {
      var result = fn();

      // Se a função já retorna resposta padronizada, use-a
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }

      // Caso contrário, envolva em resposta de sucesso
      return success(result);
    } catch (error) {
      Logger.logError(operationName || 'tryCatch', error);
      return ApiResponse.error(
        'INTERNAL_ERROR',
        'Erro ao processar operação: ' + (error.message || error.toString())
      );
    }
  }

  return {
    success: success,
    error: error,
    validationError: validationError,
    forbidden: forbidden,
    notFound: notFound,
    tryCatch: tryCatch
  };
})();

// ===== TASK-011: CSRF PROTECTION =====

/**
 * MELHORIA-06: Módulo de proteção contra CSRF (Cross-Site Request Forgery)
 *
 * @module CSRFProtection
 * @description Gera e valida tokens CSRF para prevenir ataques CSRF
 * Tokens são armazenados no CacheService com TTL de 30 minutos
 *
 * @example
 * // Gerar token ao autenticar
 * const token = CSRFProtection.generateToken(userEmail);
 *
 * // Validar token em operações de escrita
 * if (!CSRFProtection.validateToken(userEmail, token)) {
 *   return ApiResponse.forbidden('Token CSRF inválido');
 * }
 *
 * // Forçar validação (lança erro se inválido)
 * CSRFProtection.enforce(userEmail, token);
 */
var CSRFProtection = (function() {
  'use strict';

  /** Tempo de vida do token em segundos */
  var TOKEN_TTL = 1800; // 30 minutos

  /**
   * Gera um token CSRF único para o usuário
   * @param {string} user - Email do usuário
   * @returns {string} Token CSRF codificado em Base64
   * @throws {Error} Se falhar ao gerar o token
   * @example
   * const token = CSRFProtection.generateToken('user@example.com');
   * // Returns: 'dXNlckBleGFtcGxlLmNvbXwxNjM...'
   */
  function generateToken(user) {
    try {
      var timestamp = new Date().getTime();
      var random = Math.random().toString(36).substring(2);
      var data = user + '|' + timestamp + '|' + random;

      // Usar Cache Service para armazenar token temporariamente
      var cache = CacheService.getUserCache();
      var token = Utilities.base64Encode(data);
      cache.put('csrf_' + user, token, TOKEN_TTL);

      return token;
    } catch (error) {
      Logger.logError('CSRFProtection.generateToken', error, { user: user });
      throw new Error('Failed to generate CSRF token');
    }
  }

  /**
   * Valida um token CSRF
   * @param {string} user - Email do usuário
   * @param {string} token - Token a ser validado
   * @returns {boolean} True se válido
   */
  function validateToken(user, token) {
    try {
      if (!token || !user) return false;

      var cache = CacheService.getUserCache();
      var cachedToken = cache.get('csrf_' + user);

      return cachedToken === token;
    } catch (error) {
      Logger.logError('CSRFProtection.validateToken', error, { user: user });
      return false;
    }
  }

  /**
   * Valida token e lança erro se inválido
   * @param {string} user - Email do usuário
   * @param {string} token - Token a ser validado
   */
  function enforce(user, token) {
    if (!validateToken(user, token)) {
      throw new Error('Invalid CSRF token. Please reload the page and try again.');
    }
  }

  return {
    generateToken: generateToken,
    validateToken: validateToken,
    enforce: enforce
  };
})();

// ===== TASK-009: RATE LIMITING =====

/**
 * TASK-009: Implementa rate limiting usando Cache Service
 * Previne abuse e ataques DoS
 */
var RateLimiter = (function() {
  'use strict';

  // Configurações de rate limiting
  var LIMITS = {
    // Limite de requisições por usuário
    PER_USER: {
      maxRequests: 60,      // 60 requisições
      windowSeconds: 60     // por minuto
    },
    // Limite de operações de escrita
    WRITE_OPS: {
      maxRequests: 10,      // 10 escritas
      windowSeconds: 60     // por minuto
    }
  };

  /**
   * Verifica se o usuário excedeu o rate limit
   * @param {string} user - Email do usuário
   * @param {string} type - Tipo de operação ('general' ou 'write')
   * @returns {Object} {allowed: boolean, remaining: number, resetIn: number}
   */
  function checkLimit(user, type) {
    try {
      var cache = CacheService.getUserCache();
      var limit = type === 'write' ? LIMITS.WRITE_OPS : LIMITS.PER_USER;
      var cacheKey = 'ratelimit_' + type + '_' + user;

      // Obter contagem atual do cache
      var cachedData = cache.get(cacheKey);
      var currentCount = cachedData ? parseInt(cachedData) : 0;

      // Verificar se excedeu o limite
      if (currentCount >= limit.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: limit.windowSeconds
        };
      }

      // Incrementar contador
      currentCount++;
      cache.put(cacheKey, currentCount.toString(), limit.windowSeconds);

      return {
        allowed: true,
        remaining: limit.maxRequests - currentCount,
        resetIn: limit.windowSeconds
      };

    } catch (error) {
      Logger.logError('RateLimiter.checkLimit', error, { user: user, type: type });
      // TASK-009: Fail-safe CONSERVADOR - bloquear em caso de erro do rate limiter
      // Isso previne abuso se o sistema de cache falhar
      Logger.logWarning('RateLimiter_FAIL_CLOSED', { user: user, type: type });
      return { allowed: false, remaining: 0, resetIn: 60 };
    }
  }

  /**
   * Verifica rate limit e lança erro se excedido
   * @param {string} user - Email do usuário
   * @param {string} type - Tipo de operação
   */
  function enforce(user, type) {
    var result = checkLimit(user, type || 'general');
    if (!result.allowed) {
      throw new Error('Rate limit exceeded. Try again in ' + result.resetIn + ' seconds.');
    }
    return result;
  }

  return {
    checkLimit: checkLimit,
    enforce: enforce
  };
})();

// ===== FUNÇÕES PRINCIPAIS DO SISTEMA =====

// ============================================
// FASE 2.4: Otimização de ordenação de números RNC - 30-40% ganho
// ============================================
/**
 * Ordena números de RNC de forma otimizada
 * FASE 2.4: Parseia números apenas UMA VEZ ao invés de a cada comparação
 * @param {Array<string>} rncNumbers - Array de números no formato "XXXX/YYYY"
 * @return {Array<string>} Array ordenado (mais recentes primeiro)
 * @private
 */
function sortRncNumbers(rncNumbers) {
  // Map: criar pares [original, {year, number}] - parseia UMA VEZ
  var mapped = rncNumbers.map(function(num) {
    var parts = num.split('/');
    return {
      original: num,
      year: parseInt(parts[1]) || 0,
      number: parseInt(parts[0]) || 0
    };
  });

  // Sort: usar os números já parseados
  mapped.sort(function(a, b) {
    if (a.year !== b.year) return b.year - a.year;
    return b.number - a.number;
  });

  // Map: extrair originais
  return mapped.map(function(item) {
    return item.original;
  });
}

/**
 * Ponto de entrada da aplicação web COM AUTENTICAÇÃO FORÇADA
 * Gerencia autenticação, rate limiting e carrega interface HTML
 *
 * @param {Object} e - Objeto de evento do Google Apps Script
 * @return {HtmlOutput} Interface HTML da aplicação ou tela de erro/login
 *
 * @example
 * // Chamado automaticamente quando usuário acessa a URL da aplicação
 * // Valida email, aplica rate limiting e retorna interface
 *
 * @since Deploy 33 - Correção de Autenticação
 * @since Deploy 119
 */
function doGet(e) {
  try {
    // ✨ NOVA LÓGICA: Forçar autenticação ANTES de tudo
    var user = Session.getActiveUser().getEmail();

    // Método alternativo se o primeiro falhar
    if (!user || user === '' || user === 'anonymous') {
      user = Session.getEffectiveUser().getEmail();
    }

    // TASK-010: Validação rigorosa de email
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!user || user === '' || user === 'anonymous' || !emailRegex.test(user)) {
      Logger.logWarning('doGet_INVALID_EMAIL', { user: user });
      return HtmlService.createHtmlOutput('<h1>❌ Acesso Negado</h1><p>Email inválido ou não autenticado.</p>');
    }

    // TASK-002: Log sanitizado - não expõe email completo
    console.log('🔍 [doGet] Usuário autenticado: ' + (user ? '***@' + user.split('@')[1] : 'nenhum'));

    // TASK-009: Aplicar rate limiting
    if (user && user !== '' && user !== 'anonymous') {
      try {
        RateLimiter.enforce(user, 'general');
      } catch (rateLimitError) {
        Logger.logWarning('doGet_RATE_LIMIT', { user: user });
        return HtmlService.createHtmlOutput('<h1>Rate Limit Exceeded</h1><p>' + rateLimitError.message + '</p>');
      }
    }

    // ❌ SE NÃO CONSEGUIR PEGAR EMAIL, MOSTRAR TELA DE LOGIN
    if (!user || user === '' || user === 'anonymous') {
      console.log('❌ [doGet] Usuário não autenticado, mostrando tela de login');
      
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Necessário - RNC Neoformula</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #009688 0%, #00796B 100%);
              padding: 20px;
            }
            .container {
              background: white;
              padding: 50px 40px;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
              width: 100%;
              animation: fadeIn 0.5s ease;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
              animation: bounce 2s infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            h1 {
              color: #009688;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 15px;
            }
            p {
              color: #666;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .users-list {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: left;
            }
            .users-list strong {
              display: block;
              margin-bottom: 10px;
              color: #333;
              font-size: 14px;
            }
            .user-item {
              padding: 10px;
              background: white;
              margin-bottom: 8px;
              border-radius: 6px;
              font-size: 13px;
              color: #555;
              border-left: 3px solid #009688;
            }
            .btn {
              background: #009688;
              color: white;
              border: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(0,150,136,0.3);
            }
            .btn:hover {
              background: #00796B;
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,150,136,0.4);
            }
            .btn:active {
              transform: translateY(0);
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #999;
            }
            .alert {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-left: 4px solid #ffc107;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
              text-align: left;
              font-size: 13px;
              color: #856404;
            }
            .alert strong {
              display: block;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🔐</div>
            <h1>Autenticação Necessária</h1>
            <p>
              Para acessar o <strong>Sistema RNC Neoformula</strong>, você precisa fazer login com uma conta Google autorizada.
            </p>
            
            <div class="users-list">
              <strong>📧 Acesso Restrito:</strong>
              <div class="user-item">✅ Apenas contas Google autorizadas podem acessar este sistema</div>
              <div class="user-item">🔒 A lista de usuários autorizados é gerenciada pelo administrador</div>
            </div>
            
            <button class="btn" onclick="window.location.reload()">
              🔄 Fazer Login com Google
            </button>
            
            <div class="alert">
              <strong>⚠️ Importante:</strong>
              Após clicar no botão, selecione uma das contas autorizadas acima.<br>
              Se você não tiver acesso, entre em contato com o administrador.
            </div>
            
            <div class="footer">
              Sistema RNC • Neoformula 2025<br>
              Deploy 33 - Autenticação Segura
            </div>
          </div>
        </body>
        </html>
      `)
        .setTitle('Login Necessário - RNC Neoformula')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    
    // ✅ USUÁRIO AUTENTICADO - CONTINUAR NORMALMENTE
    console.log('✅ [doGet] Usuário autenticado: ' + user);
    
    Logger.logInfo('APP_ACCESS', {
      user: user,
      parameters: e ? e.parameters : null
    });
    
    // Inicializar sistema se necessário
    try {
      initializeSystemFast();
    } catch (initError) {
      Logger.logDebug('SYSTEM_ALREADY_INITIALIZED', { message: 'Sistema já inicializado' });
    }
    
    // Criar template HTML
    var template = HtmlService.createTemplateFromFile('index');
    
    // Passar contexto inicial para o template
    var context = getUserContextOptimized();
    
    console.log('🔍 [doGet] Contexto retornado:');
    console.log('  - Email: ' + context.email);
    console.log('  - Roles: ' + (context.roles ? context.roles.join(', ') : 'NENHUMA'));
    console.log('  - HasPermissions: ' + context.hasPermissions);

    // SEGURANÇA: Filtrar dados sensíveis antes de enviar ao cliente
    var safeContext = {
      email: context.email,
      role: context.role,
      roles: context.roles,
      permissions: context.permissions,
      isAdmin: context.isAdmin,
      canConfig: context.canConfig,
      setor: context.setor,
      hasPermissions: context.hasPermissions,
      fieldsConfig: context.fieldsConfig,
      lists: context.lists,
      listNames: context.listNames,
      sections: context.sections,
      fieldTypes: context.fieldTypes,
      fieldMapping: context.fieldMapping,
      systemConfig: context.systemConfig,
      statusPipeline: context.statusPipeline,
      version: context.version,
      theme: context.theme
      // NÃO INCLUIR: csrfToken (linha 874)
    };

    template.contextData = JSON.stringify(safeContext);
    
    // Retornar HTML
    var output = template.evaluate()
      .setTitle('RNC • Neoformula')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setFaviconUrl('https://neoformula.com.br/favicon.ico');
    
    return output;
    
  } catch (error) {
    console.log('❌ [doGet] ERRO: ' + error.toString());
    Logger.logCritical('APP_ACCESS_ERROR', error);

    // TASK-011: Gerar ID único do erro (timestamp + hash simples)
    var errorId = 'ERR-' + new Date().getTime();

    // TASK-011: NÃO expor stack trace para o usuário - mensagem genérica
    // O erro completo fica apenas nos logs do servidor
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Erro - RNC Neoformula</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .error-container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: 0 auto;
          }
          h1 {
            color: #F44336;
            margin-bottom: 20px;
          }
          .error-message {
            background: #ffebee;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #F44336;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .error-id {
            font-family: monospace;
            font-size: 12px;
            color: #999;
            margin-top: 10px;
          }
          .btn {
            background: #009688;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>⚠️ Erro no Sistema</h1>
          <p>Ocorreu um erro ao carregar o sistema RNC.</p>
          <div class="error-message">
            Não foi possível inicializar o sistema. Por favor, tente novamente.
            <div class="error-id">ID do erro: ${errorId}</div>
          </div>
          <button class="btn" onclick="location.reload()">🔄 Tentar Novamente</button>
          <p style="margin-top: 20px; font-size: 13px; color: #999;">
            Se o problema persistir, entre em contato com:<br>
            <strong>producao.neoformula@gmail.com</strong><br>
            Informe o ID do erro acima.
          </p>
        </div>
      </body>
      </html>
    `)
      .setTitle('Erro - RNC Neoformula');
  }
}

/**
 * Inicialização rápida do sistema
 * Valida configurações, cria planilhas e inicializa configurações padrão
 *
 * @return {Object} Resultado da inicialização com propriedades {success, message, version}
 *
 * @example
 * var result = initializeSystemFast();
 * // Returns: {success: true, message: 'Sistema inicializado com sucesso', version: '...'}
 *
 * @since Deploy 119
 */
function initializeSystemFast() {
  var startTime = new Date().getTime();
  
  try {
    Logger.logInfo('INIT_SYSTEM_START', { version: CONFIG.VERSION });
    
    // Validar configurações
    var validation = validateSystemConfig();
    if (!validation.valid) {
      throw new Error('Configuração inválida: ' + validation.errors.join(', '));
    }
    
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Criar planilhas se não existirem
    initializeSheets(ss);
    
    // Inicializar configurações padrão
    initializeDefaultConfigs();
    
    Logger.logInfo('INIT_SYSTEM_COMPLETE', {
      success: true,
      duration: Logger.logPerformance('initializeSystem', startTime)
    });
    
    return { 
      success: true, 
      message: 'Sistema inicializado com sucesso',
      version: CONFIG.VERSION
    };
    
  } catch (error) {
    Logger.logCritical('INIT_SYSTEM_ERROR', error);
    throw error;
  }
}

/**
 * Inicializa planilhas necessárias do sistema
 * Cria abas RNC, Anexos, Logs e outras planilhas de configuração
 *
 * @param {Spreadsheet} ss - Objeto Spreadsheet do Google Sheets
 * @return {void}
 *
 * @example
 * var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
 * initializeSheets(ss);
 *
 * @private
 * @since Deploy 119
 */
function initializeSheets(ss) {
  // Planilha RNC
  var rncSheet = Database.getSheet(CONFIG.SHEETS.RNC, [
    'Nº RNC', 'Status Geral', 'Data Criação', 'Usuário Criação',
    'Data de Abertura', 'Responsável pela abertura da RNC', 'Setor onde foi feita abertura\n',
    'Nome do Cliente', 'Código do Cliente', 'Telefone do Cliente',
    'Filial de Origem', 'Requisição', 'Número do pedido', 'Prescritor',
    'Tipo RNC', 'Forma Farmacêutica', 'Descrição Detalhada da RNC/Reclamação',
    'Descrição do Problema', 'Prioridade', 'Observações',
    'Setor onde ocorreu a não conformidade', 'Data da Análise', 'Risco',
    'Tipo de Falha', 'Análise da Causa Raiz (relatório)', 'Ação Corretiva Imediata',
    'Gerou custo de cortesia?', 'Req de Cortesia', 'Valor',
    'Plano de ação', 'Status da Ação Corretiva', 'Data limite para execução',
    'Data da conclusão da Ação', 'Responsável pela ação corretiva',
    'Última Edição', 'Editado Por'
  ]);
  
  // Planilha de Anexos
  var anexosSheet = Database.getSheet(CONFIG.SHEETS.ANEXOS, [
    'RncNumero', 'NomeArquivo', 'NomeOriginal', 'TipoArquivo', 
    'Tamanho', 'DriveFileId', 'DataUpload', 'UsuarioUpload', 'Seção', 'Url'
  ]);
  
  // Planilha de Logs
  var logsSheet = Database.getSheet(CONFIG.SHEETS.LOGS, [
    'Timestamp', 'Level', 'User', 'Action', 'Info', 'Error', 'Stack', 'Version'
  ]);
  
  // Outras planilhas são criadas sob demanda pelos módulos
}

/**
 * Inicializa configurações padrão do sistema
 * Cria seções, campos, listas e permissões padrão se não existirem
 *
 * @return {void}
 *
 * @example
 * initializeDefaultConfigs();
 * // Cria seções: Abertura, Qualidade, Liderança
 * // Cria listas padrão de colaboradores, setores, etc
 *
 * @private
 * @since Deploy 119
 */
function initializeDefaultConfigs() {
  // Seções padrão
  var secoesSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_SECOES, ['Nome', 'Descrição', 'Ordem', 'Ativo']);
  if (secoesSheet.getLastRow() <= 1) {
    Database.insertData(CONFIG.SHEETS.CONFIG_SECOES, [
      { Nome: 'Abertura', Descrição: 'Campos para abertura da RNC', Ordem: 1, Ativo: 'Sim' },
      { Nome: 'Qualidade', Descrição: 'Análise da qualidade', Ordem: 2, Ativo: 'Sim' },
      { Nome: 'Liderança', Descrição: 'Plano de ação e aprovação', Ordem: 3, Ativo: 'Sim' }
    ]);
  }
  
  // Campos padrão
  var camposSheet = Database.getSheet(CONFIG.SHEETS.CONFIG_CAMPOS, [
    'Seção', 'Campo', 'Tipo', 'Obrigatório', 'Placeholder', 'Lista', 'Ordem', 'Ativo', 'ValidaçãoRegex', 'MensagemErro'
  ]);
  
  if (camposSheet.getLastRow() <= 1) {
    var defaultFields = [
      // Abertura
      { Seção: 'Abertura', Campo: 'Data', Tipo: 'date', Obrigatório: 'Sim', Placeholder: '', Lista: '', Ordem: 1, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Responsável pela abertura da RNC', Tipo: 'select', Obrigatório: 'Sim', Placeholder: 'Selecione o responsável', Lista: 'Colaboradores', Ordem: 2, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Setor onde foi feita abertura', Tipo: 'select', Obrigatório: 'Sim', Placeholder: 'Setor da abertura', Lista: 'Setores', Ordem: 3, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Nome do Cliente', Tipo: 'input', Obrigatório: 'Sim', Placeholder: 'Digite o nome completo', Lista: '', Ordem: 4, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Filial de Origem', Tipo: 'select', Obrigatório: 'Não', Placeholder: 'Selecione a filial', Lista: 'Filiais', Ordem: 7, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Tipo da RNC', Tipo: 'select', Obrigatório: 'Sim', Placeholder: 'Tipo da RNC', Lista: 'TiposRNC', Ordem: 11, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Descrição Detalhada da RNC/Reclamação', Tipo: 'textarea', Obrigatório: 'Sim', Placeholder: 'Descreva detalhadamente', Lista: '', Ordem: 13, Ativo: 'Sim' },
      { Seção: 'Abertura', Campo: 'Anexo de Documentos', Tipo: 'file', Obrigatório: 'Não', Placeholder: 'Selecione arquivos', Lista: '', Ordem: 14, Ativo: 'Sim' }
    ];
    
    Database.insertData(CONFIG.SHEETS.CONFIG_CAMPOS, defaultFields);
  }
  
  // Listas padrão
  var listasSheet = Database.getSheet(CONFIG.SHEETS.LISTAS, [
    'Colaboradores', 'Riscos', 'Setores', 'TiposRNC', 'TiposFalha', 'SimNao', 'StatusAcao', 'StatusGeral', 'FormasFarmaceuticas', 'Filiais'
  ]);
  
  if (listasSheet.getLastRow() <= 1) {
    var defaultLists = [
      ['João Silva', 'Baixo', 'Produção', 'Interna - Neoformula', 'Falha no processo', 'Sim', 'Planejada', 'Abertura RNC', 'Cápsula', 'Matriz'],
      ['Maria Santos', 'Médio', 'Qualidade', 'Externa - Cliente', 'Falha no produto', 'Não', 'Em andamento', 'Análise Qualidade', 'Comprimido', 'Filial 1'],
      ['Carlos Lima', 'Alto', 'Comercial', 'Externa - Fornecedor', 'Falha no serviço', '', 'Concluída', 'Análise do problema e Ação Corretiva', 'Loção', 'Filial 2'],
      ['Ana Costa', 'Crítico', 'Administrativo', 'Não procede', 'Falha humana', '', 'Cancelada', 'Finalizada', 'Gel', 'Filial 3']
    ];
    
    for (var i = 0; i < defaultLists.length; i++) {
      listasSheet.appendRow(defaultLists[i]);
    }
  }
  
  // Permissões padrão
  var permSheet = Database.getSheet(CONFIG.SHEETS.PERMISSOES, ['Email', 'Role', 'Ativo']);
  if (permSheet.getLastRow() <= 1) {
    Database.insertData(CONFIG.SHEETS.PERMISSOES, {
      Email: 'producao.neoformula@gmail.com',
      Role: 'Admin',
      Ativo: 'Sim'
    });
  }
}

/**
 * Obtém contexto do usuário otimizado COM PERMISSÕES E VALIDAÇÃO
 * Deploy 33 - Validação de Permissões
 */
function getUserContextOptimized() {
  var startTime = new Date().getTime();
  
  try {
    var email = Session.getActiveUser().getEmail() || 'anonymous';
    Logger.logInfo('GET_USER_CONTEXT', { email: email });
    
    console.log('🔍 [getUserContext] Email: ' + email);
    
    // ✨ OBTER PERMISSÕES PRIMEIRO
    var userPermissions = PermissionsManager.getUserPermissions(email);
    
    console.log('🔍 [getUserContext] Permissões retornadas:');
    console.log('  - Roles: ' + userPermissions.roles.join(', '));
    console.log('  - IsAdmin: ' + userPermissions.isAdmin);
    console.log('  - Total roles: ' + userPermissions.roles.length);
    
    // ✨ VALIDAR: Se não tem roles OU só tem Espectador sem permissões reais
    if (!userPermissions.roles || userPermissions.roles.length === 0) {
      console.log('❌ [getUserContext] NENHUMA ROLE ENCONTRADA');
      
      return {
        error: 'Sem permissões',
        email: email,
        hasPermissions: false,
        roles: [],
        debugInfo: {
          userPermissions: userPermissions,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Se só tem "Espectador" e não é deliberado, pode ser problema
    if (userPermissions.roles.length === 1 && 
        userPermissions.roles[0] === 'Espectador' && 
        email !== 'anonymous') {
      console.log('⚠️ [getUserContext] Usuário tem apenas role Espectador');
      
      // Verificar se realmente está cadastrado ou é fallback
      var permData = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Email': email
      });
      
      if (permData.length === 0) {
        console.log('❌ [getUserContext] Email não encontrado na planilha Permissoes');
        
        return {
          error: 'Usuário não cadastrado',
          email: email,
          hasPermissions: false,
          roles: ['Espectador'],
          debugInfo: {
            message: 'Email não encontrado na planilha de permissões',
            timestamp: new Date().toISOString()
          }
        };
      }
    }
    
    console.log('✅ [getUserContext] Usuário tem ' + userPermissions.roles.length + ' role(s) válida(s)');
    
    // Obter configurações
    var fieldsConfig = {};
    var sections = ConfigManager.getSections();
    
    // Obter campos por seção
    for (var i = 0; i < sections.length; i++) {
      fieldsConfig[sections[i].nome] = ConfigManager.getFieldsForSection(sections[i].nome);
    }
    
    // Obter listas
    var lists = ConfigManager.getLists();
    
    // Configurações do sistema
    var systemConfig = {
      pastaGID: getSystemConfig('PastaGID', CONFIG.DRIVE_FOLDER_ID),
      statusPipeline: Object.values(CONFIG.STATUS_PIPELINE),
      renomearArquivos: getSystemConfig('RenomearArquivos', 'Sim') === 'Sim',
      maxFileSize: getSystemConfig('MaxFileSize', CONFIG.SYSTEM.MAX_FILE_SIZE)
    };
    
    // TASK-011: Gerar token CSRF para o usuário
    var csrfToken = CSRFProtection.generateToken(email);

    var context = {
      email: email,
      role: userPermissions.roles[0] || 'Espectador',
      roles: userPermissions.roles,
      permissions: userPermissions.permissions,
      isAdmin: userPermissions.isAdmin,
      canConfig: userPermissions.isAdmin,
      setor: userPermissions.setor, // Deploy 68: Incluir setor do usuário
      hasPermissions: true, // ✨ Flag explícita
      csrfToken: csrfToken, // TASK-011: Token CSRF
      fieldsConfig: fieldsConfig,
      lists: lists,
      listNames: Object.keys(lists),
      sections: sections,
      fieldTypes: CONFIG.FIELD_TYPES,
      fieldMapping: FIELD_MAPPING,
      systemConfig: systemConfig,
      statusPipeline: CONFIG.STATUS_PIPELINE,
      version: CONFIG.VERSION,
      theme: {
        PrimaryColor: '#009688',
        AccentColor: '#FFB300',
        BgColor: '#FAFAFA',
        TextColor: '#222',
        LogoUrl: 'https://neoformula.com.br/cdn/shop/files/Logotipo-NeoFormula-Manipulacao-Homeopatia_76b2fa98-5ffa-4cc3-ac0a-6d41e1bc8810.png?height=100&v=1677088468'
      }
    };
    
    console.log('✅ [getUserContext] Contexto completo criado com sucesso');
    
    Logger.logInfo('GET_USER_CONTEXT_SUCCESS', {
      email: email,
      roles: userPermissions.roles.join(', '),
      isAdmin: userPermissions.isAdmin,
      duration: Logger.logPerformance('getUserContext', startTime)
    });
    
    return context;
    
  } catch (error) {
    console.log('❌ [getUserContext] ERRO: ' + error.toString());
    Logger.logError('GET_USER_CONTEXT_ERROR', error);
    
    return {
      error: error.toString(),
      email: Session.getActiveUser().getEmail(),
      hasPermissions: false
    };
  }
}

/**
 * Obtém role do usuário baseado nas permissões
 * Busca role na planilha de permissões, retorna 'Usuario' como padrão
 *
 * @param {string} email - Email do usuário
 * @return {string} Role do usuário ('Admin', 'Usuario', 'Espectador', etc)
 *
 * @example
 * var role = getUserRole('usuario@example.com');
 * // Returns: 'Admin' ou 'Usuario'
 *
 * @private
 * @since Deploy 119
 */
function getUserRole(email) {
  try {
    var permissions = Database.findData(CONFIG.SHEETS.PERMISSOES, {
      'Email': email,
      'Ativo': 'Sim'
    });
    
    if (permissions.length > 0) {
      return permissions[0]['Role'] || 'Usuario';
    }
    
    // Default para Admin se for o email configurado
    if (email === 'producao.neoformula@gmail.com') {
      return 'Admin';
    }
    
    return 'Usuario';
    
  } catch (error) {
    Logger.logError('getUserRole', error, { email: email });
    return 'Usuario';
  }
}

// ===== FUNÇÕES EXPOSTAS PARA O FRONTEND =====

// RNC Operations

/**
 * Salva nova RNC no sistema
 * @param {Object} formData - Dados do formulário de RNC
 * @param {Array} files - Arquivos anexados (opcional)
 * @return {Object} Resultado da operação com propriedades {success, rncNumber, message}
 * @since Deploy 119
 */
function saveRnc(formData, files) { return RncOperations.saveRnc(formData, files); }

/**
 * Atualiza RNC existente
 * @param {string} rncNumber - Número da RNC no formato "XXXX/YYYY"
 * @param {Object} formData - Dados atualizados do formulário
 * @param {Array} files - Arquivos anexados (opcional)
 * @return {Object} Resultado da operação com propriedades {success, message}
 * @since Deploy 119
 */
function updateRnc(rncNumber, formData, files) { return RncOperations.updateRnc(rncNumber, formData, files); }

/**
 * Busca RNC por número
 * @param {string} rncNumber - Número da RNC no formato "XXXX/YYYY"
 * @return {Object|null} Objeto com dados da RNC ou null se não encontrada
 * @since Deploy 119
 */
function getRncByNumber(rncNumber) { return RncOperations.getRncByNumber(rncNumber); }

/**
 * Busca todas as RNCs com filtros opcionais
 * @param {Object} filters - Filtros para busca (opcional)
 * @return {Array<Object>} Array de objetos RNC
 * @since Deploy 119
 */
function getAllRncs(filters) { return RncOperations.getAllRncs(filters); }

/**
 * Busca apenas números de todas as RNCs
 * @return {Array<string>} Array de números de RNC ordenados
 * @since Deploy 119
 */
function getAllRncNumbers() { return RncOperations.getAllRncNumbers(); }

/**
 * Busca RNCs por termo de pesquisa
 * @param {string} searchTerm - Termo para buscar em múltiplos campos
 * @return {Array<Object>} Array de RNCs que correspondem à busca
 * @since Deploy 119
 */
function searchRncs(searchTerm) { return RncOperations.searchRncs(searchTerm); }

/**
 * Busca RNCs por setor
 * @param {string} setor - Nome do setor
 * @return {Array<Object>} Array de RNCs do setor especificado
 * @since Deploy 119
 */
function getRncsBySetor(setor) { return RncOperations.getRncsBySetor(setor); }

/**
 * Busca RNCs filtradas pelo setor do usuário autenticado
 * Admins visualizam todas as RNCs, outros usuários veem apenas do seu setor
 *
 * @return {Array<Object>} Array de RNCs filtradas por permissão do usuário
 *
 * @example
 * var rncs = getRncsByUserSetor();
 * // Admin: retorna todas
 * // Usuário: retorna apenas do seu setor
 *
 * @since Deploy 66
 * @since Deploy 119
 */
function getRncsByUserSetor() {
  var userEmail = Session.getActiveUser().getEmail();
  var userPerms = PermissionsManager.getUserPermissions(userEmail);

  // Se for Admin, retornar todas as RNCs
  if (userPerms.isAdmin) {
    return RncOperations.getAllRncs();
  }

  // Se não for Admin, filtrar por setor
  return RncOperations.getRncsByUserSetor(userEmail);
}

/**
 * Obtém histórico de alterações de uma RNC
 * Retorna array de registros com mudanças, timestamps e usuários
 *
 * @param {string} rncNumber - Número da RNC no formato "XXXX/YYYY"
 * @return {Array<Object>} Array de objetos com histórico de alterações
 *
 * @example
 * var historico = getHistoricoRnc('0001/2024');
 * // Returns: [{campo: 'Status', valorAnterior: 'Abertura', valorNovo: 'Análise', ...}]
 *
 * @since Deploy 34 - Histórico de alterações
 * @since Deploy 119
 */
function getHistoricoRnc(rncNumber) {
  try {
    var result = HistoricoManager.getHistoricoRnc(rncNumber);

    Logger.logInfo('getHistoricoRnc_WRAPPER', {
      rncNumber: rncNumber,
      resultType: typeof result,
      isArray: Array.isArray(result),
      length: result ? result.length : 'null/undefined',
      firstItem: result && result.length > 0 ? JSON.stringify(result[0]) : 'empty'
    });

    return result;
  } catch (error) {
    Logger.logError('getHistoricoRnc_WRAPPER_ERROR', error, {
      rncNumber: rncNumber
    });
    return [];
  }
}
//function getSetoresUnicos() { return RncOperations.getSetoresUnicos(); }
//function getRncNumbersBySetor(setor) { return RncOperations.getRncNumbersBySetor(setor); }

/**
 * Helper: Separa setores que estão salvos com vírgula ou ponto-e-vírgula
 * Deploy 74.7: Aceita tanto vírgula (,) quanto ponto-e-vírgula (;)
 * @param {string} setorString - String com setores separados por vírgula ou ponto-e-vírgula
 * @return {Array} Array de setores individuais
 */
function splitSetores(setorString) {
  if (!setorString || typeof setorString !== 'string') {
    return [];
  }

  // Substituir ponto-e-vírgula por vírgula e depois fazer split
  return setorString
    .replace(/;/g, ',')  // Substitui ; por ,
    .split(',')
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s !== ''; });
}

/**
 * Obtém lista única de setores das RNCs
 * Deploy 74.5: Considera setores múltiplos separados por vírgula
 * @return {Array} Lista de setores únicos
 */
function getSetoresUnicos() {
  try {
    var rncs = RncOperations.getAllRncs();
    var setoresSet = {};

    rncs.forEach(function(rnc) {
      // Buscar em ambos os campos de setor
      var setor = rnc['Setor onde ocorreu a não conformidade'] ||
                 rnc['Setor onde foi feita abertura\n'] ||
                 rnc['Setor onde foi feita abertura'];

      if (setor && setor.trim()) {
        // Deploy 74.5: Separar setores múltiplos por vírgula
        var setoresSeparados = splitSetores(setor);
        setoresSeparados.forEach(function(s) {
          setoresSet[s] = true;
        });
      }
    });

    var setores = Object.keys(setoresSet).sort();

    Logger.logDebug('getSetoresUnicos', {
      totalSetores: setores.length,
      setores: setores
    });

    return setores;

  } catch (error) {
    Logger.logError('getSetoresUnicos', error);
    return [];
  }
}

/**
 * Deploy 68: Obtém lista de setores da planilha Listas
 * @return {Array} Lista de setores configurados
 */
function getSetoresFromListas() {
  return ApiResponse.tryCatch(function() {
    return ConfigManager.getSetoresFromListas();
  }, 'getSetoresFromListas');
}

/**
 * Obtém números de RNCs filtrados por setor
 * @param {string} setor - Nome do setor
 * @return {Array} Lista de números de RNC
 */
/**
 * Obtém números de RNCs filtrados por tipo de setor e setor
 * @param {string} tipoSetor - 'abertura' ou 'qualidade'
 * @param {string} setor - Nome do setor
 * @return {Array} Lista de números de RNC
 */
function getRncNumbersBySetor(tipoSetor, setor) {
  try {
    var allRncs = RncOperations.getAllRncs();
    
    if (!setor || setor === 'Todos') {
      // Retornar todos os números
      var allNumbers = allRncs.map(function(rnc) {
        return rnc['Nº RNC'];
      }).filter(function(num) {
        // TASK-007: Usar strict equality (!==) ao invés de loose equality (!=)
        return num !== null && num !== '';
      });

      // ✅ FASE 2.4: Ordenar usando função otimizada (30-40% mais rápido)
      return sortRncNumbers(allNumbers);
    }
    
    // Determinar qual campo de setor usar
    var campoSetor;
    if (tipoSetor === 'abertura') {
      campoSetor = 'Setor onde foi feita abertura\n';
    } else {
      campoSetor = 'Setor onde ocorreu a não conformidade';
    }
    
    // Filtrar RNCs
    var filtered = [];
    allRncs.forEach(function(rnc) {
      var rncSetor = rnc[campoSetor] || rnc[campoSetor.replace('\n', '')] || '';

      // Deploy 74.7.2: Usar splitSetores para verificar se o setor está contido
      if (rncSetor) {
        var setoresSeparados = splitSetores(rncSetor);
        var encontrado = false;

        for (var i = 0; i < setoresSeparados.length; i++) {
          if (setoresSeparados[i] === setor.trim()) {
            encontrado = true;
            break;
          }
        }

        if (encontrado) {
          filtered.push(rnc['Nº RNC']);
        }
      }
    });
    
    Logger.logDebug('getRncNumbersBySetor', {
      tipoSetor: tipoSetor,
      setor: setor,
      total: filtered.length
    });

    // ✅ FASE 2.4: Ordenar usando função otimizada (30-40% mais rápido)
    return sortRncNumbers(filtered);
    
  } catch (error) {
    Logger.logError('getRncNumbersBySetor', error);
    return [];
  }
}


// Reports

/**
 * Obtém dados estatísticos do dashboard
 * @param {string} setor - Setor para filtrar (opcional)
 * @return {Object} Estatísticas com totais, gráficos e métricas
 * @since Deploy 119
 */
function getDashboardData(setor) { return Reports.getDashboardData(setor); }

/**
 * Obtém dados do kanban de RNCs por status
 * @return {Object} Colunas do kanban com RNCs agrupadas por status
 * @since Deploy 119
 */
function getKanbanData() { return Reports.getKanbanData(); }

/**
 * Gera relatório personalizado com filtros
 * @param {Object} filters - Filtros para o relatório (período, setor, status, etc)
 * @return {Object} Dados do relatório gerado
 * @since Deploy 119
 */
function generateReport(filters) { return Reports.generateReport(filters); }

/**
 * Obtém opções disponíveis para filtros de relatório
 * @return {Object} Opções de filtros (setores, status, tipos, etc)
 * @since Deploy 119
 */
function getReportFilterOptions() { return Reports.getReportFilterOptions(); }

// Configuration

/**
 * Obtém todas as listas de configuração
 * @return {Object} Objeto com todas as listas (Colaboradores, Setores, etc)
 * @since Deploy 119
 */
function getLists() { return ConfigManager.getLists(); }

/**
 * Salva ou atualiza uma lista de configuração
 * @param {string} listName - Nome da lista
 * @param {Array} items - Itens da lista
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function saveList(listName, items) { return ConfigManager.saveList(listName, items); }

/**
 * Remove uma lista de configuração
 * @param {string} listName - Nome da lista a remover
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function deleteList(listName) { return ConfigManager.deleteList(listName); }

/**
 * Obtém todas as seções do formulário
 * @return {Array<Object>} Array de seções configuradas
 * @since Deploy 119
 */
function getSections() { return ConfigManager.getSections(); }

/**
 * Salva ou atualiza uma seção
 * @param {Object} sectionData - Dados da seção (nome, descrição, ordem)
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function saveSection(sectionData) { return ConfigManager.saveSection(sectionData); }

/**
 * Remove uma seção do formulário
 * @param {string} sectionName - Nome da seção a remover
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function deleteSection(sectionName) { return ConfigManager.deleteSection(sectionName); }

/**
 * Obtém todos os campos configurados
 * @return {Array<Object>} Array de campos de todas as seções
 * @since Deploy 119
 */
function getAllFieldsFromConfig() { return ConfigManager.getAllFieldsFromConfig(); }

/**
 * Salva ou atualiza configuração de um campo
 * @param {Object} fieldData - Dados do campo (seção, nome, tipo, validação, etc)
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function saveFieldConfiguration(fieldData) { return ConfigManager.saveFieldConfiguration(fieldData); }

/**
 * Remove configuração de um campo
 * @param {string} secao - Nome da seção
 * @param {string} campo - Nome do campo
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function deleteFieldConfiguration(secao, campo) { return ConfigManager.deleteFieldConfiguration(secao, campo); }

// ===== FUNÇÕES DE TESTE E DEBUG =====

/**
 * Função de teste completo do sistema
 * @return {Object} Resultado dos testes
 */
function testSystem() {
  var startTime = new Date().getTime();
  var tests = {
    config: false,
    database: false,
    rnc: false,
    reports: false,
    files: false,
    context: false
  };
  
  try {
    Logger.logInfo('TEST_SYSTEM_START');
    
    // Teste de configuração
    var validation = validateSystemConfig();
    tests.config = validation.valid;
    
    // Teste de database
    try {
      var sheet = Database.getSheet(CONFIG.SHEETS.RNC);
      tests.database = (sheet !== null);
    } catch (e) {
      tests.database = false;
    }
    
    // Teste de RNC
    try {
      var numbers = RncOperations.getAllRncNumbers();
      tests.rnc = true;
    } catch (e) {
      tests.rnc = false;
    }
    
    // Teste de relatórios
    try {
      var dashboard = Reports.getDashboardData();
      tests.reports = (dashboard.total >= 0);
    } catch (e) {
      tests.reports = false;
    }
    
    // Teste de contexto
    try {
      var context = getUserContextOptimized();
      tests.context = (context.email !== null);
    } catch (e) {
      tests.context = false;
    }
    
    var allPassed = Object.values(tests).every(function(t) { return t === true; });
    
    var result = {
      success: allPassed,
      tests: tests,
      version: CONFIG.VERSION,
      duration: new Date().getTime() - startTime,
      timestamp: new Date().toISOString()
    };
    
    Logger.logInfo('TEST_SYSTEM_COMPLETE', result);
    return result;
    
  } catch (error) {
    Logger.logError('TEST_SYSTEM_ERROR', error);
    return {
      success: false,
      error: error.toString(),
      tests: tests
    };
  }
}
/**
 * Função de debug para testar o campo Filial de Origem
 */
function debugFilialOrigem() {
  try {
    console.log('=== DEBUG FILIAL DE ORIGEM ===');
    
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RNC');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    console.log('Headers da planilha:', headers);
    
    // Procurar coluna Filial de Origem
    var filialColumn = -1;
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] === 'Filial de Origem') {
        filialColumn = i;
        console.log('✅ Coluna Filial de Origem encontrada no índice:', i);
        break;
      }
    }
    
    if (filialColumn === -1) {
      console.log('❌ Coluna Filial de Origem NÃO encontrada!');
      console.log('Headers existentes:', headers);
      return { error: 'Coluna não encontrada', headers: headers };
    }
    
    // Buscar última RNC
    if (sheet.getLastRow() > 1) {
      var lastRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
      console.log('✅ Última RNC:');
      console.log('  Nº RNC:', lastRow[0]);
      console.log('  Cliente:', lastRow[7]); // Nome do Cliente
      console.log('  Filial de Origem:', lastRow[filialColumn]);
      
      return {
        success: true,
        filialColumn: filialColumn,
        ultimaRnc: lastRow[0],
        filialValue: lastRow[filialColumn]
      };
    }
    
    return { error: 'Nenhuma RNC encontrada' };
    
  } catch (e) {
    console.error('Erro no debug:', e);
    return { error: e.message, stack: e.stack };
  }
}

/**
 * Obtém setores únicos de AMBOS os campos (Abertura e Qualidade)
 * @return {Object} Objeto com dois arrays de setores
 */
function getSetoresDuplos() {
  try {
    var rncs = RncOperations.getAllRncs();
    var setoresAberturaSet = {};
    var setoresQualidadeSet = {};
    
    rncs.forEach(function(rnc) {
      // Setor de ABERTURA
      var setorAbertura = rnc['Setor onde foi feita abertura\n'] ||
                         rnc['Setor onde foi feita abertura'] ||
                         rnc['Setor de Abertura'];

      if (setorAbertura && setorAbertura.trim()) {
        // Deploy 74.7.2: Separar setores múltiplos
        var setoresSeparados = splitSetores(setorAbertura);
        setoresSeparados.forEach(function(s) {
          setoresAberturaSet[s] = true;
        });
      }

      // Setor de QUALIDADE (não conformidade)
      var setorQualidade = rnc['Setor onde ocorreu a não conformidade'];

      if (setorQualidade && setorQualidade.trim()) {
        // Deploy 74.7.2: Separar setores múltiplos
        var setoresSeparados = splitSetores(setorQualidade);
        setoresSeparados.forEach(function(s) {
          setoresQualidadeSet[s] = true;
        });
      }
    });
    
    var resultado = {
      setoresAbertura: Object.keys(setoresAberturaSet).sort(),
      setoresQualidade: Object.keys(setoresQualidadeSet).sort()
    };
    
    Logger.logDebug('getSetoresDuplos', { 
      abertura: resultado.setoresAbertura.length,
      qualidade: resultado.setoresQualidade.length
    });
    
    return resultado;
    
  } catch (error) {
    Logger.logError('getSetoresDuplos', error);
    return {
      setoresAbertura: [],
      setoresQualidade: []
    };
  }
}

/**
 * Obtém dados do Kanban filtrados por setor
 * @param {string} tipoSetor - 'abertura' ou 'qualidade'
 * @param {string} setor - Nome do setor
 * @return {Object} Dados do kanban filtrados
 */
/**
 * Deploy 74.5: Considera setores múltiplos separados por vírgula
 */
function getKanbanDataFiltered(tipoSetor, setor) {
  try {
    // Deploy 72.2: Filtrar RNCs ANTES de criar Kanban (mesma lógica do Dashboard)
    if (!setor || setor === 'Todos') {
      return Reports.getKanbanData();
    }

    // Obter todos os RNCs brutos
    var allRncs = RncOperations.getAllRncs();

    // Determinar qual campo de setor usar (mesma lógica do Dashboard)
    var campoSetor;
    if (tipoSetor === 'abertura') {
      campoSetor = 'Setor onde foi feita abertura\n';
    } else {
      campoSetor = 'Setor onde ocorreu a não conformidade';
    }

    // Deploy 74.5: Filtrar RNCs pelo setor (considerando setores múltiplos)
    var filteredRncs = allRncs.filter(function(rnc) {
      var rncSetor = rnc[campoSetor] || rnc[campoSetor.replace('\n', '')] || '';

      // Separar setores múltiplos e verificar se o setor buscado está entre eles
      var setoresSeparados = splitSetores(rncSetor);
      for (var i = 0; i < setoresSeparados.length; i++) {
        if (setoresSeparados[i] === setor.trim()) {
          return true;
        }
      }
      return false;
    });

    Logger.logDebug('getKanbanDataFiltered', {
      tipoSetor: tipoSetor,
      setor: setor,
      totalRncs: filteredRncs.length
    });

    // Criar Kanban apenas com RNCs filtrados
    return Reports.getKanbanDataFromRncs(filteredRncs);

  } catch (error) {
    Logger.logError('getKanbanDataFiltered', error);
    return Reports.getKanbanData();
  }
}

/**
 * Obtém dados do Dashboard filtrados por setor
 * Deploy 74.5: Considera setores múltiplos separados por vírgula
 * @param {string} tipoSetor - 'abertura' ou 'qualidade'
 * @param {string} setor - Nome do setor
 * @return {Object} Estatísticas filtradas
 */
function getDashboardDataFiltered(tipoSetor, setor) {
  try {
    // ✅ DEPLOY 109: FORCE REFRESH para limpar cache antigo (temporário)
    var forceRefresh = true;

    // ✅ DEPLOY 72.4: Se não houver filtro, retornar dados completos
    if (!setor || setor === 'Todos') {
      return Reports.getDashboardData(forceRefresh);
    }

    var allRncs = RncOperations.getAllRncs();

    var campoSetor = tipoSetor === 'abertura'
      ? 'Setor onde foi feita abertura\n'
      : 'Setor onde ocorreu a não conformidade';

    // Deploy 74.5: Filtrar RNCs pelo setor selecionado (considerando setores múltiplos)
    var filteredRncs = allRncs.filter(function(rnc) {
      var rncSetor = rnc[campoSetor] || rnc[campoSetor.replace('\n', '')] || '';

      // Separar setores múltiplos e verificar se o setor buscado está entre eles
      var setoresSeparados = splitSetores(rncSetor);
      for (var i = 0; i < setoresSeparados.length; i++) {
        if (setoresSeparados[i] === setor.trim()) {
          return true;
        }
      }
      return false;
    });

    Logger.logDebug('getDashboardDataFiltered', {
      tipoSetor: tipoSetor,
      setor: setor,
      totalRncs: filteredRncs.length
    });

    // ✅ DEPLOY 72.4: Usar a função completa do Reports passando RNCs filtradas
    // Isso garante que TODOS os gráficos sejam calculados corretamente
    // ✅ DEPLOY 109: Force refresh para limpar cache antigo
    return Reports.getDashboardData(forceRefresh, filteredRncs);

  } catch (error) {
    Logger.logError('getDashboardDataFiltered', error);
    return Reports.getDashboardData();
  }
}

// ===== PERMISSIONS (NOVO) =====

/**
 * Obtém permissões do usuário atual
 * @return {Object} Objeto com roles, permissões e flags de acesso
 * @example
 * var perms = getUserPermissions();
 * // Returns: {roles: ['Admin'], isAdmin: true, permissions: {...}, ...}
 * @since Deploy 119
 */
function getUserPermissions() { return PermissionsManager.getUserPermissions(Session.getActiveUser().getEmail()); }

/**
 * Verifica se usuário atual tem permissão para salvar em uma seção
 * @param {string} secao - Nome da seção
 * @return {boolean} True se tem permissão
 * @since Deploy 119
 */
function checkPermissionToSave(secao) { return PermissionsManager.checkPermissionToSave(Session.getActiveUser().getEmail(), secao); }

/**
 * Adiciona role a um usuário
 * @param {string} email - Email do usuário
 * @param {string} role - Role a adicionar ('Admin', 'Usuario', etc)
 * @param {string|Array<string>} setor - Setor(es) do usuário (string ou array)
 * @return {Object} Resultado da operação
 * @since Deploy 119
 * @updated Deploy 124 - Suporte para múltiplos setores
 */
function addUserRole(email, role, setor) { return PermissionsManager.addUserRole(email, role, setor); }

/**
 * Remove role de um usuário
 * @param {string} email - Email do usuário
 * @param {string} role - Role a remover
 * @return {Object} Resultado da operação
 * @since Deploy 119
 */
function removeUserRole(email, role) { return PermissionsManager.removeUserRole(email, role); }

/**
 * Obtém lista de todos os usuários cadastrados
 * @return {Array<Object>} Array de usuários com suas permissões
 * @since Deploy 119
 */
function getAllUsers() { return PermissionsManager.getAllUsers(); }

/**
 * Atualiza o setor de um usuário
 * @param {string} email - Email do usuário
 * @param {string} novoSetor - Novo setor a ser atribuído
 * @return {Object} Resultado da operação {success, message}
 * @since Deploy 123 HOTFIX
 */
function updateUserSetor(email, novoSetor) { return PermissionsManager.updateUserSetor(email, novoSetor); }

// ===== CACHE MANAGEMENT (Deploy 74.5) =====
/**
 * Limpa a aba de Logs da planilha
 * Remove todos os logs mantendo apenas o cabeçalho
 * @return {Object} Resultado da operação
 */
function limparAbaLogs() {
  try {
    var logSheet = Database.getSheet(CONFIG.SHEETS.LOGS);

    if (!logSheet) {
      return {
        success: false,
        message: 'Aba de Logs não encontrada'
      };
    }

    var lastRow = logSheet.getLastRow();

    // Se só tem cabeçalho ou está vazia, não precisa limpar
    if (lastRow <= 1) {
      return {
        success: true,
        message: 'Aba de Logs já está vazia',
        logsRemovidos: 0
      };
    }

    // Limpar todas as linhas exceto o cabeçalho
    var logsRemovidos = lastRow - 1;
    logSheet.deleteRows(2, logsRemovidos);

    Logger.logInfo('LOGS_LIMPOS', {
      logsRemovidos: logsRemovidos,
      usuario: Session.getActiveUser().getEmail()
    });

    return {
      success: true,
      message: 'Aba de Logs limpa com sucesso',
      logsRemovidos: logsRemovidos
    };

  } catch (error) {
    Logger.logError('LIMPAR_LOGS_ERROR', error);
    return {
      success: false,
      message: 'Erro ao limpar logs: ' + error.toString()
    };
  }
}

/**
 * Limpa TODOS os caches do sistema
 * Use após deploy de alterações que afetam dados em cache
 * @return {Object} Resultado da limpeza
 */
function limparTodosCaches() {
  try {
    var result = {
      rncCache: false,
      dashboardCache: false,
      scriptCache: false
    };

    // 1. Limpar cache de RNCs (getAllRncs)
    try {
      RncOperations.invalidateRncCache();
      result.rncCache = true;
      Logger.logInfo('CACHE_RNC_CLEARED');
    } catch (e) {
      Logger.logWarning('CACHE_RNC_CLEAR_FAILED', { error: e.toString() });
    }

    // 2. Limpar cache do Dashboard
    try {
      Reports.clearDashboardCache();
      result.dashboardCache = true;
      Logger.logInfo('CACHE_DASHBOARD_CLEARED');
    } catch (e) {
      Logger.logWarning('CACHE_DASHBOARD_CLEAR_FAILED', { error: e.toString() });
    }

    // 3. Limpar CacheService (cache geral do script)
    try {
      var cache = CacheService.getScriptCache();
      cache.removeAll(['dashboard_data_v1', 'rnc_cache']);
      result.scriptCache = true;
      Logger.logInfo('CACHE_SCRIPT_CLEARED');
    } catch (e) {
      Logger.logWarning('CACHE_SCRIPT_CLEAR_FAILED', { error: e.toString() });
    }

    Logger.logInfo('TODOS_CACHES_LIMPOS', result);
    return {
      success: true,
      message: 'Todos os caches foram limpos com sucesso',
      details: result
    };

  } catch (error) {
    Logger.logError('LIMPAR_CACHES_ERROR', error);
    return {
      success: false,
      message: 'Erro ao limpar caches: ' + error.toString()
    };
  }
}

// ===== DEBUG (Deploy 74.7) =====
/**
 * Função de teste para verificar setores
 * Deploy 74.7: Debug para verificar se splitSetores está funcionando
 */
function debugSetores() {
  try {
    var rncs = RncOperations.getAllRncs();
    var resultado = {
      totalRncs: rncs.length,
      exemploSetores: [],
      setoresUnicos: getSetoresUnicos(),
      testeSplit: {}
    };

    // Pegar primeiro 5 RNCs com setores
    var count = 0;
    for (var i = 0; i < rncs.length && count < 5; i++) {
      var setor = rncs[i]['Setor onde ocorreu a não conformidade'] ||
                 rncs[i]['Setor onde foi feita abertura\n'] ||
                 rncs[i]['Setor onde foi feita abertura'];

      if (setor) {
        resultado.exemploSetores.push({
          rncNumero: rncs[i]['Nº RNC'],
          setorOriginal: setor,
          setorSeparado: splitSetores(setor)
        });
        count++;
      }
    }

    // Testar split de exemplo
    resultado.testeSplit = {
      exemplo1: splitSetores('Laboratório; Conferência Farmacêutica'),
      exemplo2: splitSetores('Laboratório, Conferência Farmacêutica'),
      exemplo3: splitSetores('TI')
    };

    Logger.logInfo('DEBUG_SETORES', resultado);
    return resultado;

  } catch (error) {
    Logger.logError('DEBUG_SETORES_ERROR', error);
    return { error: error.toString() };
  }
}

// ===== ORGANIZAÇÃO ABA RNC (Deploy 75) =====
/**
 * Mapeia colunas da aba RNC e preenche a coluna OrdemRNC
 * Deploy 75: Organização da base de dados
 */
function mapearColunasRNC() {
  try {
    Logger.logInfo('MAPEAR_COLUNAS_RNC_START');

    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var rncSheet = ss.getSheetByName(CONFIG.SHEETS.RNC);
    var configSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG_CAMPOS);

    if (!rncSheet || !configSheet) {
      throw new Error('Aba RNC ou ConfigCampos não encontrada');
    }

    // 1. Ler headers da aba RNC (primeira linha)
    var lastColumn = rncSheet.getLastColumn();
    var headers = rncSheet.getRange(1, 1, 1, lastColumn).getValues()[0];

    Logger.logInfo('HEADERS_RNC_LIDOS', { total: headers.length });

    // 2. Ler dados da aba ConfigCampos
    var configData = configSheet.getDataRange().getValues();
    var configHeaders = configData[0];

    // Encontrar índices das colunas
    var campoIdx = configHeaders.indexOf('Campo');
    var ordemRncIdx = configHeaders.indexOf('OrdemRNC');

    if (campoIdx === -1 || ordemRncIdx === -1) {
      throw new Error('Colunas "Campo" ou "OrdemRNC" não encontradas em ConfigCampos');
    }

    var mapeamentos = 0;
    var naoEncontrados = [];

    // 3. Para cada campo em ConfigCampos, encontrar sua coluna na aba RNC
    for (var i = 1; i < configData.length; i++) {
      var nomeCampo = configData[i][campoIdx];

      if (!nomeCampo || nomeCampo.trim() === '') continue;

      // Buscar índice da coluna na aba RNC
      var colIndex = headers.indexOf(nomeCampo);

      if (colIndex !== -1) {
        // Coluna encontrada! Salvar índice (1-based)
        configSheet.getRange(i + 1, ordemRncIdx + 1).setValue(colIndex + 1);
        mapeamentos++;
      } else {
        // Campo não encontrado na aba RNC
        naoEncontrados.push(nomeCampo);
        configSheet.getRange(i + 1, ordemRncIdx + 1).setValue('');
      }
    }

    var resultado = {
      success: true,
      totalHeaders: headers.length,
      mapeamentos: mapeamentos,
      naoEncontrados: naoEncontrados
    };

    Logger.logInfo('MAPEAR_COLUNAS_RNC_COMPLETE', resultado);
    return resultado;

  } catch (error) {
    Logger.logError('MAPEAR_COLUNAS_RNC_ERROR', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Pinta headers da aba RNC com cores baseadas na seção do campo
 * Deploy 75.1: Corrigido para usar cores por seção (sem aba ConfigSecoes)
 */
function pintarColunasPorSecao() {
  try {
    Logger.logInfo('PINTAR_COLUNAS_START');

    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var rncSheet = ss.getSheetByName(CONFIG.SHEETS.RNC);
    var configCamposSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG_CAMPOS);

    if (!rncSheet || !configCamposSheet) {
      throw new Error('Aba RNC ou ConfigCampos não encontrada');
    }

    // 1. Definir cores por seção (hardcoded - cores pastéis)
    var coresSecoes = {
      'Abertura': '#E3F2FD',           // Azul claro
      'Qualidade': '#E8F5E9',          // Verde claro
      'Liderança': '#FFF3E0',          // Laranja claro
      'Análise': '#F3E5F5',            // Roxo claro
      'Ação Imediata': '#FFEBEE',      // Vermelho claro
      'Ação Corretiva': '#FFF8E1',     // Amarelo claro
      'Encerramento': '#E0F2F1',       // Teal claro
      'Geral': '#F5F5F5'               // Cinza claro (padrão)
    };

    Logger.logInfo('CORES_SECOES_DEFINIDAS', { total: Object.keys(coresSecoes).length });

    // 2. Ler campos com suas seções e colunas OrdemRNC
    var camposData = configCamposSheet.getDataRange().getValues();
    var camposHeaders = camposData[0];
    var campoSecaoIdx = camposHeaders.indexOf('Seção');
    var campoOrdemRncIdx = camposHeaders.indexOf('OrdemRNC');

    if (campoSecaoIdx === -1 || campoOrdemRncIdx === -1) {
      throw new Error('Colunas "Seção" ou "OrdemRNC" não encontradas em ConfigCampos');
    }

    var headersPintados = 0;
    var secoesUsadas = {};

    // 3. Para cada campo, pintar o HEADER da coluna correspondente
    for (var i = 1; i < camposData.length; i++) {
      var secao = camposData[i][campoSecaoIdx];
      var ordemRnc = camposData[i][campoOrdemRncIdx];

      if (!secao || !ordemRnc || ordemRnc === '') continue;

      // Pegar cor da seção (ou usar cor padrão)
      var cor = coresSecoes[secao] || coresSecoes['Geral'];

      if (!coresSecoes[secao]) {
        Logger.logWarning('COR_SECAO_NAO_DEFINIDA_USANDO_PADRAO', { secao: secao });
      }

      // Pintar APENAS o header (linha 1)
      var colNumber = parseInt(ordemRnc);
      var headerCell = rncSheet.getRange(1, colNumber);

      // Aplicar cor de fundo e negrito
      headerCell.setBackground(cor);
      headerCell.setFontWeight('bold');
      headerCell.setFontColor('#000000'); // Texto preto para contraste

      secoesUsadas[secao] = (secoesUsadas[secao] || 0) + 1;
      headersPintados++;
    }

    var resultado = {
      success: true,
      headersPintados: headersPintados,
      secoesUsadas: secoesUsadas,
      secoes: Object.keys(coresSecoes)
    };

    Logger.logInfo('PINTAR_COLUNAS_COMPLETE', resultado);
    return resultado;

  } catch (error) {
    Logger.logError('PINTAR_COLUNAS_ERROR', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Formata a aba RNC completamente
 * Deploy 75.2: Formatação profissional da planilha
 */
function formatarAbaRNC() {
  try {
    Logger.logInfo('FORMATAR_ABA_RNC_START');

    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var rncSheet = ss.getSheetByName(CONFIG.SHEETS.RNC);

    if (!rncSheet) {
      throw new Error('Aba RNC não encontrada');
    }

    var lastRow = rncSheet.getLastRow();
    var lastColumn = rncSheet.getLastColumn();

    if (lastRow === 0 || lastColumn === 0) {
      throw new Error('Aba RNC está vazia');
    }

    Logger.logInfo('DIMENSOES_ABA_RNC', { linhas: lastRow, colunas: lastColumn });

    // 1. FORMATAR CABEÇALHO (Linha 1)
    var headerRange = rncSheet.getRange(1, 1, 1, lastColumn);

    headerRange
      .setHorizontalAlignment('center')      // Centralizado horizontal
      .setVerticalAlignment('middle')        // Centralizado vertical
      .setWrap(true)                         // Quebra de texto
      .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID); // Todas as bordas

    Logger.logInfo('HEADER_FORMATADO');

    // 2. FORMATAR DADOS (Linhas 2 em diante)
    if (lastRow > 1) {
      var dataRange = rncSheet.getRange(2, 1, lastRow - 1, lastColumn);

      dataRange
        .setHorizontalAlignment('left')        // Esquerda horizontal
        .setVerticalAlignment('middle')        // Centralizado vertical
        .setWrap(true)                         // Quebra de texto
        .setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID); // Bordas cinza

      Logger.logInfo('DADOS_FORMATADOS', { linhas: lastRow - 1 });
    }

    // 3. AJUSTAR LARGURA DAS COLUNAS (auto-resize)
    for (var col = 1; col <= lastColumn; col++) {
      try {
        rncSheet.autoResizeColumn(col);

        // Limitar largura máxima para evitar colunas muito largas
        var currentWidth = rncSheet.getColumnWidth(col);
        if (currentWidth > 400) {
          rncSheet.setColumnWidth(col, 400);
        }

        // Largura mínima para evitar colunas muito estreitas
        if (currentWidth < 100) {
          rncSheet.setColumnWidth(col, 100);
        }
      } catch (e) {
        Logger.logWarning('ERRO_AUTO_RESIZE_COLUNA', { coluna: col, erro: e.toString() });
      }
    }

    Logger.logInfo('COLUNAS_REDIMENSIONADAS');

    // 4. AJUSTAR ALTURA DAS LINHAS
    // Header um pouco mais alto
    rncSheet.setRowHeight(1, 60);

    // Demais linhas com altura padrão maior para acomodar quebra de texto
    if (lastRow > 1) {
      for (var row = 2; row <= lastRow; row++) {
        rncSheet.setRowHeight(row, 30);
      }
    }

    Logger.logInfo('LINHAS_REDIMENSIONADAS');

    // 5. CONGELAR CABEÇALHO
    rncSheet.setFrozenRows(1);

    Logger.logInfo('HEADER_CONGELADO');

    var resultado = {
      success: true,
      linhas: lastRow,
      colunas: lastColumn,
      linhasFormatadas: lastRow - 1,
      colunasRedimensionadas: lastColumn
    };

    Logger.logInfo('FORMATAR_ABA_RNC_COMPLETE', resultado);
    return resultado;

  } catch (error) {
    Logger.logError('FORMATAR_ABA_RNC_ERROR', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ===== NOTIFICATIONS (Deploy 72.5) =====
/**
 * Reenvio manual de notificação
 * @param {string} rncNumber - Número da RNC
 * @param {string} type - Tipo: 'created', 'updated', 'statusChanged'
 * @param {Array} additionalEmails - Emails adicionais (opcional)
 * @return {Object} Resultado do envio
 */
function manualSendNotification(rncNumber, type, additionalEmails) {
  return NotificationManager.manualNotify(rncNumber, type, additionalEmails || []);
}

/**
 * Forçar criação de permissão
 * Deploy 33 - Garantir permissões
 */
function forceAddPermission(email, role) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let permSheet = ss.getSheetByName('Permissoes');
    
    // Criar aba se não existir
    if (!permSheet) {
      permSheet = ss.insertSheet('Permissoes');
      permSheet.appendRow(['Email', 'Role']);
    }
    
    // Limpar email
    email = email.toLowerCase().trim();
    
    // Verificar se já existe
    const data = permSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowEmail = String(data[i][0]).toLowerCase().trim();
      const rowRole = String(data[i][1]).trim();
      
      if (rowEmail === email && rowRole === role) {
        return {
          success: true,
          message: 'Permissão já existe',
          linha: i + 1
        };
      }
    }
    
    // Adicionar nova linha
    permSheet.appendRow([email, role]);
    
    return {
      success: true,
      message: 'Permissão adicionada com sucesso',
      email: email,
      role: role
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}


/**
 * DEBUG SIMPLIFICADO: Verificar permissões
 * Deploy 33 - Versão Corrigida
 */
function debugUserPermissions(email) {
  try {
    if (!email) {
      email = Session.getActiveUser().getEmail();
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const permSheet = ss.getSheetByName('Permissoes');
    
    if (!permSheet) {
      console.log('ERRO: Planilha Permissoes não encontrada');
      return {
        error: 'Planilha Permissoes não encontrada'
      };
    }
    
    const data = permSheet.getDataRange().getValues();
    const headers = data[0];
    
    console.log('=== INICIANDO DIAGNÓSTICO ===');
    console.log('Email pesquisado: ' + email);
    console.log('Total de linhas: ' + (data.length - 1));
    
    // Buscar linhas do usuário
    const userRows = [];
    for (let i = 1; i < data.length; i++) {
      const rowEmail = String(data[i][0]).toLowerCase().trim();
      const searchEmail = email.toLowerCase().trim();
      
      console.log('Comparando: [' + rowEmail + '] com [' + searchEmail + ']');
      
      if (rowEmail === searchEmail) {
        userRows.push({
          email: data[i][0],
          role: data[i][1],
          linha: i + 1
        });
      }
    }
    
    console.log('Permissões encontradas: ' + userRows.length);
    console.log('Detalhes: ' + JSON.stringify(userRows));
    
    return {
      emailPesquisado: email,
      emailAtual: Session.getActiveUser().getEmail(),
      totalLinhas: data.length - 1,
      permissoesEncontradas: userRows.length,
      permissoes: userRows,
      headers: headers
    };
    
  } catch (error) {
    console.log('ERRO no diagnóstico: ' + error.toString());
    return {
      error: error.toString()
    };
  }
}

/**
 * Testar acesso do usuário ATUAL
 */
function testCurrentUserAccess() {
  const email = Session.getActiveUser().getEmail();
  console.log('===== DIAGNÓSTICO DE PERMISSÕES =====');
  console.log('Testando email: ' + email);
  
  const debug = debugUserPermissions(email);
  
  console.log('Resultado: ' + JSON.stringify(debug, null, 2));
  
  return debug;
}

/**
 * Testar email ESPECÍFICO (varejo)
 */
function testeEmailVarejo() {
  const emailTeste = 'varejo.neoformula@gmail.com';
  
  console.log('===== TESTE ESPECÍFICO =====');
  console.log('Testando: ' + emailTeste);
  
  // 1. Forçar adicionar permissão
  const addResult = forceAddPermission(emailTeste, 'Abertura');
  console.log('Resultado de adicionar: ' + JSON.stringify(addResult));
  
  // 2. Verificar se foi adicionado
  const checkResult = debugUserPermissions(emailTeste);
  console.log('Verificação: ' + JSON.stringify(checkResult));
  
  return {
    adicao: addResult,
    verificacao: checkResult
  };
}

/**
 * Listar TODOS os usuários cadastrados
 */
function listarTodosUsuarios() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const permSheet = ss.getSheetByName('Permissoes');
    
    if (!permSheet) {
      return { error: 'Planilha Permissoes não encontrada' };
    }
    
    const data = permSheet.getDataRange().getValues();
    const usuarios = [];
    
    console.log('===== TODOS OS USUÁRIOS =====');
    
    for (let i = 1; i < data.length; i++) {
      const email = String(data[i][0]).trim();
      const role = String(data[i][1]).trim();
      
      if (email) {
        usuarios.push({
          linha: i + 1,
          email: email,
          role: role
        });
        
        console.log('Linha ' + (i + 1) + ': ' + email + ' - ' + role);
      }
    }
    
    console.log('Total: ' + usuarios.length + ' usuários');
    
    return {
      total: usuarios.length,
      usuarios: usuarios
    };
    
  } catch (error) {
    console.log('ERRO: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * Verificar e corrigir estrutura da planilha Permissoes
 * Deploy 33 - Correção Estrutural
 */
function verificarECorrigirPermissoes() {
  try {
    console.log('===== VERIFICAÇÃO DA PLANILHA PERMISSOES =====');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var permSheet = ss.getSheetByName('Permissoes');
    
    if (!permSheet) {
      console.log('❌ Planilha Permissoes não encontrada');
      return { error: 'Planilha não encontrada' };
    }
    
    var data = permSheet.getDataRange().getValues();
    var headers = data[0];
    
    console.log('📋 Headers atuais: ' + JSON.stringify(headers));
    console.log('📊 Total de linhas: ' + (data.length - 1));
    
    // Verificar se coluna "Ativo" existe
    var ativoIndex = headers.indexOf('Ativo');
    
    if (ativoIndex === -1) {
      console.log('⚠️ COLUNA "Ativo" NÃO ENCONTRADA!');
      console.log('🔧 Adicionando coluna "Ativo"...');
      
      // Adicionar cabeçalho "Ativo" na coluna C
      permSheet.getRange(1, 3).setValue('Ativo');
      
      // Preencher todas as linhas existentes com "Sim"
      for (var i = 2; i <= data.length; i++) {
        permSheet.getRange(i, 3).setValue('Sim');
      }
      
      console.log('✅ Coluna "Ativo" adicionada e preenchida');
      
      ativoIndex = 2; // Agora está na coluna C (índice 2)
    } else {
      console.log('✅ Coluna "Ativo" existe no índice: ' + ativoIndex);
      
      // Verificar valores
      var valoresAtivo = [];
      for (var i = 1; i < data.length; i++) {
        var valor = data[i][ativoIndex];
        valoresAtivo.push(valor);
        
        // Se estiver vazio, preencher com "Sim"
        if (!valor || valor === '') {
          console.log('⚠️ Linha ' + (i + 1) + ' sem valor em "Ativo", preenchendo com "Sim"');
          permSheet.getRange(i + 1, ativoIndex + 1).setValue('Sim');
        }
      }
      
      console.log('📊 Valores em "Ativo": ' + JSON.stringify(valoresAtivo));
    }
    
    // Recarregar dados após modificações
    data = permSheet.getDataRange().getValues();
    headers = data[0];
    
    console.log('\n===== ESTRUTURA FINAL =====');
    console.log('Headers: ' + JSON.stringify(headers));
    
    console.log('\n📋 USUÁRIOS:');
    for (var i = 1; i < data.length; i++) {
      console.log('Linha ' + (i + 1) + ': ' + 
                 data[i][0] + ' - ' + 
                 data[i][1] + ' - ' + 
                 data[i][2]);
    }
    
    return {
      success: true,
      headers: headers,
      totalLinhas: data.length - 1,
      colunaAtivoIndex: headers.indexOf('Ativo')
    };
    
  } catch (error) {
    console.log('❌ ERRO: ' + error.toString());
    return { 
      error: error.toString(),
      stack: error.stack
    };
  }
}


/**
 * Testar permissões após correção
 * Deploy 33
 */
function testarPermissoesAposCorrecao() {
  try {
    console.log('===== TESTE APÓS CORREÇÃO =====');
    
    // 1. Testar varejo
    console.log('\n1️⃣ Testando varejo.neoformula@gmail.com:');
    var permVarejo = PermissionsManager.getUserPermissions('varejo.neoformula@gmail.com');
    console.log('Roles: ' + permVarejo.roles.join(', '));
    console.log('IsAdmin: ' + permVarejo.isAdmin);
    console.log('Permissões: ' + JSON.stringify(permVarejo.permissions, null, 2));
    
    // 2. Testar producao
    console.log('\n2️⃣ Testando producao.neoformula@gmail.com:');
    var permProducao = PermissionsManager.getUserPermissions('producao.neoformula@gmail.com');
    console.log('Roles: ' + permProducao.roles.join(', '));
    console.log('IsAdmin: ' + permProducao.isAdmin);
    console.log('Permissões: ' + JSON.stringify(permProducao.permissions, null, 2));
    
    // 3. Testar contexto completo
    console.log('\n3️⃣ Testando getUserContextOptimized:');
    var context = getUserContextOptimized();
    console.log('Email: ' + context.email);
    console.log('Role: ' + context.role);
    console.log('Roles: ' + (context.roles ? context.roles.join(', ') : 'NENHUMA'));
    console.log('IsAdmin: ' + context.isAdmin);
    console.log('HasPermissions: ' + context.hasPermissions);
    
    return {
      varejo: permVarejo,
      producao: permProducao,
      context: {
        email: context.email,
        roles: context.roles,
        isAdmin: context.isAdmin
      }
    };
    
  } catch (error) {
    console.log('❌ ERRO: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * Debug: Verificar email do usuário
 * Deploy 33
 */
function debugEmailUsuario() {
  try {
    console.log('===== DEBUG EMAIL USUÁRIO =====');
    
    // Método 1: Session.getActiveUser()
    var email1 = Session.getActiveUser().getEmail();
    console.log('Session.getActiveUser().getEmail(): ' + email1);
    
    // Método 2: Session.getEffectiveUser()
    var email2 = Session.getEffectiveUser().getEmail();
    console.log('Session.getEffectiveUser().getEmail(): ' + email2);
    
    // Método 3: ScriptApp
    var email3 = '';
    try {
      email3 = ScriptApp.getOAuthToken() ? Session.getActiveUser().getEmail() : 'no-oauth';
    } catch (e) {
      email3 = 'error: ' + e.message;
    }
    console.log('Via OAuth: ' + email3);
    
    return {
      method1_activeUser: email1,
      method2_effectiveUser: email2,
      method3_oauth: email3,
      isAnonymous: (email1 === '' || email1 === 'anonymous' || !email1)
    };
    
  } catch (error) {
    console.log('ERRO: ' + error.toString());
    return { error: error.toString() };
  }
}

// ===== FUNÇÕES DE ANEXOS (WRAPPERS) =====

/**
 * Excluir anexo de uma RNC
 * Remove arquivo do Google Drive e registro da planilha de anexos
 *
 * @param {string} rncNumber - Número da RNC no formato "XXXX/YYYY"
 * @param {string} fileId - ID do arquivo no Google Drive
 * @return {Object} Resultado da operação com propriedades {success, message}
 *
 * @example
 * var result = deleteAnexo('0001/2024', '1abc...xyz');
 * // Returns: {success: true, message: 'Anexo excluído com sucesso'}
 *
 * @since Deploy 36.2
 * @since Deploy 119
 */
function deleteAnexo(rncNumber, fileId) {
  try {
    Logger.logWarning('deleteAnexo_ATTEMPT', {
      rncNumber: rncNumber,
      fileId: fileId
    });

    // Chama a função do FileManager
    var result = FileManager.deleteAnexo(rncNumber, fileId);

    Logger.logInfo('deleteAnexo_SUCCESS', { rncNumber: rncNumber, fileId: fileId });
    return result;

  } catch (error) {
    Logger.logError('deleteAnexo_ERROR', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Download de anexo
 * Retorna URL de download do arquivo no Google Drive
 *
 * @param {string} fileId - ID do arquivo no Google Drive
 * @return {Object} Objeto com URL de download ou erro
 *
 * @example
 * var result = downloadAnexo('1abc...xyz');
 * // Returns: {success: true, url: 'https://drive.google.com/...', fileName: '...'}
 *
 * @since Deploy 36.2
 * @since Deploy 119
 */
function downloadAnexo(fileId) {
  try {
    Logger.logInfo('downloadAnexo_START', { fileId: fileId });

    // Chama a função do FileManager
    var result = FileManager.downloadAnexo(fileId);

    Logger.logInfo('downloadAnexo_SUCCESS', { fileId: fileId });
    return result;

  } catch (error) {
    Logger.logError('downloadAnexo_ERROR', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Obter lista de anexos de uma RNC
 * Retorna todos os arquivos anexados a uma RNC específica
 *
 * @param {string} rncNumber - Número da RNC no formato "XXXX/YYYY"
 * @return {Array<Object>} Array de objetos com dados dos anexos
 *
 * @example
 * var anexos = getAttachments('0001/2024');
 * // Returns: [{fileId: '...', fileName: '...', fileSize: 1234, ...}]
 *
 * @since Deploy 36.2
 * @since Deploy 119
 */
function getAttachments(rncNumber) {
  try {
    Logger.logInfo('getAttachments_START', { rncNumber: rncNumber });

    // Chama a função do FileManager
    var anexos = FileManager.getAnexosRnc(rncNumber);

    Logger.logInfo('getAttachments_SUCCESS', { count: anexos.length });
    return anexos;

  } catch (error) {
    Logger.logError('getAttachments_ERROR', error);
    return [];
  }
}

/**
 * Função manual para sincronização completa
 * Sincroniza aba RNC com configuração de campos e atualiza status de anexos
 *
 * @return {Object} Resultado da sincronização com detalhes de mudanças
 *
 * @example
 * var result = manualFullSync();
 * // Sincroniza headers RNC, adiciona/remove colunas e atualiza anexos
 *
 * @since Deploy 119
 */
function manualFullSync() {
  try {
    console.log('🔄 Iniciando sincronização completa...');
    
    var result = ConfigManager.fullSyncRncWithConfig(false);
    
    if (result.success) {
      console.log('✅ Sincronização concluída!');
      console.log('📊 Ação executada:', result.action);
      
      if (result.changes) {
        console.log('➕ Colunas adicionadas:', result.changes.added);
        console.log('➖ Colunas removidas:', result.changes.removed);
      }
      
      if (result.headersCount) {
        console.log('📋 Total de headers:', result.headersCount);
      }
    }
    
    // Atualizar status de anexos para todas as RNCs
    console.log('📎 Atualizando status de anexos...');
    updateAllAttachmentStatus();
    
    console.log('🎉 Sincronização completa finalizada!');
    return result;
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Função para reorganizar completamente os headers da aba RNC
 * ATENÇÃO: Só use se não houver dados na planilha RNC! Pode causar perda de dados.
 *
 * @return {Object} Resultado da reorganização
 *
 * @example
 * var result = forceReorganizeHeaders();
 * // ATENÇÃO: Reorganiza headers completamente, USE APENAS EM PLANILHA VAZIA
 *
 * @since Deploy 119
 */
function forceReorganizeHeaders() {
  try {
    console.log('⚠️ ATENÇÃO: Reorganização completa iniciada');
    console.log('⚠️ Isso só funciona se não houver dados na planilha RNC!');
    
    var result = ConfigManager.fullSyncRncWithConfig(true);
    
    if (result.success) {
      console.log('✅ Headers reorganizados completamente');
      console.log('📋 Total de headers:', result.headersCount);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro na reorganização:', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Atualiza status de anexos para todas as RNCs
 * Percorre todas as RNCs e atualiza campo de status de anexos
 *
 * @return {Object} Estatísticas da atualização com contadores
 *
 * @example
 * var result = updateAllAttachmentStatus();
 * // Returns: {updated: 50, errors: 0}
 *
 * @since Deploy 119
 */
function updateAllAttachmentStatus() {
  try {
    console.log('📎 Iniciando atualização de status de anexos...');
    
    // Buscar todas as RNCs
    var allRncs = Database.findData(CONFIG.SHEETS.RNC, {});
    var updated = 0;
    var errors = 0;
    
    for (var i = 0; i < allRncs.length; i++) {
      var rnc = allRncs[i];
      var rncNumber = rnc['Nº RNC'];
      
      if (rncNumber) {
        try {
          ConfigManager.updateAttachmentStatus(rncNumber);
          updated++;
        } catch (error) {
          console.error('❌ Erro ao atualizar RNC:', rncNumber, error.toString());
          errors++;
        }
      }
    }
    
    console.log('✅ Status de anexos atualizado!');
    console.log('📊 RNCs atualizadas:', updated);
    if (errors > 0) {
      console.log('⚠️ Erros encontrados:', errors);
    }
    
    return { updated: updated, errors: errors };
    
  } catch (error) {
    console.error('❌ Erro geral:', error.toString());
    return { updated: 0, errors: 1 };
  }
}

/**
 * Função para criar automaticamente o campo "Anexo de Documentos"
 * Cria campo de status de anexos na seção Abertura
 *
 * @return {Object} Resultado da criação do campo
 *
 * @example
 * var result = createAttachmentField();
 * // Cria campo tipo 'label' para mostrar status dos anexos
 *
 * @since Deploy 119
 */
function createAttachmentField() {
  try {
    console.log('📎 Criando campo "Anexo de Documentos"...');
    
    var fieldData = {
      secao: 'Abertura',
      campo: 'Anexo de Documentos',
      tipo: 'label',
      obrigatorio: 'Não',
      placeholder: 'Status dos anexos',
      lista: '',
      ordem: 998,
      ativo: 'Sim'
    };
    
    var result = ConfigManager.saveFieldConfiguration(fieldData);
    
    if (result.success) {
      console.log('✅ Campo "Anexo de Documentos" criado com sucesso!');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao criar campo de anexos:', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Recarrega contexto do usuário após mudanças na configuração
 * @return {Object} Novo contexto
 */
function reloadUserContext() {
  try {
    Logger.logInfo('reloadUserContext_START');
    
    // Limpar cache se existir
    if (typeof Database.clearCache === 'function') {
      Database.clearCache();
    }
    
    // Obter novo contexto
    var newContext = getUserContextOptimized();
    
    Logger.logInfo('reloadUserContext_SUCCESS', {
      email: newContext.email,
      fieldsCount: Object.keys(newContext.fieldsConfig).length
    });
    
    return {
      success: true,
      context: newContext
    };
    
  } catch (error) {
    Logger.logError('reloadUserContext_ERROR', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}



// ===== IMPRESSÃO (Deploy 34) =====

/**
 * Preenche template de impressão e retorna URL
 * Cria documento formatado da RNC para impressão
 *
 * @param {string} rncNumber - Número da RNC no formato "XXXX/YYYY"
 * @return {Object} Objeto com URL do documento gerado
 *
 * @example
 * var result = fillPrintTemplateAndGetUrl('0001/2024');
 * // Returns: {success: true, url: 'https://docs.google.com/...'}
 *
 * @since Deploy 34
 * @since Deploy 119
 */
function fillPrintTemplateAndGetUrl(rncNumber) {
  return PrintManager.fillPrintTemplateAndGetUrl(rncNumber);
}

// ==========================================
// SISTEMA DE BACKUP - Deploy 76
// ==========================================

/**
 * Módulo de Backup de Dados
 * Permite exportar todas as tabelas da planilha para backup
 * e posterior integração com banco de dados externo
 */
var BackupManager = (function() {

  /**
   * Obtém o ID da pasta de backup configurada
   * Usa getSystemConfig igual aos anexos
   * @private
   */
  function getBackupFolderId() {
    try {
      var backupFolderId = getSystemConfig('BACKUP_FOLDER_ID', null);

      // Remover apóstrofo inicial se existir (adicionado para forçar texto no Sheets)
      if (backupFolderId && typeof backupFolderId === 'string' && backupFolderId.charAt(0) === "'") {
        backupFolderId = backupFolderId.substring(1);
      }

      Logger.logInfo('getBackupFolderId_RESULT', {
        value: backupFolderId,
        type: typeof backupFolderId,
        length: backupFolderId ? backupFolderId.length : 0,
        firstChar: backupFolderId ? backupFolderId.charAt(0) : null,
        isString: typeof backupFolderId === 'string'
      });

      return backupFolderId;
    } catch (error) {
      Logger.logError('getBackupFolderId_ERROR', error);
      return null;
    }
  }

  /**
   * Configura o ID da pasta de backup
   * @param {string} folderId - ID da pasta do Google Drive
   * @return {Object} Resultado da operação
   */
  function setBackupFolderId(folderId) {
    try {
      Logger.logInfo('setBackupFolderId_START', { folderId: folderId });

      if (!folderId || folderId.trim() === '') {
        return {
          success: false,
          error: 'ID da pasta não pode estar vazio'
        };
      }

      folderId = folderId.trim();

      Logger.logInfo('SAVING_FOLDER_ID', {
        value: folderId,
        length: folderId.length
      });

      // Salvar diretamente na planilha com controle total
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      var configSheet = ss.getSheetByName('ConfigSistema');

      if (!configSheet) {
        configSheet = ss.insertSheet('ConfigSistema');
        configSheet.getRange(1, 1, 1, 3).setValues([['Chave', 'Valor', 'Descrição']]);
      }

      var data = configSheet.getDataRange().getValues();
      var rowIndex = -1;

      // Procurar linha existente
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === 'BACKUP_FOLDER_ID') {
          rowIndex = i + 1; // +1 porque getRange é 1-indexed
          break;
        }
      }

      if (rowIndex > 0) {
        // SOLUÇÃO COM APÓSTROFO: Google Sheets trata 'texto como string pura
        var targetRange = configSheet.getRange(rowIndex, 2);
        targetRange.clearContent();
        SpreadsheetApp.flush();
        // Adicionar apóstrofo ' antes do ID para forçar texto (método nativo do Sheets)
        targetRange.setValue("'" + String(folderId));
        SpreadsheetApp.flush();
        Logger.logInfo('UPDATED_EXISTING_ROW', { row: rowIndex, value: folderId });
      } else {
        // Nova linha com apóstrofo para forçar texto
        configSheet.appendRow(['BACKUP_FOLDER_ID', "'" + String(folderId), 'ID da pasta do Google Drive para backups']);
        SpreadsheetApp.flush();
        Logger.logInfo('ADDED_NEW_ROW', { value: folderId });
      }

      // Limpar cache
      try {
        var cache = CacheService.getScriptCache();
        cache.remove('config_BACKUP_FOLDER_ID');
      } catch (e) {
        Logger.logWarning('CACHE_CLEAR_WARNING', e);
      }

      // Verificar lendo diretamente da planilha
      SpreadsheetApp.flush(); // Forçar flush para garantir que foi salvo
      var verifyData = configSheet.getDataRange().getValues();
      var verifyValue = null;
      for (var i = 1; i < verifyData.length; i++) {
        if (verifyData[i][0] === 'BACKUP_FOLDER_ID') {
          verifyValue = verifyData[i][1];
          break;
        }
      }

      Logger.logInfo('VERIFY_DIRECT_READ', {
        original: folderId,
        readFromSheet: verifyValue,
        match: folderId === verifyValue
      });

      return {
        success: true,
        folderId: folderId,
        savedValue: verifyValue,
        message: '✅ Pasta configurada!\n\n' +
                 'ID salvo: ' + verifyValue + '\n' +
                 (folderId === verifyValue ? '✓ Verificação OK' : '❌ ATENÇÃO: Valor divergente!')
      };

    } catch (error) {
      Logger.logError('setBackupFolderId_ERROR', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Exporta dados de uma aba para formato JSON
   * @private
   */
  function exportSheetData(sheetName) {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        Logger.logWarning('SHEET_NOT_FOUND', { sheetName: sheetName });
        return null;
      }

      var data = sheet.getDataRange().getValues();

      if (data.length === 0) {
        return {
          sheetName: sheetName,
          headers: [],
          rows: [],
          totalRows: 0
        };
      }

      var headers = data[0];
      var rows = data.slice(1);

      return {
        sheetName: sheetName,
        headers: headers,
        rows: rows,
        totalRows: rows.length,
        exportDate: new Date().toISOString()
      };

    } catch (error) {
      Logger.logError('exportSheetData_ERROR', error, { sheetName: sheetName });
      return null;
    }
  }

  /**
   * Cria um backup completo de todas as tabelas
   * @return {Object} Resultado da operação com informações do backup
   */
  function createBackup() {
    try {
      Logger.logInfo('createBackup_START');

      // Obter ID da pasta de backup (igual aos anexos)
      var folderId = getBackupFolderId();

      if (!folderId) {
        return {
          success: false,
          error: 'Pasta de backup não configurada.\n\n' +
                 'Configure o ID da pasta em Configurações > Sistema de Backup.'
        };
      }

      // Validar acesso à pasta usando Drive API v3
      try {
        Drive.Files.get(folderId, {
          supportsAllDrives: true,
          fields: 'id,name'
        });
      } catch (e) {
        Logger.logError('BACKUP_FOLDER_ACCESS_ERROR', e);
        return {
          success: false,
          error: 'Não foi possível acessar a pasta de backup.\n\n' +
                 'Verifique se:\n' +
                 '• A pasta existe\n' +
                 '• Você tem permissão de acesso\n' +
                 '• O ID está correto\n\n' +
                 'Erro: ' + e.message
        };
      }

      // Definir quais abas serão incluídas no backup
      var sheetsToBackup = [
        'RNC',
        'ConfigCampos',
        'ConfigListas',
        'ConfigSecoes',
        'Permissoes',
        'Logs',
        'Historico',
        'ConfigSistema'
      ];

      // Exportar dados de cada aba
      var backupData = {
        metadata: {
          backupDate: new Date().toISOString(),
          backupDateBrazil: Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'),
          spreadsheetId: CONFIG.SPREADSHEET_ID,
          version: CONFIG.VERSION,
          totalSheets: sheetsToBackup.length
        },
        sheets: {}
      };

      var exportedCount = 0;
      var totalRows = 0;

      for (var i = 0; i < sheetsToBackup.length; i++) {
        var sheetName = sheetsToBackup[i];
        var sheetData = exportSheetData(sheetName);

        if (sheetData) {
          backupData.sheets[sheetName] = sheetData;
          exportedCount++;
          totalRows += sheetData.totalRows;
        }
      }

      // Gerar nome do arquivo com timestamp
      var timestamp = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyyMMdd_HHmmss');
      var fileName = 'Backup_RNC_' + timestamp + '.json';

      // Converter para JSON
      var jsonContent = JSON.stringify(backupData, null, 2);

      // Criar arquivo no Drive usando Drive API v3
      var fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId]
      };

      var fileBlob = Utilities.newBlob(jsonContent, 'application/json', fileName);

      // Drive API v3 usa create(), não insert()
      var file = Drive.Files.create(fileMetadata, fileBlob, {
        supportsAllDrives: true
      });

      var fileUrl = 'https://drive.google.com/file/d/' + file.id + '/view';

      Logger.logInfo('createBackup_SUCCESS', {
        fileName: fileName,
        fileId: file.id,
        sheetsExported: exportedCount,
        totalRows: totalRows,
        fileSize: jsonContent.length
      });

      return {
        success: true,
        backup: {
          fileName: fileName,
          fileId: file.id,
          fileUrl: fileUrl,
          backupDate: backupData.metadata.backupDateBrazil,
          sheetsExported: exportedCount,
          totalRows: totalRows,
          fileSize: (jsonContent.length / 1024).toFixed(2) + ' KB'
        }
      };

    } catch (error) {
      Logger.logError('createBackup_ERROR', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Lista todos os backups disponíveis na pasta configurada
   * @return {Object} Lista de backups
   */
  function listBackups() {
    try {
      Logger.logInfo('listBackups_START');

      // Obter ID da pasta de backup (igual aos anexos)
      var folderId = getBackupFolderId();

      if (!folderId) {
        return {
          success: false,
          error: 'Pasta de backup não configurada'
        };
      }

      // Listar arquivos na pasta usando Drive API v3
      var backups = [];

      try {
        var searchQuery = "'" + folderId + "' in parents and trashed=false";

        // Drive API v3: 'files' ao invés de 'items', 'createdTime' ao invés de 'createdDate'
        var response = Drive.Files.list({
          q: searchQuery,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          fields: 'files(id,name,createdTime,modifiedTime,size,webViewLink)',
          pageSize: 100
        });

        if (response.files && response.files.length > 0) {
          for (var i = 0; i < response.files.length; i++) {
            var file = response.files[i];
            var fileName = file.name;

            // Filtrar apenas arquivos de backup
            if (fileName.indexOf('Backup_RNC_') === 0 && fileName.indexOf('.json') > -1) {
              backups.push({
                fileId: file.id,
                fileName: fileName,
                fileUrl: file.webViewLink || 'https://drive.google.com/file/d/' + file.id + '/view',
                createdDate: Utilities.formatDate(new Date(file.createdTime), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'),
                size: (parseInt(file.size) / 1024).toFixed(2) + ' KB',
                lastModified: Utilities.formatDate(new Date(file.modifiedTime), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss')
              });
            }
          }
        }
      } catch (e) {
        Logger.logError('BACKUP_LIST_ERROR', e);
        return {
          success: false,
          error: 'Erro ao listar backups: ' + e.message
        };
      }

      // Ordenar por data de criação (mais recente primeiro)
      backups.sort(function(a, b) {
        return b.fileName.localeCompare(a.fileName);
      });

      Logger.logInfo('listBackups_SUCCESS', { totalBackups: backups.length });

      var folderUrl = 'https://drive.google.com/drive/folders/' + folderId;

      return {
        success: true,
        backups: backups,
        totalBackups: backups.length,
        folderUrl: folderUrl
      };

    } catch (error) {
      Logger.logError('listBackups_ERROR', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Deleta um backup específico
   * @param {string} fileId - ID do arquivo de backup
   * @return {Object} Resultado da operação
   */
  function deleteBackup(fileId) {
    try {
      Logger.logInfo('deleteBackup_START', { fileId: fileId });

      if (!fileId) {
        return {
          success: false,
          error: 'ID do arquivo não fornecido'
        };
      }

      var file = DriveApp.getFileById(fileId);
      var fileName = file.getName();

      // Verificar se é um arquivo de backup válido
      if (fileName.indexOf('Backup_RNC_') !== 0) {
        return {
          success: false,
          error: 'Arquivo não é um backup válido do sistema'
        };
      }

      file.setTrashed(true);

      Logger.logInfo('deleteBackup_SUCCESS', { fileName: fileName });

      return {
        success: true,
        fileName: fileName
      };

    } catch (error) {
      Logger.logError('deleteBackup_ERROR', error, { fileId: fileId });
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Baixa um backup específico (retorna URL para download)
   * @param {string} fileId - ID do arquivo de backup
   * @return {Object} URL de download
   */
  function downloadBackup(fileId) {
    try {
      Logger.logInfo('downloadBackup_START', { fileId: fileId });

      if (!fileId) {
        return {
          success: false,
          error: 'ID do arquivo não fornecido'
        };
      }

      var file = DriveApp.getFileById(fileId);

      return {
        success: true,
        fileUrl: file.getUrl(),
        downloadUrl: file.getDownloadUrl(),
        fileName: file.getName()
      };

    } catch (error) {
      Logger.logError('downloadBackup_ERROR', error, { fileId: fileId });
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  // Retornar API pública
  return {
    createBackup: createBackup,
    listBackups: listBackups,
    deleteBackup: deleteBackup,
    downloadBackup: downloadBackup,
    setBackupFolderId: setBackupFolderId,
    getBackupFolderId: getBackupFolderId
  };

})();

// Funções wrapper para acesso direto

/**
 * Cria backup completo do sistema
 * Exporta todas as planilhas para arquivo JSON no Google Drive
 *
 * @return {Object} Resultado com informações do backup criado
 *
 * @example
 * var result = createSystemBackup();
 * // Returns: {success: true, fileId: '...', fileName: 'backup-2024-01-02.json', ...}
 *
 * @since Deploy 76
 * @since Deploy 119
 */
function createSystemBackup() {
  return BackupManager.createBackup();
}

/**
 * Lista todos os backups disponíveis
 *
 * @return {Object} Lista de backups com metadados
 *
 * @example
 * var result = listSystemBackups();
 * // Returns: {success: true, backups: [{fileId: '...', fileName: '...', date: '...'}]}
 *
 * @since Deploy 76
 * @since Deploy 119
 */
function listSystemBackups() {
  return BackupManager.listBackups();
}

/**
 * Deleta um backup específico
 *
 * @param {string} fileId - ID do arquivo de backup no Google Drive
 * @return {Object} Resultado da operação
 *
 * @example
 * var result = deleteSystemBackup('1abc...xyz');
 * // Returns: {success: true, message: 'Backup deletado com sucesso'}
 *
 * @since Deploy 76
 * @since Deploy 119
 */
function deleteSystemBackup(fileId) {
  return BackupManager.deleteBackup(fileId);
}

/**
 * Faz download de um backup
 *
 * @param {string} fileId - ID do arquivo de backup no Google Drive
 * @return {Object} URLs para download do backup
 *
 * @example
 * var result = downloadSystemBackup('1abc...xyz');
 * // Returns: {success: true, fileUrl: '...', downloadUrl: '...'}
 *
 * @since Deploy 76
 * @since Deploy 119
 */
function downloadSystemBackup(fileId) {
  return BackupManager.downloadBackup(fileId);
}

/**
 * Configura pasta do Google Drive para armazenar backups
 *
 * @param {string} folderId - ID da pasta no Google Drive
 * @return {Object} Resultado da configuração
 *
 * @example
 * var result = setSystemBackupFolder('1abc...xyz');
 * // Returns: {success: true, folderId: '...', message: '...'}
 *
 * @since Deploy 76
 * @since Deploy 119
 */
function setSystemBackupFolder(folderId) {
  return BackupManager.setBackupFolderId(folderId);
}

/**
 * Obtém ID da pasta configurada para backups
 *
 * @return {string|null} ID da pasta ou null se não configurada
 *
 * @example
 * var folderId = getSystemBackupFolder();
 * // Returns: '1abc...xyz' ou null
 *
 * @since Deploy 76
 * @since Deploy 119
 */
function getSystemBackupFolder() {
  return BackupManager.getBackupFolderId();
}