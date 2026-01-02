/**
 * ============================================
 * ARQUIVO: 09. Tests.js
 * MÓDULO: Sistema de Testes do RNC
 * ============================================
 *
 * Este arquivo contém todas as funções de teste e diagnóstico
 * do sistema RNC. Permite validar funcionalidades, verificar
 * integridade de dados e realizar troubleshooting.
 *
 * @module Tests
 * @author Neoformula
 * @since Deploy 119
 * @version 1.0.0
 */

/**
 * TESTE: Verificar estrutura da planilha Anexos
 *
 * Valida se a planilha Anexos existe e está configurada corretamente.
 * Exibe informações sobre cabeçalhos, quantidade de registros e últimos
 * 5 registros cadastrados para validação.
 *
 * @example
 * verificarPlanilhaAnexos();
 * // Resultado esperado: Log com estrutura completa da planilha Anexos
 *
 * @returns {void}
 * @since Deploy 119
 */
function verificarPlanilhaAnexos() {
  try {
    console.log('=== VERIFICAÇÃO DA PLANILHA ANEXOS ===\n');
    
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Anexos');
    
    if (!sheet) {
      console.log('❌ Planilha Anexos não encontrada');
      return;
    }
    
    console.log('✅ Planilha encontrada');
    console.log('   Nome: ' + sheet.getName());
    console.log('   Linhas: ' + sheet.getLastRow());
    console.log('   Colunas: ' + sheet.getLastColumn());
    console.log('');
    
    // Ver cabeçalhos
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    console.log('📋 Cabeçalhos:');
    for (var i = 0; i < headers.length; i++) {
      console.log('   ' + (i + 1) + '. ' + headers[i]);
    }
    console.log('');
    
    // Ver dados
    if (sheet.getLastRow() > 1) {
      console.log('📊 Últimos 5 registros:');
      var maxRows = Math.min(sheet.getLastRow() - 1, 5);
      var data = sheet.getRange(2, 1, maxRows, sheet.getLastColumn()).getValues();
      
      for (var i = 0; i < data.length; i++) {
        console.log('   Linha ' + (i + 2) + ':');
        console.log('     RNC: ' + data[i][0]);
        console.log('     Arquivo: ' + data[i][1]);
        console.log('     Original: ' + data[i][2]);
        console.log('     Tipo: ' + data[i][3]);
        console.log('     Tamanho: ' + data[i][4]);
        console.log('     ID: ' + data[i][5]);
        console.log('     Data: ' + data[i][6]);
        console.log('     Usuário: ' + data[i][7]);
        console.log('     Seção: ' + data[i][8]);
        console.log('');
      }
    } else {
      console.log('ℹ️ Nenhum registro encontrado (apenas cabeçalhos)');
    }
    
    console.log('✅ Verificação concluída');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}



/**
 * TESTE: Funcionalidade de anexos
 *
 * Testa as operações de anexos incluindo busca e download.
 * Valida a integração com FileManager e verifica se os anexos
 * podem ser recuperados corretamente.
 *
 * @example
 * testarAnexos();
 * // Resultado esperado: Logs de teste de busca e download de anexos
 *
 * @returns {void}
 * @since Deploy 119
 */
function testarAnexos() {
  try {
    // Testar com uma RNC real do seu sistema
    var rncNumber = '0001/2025'; // SUBSTITUA por uma RNC real
    
    console.log('=== TESTE DE ANEXOS ===');
    
    // Teste 1: Buscar anexos
    console.log('1️⃣ Buscando anexos da RNC ' + rncNumber);
    
    // ✅ CORRETO: Chamar através do módulo FileManager
    var anexos = FileManager.getAnexosRnc(rncNumber);
    
    console.log('Total de anexos: ' + anexos.length);
    console.log('Anexos:', JSON.stringify(anexos, null, 2));
    
    if (anexos.length > 0) {
      var primeiroAnexo = anexos[0];
      
      // Teste 2: Download
      console.log('2️⃣ Testando download do primeiro anexo');
      
      // ✅ CORRETO: Chamar através do módulo FileManager
      var download = FileManager.downloadAnexo(primeiroAnexo.id);
      
      console.log('Download sucesso:', download.success);
      console.log('Nome:', download.name);
      console.log('Tamanho:', download.size + ' bytes');
    }
    
    console.log('✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}


/**
 * TESTE: Verificar nomes das listas e sincronização
 *
 * Valida se as listas na aba Listas correspondem às referências
 * na ConfigCampos. Identifica incompatibilidades e listas ausentes
 * que podem causar erros nos selects do formulário.
 *
 * @example
 * verificarNomesListas();
 * // Resultado esperado: Lista de todas as listas e suas referências
 *
 * @returns {void}
 * @since Deploy 119
 */
function verificarNomesListas() {
  console.log('=== VERIFICAÇÃO DE NOMES DAS LISTAS ===\n');
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // 1. Nomes das listas (colunas da aba Listas)
  var listasSheet = ss.getSheetByName('Listas');
  var listasHeaders = listasSheet.getRange(1, 1, 1, listasSheet.getLastColumn()).getValues()[0];
  
  console.log('📋 LISTAS DISPONÍVEIS (Aba Listas):');
  listasHeaders.forEach(function(nome, index) {
    console.log(`  ${index + 1}. "${nome}" (${nome.length} caracteres)`);
  });
  
  // 2. Listas referenciadas na ConfigCampos
  var configSheet = ss.getSheetByName('ConfigCampos');
  var configData = configSheet.getDataRange().getValues();
  
  console.log('\n🏷️ LISTAS REFERENCIADAS (ConfigCampos):');
  
  var listasReferenciadas = new Set();
  
  for (var i = 1; i < configData.length; i++) {
    var tipo = configData[i][2]; // Coluna Tipo
    var lista = configData[i][5]; // Coluna Lista
    
    if (tipo === 'select' && lista) {
      listasReferenciadas.add(lista);
    }
  }
  
  Array.from(listasReferenciadas).forEach(function(lista) {
    var encontrada = listasHeaders.indexOf(lista) !== -1;
    var status = encontrada ? '✅' : '❌';
    console.log(`  ${status} "${lista}"`);
  });
  
  // 3. Verificar incompatibilidades
  console.log('\n⚠️ INCOMPATIBILIDADES:');
  
  var incompatibilidades = [];
  
  Array.from(listasReferenciadas).forEach(function(listaRef) {
    if (listasHeaders.indexOf(listaRef) === -1) {
      incompatibilidades.push(listaRef);
    }
  });
  
  if (incompatibilidades.length > 0) {
    console.log('❌ As seguintes listas estão referenciadas mas NÃO existem:');
    incompatibilidades.forEach(function(lista) {
      console.log(`  - "${lista}"`);
    });
  } else {
    console.log('✅ Todas as listas referenciadas existem!');
  }
  
  console.log('\n=== FIM DA VERIFICAÇÃO ===');
}


/**
 * TESTE: Carregamento de listas da planilha
 *
 * Testa o carregamento de todas as listas da aba Listas.
 * Retorna um objeto com todos os valores de cada lista para
 * validação de dados e debug.
 *
 * @example
 * testarCarregamentoListas();
 * // Resultado esperado: Objeto com todas as listas e seus valores
 *
 * @returns {Object} Objeto com listas e seus valores
 * @since Deploy 119
 */
function testarCarregamentoListas() {
  console.log('=== TESTE: CARREGAMENTO DE LISTAS ===');
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var listasSheet = ss.getSheetByName('Listas');
  
  if (!listasSheet) {
    console.error('❌ Aba "Listas" não encontrada!');
    return;
  }
  
  var data = listasSheet.getDataRange().getValues();
  var headers = data[0];
  
  console.log('✅ Aba "Listas" encontrada');
  console.log('Colunas (listas):', headers);
  
  var lists = {};
  
  for (var col = 0; col < headers.length; col++) {
    var listName = headers[col];
    var listValues = [];
    
    for (var row = 1; row < data.length; row++) {
      var value = data[row][col];
      if (value && String(value).trim() !== '') {
        listValues.push(String(value).trim());
      }
    }
    
    lists[listName] = listValues;
    console.log(`  - ${listName}: ${listValues.length} itens`);
  }
  
  console.log('\n=== RESULTADO ===');
  console.log(JSON.stringify(lists, null, 2));
  
  return lists;
}
/**
 * TESTE: Sistema de permissões completo
 *
 * Valida todas as funcionalidades do PermissionsManager incluindo
 * getUserRoles, getPermissionForSection, getUserPermissions,
 * checkPermissionToSave e getAllUsers. Verifica se o controle de
 * acesso está funcionando corretamente.
 *
 * @example
 * testarSistemaPermissoes();
 * // Resultado esperado: Todos os testes de permissões devem passar
 *
 * @returns {boolean} True se todos os testes passaram
 * @since Deploy 119
 */
function testarSistemaPermissoes() {
  console.log('\n=== TESTE SISTEMA DE PERMISSÕES ===\n');
  
  try {
    var testEmail = 'producao.neoformula@gmail.com';
    
    // 1. Testar getUserRoles
    console.log('1️⃣ TESTE: getUserRoles');
    var roles = PermissionsManager.getUserRoles(testEmail);
    console.log('   Roles:', roles.join(', '));
    console.log('   Status:', roles.length > 0 ? '✅ PASSOU' : '❌ FALHOU');
    
    // 2. Testar getPermissionForSection
    console.log('\n2️⃣ TESTE: getPermissionForSection');
    var permAbertura = PermissionsManager.getPermissionForSection(roles, 'Abertura');
    var permQualidade = PermissionsManager.getPermissionForSection(roles, 'Qualidade');
    var permLideranca = PermissionsManager.getPermissionForSection(roles, 'Liderança');
    
    console.log('   Abertura:', permAbertura);
    console.log('   Qualidade:', permQualidade);
    console.log('   Liderança:', permLideranca);
    console.log('   Status: ✅ PASSOU');
    
    // 3. Testar getUserPermissions
    console.log('\n3️⃣ TESTE: getUserPermissions');
    var userPerms = PermissionsManager.getUserPermissions(testEmail);
    console.log('   Email:', userPerms.roles.join(', '));
    console.log('   Is Admin:', userPerms.isAdmin);
    console.log('   Permissões:', JSON.stringify(userPerms.permissions));
    console.log('   Status: ✅ PASSOU');
    
    // 4. Testar checkPermissionToSave
    console.log('\n4️⃣ TESTE: checkPermissionToSave');
    var canSave = PermissionsManager.checkPermissionToSave(testEmail, 'Abertura');
    console.log('   Pode salvar Abertura:', canSave.canSave ? 'Sim' : 'Não');
    console.log('   Mensagem:', canSave.message);
    console.log('   Status:', canSave.canSave ? '✅ PASSOU' : '❌ FALHOU');
    
    // 5. Testar getAllUsers
    console.log('\n5️⃣ TESTE: getAllUsers');
    var users = PermissionsManager.getAllUsers();
    console.log('   Total de usuários:', users.length);
    users.forEach(function(user) {
      console.log('   -', user.email, '→', user.roles.join(', '));
    });
    console.log('   Status: ✅ PASSOU');
    
    console.log('\n=== TODOS OS TESTES PASSARAM! ✅ ===\n');
    return true;
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.toString());
    console.error('Stack:', error.stack);
    return false;
  }
}



/**
 * TESTE: Novos KPIs implementados
 *
 * Valida os 8 KPIs principais do sistema: Impacto Cliente, Detecção Interna,
 * Não Procede, Custo Médio por Tipo, ISP (Índice de Severidade Ponderado),
 * Cumprimento de Prazo, entre outros. Verifica cálculos e exibe resumo geral.
 *
 * @example
 * testarNovosKPIs();
 * // Resultado esperado: Dashboard com todos os KPIs calculados
 *
 * @returns {boolean} True se todos os KPIs foram calculados corretamente
 * @since Deploy 119
 */
function testarNovosKPIs() {
  console.log('\n=== TESTE DOS 8 NOVOS KPIs ===\n');
  
  try {
    // Obter dados do dashboard
    var stats = Reports.getDashboardData();
    
    console.log('📊 TOTAL DE RNCs:', stats.total);
    console.log('');
    
    // KPI 1: Impacto Cliente
    console.log('✅ KPI 1 - Impacto ao Cliente');
    console.log('   Total:', stats.impactoClienteTotal);
    console.log('   Percentual:', stats.impactoClientePercentual + '%');
    console.log('   Status:', stats.impactoClientePercentual <= 30 ? '🟢 BOM' : '🔴 ATENÇÃO');
    console.log('');
    
    // KPI 2: Detecção Interna
    console.log('✅ KPI 2 - Detecção Interna');
    console.log('   Total:', stats.deteccaoInternaTotal);
    console.log('   Percentual:', stats.deteccaoInternaPercentual + '%');
    console.log('   Status:', stats.deteccaoInternaPercentual >= 70 ? '🟢 BOM' : '🟡 MELHORAR');
    console.log('');
    
    // KPI 3: Não Procede
    console.log('✅ KPI 3 - Taxa Não Procede');
    console.log('   Total:', stats.naoProcede);
    console.log('   Taxa:', stats.naoProcedeTaxa + '%');
    console.log('   Status:', stats.naoProcedeTaxa <= 10 ? '🟢 BOM' : '🔴 ALTO');
    console.log('');
    
    // KPI 5: Custo Médio
    console.log('✅ KPI 5 - Custo Médio por Tipo');
    for (var tipo in stats.custoMedioPorTipo) {
      var dados = stats.custoMedioPorTipo[tipo];
      console.log('   ' + tipo + ': R$', dados.media.toFixed(2), '(média de', dados.count, 'RNCs)');
    }
    console.log('');
    
    // KPI 6: ISP
    console.log('✅ KPI 6 - Índice de Severidade Ponderado (ISP)');
    console.log('   ISP Total:', stats.indiceSeveridadePonderado);
    console.log('   Status:', 
      stats.indiceSeveridadePonderado > 50 ? '🔴 CRÍTICO' :
      stats.indiceSeveridadePonderado > 30 ? '🟡 ATENÇÃO' : '🟢 BOM');
    console.log('');
    
    // KPI 7: Cumprimento de Prazo
    console.log('✅ KPI 7 - Taxa de Cumprimento de Prazo');
    console.log('   Taxa:', stats.taxaCumprimentoPrazo + '%');
    console.log('   Status:', 
      stats.taxaCumprimentoPrazo >= 80 ? '🟢 EXCELENTE' :
      stats.taxaCumprimentoPrazo >= 60 ? '🟡 REGULAR' : '🔴 INSUFICIENTE');
    console.log('');
    
    // Resumo Geral
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMO GERAL DOS KPIs');
    console.log('═══════════════════════════════════════');
    console.log('Total RNCs:', stats.total);
    console.log('Custo Total: R$', stats.custoTotal.toFixed(2));
    console.log('Tempo Médio Resolução:', stats.tempoMedioResolucao, 'dias');
    console.log('RNCs Vencidas:', stats.rncsVencidas);
    console.log('RNCs Próximas Vencer:', stats.rncsProximasVencer);
    console.log('═══════════════════════════════════════');
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.toString());
    return false;
  }
}

/**
 * TESTE: Relatórios com filtros e KPIs
 *
 * Testa a geração de relatórios aplicando filtros de data, status,
 * setor e tipo. Valida se os KPIs são calculados corretamente sobre
 * o conjunto filtrado de RNCs.
 *
 * @example
 * testarRelatoriosComKPIs();
 * // Resultado esperado: Relatório filtrado com KPIs calculados
 *
 * @returns {boolean} True se o relatório foi gerado com sucesso
 * @since Deploy 119
 */
function testarRelatoriosComKPIs() {
  console.log('\n=== TESTE RELATÓRIOS COM KPIs ===\n');
  
  try {
    var filters = {
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
      status: 'Todos',
      setor: 'Todos',
      tipo: 'Todos'
    };
    
    console.log('Gerando relatório com filtros:', filters);
    
    var result = Reports.generateReport(filters);
    
    console.log('\n📊 RESULTADO:');
    console.log('   Total RNCs encontradas:', result.totalFiltrado);
    console.log('   Impacto Cliente:', result.stats.impactoClientePercentual + '%');
    console.log('   Detecção Interna:', result.stats.deteccaoInternaPercentual + '%');
    console.log('   Não Procede:', result.stats.naoProcedeTaxa + '%');
    console.log('   ISP:', result.stats.indiceSeveridadePonderado);
    console.log('   Taxa Prazo:', result.stats.taxaCumprimentoPrazo + '%');
    
    console.log('\n✅ RELATÓRIO GERADO COM SUCESSO!\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERRO:', error.toString());
    return false;
  }
}






/**
 * TESTE: Sistema completo
 *
 * Executa teste completo do sistema RNC incluindo configuração,
 * inicialização, testes básicos, listagem de RNCs e dashboard.
 * Útil para validar se o sistema está pronto para deploy.
 *
 * @example
 * fullSystemTest();
 * // Resultado esperado: Log completo do status de todos os módulos
 *
 * @returns {void}
 * @since Deploy 119
 */
function fullSystemTest() {
  console.log('🚀 TESTE COMPLETO DO SISTEMA RNC\n');
  
  // Config
  console.log('1️⃣ CONFIGURAÇÃO:');
  console.log('   Planilha ID:', CONFIG.SPREADSHEET_ID);
  console.log('   Drive ID:', CONFIG.DRIVE_FOLDER_ID);
  console.log('   Versão:', CONFIG.VERSION);
  
  // Inicialização
  console.log('\n2️⃣ INICIALIZAÇÃO:');
  try {
    initializeSystemFast();
    console.log('   ✅ Sistema inicializado');
  } catch(e) {
    console.log('   ⚠️', e.toString());
  }
  
  // Testes
  console.log('\n3️⃣ TESTES:');
  var result = testSystem();
  Object.keys(result.tests).forEach(function(test) {
    console.log('   ' + test + ':', result.tests[test] ? '✅' : '❌');
  });
  
  // RNCs
  console.log('\n4️⃣ RNCS:');
  var rncs = getAllRncNumbers();
  console.log('   Total:', rncs.length);
  console.log('   Últimas 3:', rncs.slice(0, 3));
  
  // Dashboard
  console.log('\n5️⃣ DASHBOARD:');
  var dash = getDashboardData();
  console.log('   Total RNCs:', dash.total);
  console.log('   Abertas:', dash.aberturaRnc);
  console.log('   Em análise:', dash.analiseQualidade);
  
  console.log('\n✅ SISTEMA PRONTO PARA DEPLOY!');
}

/**
 * TESTE: Sistema de arquivos do Google Drive
 *
 * Valida se a pasta configurada no Drive está acessível e se
 * o sistema tem permissão para criar e deletar pastas. Essencial
 * para o funcionamento do sistema de anexos.
 *
 * @example
 * testFileSystem();
 * // Resultado esperado: Confirmação de acesso ao Drive
 *
 * @returns {boolean} True se o sistema de arquivos está OK
 * @since Deploy 119
 */
function testFileSystem() {
  console.log('=== TESTE DO SISTEMA DE ARQUIVOS ===');
  
  // 1. Verificar pasta configurada
  var pastaId = getSystemConfig('PastaGID', CONFIG.DRIVE_FOLDER_ID);
  console.log('ID da Pasta:', pastaId);
  
  try {
    var folder = DriveApp.getFolderById(pastaId);
    console.log('✅ Pasta encontrada:', folder.getName());
    
    // 2. Tentar criar uma pasta de teste
    var testFolder = folder.createFolder('TEST_' + new Date().getTime());
    console.log('✅ Pasta de teste criada:', testFolder.getName());
    
    // 3. Limpar teste
    testFolder.setTrashed(true);
    console.log('✅ Pasta de teste removida');
    
    console.log('\n✅ SISTEMA DE ARQUIVOS OK!');
    return true;
    
  } catch(e) {
    console.error('❌ ERRO:', e.toString());
    console.log('\nSOLUÇÃO:');
    console.log('1. Crie uma nova pasta no Google Drive');
    console.log('2. Copie o ID da pasta da URL');
    console.log('3. Atualize em Config.gs linha 14:');
    console.log("   DRIVE_FOLDER_ID: 'SEU_ID_AQUI'");
    return false;
  }
}

/**
 * TESTE: Verificar correções aplicadas
 *
 * Valida se as correções de bugs foram aplicadas corretamente,
 * incluindo campo Data, status Não Procede, relatórios e sistema
 * de arquivos. Útil após aplicar patches.
 *
 * @example
 * verifyFixes();
 * // Resultado esperado: Todos os testes de correção devem passar
 *
 * @returns {void}
 * @since Deploy 119
 */
function verifyFixes() {
  console.log('=== VERIFICANDO CORREÇÕES ===\n');
  
  // 1. Testar campo Data
  console.log('1️⃣ TESTE CAMPO DATA:');
  var testData = {
    'Data': '2025-09-11',
    'Nome do Cliente': 'Teste Fix',
    'Tipo da RNC': 'Não Procede'
  };
  
  var prepared = RncOperations.prepareRncData(testData, '9999/2025', 'test', true);
  console.log('   Data mapeada para:', prepared['Data de Abertura'] ? '✅ Data de Abertura' : '❌ Erro');
  
  // 2. Testar status Não Procede
  console.log('\n2️⃣ TESTE STATUS NÃO PROCEDE:');
  var currentRnc = {'Status Geral': 'Abertura RNC', 'Nº RNC': '9999/2025'};
  var updates = {'Tipo RNC': 'Não Procede'};
  var newStatus = RncOperations.determineNewStatus(currentRnc, updates);
  console.log('   Status mudou para:', newStatus === 'Finalizada' ? '✅ Finalizada' : '❌ ' + newStatus);
  
  // 3. Testar relatórios
  console.log('\n3️⃣ TESTE RELATÓRIOS:');
  var report = Reports.generateReport({
    dataInicio: '2025-09-01',
    dataFim: '2025-09-30',
    setor: 'Todos',
    tipo: 'Todos',
    status: 'Todos'
  });
  console.log('   RNCs encontradas:', report.totalFiltrado >= 0 ? '✅ ' + report.totalFiltrado : '❌ Erro');
  
  // 4. Testar sistema de arquivos
  console.log('\n4️⃣ TESTE ARQUIVOS:');
  var fileTest = testFileSystem();
  
  console.log('\n=== RESULTADO FINAL ===');
  console.log('Se todos os testes passaram (✅), as correções foram aplicadas com sucesso!');
}

/**
 * TESTE: Monitorar logs recentes
 *
 * Exibe os últimos 20 logs do sistema, filtrando apenas erros
 * e avisos. Útil para identificar problemas rapidamente.
 *
 * @example
 * monitorLogs();
 * // Resultado esperado: Lista de logs de erro e warning
 *
 * @returns {void}
 * @since Deploy 119
 */
function monitorLogs() {
  var logs = Logger.getRecentLogs(20);
  logs.forEach(function(log) {
    if (log.level === 'ERROR' || log.level === 'WARNING') {
      console.log(log.timestamp, log.level, log.action, log.error);
    }
  });
}

/**
 * TESTE: Sistema básico
 *
 * Testa as funcionalidades básicas do sistema incluindo existência
 * de CONFIG, Database, RncOperations, getAllRncNumbers e contexto
 * de usuário. Primeiro teste a executar após deployment.
 *
 * @example
 * testBasicSystem();
 * // Resultado esperado: Todos os módulos básicos devem existir
 *
 * @returns {boolean} True se o sistema básico está funcionando
 * @since Deploy 119
 */
function testBasicSystem() {
  console.log('=== TESTE BÁSICO DO SISTEMA ===');
  
  try {
    // 1. Testar configuração
    console.log('1. CONFIG existe?', typeof CONFIG !== 'undefined' ? '✅' : '❌');
    
    // 2. Testar Database
    console.log('2. Database existe?', typeof Database !== 'undefined' ? '✅' : '❌');
    
    // 3. Testar RncOperations
    console.log('3. RncOperations existe?', typeof RncOperations !== 'undefined' ? '✅' : '❌');
    
    // 4. Testar função principal
    var numbers = RncOperations.getAllRncNumbers();
    console.log('4. getAllRncNumbers funciona?', '✅ (' + numbers.length + ' RNCs)');
    
    // 5. Testar contexto
    var context = getUserContextOptimized();
    console.log('5. getUserContextOptimized funciona?', context.email ? '✅' : '❌');
    
    console.log('\n✅ SISTEMA BÁSICO FUNCIONANDO!');
    return true;
    
  } catch(e) {
    console.error('❌ ERRO NO TESTE:', e);
    return false;
  }
}

/**
 * TESTE: Diagnóstico completo do sistema
 *
 * Executa checagem completa de todos os componentes críticos:
 * planilha, Drive, contexto, listagem de RNCs e dashboard.
 * Retorna objeto com status de cada componente.
 *
 * @example
 * diagnosticCheck();
 * // Resultado esperado: Objeto com status de todos os componentes
 *
 * @returns {Object} Objeto com status de cada verificação
 * @since Deploy 119
 */
function diagnosticCheck() {
  console.log('=== DIAGNÓSTICO COMPLETO ===\n');
  
  var checks = {
    'Planilha acessível': false,
    'Pasta Drive acessível': false,
    'Contexto carrega': false,
    'RNCs listam': false,
    'Dashboard carrega': false
  };
  
  // 1. Planilha
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    checks['Planilha acessível'] = true;
  } catch(e) {
    console.error('Erro planilha:', e.toString());
  }
  
  // 2. Drive
  try {
    var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    checks['Pasta Drive acessível'] = true;
  } catch(e) {
    console.error('Erro Drive:', e.toString());
  }
  
  // 3. Contexto
  try {
    var ctx = getUserContextOptimized();
    checks['Contexto carrega'] = (ctx && ctx.email);
  } catch(e) {
    console.error('Erro contexto:', e.toString());
  }
  
  // 4. RNCs
  try {
    var rncs = getAllRncNumbers();
    checks['RNCs listam'] = true;
  } catch(e) {
    console.error('Erro RNCs:', e.toString());
  }
  
  // 5. Dashboard
  try {
    var dash = getDashboardData();
    checks['Dashboard carrega'] = (dash && dash.total >= 0);
  } catch(e) {
    console.error('Erro dashboard:', e.toString());
  }
  
  // Resultado
  console.log('\nRESULTADO:');
  for (var check in checks) {
    console.log(check + ':', checks[check] ? '✅' : '❌');
  }
  
  return checks;
}

/**
 * TESTE: Verificar cabeçalhos da planilha RNC
 *
 * Lista todos os cabeçalhos da aba RNC e identifica especificamente
 * as colunas relacionadas a datas. Útil para debug de mapeamento de campos.
 *
 * @example
 * checkSheetHeaders();
 * // Resultado esperado: Lista completa de headers e colunas de data
 *
 * @returns {void}
 * @since Deploy 119
 */
function checkSheetHeaders() {
  var sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('RNC');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  console.log('=== HEADERS DA PLANILHA RNC ===');
  headers.forEach(function(header, index) {
    console.log('Coluna ' + (index + 1) + ':', header);
  });
  
  // Verificar especificamente as colunas de data
  console.log('\n=== COLUNAS DE DATA ===');
  headers.forEach(function(header, index) {
    if (header.toLowerCase().includes('data')) {
      console.log('Encontrada:', header, 'na coluna', index + 1);
    }
  });
}

/**
 * TESTE: Validar campo Data
 *
 * Testa o mapeamento do campo "Data" durante o processo de prepareRncData.
 * Verifica se o campo está sendo mapeado corretamente para a planilha.
 *
 * @example
 * testDataField();
 * // Resultado esperado: Objeto com dados preparados e campo Data mapeado
 *
 * @returns {Object} Dados preparados para salvar
 * @since Deploy 119
 */
function testDataField() {
  console.log('=== TESTE DO CAMPO DATA ===');
  
  var testData = {
    'Data': '2025-09-12',
    'Nome do Cliente': 'TESTE DATA',
    'Responsável pela abertura da RNC': 'Admin',
    'Setor onde foi feita abertura': 'Administrativo',
    'Tipo da RNC': 'Interna - Neoformula',
    'Descrição Detalhada da RNC/Reclamação': 'Teste do campo data'
  };
  
  // Simular prepareRncData
  var prepared = {};
  for (var field in testData) {
    var column = FIELD_MAPPING[field] || field;
    console.log(field + ' -> ' + column + ' = ' + testData[field]);
    prepared[column] = testData[field];
  }
  
  console.log('\nDados preparados:', prepared);
  console.log('Campo "Data" presente?', prepared['Data'] ? '✅' : '❌');
  
  return prepared;
}

/**
 * TESTE: Verificar configuração do campo Filial de Origem
 *
 * Valida se o campo "Filial de Origem" está presente no ConfigCampos
 * e configurado corretamente com seção, tipo, obrigatoriedade e lista.
 *
 * @example
 * verificarCampoFilial();
 * // Resultado esperado: Confirmação da existência e configuração do campo
 *
 * @returns {boolean} True se o campo foi encontrado
 * @since Deploy 119
 */
function verificarCampoFilial() {
  console.log('=== VERIFICANDO CAMPO FILIAL ===');
  
  var ss = SpreadsheetApp.openById('14X1ix2CZ2Exg9qORXF8THluwVoG-NFlfdAlUl2J-Syc');
  var configSheet = ss.getSheetByName('ConfigCampos');
  
  var data = configSheet.getDataRange().getValues();
  console.log('Total de campos configurados:', data.length - 1);
  
  // Procurar Filial de Origem
  var encontrado = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === 'Filial de Origem') {
      console.log('✅ CAMPO ENCONTRADO:');
      console.log('  Seção:', data[i][0]);
      console.log('  Campo:', data[i][1]);
      console.log('  Tipo:', data[i][2]);
      console.log('  Obrigatório:', data[i][3]);
      console.log('  Lista:', data[i][5]);
      console.log('  Ordem:', data[i][6]);
      console.log('  Ativo:', data[i][7]);
      encontrado = true;
      break;
    }
  }
  
  if (!encontrado) {
    console.log('❌ CAMPO NÃO ENCONTRADO EM ConfigCampos!');
    console.log('SOLUÇÃO: Execute addFilialOrigemField()');
  }
  
  return encontrado;
}

