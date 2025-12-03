/**
 * ============================================
 * CODE.GS - Arquivo Principal de Coordenação
 * Sistema RNC Neoformula - Deploy 30 Modularizado
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

// ===== FUNÇÕES PRINCIPAIS DO SISTEMA =====

/**
 * Ponto de entrada da aplicação web COM AUTENTICAÇÃO FORÇADA
 * Deploy 33 - Correção de Autenticação
 */
function doGet(e) {
  try {
    // ✨ NOVA LÓGICA: Forçar autenticação ANTES de tudo
    var user = Session.getActiveUser().getEmail();
    
    // Método alternativo se o primeiro falhar
    if (!user || user === '' || user === 'anonymous') {
      user = Session.getEffectiveUser().getEmail();
    }
    
    console.log('🔍 [doGet] Email detectado: ' + user);
    
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
              <strong>📧 Contas Autorizadas:</strong>
              <div class="user-item">📧 varejo.neoformula@gmail.com</div>
              <div class="user-item">📧 lucolicos@gmail.com</div>
              <div class="user-item">📧 producao.neoformula@gmail.com</div>
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
    
    template.contextData = JSON.stringify(context);
    
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
    
    // Página de erro detalhada
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
            font-family: monospace;
            font-size: 13px;
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
          <div class="error-message">${error.toString()}</div>
          <button class="btn" onclick="location.reload()">🔄 Tentar Novamente</button>
          <p style="margin-top: 20px; font-size: 13px; color: #999;">
            Se o problema persistir, entre em contato com:<br>
            <strong>producao.neoformula@gmail.com</strong>
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
 * @return {Object} Resultado da inicialização
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
 * Inicializa planilhas necessárias
 * @private
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
 * Inicializa configurações padrão
 * @private
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
    
    var context = {
      email: email,
      role: userPermissions.roles[0] || 'Espectador',
      roles: userPermissions.roles,
      permissions: userPermissions.permissions,
      isAdmin: userPermissions.isAdmin,
      canConfig: userPermissions.isAdmin,
      hasPermissions: true, // ✨ Flag explícita
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
 * Obtém role do usuário
 * @private
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
function saveRnc(formData, files) { return RncOperations.saveRnc(formData, files); }
function updateRnc(rncNumber, formData, files) { return RncOperations.updateRnc(rncNumber, formData, files); }
function getRncByNumber(rncNumber) { return RncOperations.getRncByNumber(rncNumber); }
function getAllRncs(filters) { return RncOperations.getAllRncs(filters); }
function getAllRncNumbers() { return RncOperations.getAllRncNumbers(); }
function searchRncs(searchTerm) { return RncOperations.searchRncs(searchTerm); }
function getRncsBySetor(setor) { return RncOperations.getRncsBySetor(setor); }

// ✅ Deploy 34: Histórico de alterações
function getHistoricoRnc(rncNumber) { return HistoricoManager.getHistoricoRnc(rncNumber); }
//function getSetoresUnicos() { return RncOperations.getSetoresUnicos(); }
//function getRncNumbersBySetor(setor) { return RncOperations.getRncNumbersBySetor(setor); }

/**
 * Obtém lista única de setores das RNCs
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
        setoresSet[setor.trim()] = true;
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
        return num != null && num != '';
      });
      
      return allNumbers.sort(function(a, b) {
        var yearA = parseInt(a.split('/')[1]) || 0;
        var numberA = parseInt(a.split('/')[0]) || 0;
        var yearB = parseInt(b.split('/')[1]) || 0;
        var numberB = parseInt(b.split('/')[0]) || 0;
        
        if (yearA !== yearB) return yearB - yearA;
        return numberB - numberA;
      });
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
      
      if (rncSetor.trim() === setor.trim()) {
        filtered.push(rnc['Nº RNC']);
      }
    });
    
    Logger.logDebug('getRncNumbersBySetor', {
      tipoSetor: tipoSetor,
      setor: setor,
      total: filtered.length
    });
    
    return filtered.sort(function(a, b) {
      var yearA = parseInt(a.split('/')[1]) || 0;
      var numberA = parseInt(a.split('/')[0]) || 0;
      var yearB = parseInt(b.split('/')[1]) || 0;
      var numberB = parseInt(b.split('/')[0]) || 0;
      
      if (yearA !== yearB) return yearB - yearA;
      return numberB - numberA;
    });
    
  } catch (error) {
    Logger.logError('getRncNumbersBySetor', error);
    return [];
  }
}


// Reports
function getDashboardData(setor) { return Reports.getDashboardData(setor); }
function getKanbanData() { return Reports.getKanbanData(); }
function generateReport(filters) { return Reports.generateReport(filters); }
function getReportFilterOptions() { return Reports.getReportFilterOptions(); }

// Configuration
function getLists() { return ConfigManager.getLists(); }
function saveList(listName, items) { return ConfigManager.saveList(listName, items); }
function deleteList(listName) { return ConfigManager.deleteList(listName); }
function getSections() { return ConfigManager.getSections(); }
function saveSection(sectionData) { return ConfigManager.saveSection(sectionData); }
function deleteSection(sectionName) { return ConfigManager.deleteSection(sectionName); }
function getAllFieldsFromConfig() { return ConfigManager.getAllFieldsFromConfig(); }
function saveFieldConfiguration(fieldData) { return ConfigManager.saveFieldConfiguration(fieldData); }
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
        setoresAberturaSet[setorAbertura.trim()] = true;
      }
      
      // Setor de QUALIDADE (não conformidade)
      var setorQualidade = rnc['Setor onde ocorreu a não conformidade'];
      
      if (setorQualidade && setorQualidade.trim()) {
        setoresQualidadeSet[setorQualidade.trim()] = true;
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
function getKanbanDataFiltered(tipoSetor, setor) {
  try {
    var kanbanData = Reports.getKanbanData();
    
    if (!setor || setor === 'Todos') {
      return kanbanData;
    }
    
    var filteredData = {};
    var campoSetor = tipoSetor === 'abertura' 
      ? 'Setor onde foi feita abertura\n' 
      : 'Setor onde ocorreu a não conformidade';
    
    // Filtrar cada coluna do kanban
    Object.keys(kanbanData).forEach(function(status) {
      filteredData[status] = kanbanData[status].filter(function(card) {
        var cardSetor = card.setor || '';
        return cardSetor.trim() === setor.trim();
      });
    });
    
    Logger.logDebug('getKanbanDataFiltered', {
      tipoSetor: tipoSetor,
      setor: setor,
      totalCards: Object.values(filteredData).reduce(function(sum, arr) { 
        return sum + arr.length; 
      }, 0)
    });
    
    return filteredData;
    
  } catch (error) {
    Logger.logError('getKanbanDataFiltered', error);
    return Reports.getKanbanData();
  }
}

/**
 * Obtém dados do Dashboard filtrados por setor
 * @param {string} tipoSetor - 'abertura' ou 'qualidade'
 * @param {string} setor - Nome do setor
 * @return {Object} Estatísticas filtradas
 */
function getDashboardDataFiltered(tipoSetor, setor) {
  try {
    var allRncs = RncOperations.getAllRncs();
    
    if (!setor || setor === 'Todos') {
      return Reports.getDashboardData();
    }
    
    var campoSetor = tipoSetor === 'abertura'
      ? 'Setor onde foi feita abertura\n'
      : 'Setor onde ocorreu a não conformidade';
    
    // Filtrar RNCs
    var filteredRncs = allRncs.filter(function(rnc) {
      var rncSetor = rnc[campoSetor] || rnc[campoSetor.replace('\n', '')] || '';
      return rncSetor.trim() === setor.trim();
    });
    
    Logger.logDebug('getDashboardDataFiltered', {
      tipoSetor: tipoSetor,
      setor: setor,
      totalRncs: filteredRncs.length
    });
    
    // Calcular estatísticas apenas das RNCs filtradas
    return calculateDashboardStats(filteredRncs);
    
  } catch (error) {
    Logger.logError('getDashboardDataFiltered', error);
    return Reports.getDashboardData();
  }
}

/**
 * Calcula estatísticas para o dashboard
 * @private
 */
function calculateDashboardStats(rncs) {
  var stats = {
    total: rncs.length,
    aberturaRnc: 0,
    analiseQualidade: 0,
    analiseAcao: 0,
    finalizadas: 0,
    esteMes: 0,
    esteAno: 0,
    porMes: {},
    porStatus: {},
    porSetor: {},
    porTipo: {},
    porRisco: {},
    tempoMedioResolucao: 0,
    rncsCriticas: 0
  };
  
  var thisMonth = new Date().getMonth();
  var thisYear = new Date().getFullYear();
  var temposResolucao = [];
  
  rncs.forEach(function(rnc) {
    var status = rnc['Status Geral'] || CONFIG.STATUS_PIPELINE.ABERTURA;
    
    if (status === CONFIG.STATUS_PIPELINE.ABERTURA) stats.aberturaRnc++;
    else if (status === CONFIG.STATUS_PIPELINE.ANALISE_QUALIDADE) stats.analiseQualidade++;
    else if (status === CONFIG.STATUS_PIPELINE.ANALISE_ACAO) stats.analiseAcao++;
    else if (status === CONFIG.STATUS_PIPELINE.FINALIZADA) stats.finalizadas++;
    
    if (!stats.porStatus[status]) stats.porStatus[status] = 0;
    stats.porStatus[status]++;
    
    var risco = rnc['Risco'] || '';
    if (risco === 'Alto' || risco === 'Crítico') {
      stats.rncsCriticas++;
    }
    
    var dataCriacao = rnc['Data Criação'];
    if (dataCriacao) {
      var dataObj = new Date(dataCriacao);
      if (!isNaN(dataObj.getTime())) {
        if (dataObj.getMonth() === thisMonth && dataObj.getFullYear() === thisYear) {
          stats.esteMes++;
        }
        if (dataObj.getFullYear() === thisYear) {
          stats.esteAno++;
        }
      }
    }
  });
  
  return stats;
}
// ===== PERMISSIONS (NOVO) =====
function getUserPermissions() { return PermissionsManager.getUserPermissions(Session.getActiveUser().getEmail()); }
function checkPermissionToSave(secao) { return PermissionsManager.checkPermissionToSave(Session.getActiveUser().getEmail(), secao); }
function addUserRole(email, role) { return PermissionsManager.addUserRole(email, role); }
function removeUserRole(email, role) { return PermissionsManager.removeUserRole(email, role); }
function getAllUsers() { return PermissionsManager.getAllUsers(); }



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
 * Excluir anexo - Wrapper corrigido
 * Deploy 36.2
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
 * Download de anexo - Wrapper corrigido
 * Deploy 36.2
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
 * Obter anexos - Wrapper corrigido
 * Deploy 36.2
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
 * Execute no Apps Script quando precisar sincronizar tudo
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
 * Função para reorganizar completamente os headers
 * ATENÇÃO: Só use se não houver dados na planilha RNC!
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
function fillPrintTemplateAndGetUrl(rncNumber) {
  return PrintManager.fillPrintTemplateAndGetUrl(rncNumber);
}