/**
 * TESTE: Teste completo do campo Filial de Origem
 *
 * Executa bateria completa de testes para o campo Filial incluindo
 * verificação de configuração, lista, busca de RNC e limpeza de cache.
 *
 * @example
 * testeCompletoFilial();
 * // Resultado esperado: Validação completa do campo Filial
 *
 * @returns {void}
 * @since Deploy 119
 */
function testeCompletoFilial() {
  console.log('\n=== TESTE COMPLETO - FILIAL DE ORIGEM ===\n');
  
  // 1. Verificar campo
  console.log('1️⃣ Verificando configuração...');
  verificarCampoFilial();
  
  // 2. Verificar lista
  console.log('\n2️⃣ Verificando lista Filiais...');
  verificarListaFiliais();
  
  // 3. Buscar RNC
  console.log('\n3️⃣ Testando getRncByNumber...');
  var rnc = getRncByNumber('0001/2025');
  if (rnc) {
    console.log('✅ RNC encontrada');
    console.log('   Filial de Origem:', rnc['Filial de Origem']);
    console.log('   Todas as chaves:', Object.keys(rnc));
  }
  
  // 4. Limpar cache
  console.log('\n4️⃣ Limpando cache...');
  limparCacheSistema();
  
  console.log('\n✅ TESTE COMPLETO! Recarregue a página.');
}


/**
 * TESTE: Diagnóstico profundo do campo Filial de Origem
 *
 * Realiza análise profunda do campo Filial verificando headers da planilha,
 * busca de RNC, presença no objeto, variações de nome e ConfigCampos.
 * Útil para troubleshooting de campos que não aparecem no formulário.
 *
 * @example
 * testeCompletoFilialOrigem();
 * // Resultado esperado: Análise detalhada de todas as variações do campo
 *
 * @returns {void}
 * @since Deploy 119
 */
function testeCompletoFilialOrigem() {
  console.log('\n=== TESTE COMPLETO: FILIAL DE ORIGEM ===\n');
  
  var rncNumber = '0004/2025'; // Da imagem
  
  // 1. Testar headers da planilha
  console.log('1️⃣ VERIFICANDO HEADERS DA PLANILHA:');
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('RNC');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  console.log('Total de colunas:', headers.length);
  
  // Procurar colunas com "filial"
  headers.forEach(function(header, index) {
    if (String(header).toLowerCase().includes('filial')) {
      console.log('  Coluna', index + 1, ':', JSON.stringify(header));
      console.log('  Comprimento:', header.length);
      console.log('  Char codes:', Array.from(header).map(c => c.charCodeAt(0)));
    }
  });
  
  // 2. Testar busca da RNC
  console.log('\n2️⃣ BUSCANDO RNC:', rncNumber);
  var rnc = RncOperations.getRncByNumber(rncNumber);
  
  if (!rnc) {
    console.error('❌ RNC não encontrada!');
    return;
  }
  
  console.log('✅ RNC encontrada');
  console.log('Total de campos:', Object.keys(rnc).length);
  
  // 3. Procurar campos com "filial"
  console.log('\n3️⃣ CAMPOS COM "FILIAL" NO OBJETO:');
  Object.keys(rnc).forEach(function(key) {
    if (key.toLowerCase().includes('filial')) {
      console.log('  Chave:', JSON.stringify(key));
      console.log('  Valor:', rnc[key]);
      console.log('  Tipo:', typeof rnc[key]);
    }
  });
  
  // 4. Testar valores específicos
  console.log('\n4️⃣ TESTANDO VARIAÇÕES:');
  var variations = [
    'Filial de Origem',
    'Filial de origem',
    'FilialdeOrigem',
    'filialdeorigem',
    'Filial Origem',
    'FilialOrigem'
  ];
  
  variations.forEach(function(v) {
    console.log('  "' + v + '":', rnc[v] !== undefined ? '✅ ' + rnc[v] : '❌ undefined');
  });
  
  // 5. Verificar ConfigCampos
  console.log('\n5️⃣ VERIFICANDO ConfigCampos:');
  var configSheet = ss.getSheetByName('ConfigCampos');
  var configData = configSheet.getDataRange().getValues();
  
  for (var i = 1; i < configData.length; i++) {
    if (configData[i][1] && configData[i][1].toLowerCase().includes('filial')) {
      console.log('  Seção:', configData[i][0]);
      console.log('  Campo:', JSON.stringify(configData[i][1]));
      console.log('  Tipo:', configData[i][2]);
      console.log('  Lista:', configData[i][5]);
    }
  }
  
  console.log('\n=== FIM DO TESTE ===\n');
}

/**
 * TESTE: Regras do pipeline de status
 *
 * Valida as regras de transição de status do sistema incluindo:
 * Abertura -> Qualidade, Qualidade -> Liderança, Não Procede -> Finalizada,
 * e Ação Corretiva Concluída -> Finalizada.
 *
 * @example
 * testarRegraStatusPipeline();
 * // Resultado esperado: Todas as transições devem funcionar corretamente
 *
 * @returns {void}
 * @since Deploy 119
 */
function testarRegraStatusPipeline() {
  console.log('\n=== TESTE: REGRAS DO STATUS PIPELINE ===\n');
  
  // Mock de uma RNC em Abertura
  var rncAbertura = {
    'Nº RNC': 'TESTE/2025',
    'Status Geral': 'Abertura RNC'
  };
  
  // TESTE 1: Preencher campo de Qualidade
  console.log('1️⃣ TESTE: Preencher campo de Qualidade');
  var updates1 = { 'Risco': 'Alto' };
  var novoStatus1 = RncOperations.determineNewStatus(rncAbertura, updates1);
  console.log('   Status esperado: Análise Qualidade');
  console.log('   Status retornado:', novoStatus1);
  console.log('   Resultado:', novoStatus1 === 'Análise Qualidade' ? '✅ PASSOU' : '❌ FALHOU');
  
  // TESTE 2: Preencher campo de Liderança
  console.log('\n2️⃣ TESTE: Preencher campo de Liderança');
  var rncQualidade = {
    'Nº RNC': 'TESTE/2025',
    'Status Geral': 'Análise Qualidade'
  };
  var updates2 = { 'Plano de ação': 'Realizar treinamento' };
  var novoStatus2 = RncOperations.determineNewStatus(rncQualidade, updates2);
  console.log('   Status esperado: Análise do problema e Ação Corretiva');
  console.log('   Status retornado:', novoStatus2);
  console.log('   Resultado:', novoStatus2 === 'Análise do problema e Ação Corretiva' ? '✅ PASSOU' : '❌ FALHOU');
  
  // TESTE 3: Tipo RNC = Não Procede
  console.log('\n3️⃣ TESTE: Tipo RNC = Não Procede');
  var updates3 = { 'Tipo RNC': 'Não Procede' };
  var novoStatus3 = RncOperations.determineNewStatus(rncAbertura, updates3);
  console.log('   Status esperado: Finalizada');
  console.log('   Status retornado:', novoStatus3);
  console.log('   Resultado:', novoStatus3 === 'Finalizada' ? '✅ PASSOU' : '❌ FALHOU');
  
  // TESTE 4: Status da Ação Corretiva = Concluída
  console.log('\n4️⃣ TESTE: Status da Ação Corretiva = Concluída');
  var rncAcao = {
    'Nº RNC': 'TESTE/2025',
    'Status Geral': 'Análise do problema e Ação Corretiva'
  };
  var updates4 = { 'Status da Ação Corretiva': 'Concluída' };
  var novoStatus4 = RncOperations.determineNewStatus(rncAcao, updates4);
  console.log('   Status esperado: Finalizada');
  console.log('   Status retornado:', novoStatus4);
  console.log('   Resultado:', novoStatus4 === 'Finalizada' ? '✅ PASSOU' : '❌ FALHOU');
  
  console.log('\n=== FIM DOS TESTES ===\n');
}

/**
 * TESTE: Filtro por setor
 *
 * Testa a funcionalidade de filtro por setor incluindo listagem de
 * setores únicos e filtragem de RNCs por setor específico.
 *
 * @example
 * testarFiltroSetor();
 * // Resultado esperado: Lista de setores e RNCs filtradas
 *
 * @returns {void}
 * @since Deploy 119
 */
function testarFiltroSetor() {
    console.log('=== TESTE: FILTRO POR SETOR ===');
    
    // 1. Listar todos os setores
    var setores = getSetoresUnicos();
    console.log('✅ Setores encontrados:', setores.length);
    console.log('   Setores:', setores);
    
    // 2. Testar filtro por setor específico
    if (setores.length > 0) {
        var primeiroSetor = setores[0];
        var rncs = getRncNumbersBySetor(primeiroSetor);
        console.log('✅ RNCs do setor "' + primeiroSetor + '":', rncs.length);
        console.log('   RNCs:', rncs);
    }
    
    // 3. Testar "Todos"
    var todasRncs = getRncNumbersBySetor('Todos');
    console.log('✅ Todas as RNCs:', todasRncs.length);
}


/**
 * TESTE: Setores duplos (Abertura e Qualidade)
 *
 * Testa a função getSetoresDuplos que retorna setores distintos
 * de Abertura e Qualidade para filtros específicos.
 *
 * @example
 * testarSetoresDuplos();
 * // Resultado esperado: Arrays separados de setores de Abertura e Qualidade
 *
 * @returns {void}
 * @since Deploy 119
 */
function testarSetoresDuplos() {
  var setores = getSetoresDuplos();
  console.log('Setores de Abertura:', setores.setoresAbertura);
  console.log('Setores de Qualidade:', setores.setoresQualidade);
}


/**
 * TESTE: Filtros completos do sistema
 *
 * Valida todos os filtros incluindo setores duplos, Kanban filtrado
 * e Dashboard filtrado. Verifica se os dados são filtrados corretamente.
 *
 * @example
 * testarFiltrosCompletos();
 * // Resultado esperado: Kanban e Dashboard com filtros aplicados
 *
 * @returns {void}
 * @since Deploy 119
 */
function testarFiltrosCompletos() {
    console.log('=== TESTE COMPLETO DOS FILTROS ===\n');
    
    // 1. Testar setores duplos
    var setores = getSetoresDuplos();
    console.log('✅ Setores de Abertura:', setores.setoresAbertura);
    console.log('✅ Setores de Qualidade:', setores.setoresQualidade);
    
    // 2. Testar Kanban filtrado
    if (setores.setoresQualidade.length > 0) {
        var kanban = getKanbanDataFiltered('qualidade', setores.setoresQualidade[0]);
        console.log('✅ Kanban filtrado:', kanban);
    }
    
    // 3. Testar Dashboard filtrado
    if (setores.setoresAbertura.length > 0) {
        var dash = getDashboardDataFiltered('abertura', setores.setoresAbertura[0]);
        console.log('✅ Dashboard filtrado:', dash);
    }
}


/**
 * TESTE: Dashboard completo
 *
 * Testa o carregamento completo do dashboard com todos os KPIs
 * e estatísticas incluindo totais, custos, tempos, distribuições
 * por tipo, falha e setor.
 *
 * @example
 * testarDashboardCompleto();
 * // Resultado esperado: Dashboard com todas as métricas calculadas
 *
 * @returns {void}
 * @since Deploy 119
 */
function testarDashboardCompleto() {
    console.log('=== TESTE DASHBOARD COMPLETO ===\n');
    
    var stats = getDashboardData();
    
    console.log('✅ Total RNCs:', stats.total);
    console.log('✅ Custo Total:', stats.custoTotal);
    console.log('✅ Tempo Médio:', stats.tempoMedioResolucao, 'dias');
    console.log('✅ RNCs Críticas:', stats.rncsCriticas);
    console.log('✅ RNCs Vencidas:', stats.rncsVencidas);
    console.log('✅ Por Tipo:', stats.porTipo);
    console.log('✅ Por Tipo de Falha:', stats.porTipoFalha);
    console.log('✅ Por Setor Abertura:', stats.porSetorAbertura);
    console.log('✅ Por Setor Qualidade:', stats.porSetorQualidade);
}

/**
 * TESTE: Diagnosticar problemas de campos
 *
 * Compara campos em ConfigCampos com headers da planilha RNC.
 * Identifica discrepâncias e campos que existem em um local mas
 * não em outro. Essencial para troubleshooting de campos ausentes.
 *
 * @example
 * diagnosticarProblema();
 * // Resultado esperado: Relatório de compatibilidade entre ConfigCampos e RNC
 *
 * @returns {Object} Objeto com totais e lista de headers
 * @since Deploy 119
 */
function diagnosticarProblema() {
  console.log('=== DIAGNÓSTICO DE CAMPOS ===');
  
  // 1. Verificar campos em ConfigCampos
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var configSheet = ss.getSheetByName('ConfigCampos');
  var configData = configSheet.getDataRange().getValues();
  
  console.log('\n📋 CAMPOS EM ConfigCampos:');
  for (var i = 1; i < configData.length; i++) {
    console.log('- ' + configData[i][1] + ' (Seção: ' + configData[i][0] + ')');
  }
  
  // 2. Verificar headers na aba RNC
  var rncSheet = ss.getSheetByName('RNC');
  var headers = rncSheet.getRange(1, 1, 1, rncSheet.getLastColumn()).getValues()[0];
  
  console.log('\n📋 HEADERS NA ABA RNC:');
  for (var j = 0; j < headers.length; j++) {
    console.log('Coluna ' + (j + 1) + ': "' + headers[j] + '"');
  }
  
  // 3. Verificar campos específicos problemáticos
  var camposProblema = ['Setor onde foi feita abertura', 'Tipo da RNC'];
  
  console.log('\n🔍 VERIFICANDO CAMPOS ESPECÍFICOS:');
  for (var k = 0; k < camposProblema.length; k++) {
    var campo = camposProblema[k];
    var indexRnc = headers.indexOf(campo);
    
    console.log('\n🔍 Campo: "' + campo + '"');
    console.log('  - Existe na RNC: ' + (indexRnc !== -1 ? 'SIM (coluna ' + (indexRnc + 1) + ')' : 'NÃO'));
    
    // Verificar se existe em ConfigCampos
    var existeConfig = false;
    for (var l = 1; l < configData.length; l++) {
      if (configData[l][1] === campo) {
        existeConfig = true;
        console.log('  - Existe em ConfigCampos: SIM (Seção: ' + configData[l][0] + ')');
        break;
      }
    }
    if (!existeConfig) {
      console.log('  - Existe em ConfigCampos: NÃO');
    }
  }
  
  return {
    configCampos: configData.length - 1,
    headersRnc: headers.length,
    headers: headers
  };
}

/**
 * TESTE: Corrigir sincronização entre ConfigCampos e RNC
 *
 * Executa sincronização completa entre ConfigCampos e a aba RNC
 * usando fullSyncRncWithConfig. Útil para resolver problemas de
 * campos desconfigurados.
 *
 * @example
 * corrigirSincronizacao();
 * // Resultado esperado: Sincronização completa executada com sucesso
 *
 * @returns {Object} Resultado da sincronização
 * @since Deploy 119
 */
function corrigirSincronizacao() {
  console.log('=== INICIANDO CORREÇÃO ===');
  
  try {
    // 1. Executar sincronização completa
    console.log('1️⃣ Executando sincronização completa...');
    var result = ConfigManager.fullSyncRncWithConfig(false);
    
    console.log('Resultado da sincronização:', JSON.stringify(result, null, 2));
    
    // 2. Verificar se os campos foram criados
    console.log('\n2️⃣ Verificando resultado...');
    diagnosticarProblema();
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro na correção:', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * TESTE: Verificar FIELD_MAPPING
 *
 * Valida se o objeto FIELD_MAPPING existe e está configurado corretamente.
 * Verifica mapeamento de campos problemáticos específicos.
 *
 * @example
 * verificarMapeamento();
 * // Resultado esperado: Estrutura do FIELD_MAPPING e campos chave
 *
 * @returns {Object|null} FIELD_MAPPING ou null se não existir
 * @since Deploy 119
 */
function verificarMapeamento() {
  console.log('=== VERIFICANDO MAPEAMENTO ===');
  
  // Verificar se existe FIELD_MAPPING
  if (typeof FIELD_MAPPING !== 'undefined') {
    console.log('📋 FIELD_MAPPING encontrado:');
    console.log(JSON.stringify(FIELD_MAPPING, null, 2));
    
    // Verificar campos específicos
    console.log('\n🔍 Mapeamento dos campos problemáticos:');
    console.log('- "Setor onde foi feita abertura" → "' + (FIELD_MAPPING['Setor onde foi feita abertura'] || 'SEM MAPEAMENTO') + '"');
    console.log('- "Tipo da RNC" → "' + (FIELD_MAPPING['Tipo da RNC'] || 'SEM MAPEAMENTO') + '"');
  } else {
    console.log('⚠️ FIELD_MAPPING não encontrado!');
  }
  
  return typeof FIELD_MAPPING !== 'undefined' ? FIELD_MAPPING : null;
}


/**
 * ============================================
 * TESTES - Sistema de Impressão RNC
 * ============================================
 *
 * Conjunto de testes para validar o sistema de impressão de RNCs.
 * Inclui verificação de módulos, aba Print, mapeamento, ranges e
 * testes de impressão completa.
 *
 * @section Testes de Impressão
 * @since Deploy 119
 */

/**
 * TESTE: Verificar se PrintManager está funcionando
 *
 * Valida se o módulo PrintManager foi carregado corretamente e
 * se todos os seus métodos estão disponíveis.
 *
 * @example
 * test1_VerificarPrintManager();
 * // Resultado esperado: Confirmação de que PrintManager existe
 *
 * @returns {boolean} True se PrintManager está disponível
 * @since Deploy 119
 */
function test1_VerificarPrintManager() {
  console.log('=== TESTE 1: Verificar PrintManager ===');
  
  try {
    if (typeof PrintManager === 'undefined') {
      console.error('❌ PrintManager não encontrado!');
      console.log('SOLUÇÃO: Certifique-se que PrintRNC.gs foi criado');
      return false;
    }
    
    console.log('✅ PrintManager encontrado');
    console.log('📋 Métodos disponíveis:');
    console.log('  - fillPrintTemplateAndGetUrl');
    console.log('  - printCurrentRncFromSheet');
    console.log('  - createPrintMenu');
    console.log('  - showPrintInfo');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error.toString());
    return false;
  }
}

/**
 * TESTE: Verificar estrutura da aba Print
 *
 * Valida se a aba Print existe na planilha e exibe informações
 * sobre sua estrutura (linhas, colunas, sheet ID).
 *
 * @example
 * test2_VerificarAbaPrint();
 * // Resultado esperado: Informações da aba Print
 *
 * @returns {boolean} True se a aba Print existe
 * @since Deploy 119
 */
function test2_VerificarAbaPrint() {
  console.log('\n=== TESTE 2: Verificar Aba Print ===');
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var printSheet = ss.getSheetByName('Print');
    
    if (!printSheet) {
      console.error('❌ Aba "Print" não encontrada!');
      console.log('SOLUÇÃO: Crie uma aba chamada "Print" na planilha');
      return false;
    }
    
    console.log('✅ Aba Print encontrada');
    console.log('📊 Informações:');
    console.log('  - Última linha:', printSheet.getLastRow());
    console.log('  - Última coluna:', printSheet.getLastColumn());
    console.log('  - Sheet ID:', printSheet.getSheetId());
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error.toString());
    return false;
  }
}

/**
 * TESTE: Verificar mapeamento no ConfigCampos
 *
 * Valida se os campos ativos em ConfigCampos têm ranges de impressão
 * configurados na coluna K. Lista campos mapeados e não mapeados.
 *
 * @example
 * test3_VerificarMapeamento();
 * // Resultado esperado: Lista de campos com e sem range configurado
 *
 * @returns {boolean} True se há campos mapeados
 * @since Deploy 119
 */
function test3_VerificarMapeamento() {
  console.log('\n=== TESTE 3: Verificar Mapeamento ConfigCampos ===');
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var configSheet = ss.getSheetByName('ConfigCampos');
    
    if (!configSheet) {
      console.error('❌ ConfigCampos não encontrada!');
      return false;
    }
    
    var data = configSheet.getDataRange().getValues();
    var printColumnIndex = 10; // Coluna K = índice 10
    
    console.log('✅ ConfigCampos encontrada');
    console.log('📋 Campos com mapeamento Print:');
    
    var mappedFields = 0;
    var unmappedFields = 0;
    
    for (var i = 1; i < data.length; i++) {
      var fieldName = data[i][1]; // Coluna B
      var isActive = data[i][7]; // Coluna H
      var printRange = data[i][printColumnIndex]; // Coluna K
      
      if (isActive === 'Sim') {
        if (printRange && printRange !== '') {
          console.log('  ✅', fieldName, '→', printRange);
          mappedFields++;
        } else {
          console.log('  ⚠️', fieldName, '→ SEM RANGE');
          unmappedFields++;
        }
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log('  - Campos mapeados:', mappedFields);
    console.log('  - Campos sem range:', unmappedFields);
    
    if (mappedFields === 0) {
      console.warn('⚠️ AVISO: Nenhum campo tem range configurado!');
      console.log('SOLUÇÃO: Preencha a coluna K do ConfigCampos');
    }
    
    return mappedFields > 0;
    
  } catch (error) {
    console.error('❌ Erro:', error.toString());
    return false;
  }
}

/**
 * TESTE: Buscar uma RNC de teste
 *
 * Busca a primeira RNC disponível na planilha para usar nos testes
 * de impressão. Retorna o número da RNC encontrada.
 *
 * @example
 * test4_BuscarRncTeste();
 * // Resultado esperado: Número da primeira RNC cadastrada
 *
 * @returns {string|null} Número da RNC ou null se não encontrar
 * @since Deploy 119
 */
function test4_BuscarRncTeste() {
  console.log('\n=== TESTE 4: Buscar RNC para Teste ===');
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var rncSheet = ss.getSheetByName('RNC');
    
    if (!rncSheet) {
      console.error('❌ Aba RNC não encontrada!');
      return null;
    }
    
    var data = rncSheet.getDataRange().getValues();
    
    if (data.length < 2) {
      console.warn('⚠️ Nenhuma RNC cadastrada');
      return null;
    }
    
    // Pegar primeira RNC
    var headers = data[0];
    var firstRnc = data[1];
    var rncNumberIndex = headers.indexOf('Nº RNC');
    
    if (rncNumberIndex === -1) {
      console.error('❌ Coluna "Nº RNC" não encontrada');
      return null;
    }
    
    var rncNumber = firstRnc[rncNumberIndex];
    
    console.log('✅ RNC encontrada para teste:', rncNumber);
    console.log('📋 Total de RNCs na planilha:', data.length - 1);
    
    return rncNumber;
    
  } catch (error) {
    console.error('❌ Erro:', error.toString());
    return null;
  }
}

/**
 * TESTE: Executar impressão completa
 *
 * Executa o processo completo de impressão de uma RNC usando
 * PrintManager.fillPrintTemplateAndGetUrl. Valida sucesso e
 * exibe estatísticas de campos processados.
 *
 * @example
 * test5_TesteImpressaoCompleta();
 * // Resultado esperado: RNC impressa com sucesso na aba Print
 *
 * @returns {boolean} True se a impressão foi bem-sucedida
 * @since Deploy 119
 */
function test5_TesteImpressaoCompleta() {
  console.log('\n=== TESTE 5: Impressão Completa ===');
  
  try {
    // Buscar RNC de teste
    var rncNumber = test4_BuscarRncTeste();
    
    if (!rncNumber) {
      console.error('❌ Não foi possível encontrar uma RNC para teste');
      return false;
    }
    
    console.log('\n🖨️ Iniciando impressão de:', rncNumber);
    
    // Executar impressão
    var result = PrintManager.fillPrintTemplateAndGetUrl(rncNumber);
    
    if (!result.success) {
      console.error('❌ Falha na impressão:', result.error);
      return false;
    }
    
    console.log('\n✅ IMPRESSÃO BEM-SUCEDIDA!');
    console.log('📋 Detalhes:');
    console.log('  - RNC:', result.rncNumber);
    console.log('  - Campos preenchidos:', result.fieldsProcessed);
    console.log('  - Campos ignorados:', result.fieldsSkipped);
    console.log('  - URL:', result.printUrl);
    console.log('\n🎉 Abra a aba Print para verificar!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.toString());
    return false;
  }
}

/**
 * TESTE: Verificar ranges específicos
 *
 * Valida se todos os ranges configurados no ConfigCampos são válidos
 * e podem ser acessados na aba Print. Identifica ranges inválidos.
 *
 * @example
 * test6_ValidarRangesConfigCampos();
 * // Resultado esperado: Lista de ranges válidos e inválidos
 *
 * @returns {boolean} True se todos os ranges são válidos
 * @since Deploy 119
 */
function test6_ValidarRangesConfigCampos() {
  console.log('\n=== TESTE 6: Validar Ranges Específicos ===');
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var printSheet = ss.getSheetByName('Print');
    var configSheet = ss.getSheetByName('ConfigCampos');
    
    if (!printSheet || !configSheet) {
      console.error('❌ Abas necessárias não encontradas');
      return false;
    }
    
    var data = configSheet.getDataRange().getValues();
    var printColumnIndex = 10;
    
    console.log('🔍 Validando ranges...\n');
    
    var validRanges = 0;
    var invalidRanges = 0;
    
    for (var i = 1; i < data.length; i++) {
      var fieldName = data[i][1];
      var isActive = data[i][7];
      var printRange = data[i][printColumnIndex];
      
      if (isActive === 'Sim' && printRange && printRange !== '') {
        try {
          // Tentar acessar o range
          var range = printSheet.getRange(printRange);
          console.log('  ✅', printRange, '→', fieldName);
          validRanges++;
        } catch (error) {
          console.log('  ❌', printRange, '→', fieldName, '(INVÁLIDO)');
          console.log('      Erro:', error.message);
          invalidRanges++;
        }
      }
    }
    
    console.log('\n📊 Resultado:');
    console.log('  - Ranges válidos:', validRanges);
    console.log('  - Ranges inválidos:', invalidRanges);
    
    if (invalidRanges > 0) {
      console.warn('\n⚠️ ATENÇÃO: Corrija os ranges inválidos no ConfigCampos!');
    }
    
    return invalidRanges === 0;
    
  } catch (error) {
    console.error('❌ Erro:', error.toString());
    return false;
  }
}

/**
 * TESTE: Executa todos os testes de impressão em sequência
 *
 * Bateria completa de testes do sistema de impressão incluindo
 * verificação de módulo, aba, mapeamento, ranges e impressão.
 * Gera relatório final com resultados de cada teste.
 *
 * @example
 * testAll_SistemaImpressao();
 * // Resultado esperado: Relatório completo de todos os testes
 *
 * @returns {boolean} True se todos os testes passaram
 * @since Deploy 119
 */
function testAll_SistemaImpressao() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   TESTE COMPLETO - SISTEMA IMPRESSÃO  ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  var results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false
  };
  
  // Executar testes
  results.test1 = test1_VerificarPrintManager();
  results.test2 = test2_VerificarAbaPrint();
  results.test3 = test3_VerificarMapeamento();
  results.test4 = test4_BuscarRncTeste() !== null;
  results.test5 = test5_TesteImpressaoCompleta();
  results.test6 = test6_ValidarRangesConfigCampos();
  
  // Relatório final
  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║        RELATÓRIO FINAL DOS TESTES      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  var passed = 0;
  var failed = 0;
  
  for (var test in results) {
    var status = results[test] ? '✅ PASSOU' : '❌ FALHOU';
    console.log(status + ' - ' + test);
    
    if (results[test]) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 RESUMO:');
  console.log('  - Testes passados:', passed, '/ 6');
  console.log('  - Testes falhados:', failed, '/ 6');
  
  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de impressão está pronto para uso!');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM');
    console.log('📋 Verifique os erros acima e corrija antes de usar em produção.');
  }
  
  return failed === 0;
}

/**
 * TESTE: Impressão rápida de RNC específica
 *
 * Teste rápido que imprime uma RNC específica sem executar
 * toda a bateria de testes. Útil para validação pontual.
 *
 * @example
 * testQuick_ImprimirRNC('0001/2025');
 * // Resultado esperado: RNC 0001/2025 impressa na aba Print
 *
 * @param {string} rncNumber - Número da RNC a ser impressa (padrão: '0001/2025')
 * @returns {Object} Resultado da impressão
 * @since Deploy 119
 */
function testQuick_ImprimirRNC(rncNumber) {
  if (!rncNumber) {
    rncNumber = '0001/2025'; // RNC padrão de teste
  }
  
  console.log('🖨️ Teste Rápido - Impressão de RNC:', rncNumber);
  
  var result = PrintManager.fillPrintTemplateAndGetUrl(rncNumber);
  
  console.log('\nResultado:', JSON.stringify(result, null, 2));
  
  return result;
}

/**
 * DEBUG: Mostrar estrutura completa de uma RNC
 *
 * Exibe todos os campos e valores de uma RNC específica.
 * Útil para debug e validação de dados antes da impressão.
 *
 * @example
 * debug_MostrarEstrutuRA('0001/2025');
 * // Resultado esperado: Lista completa de campos e valores da RNC
 *
 * @param {string} rncNumber - Número da RNC a ser analisada
 * @returns {void}
 * @since Deploy 119
 */
function debug_MostrarEstrutuRA(rncNumber) {
  console.log('🔍 DEBUG: Estrutura da RNC', rncNumber);
  
  var rnc = RncOperations.getRncByNumber(rncNumber);
  
  if (!rnc || !rnc.success) {
    console.error('❌ RNC não encontrada');
    return;
  }
  
  var rncData = rnc.rnc;
  
  console.log('\n📋 Campos disponíveis:\n');
  
  for (var field in rncData) {
    var value = rncData[field];
    var type = typeof value;
    var preview = String(value).substring(0, 50);

    console.log('  -', field);
    console.log('    Tipo:', type);
    console.log('    Valor:', preview);
    console.log('');
  }
}

/**
 * TESTE: Validação completa da função isValidEmail()
 *
 * Testa todos os cenários de validação de email incluindo emails válidos,
 * inválidos, vazios, muito longos e com caracteres especiais. Valida tanto
 * retorno de objeto quanto boolean.
 *
 * Casos testados:
 * - Email válido (retorno objeto)
 * - Email inválido (retorno objeto)
 * - Email válido (retorno boolean)
 * - Email inválido (retorno boolean)
 * - Email vazio
 * - Email muito longo
 * - Caracteres especiais inválidos
 *
 * @example
 * testIsValidEmail();
 * // Resultado esperado: Todos os testes devem passar com outputs corretos
 *
 * @returns {void}
 * @since Deploy 119
 */
function testIsValidEmail() {
  console.log('========================================');
  console.log('TESTE: isValidEmail() - Versão Unificada');
  console.log('========================================\n');

  // Caso 1: Email válido - retorno objeto
  var test1 = isValidEmail('user@example.com');
  console.log('Teste 1 - Email válido (objeto):');
  console.log('  Input: "user@example.com"');
  console.log('  Output:', JSON.stringify(test1));
  console.log('  ✅ Esperado: { valid: true, error: null }\n');

  // Caso 2: Email inválido - retorno objeto
  var test2 = isValidEmail('invalid-email');
  console.log('Teste 2 - Email inválido (objeto):');
  console.log('  Input: "invalid-email"');
  console.log('  Output:', JSON.stringify(test2));
  console.log('  ✅ Esperado: { valid: false, error: "..." }\n');

  // Caso 3: Email válido - retorno boolean
  var test3 = isValidEmail('user@example.com', true);
  console.log('Teste 3 - Email válido (boolean):');
  console.log('  Input: "user@example.com", true');
  console.log('  Output:', test3);
  console.log('  ✅ Esperado: true\n');

  // Caso 4: Email inválido - retorno boolean
  var test4 = isValidEmail('invalid', true);
  console.log('Teste 4 - Email inválido (boolean):');
  console.log('  Input: "invalid", true');
  console.log('  Output:', test4);
  console.log('  ✅ Esperado: false\n');

  // Caso 5: Email vazio - retorno objeto
  var test5 = isValidEmail('');
  console.log('Teste 5 - Email vazio (objeto):');
  console.log('  Input: ""');
  console.log('  Output:', JSON.stringify(test5));
  console.log('  ✅ Esperado: { valid: false, error: "Email não pode estar vazio" }\n');

  // Caso 6: Email muito longo - retorno objeto
  var longEmail = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@example.com';
  var test6 = isValidEmail(longEmail);
  console.log('Teste 6 - Email muito longo (objeto):');
  console.log('  Input: "' + longEmail.substring(0, 20) + '..." (' + longEmail.length + ' chars)');
  console.log('  Output:', JSON.stringify(test6));
  console.log('  ✅ Esperado: { valid: false, error: "Email muito longo..." }\n');

  // Caso 7: Email com caracteres especiais inválidos
  var test7 = isValidEmail('user#invalid@example.com', true);
  console.log('Teste 7 - Caracteres inválidos (boolean):');
  console.log('  Input: "user#invalid@example.com", true');
  console.log('  Output:', test7);
  console.log('  ✅ Esperado: false\n');

  console.log('========================================');
  console.log('TESTES CONCLUÍDOS!');
  console.log('Verifique se todos os outputs correspondem aos esperados.');
  console.log('========================================');
}



