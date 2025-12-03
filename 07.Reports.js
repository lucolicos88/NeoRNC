/**
 * ============================================
 * REPORTS.GS - Relatórios e Dashboard
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * Deploy 32 - Performance otimizada com cache
 * ============================================
 */

var Reports = (function() {
  'use strict';

  /**
   * ============================================
   * DEPLOY 32: Cache de Dashboard
   * ============================================
   */

  /**
   * Obtém dados do dashboard com cache
   * ✅ Deploy 34: Cache de 15 min + Otimizado para +1000 RNCs
   * @param {boolean} forceRefresh - Força atualização ignorando cache
   * @return {Object} Estatísticas do dashboard
   */
  function getDashboardData(forceRefresh) {
    var startTime = new Date().getTime();

    try {
      // ✅ DEPLOY 32: Tentar obter do cache primeiro (agora 15 min)
      if (!forceRefresh) {
        var cached = getDashboardFromCache();
        if (cached) {
          Logger.logInfo('getDashboardData_CACHE_HIT', {
            cacheAge: cached.cacheAge,
            loadTime: new Date().getTime() - startTime
          });
          return cached.data;
        }
      }

      Logger.logInfo('getDashboardData_START', {
        forceRefresh: forceRefresh || false
      });

      // ✅ Deploy 34: Buscar RNCs otimizado
      var rncs = RncOperations.getAllRncs();
    
    // ============================================
    // ESTRUTURA DE DADOS DOS KPIs
    // ============================================
    var stats = {
      // === KPIs BÁSICOS (já existentes) ===
      total: rncs.length,
      aberturaRnc: 0,
      analiseQualidade: 0,
      analiseAcao: 0,
      finalizadas: 0,
      esteMes: 0,
      esteAno: 0,
      custoTotal: 0,
      tempoMedioResolucao: 0,
      rncsVencidas: 0,
      rncsProximasVencer: 0,
      acoesCorretivaTomadas: 0,
      
      // === NOVOS KPIs IMPLEMENTADOS ===
      impactoClienteTotal: 0,           // KPI 1: Total de RNCs com impacto ao cliente
      impactoClientePercentual: 0,      // KPI 1: % de RNCs que impactaram cliente
      deteccaoInternaTotal: 0,          // KPI 2: Total de RNCs detectadas internamente
      deteccaoInternaPercentual: 0,     // KPI 2: % de detecção interna
      naoProcede: 0,                    // KPI 3: Total de RNCs "Não Procede"
      naoProcedeTaxa: 0,                // KPI 3: Taxa de não procede
      custoMedioPorTipo: {},            // KPI 5: Custo médio por tipo de RNC
      indiceSeveridadePonderado: 0,     // KPI 6: ISP - Índice de Severidade Ponderado
      taxaCumprimentoPrazo: 0,          // KPI 7: % de RNCs finalizadas no prazo
      tempoMedioPorFase: {              // KPI 8: Tempo médio em cada fase
        abertura: 0,
        qualidade: 0,
        acao: 0
      },
      
      // === DADOS PARA GRÁFICOS (já existentes) ===
      porMes: {},
      porStatus: {},
      porSetor: {},
      porTipo: {},
      porRisco: {},
      porTipoFalha: {},
      porSetorAbertura: {},
      porSetorNaoConformidade: {},
      porStatusAcaoCorretiva: {}
    };
    
    // ============================================
    // VARIÁVEIS AUXILIARES PARA CÁLCULOS
    // ============================================
    var temposResolucao = [];
    var finalizadasNoPrazo = 0;
    var finalizadasTotal = 0;
    var today = new Date();
    var thisMonth = today.getMonth();
    var thisYear = today.getFullYear();
    
    // Pesos para Índice de Severidade
    var pesosSeveridade = {
      'Crítico': 10,
      'Alto': 7,
      'Médio': 4,
      'Baixo': 1
    };
    
    // ============================================
    // LOOP PRINCIPAL: PROCESSAR CADA RNC
    // ============================================
    for (var i = 0; i < rncs.length; i++) {
      var rnc = rncs[i];
      var status = String(rnc['Status Geral'] || CONFIG.STATUS_PIPELINE.ABERTURA).trim();
      
      // --------------------------------------------------
      // CONTADORES DE STATUS (Pipeline)
      // --------------------------------------------------
      if (status === CONFIG.STATUS_PIPELINE.ABERTURA) stats.aberturaRnc++;
      else if (status === CONFIG.STATUS_PIPELINE.ANALISE_QUALIDADE) stats.analiseQualidade++;
      else if (status === CONFIG.STATUS_PIPELINE.ANALISE_ACAO) stats.analiseAcao++;
      else if (status === CONFIG.STATUS_PIPELINE.FINALIZADA) {
        stats.finalizadas++;
        finalizadasTotal++;
      }
      
      // --------------------------------------------------
      // KPI BÁSICOS (já existentes - mantidos)
      // --------------------------------------------------
      
      // 1. CUSTO TOTAL
      var valor = parseFloat(rnc['Valor']) || 0;
      stats.custoTotal += valor;
      
      // 2. TEMPO DE RESOLUÇÃO (apenas finalizadas)
      var dataCriacao = rnc['Data Criação'];
      if (status === CONFIG.STATUS_PIPELINE.FINALIZADA && dataCriacao) {
        var dataObj = new Date(dataCriacao);
        var dataFechamento = rnc['Data da conclusão da Ação'];
        
        if (dataFechamento && !isNaN(dataObj.getTime())) {
          var fechamentoObj = new Date(dataFechamento);
          if (!isNaN(fechamentoObj.getTime())) {
            var diffTime = Math.abs(fechamentoObj - dataObj);
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            temposResolucao.push(diffDays);
          }
        }
      }
      
      // 3. RNCs VENCIDAS E PRÓXIMAS A VENCER
      var dataLimite = rnc['Data limite para execução'];
      if (dataLimite && status !== CONFIG.STATUS_PIPELINE.FINALIZADA) {
        var limiteObj = new Date(dataLimite);
        if (!isNaN(limiteObj.getTime())) {
          var diffDays = Math.ceil((limiteObj - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            stats.rncsVencidas++;
          } else if (diffDays <= 7) {
            stats.rncsProximasVencer++;
          }
        }
      }
      
      // 4. AÇÕES CORRETIVAS TOMADAS
      var statusAcao = rnc['Status da Ação Corretiva'] || '';
      if (statusAcao.toLowerCase().includes('concluída') || 
          statusAcao.toLowerCase().includes('concluida')) {
        stats.acoesCorretivaTomadas++;
      }
      
      // --------------------------------------------------
      // ✨ NOVOS KPIs IMPLEMENTADOS
      // --------------------------------------------------
      
      // === KPI 1: % IMPACTO AO CLIENTE ===
      var tipoRnc = rnc['Tipo RNC'] || '';
      if (tipoRnc.toLowerCase().includes('externa') && 
          tipoRnc.toLowerCase().includes('cliente')) {
        stats.impactoClienteTotal++;
      }
      
      // === KPI 2: TAXA DE DETECÇÃO INTERNA ===
      if (tipoRnc.toLowerCase().includes('interna')) {
        stats.deteccaoInternaTotal++;
      }
      
      // === KPI 3: TAXA DE NÃO PROCEDE ===
      if (tipoRnc.toLowerCase().includes('não procede') || 
          tipoRnc.toLowerCase().includes('nao procede')) {
        stats.naoProcede++;
      }
      
      // === KPI 5: CUSTO MÉDIO POR TIPO ===
      if (tipoRnc && tipoRnc.trim() !== '') {
        if (!stats.custoMedioPorTipo[tipoRnc]) {
          stats.custoMedioPorTipo[tipoRnc] = { soma: 0, count: 0 };
        }
        stats.custoMedioPorTipo[tipoRnc].soma += valor;
        stats.custoMedioPorTipo[tipoRnc].count++;
      }
      
      // === KPI 6: ÍNDICE DE SEVERIDADE PONDERADO (ISP) ===
      var risco = rnc['Risco'] || 'Baixo';
      var peso = pesosSeveridade[risco] || 1;
      stats.indiceSeveridadePonderado += peso;
      
      // === KPI 7: TAXA DE CUMPRIMENTO DE PRAZO ===
      if (status === CONFIG.STATUS_PIPELINE.FINALIZADA && dataLimite && dataFechamento) {
        var limiteObj = new Date(dataLimite);
        var fechamentoObj = new Date(dataFechamento);
        
        if (!isNaN(limiteObj.getTime()) && !isNaN(fechamentoObj.getTime())) {
          if (fechamentoObj <= limiteObj) {
            finalizadasNoPrazo++;
          }
        }
      }
      
      // --------------------------------------------------
      // GRÁFICOS (mantidos do código original)
      // --------------------------------------------------
      
      // Por Tipo
      var tipo = tipoRnc || 'Não informado';
      if (!stats.porTipo[tipo]) stats.porTipo[tipo] = 0;
      stats.porTipo[tipo]++;
      
      // Por Risco
      if (!stats.porRisco[risco]) stats.porRisco[risco] = 0;
      stats.porRisco[risco]++;
      
      // Por Tipo de Falha
      var tipoFalha = rnc['Tipo de Falha'] || 'Não informado';
      if (!stats.porTipoFalha[tipoFalha]) stats.porTipoFalha[tipoFalha] = 0;
      stats.porTipoFalha[tipoFalha]++;
      
      // Por Setor de Abertura
      var setorAbertura = rnc['Setor onde foi feita abertura\n'] || 
                         rnc['Setor onde foi feita abertura'] || 
                         'Não informado';
      setorAbertura = setorAbertura.trim();
      if (!stats.porSetorAbertura[setorAbertura]) stats.porSetorAbertura[setorAbertura] = 0;
      stats.porSetorAbertura[setorAbertura]++;
      
      // Por Setor de Não Conformidade
      var setorNaoConf = rnc['Setor onde ocorreu a não conformidade'] || 'Não informado';
      setorNaoConf = setorNaoConf.trim();
      if (!stats.porSetorNaoConformidade[setorNaoConf]) stats.porSetorNaoConformidade[setorNaoConf] = 0;
      stats.porSetorNaoConformidade[setorNaoConf]++;
      
      // Por Status da Ação Corretiva
      var statusAcaoLabel = statusAcao || 'Não iniciada';
      if (!stats.porStatusAcaoCorretiva[statusAcaoLabel]) stats.porStatusAcaoCorretiva[statusAcaoLabel] = 0;
      stats.porStatusAcaoCorretiva[statusAcaoLabel]++;
      
      // Por Mês (para timeline)
      if (dataCriacao) {
        var dataObj = new Date(dataCriacao);
        
        if (!isNaN(dataObj.getTime())) {
          if (dataObj.getMonth() === thisMonth && dataObj.getFullYear() === thisYear) {
            stats.esteMes++;
          }
          
          if (dataObj.getFullYear() === thisYear) {
            stats.esteAno++;
          }
          
          var mesAno = (dataObj.getMonth() + 1) + '/' + dataObj.getFullYear();
          if (!stats.porMes[mesAno]) stats.porMes[mesAno] = 0;
          stats.porMes[mesAno]++;
        }
      }
    }
    
    // ============================================
    // CÁLCULOS FINAIS DOS KPIs
    // ============================================
    
    // Tempo Médio de Resolução
    if (temposResolucao.length > 0) {
      var soma = temposResolucao.reduce(function(a, b) { return a + b; }, 0);
      stats.tempoMedioResolucao = Math.round(soma / temposResolucao.length);
    }
    
    // KPI 1: % Impacto ao Cliente
    if (stats.total > 0) {
      stats.impactoClientePercentual = Math.round((stats.impactoClienteTotal / stats.total) * 100);
    }
    
    // KPI 2: Taxa de Detecção Interna
    if (stats.total > 0) {
      stats.deteccaoInternaPercentual = Math.round((stats.deteccaoInternaTotal / stats.total) * 100);
    }
    
    // KPI 3: Taxa de Não Procede
    if (stats.total > 0) {
      stats.naoProcedeTaxa = Math.round((stats.naoProcede / stats.total) * 100);
    }
    
    // KPI 5: Calcular médias de custo por tipo
    for (var tipo in stats.custoMedioPorTipo) {
      var dados = stats.custoMedioPorTipo[tipo];
      stats.custoMedioPorTipo[tipo].media = dados.count > 0 ? 
        Math.round(dados.soma / dados.count) : 0;
    }
    
    // KPI 7: Taxa de Cumprimento de Prazo
    if (finalizadasTotal > 0) {
      stats.taxaCumprimentoPrazo = Math.round((finalizadasNoPrazo / finalizadasTotal) * 100);
    }
    
    // ============================================
    // LOG E RETORNO
    // ============================================
    Logger.logInfo('getDashboardData_SUCCESS', {
      totalRncs: stats.total,
      impactoCliente: stats.impactoClientePercentual + '%',
      deteccaoInterna: stats.deteccaoInternaPercentual + '%',
      naoProcede: stats.naoProcedeTaxa + '%',
      isp: stats.indiceSeveridadePonderado,
      taxaPrazo: stats.taxaCumprimentoPrazo + '%',
      duration: Logger.logPerformance('getDashboardData', startTime)
    });

    // ✅ DEPLOY 32: Salvar no cache (5 minutos)
    saveDashboardToCache(stats);

    return stats;

  } catch (error) {
    Logger.logError('getDashboardData_ERROR', error);
    return {
      total: 0,
      error: error.toString()
    };
  }
}

  /**
   * ============================================
   * DEPLOY 32: Funções de Cache do Dashboard
   * ============================================
   */

  /**
   * Obtém dashboard do cache
   * @return {Object|null} { data, cacheAge } ou null se não cached
   * @private
   */
  function getDashboardFromCache() {
    try {
      var cache = CacheService.getScriptCache();
      var cacheKey = 'dashboard_data_v1';
      var cached = cache.get(cacheKey);

      if (cached) {
        var parsedData = JSON.parse(cached);
        var cacheTimestamp = parsedData.timestamp || 0;
        var now = new Date().getTime();
        var cacheAge = Math.floor((now - cacheTimestamp) / 1000); // segundos

        Logger.logDebug('getDashboardFromCache_HIT', {
          cacheAge: cacheAge + 's',
          dataSize: cached.length
        });

        return {
          data: parsedData.stats,
          cacheAge: cacheAge
        };
      }

      Logger.logDebug('getDashboardFromCache_MISS');
      return null;

    } catch (error) {
      Logger.logWarning('getDashboardFromCache_ERROR', {
        error: error.toString()
      });
      return null;
    }
  }

  /**
   * Salva dashboard no cache
   * @param {Object} stats - Estatísticas do dashboard
   * @private
   */
  function saveDashboardToCache(stats) {
    try {
      var cache = CacheService.getScriptCache();
      var cacheKey = 'dashboard_data_v1';
      var cacheData = {
        stats: stats,
        timestamp: new Date().getTime()
      };

      var cacheTTL = 900; // ✅ Deploy 34: 15 minutos (otimizado para +1000 RNCs)
      cache.put(cacheKey, JSON.stringify(cacheData), cacheTTL);

      Logger.logDebug('saveDashboardToCache_SUCCESS', {
        ttl: cacheTTL + 's',
        dataSize: JSON.stringify(cacheData).length
      });

    } catch (error) {
      Logger.logWarning('saveDashboardToCache_ERROR', {
        error: error.toString()
      });
    }
  }

  /**
   * Limpa cache do dashboard
   * @return {boolean} Sucesso
   */
  function clearDashboardCache() {
    try {
      var cache = CacheService.getScriptCache();
      cache.remove('dashboard_data_v1');
      Logger.logInfo('clearDashboardCache_SUCCESS');
      return true;
    } catch (error) {
      Logger.logError('clearDashboardCache_ERROR', error);
      return false;
    }
  }
  
  /**
   * Obtém dados do Kanban
   * @return {Object} Dados organizados por coluna
   */
  function getKanbanData() {
    var startTime = new Date().getTime();
    
    try {
      Logger.logInfo('getKanbanData_START');
      
      var rncs = RncOperations.getAllRncs();
      
      // Inicializar colunas do kanban
      var kanban = {};
      kanban[CONFIG.STATUS_PIPELINE.ABERTURA] = [];
      kanban[CONFIG.STATUS_PIPELINE.ANALISE_QUALIDADE] = [];
      kanban[CONFIG.STATUS_PIPELINE.ANALISE_ACAO] = [];
      kanban[CONFIG.STATUS_PIPELINE.FINALIZADA] = [];
      
      for (var i = 0; i < rncs.length; i++) {
        var rnc = rncs[i];
        var status = String(rnc['Status Geral'] || CONFIG.STATUS_PIPELINE.ABERTURA).trim();
        
        // Mapear status para coluna correta
        var kanbanColumn = status;
        if (!kanban[kanbanColumn]) {
          kanbanColumn = CONFIG.STATUS_PIPELINE.ABERTURA;
        }
        
        // Calcular dias abertos
        var diasAberto = 0;
        var dataCriacao = rnc['Data Criação'];
        if (dataCriacao) {
          var dataObj = new Date(dataCriacao);
          if (!isNaN(dataObj.getTime())) {
            var agora = new Date();
            var diffTime = Math.abs(agora - dataObj);
            diasAberto = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        
        // Determinar prioridade
        var prioridade = 'Normal';
        if (diasAberto > 30) prioridade = 'Alta';
        else if (diasAberto > 15) prioridade = 'Média';
        
        // Criar item do kanban
        var kanbanItem = {
          numero: String(rnc['Nº RNC'] || ''),
          cliente: String(rnc['Nome do Cliente'] || 'Cliente não informado'),
          descricao: String(rnc['Descrição Detalhada da RNC/Reclamação'] || rnc['Descrição do Problema'] || '').substring(0, 100),
          responsavel: String(rnc['Responsável pela abertura da RNC'] || 'Não atribuído'),
          data: dataCriacao || '',
          diasAberto: diasAberto,
          status: status,
          setor: String(rnc['Setor onde ocorreu a não conformidade'] || rnc['Setor onde foi feita abertura\n'] || ''),
          tipo: String(rnc['Tipo RNC'] || ''),
          risco: String(rnc['Risco'] || ''),
          prioridade: prioridade,
          dataAnalise: String(rnc['Data da Análise'] || ''),
          statusAcao: String(rnc['Status da Ação Corretiva'] || '')
        };
        
        kanban[kanbanColumn].push(kanbanItem);
      }
      
      // Ordenar cards por prioridade e data
      for (var column in kanban) {
        kanban[column].sort(function(a, b) {
          // Prioridade primeiro
          var prioOrder = {'Alta': 0, 'Média': 1, 'Normal': 2};
          if (prioOrder[a.prioridade] !== prioOrder[b.prioridade]) {
            return prioOrder[a.prioridade] - prioOrder[b.prioridade];
          }
          // Depois por dias aberto
          return b.diasAberto - a.diasAberto;
        });
      }
      
      Logger.logInfo('getKanbanData_SUCCESS', {
        abertura: kanban[CONFIG.STATUS_PIPELINE.ABERTURA].length,
        qualidade: kanban[CONFIG.STATUS_PIPELINE.ANALISE_QUALIDADE].length,
        acao: kanban[CONFIG.STATUS_PIPELINE.ANALISE_ACAO].length,
        finalizadas: kanban[CONFIG.STATUS_PIPELINE.FINALIZADA].length,
        duration: Logger.logPerformance('getKanbanData', startTime)
      });
      
      return kanban;
      
    } catch (error) {
      Logger.logError('getKanbanData_ERROR', error);
      
      // Retornar estrutura vazia em caso de erro
      var emptyKanban = {};
      emptyKanban[CONFIG.STATUS_PIPELINE.ABERTURA] = [];
      emptyKanban[CONFIG.STATUS_PIPELINE.ANALISE_QUALIDADE] = [];
      emptyKanban[CONFIG.STATUS_PIPELINE.ANALISE_ACAO] = [];
      emptyKanban[CONFIG.STATUS_PIPELINE.FINALIZADA] = [];
      return emptyKanban;
    }
  }
  
  /**
   * Gera relatório com filtros
   * @param {Object} filters - Filtros do relatório
   * @return {Object} Dados do relatório
   */
  function generateReport(filters) {
  var startTime = new Date().getTime();
  
  try {
    Logger.logInfo('generateReport_START', { filters: filters });
    
    var allRncs = RncOperations.getAllRncs();
    var filteredRncs = [];
    
    // Log para debug
    Logger.logDebug('generateReport_DEBUG', {
      totalRncs: allRncs.length,
      filterDateStart: filters.dataInicio,
      filterDateEnd: filters.dataFim
    });
    
    // Aplicar filtros
    for (var i = 0; i < allRncs.length; i++) {
      var rnc = allRncs[i];
      var incluir = true;
      
      // CORREÇÃO: Filtro de data mais robusto
      if (filters.dataInicio && filters.dataFim) {
        var dataCriacao = rnc['Data Criação'] || rnc['Data de Abertura'];
        
        if (dataCriacao) {
          var dataObj;
          
          // Tratar diferentes formatos de data
          if (typeof dataCriacao === 'string') {
            // Se for string ISO
            if (dataCriacao.includes('T')) {
              dataObj = new Date(dataCriacao);
            } 
            // Se for formato DD/MM/YYYY
            else if (dataCriacao.includes('/')) {
              var parts = dataCriacao.split('/');
              if (parts.length === 3) {
                dataObj = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
            // Se for formato YYYY-MM-DD
            else if (dataCriacao.includes('-')) {
              dataObj = new Date(dataCriacao + 'T12:00:00');
            }
            else {
              dataObj = new Date(dataCriacao);
            }
          } else if (dataCriacao instanceof Date) {
            dataObj = dataCriacao;
          }
          
          // Validar se é data válida
          if (!dataObj || isNaN(dataObj.getTime())) {
            Logger.logWarning('generateReport_INVALID_DATE', {
              rncNumber: rnc['Nº RNC'],
              dataCriacao: dataCriacao
            });
            incluir = false;
          } else {
            // Comparar datas
            var inicio = new Date(filters.dataInicio + 'T00:00:00');
            var fim = new Date(filters.dataFim + 'T23:59:59');
            
            if (dataObj < inicio || dataObj > fim) {
              incluir = false;
            }
          }
        } else {
          // Se não tem data, não incluir quando filtro de data está ativo
          incluir = false;
        }
      }
      
      // Filtro de setor - CORREÇÃO: verificar ambos os campos de setor
      if (incluir && filters.setor && filters.setor !== 'Todos') {
        var setor = rnc['Setor onde ocorreu a não conformidade'] || 
                   rnc['Setor onde foi feita abertura\n'] || 
                   rnc['Setor onde foi feita abertura'] || '';
        
        // Limpar e comparar
        setor = String(setor).trim();
        if (setor !== filters.setor) {
          incluir = false;
        }
      }
      
      // Filtro de tipo - CORREÇÃO: normalizar comparação
      if (incluir && filters.tipo && filters.tipo !== 'Todos') {
        var tipoRnc = rnc['Tipo RNC'] || rnc['Tipo da RNC'] || '';
        tipoRnc = String(tipoRnc).trim();
        
        if (tipoRnc !== filters.tipo) {
          incluir = false;
        }
      }
      
      // Filtro de status
      if (incluir && filters.status && filters.status !== 'Todos') {
        var status = rnc['Status Geral'] || '';
        status = String(status).trim();
        
        if (status !== filters.status) {
          incluir = false;
        }
      }
      
      // Filtro de responsável
      if (incluir && filters.responsavel && filters.responsavel !== 'Todos') {
        var responsavel = rnc['Responsável pela abertura da RNC'] || '';
        responsavel = String(responsavel).trim();
        
        if (responsavel !== filters.responsavel) {
          incluir = false;
        }
      }
      
      // Filtro de risco
      if (incluir && filters.risco && filters.risco !== 'Todos') {
        var risco = rnc['Risco'] || '';
        risco = String(risco).trim();
        
        if (risco !== filters.risco) {
          incluir = false;
        }
      }
      
      if (incluir) {
        filteredRncs.push(rnc);
      }
    }
    
    // Log resultado dos filtros
    Logger.logDebug('generateReport_FILTERED', {
      original: allRncs.length,
      filtered: filteredRncs.length,
      filters: filters
    });
    
    // Calcular estatísticas
    var stats = calculateReportStats(filteredRncs);
    
    // Ordenar resultados por data (mais recentes primeiro)
    filteredRncs.sort(function(a, b) {
      var dateA = new Date(a['Data Criação'] || a['Data de Abertura'] || 0);
      var dateB = new Date(b['Data Criação'] || b['Data de Abertura'] || 0);
      return dateB - dateA;
    });
    
    var result = {
      rncs: filteredRncs,
      stats: stats,
      filters: filters,
      dataGeracao: new Date().toISOString(),
      totalOriginal: allRncs.length,
      totalFiltrado: filteredRncs.length
    };
    
    Logger.logInfo('generateReport_SUCCESS', {
      totalOriginal: allRncs.length,
      totalFiltrado: filteredRncs.length,
      duration: Logger.logPerformance('generateReport', startTime)
    });
    
    return result;
    
  } catch (error) {
    Logger.logError('generateReport_ERROR', error, { filters: filters });
    return {
      rncs: [],
      stats: {},
      filters: filters,
      dataGeracao: new Date().toISOString(),
      error: error.toString()
    };
  }
}
  
  /**
   * Calcula estatísticas do relatório
   * @private
   */
  /**
 * Calcula estatísticas do relatório com KPIs AVANÇADOS
 * Deploy 31 - Versão robusta
 */
function calculateReportStats(rncs) {
  var stats = {
    // === KPIs BÁSICOS ===
    total: rncs.length,
    porStatus: {},
    porSetor: {},
    porTipo: {},
    porMes: {},
    porRisco: {},
    porResponsavel: {},
    porTipoFalha: {},
    tempoMedioResolucao: 0,
    taxaResolucao: 0,
    rncsComAtraso: 0,
    
    // === NOVOS KPIs (mesmos do Dashboard) ===
    impactoClienteTotal: 0,
    impactoClientePercentual: 0,
    deteccaoInternaTotal: 0,
    deteccaoInternaPercentual: 0,
    naoProcede: 0,
    naoProcedeTaxa: 0,
    custoTotal: 0,
    custoMedioPorTipo: {},
    indiceSeveridadePonderado: 0,
    taxaCumprimentoPrazo: 0,
    finalizadasNoPrazo: 0,
    finalizadasTotal: 0
  };
  
  if (rncs.length === 0) {
    return stats;
  }
  
  var temposResolucao = [];
  var today = new Date();
  
  // Pesos ISP
  var pesosSeveridade = {
    'Crítico': 10,
    'Alto': 7,
    'Médio': 4,
    'Baixo': 1
  };
  
  // LOOP PRINCIPAL
  for (var i = 0; i < rncs.length; i++) {
    var rnc = rncs[i];
    var status = rnc['Status Geral'] || CONFIG.STATUS_PIPELINE.ABERTURA;
    var tipoRnc = rnc['Tipo RNC'] || 'Não informado';
    var risco = rnc['Risco'] || 'Baixo';
    var valor = parseFloat(rnc['Valor']) || 0;
    
    // Custo total
    stats.custoTotal += valor;
    
    // Por Status
    if (!stats.porStatus[status]) stats.porStatus[status] = 0;
    stats.porStatus[status]++;
    
    // Finalizadas
    if (status === CONFIG.STATUS_PIPELINE.FINALIZADA) {
      stats.finalizadasTotal++;
    }
    
    // Por Setor
    var setor = rnc['Setor onde ocorreu a não conformidade'] || 
               rnc['Setor onde foi feita abertura\n'] || 
               'Não informado';
    if (!stats.porSetor[setor]) stats.porSetor[setor] = 0;
    stats.porSetor[setor]++;
    
    // Por Tipo
    if (!stats.porTipo[tipoRnc]) stats.porTipo[tipoRnc] = 0;
    stats.porTipo[tipoRnc]++;
    
    // Por Risco
    if (!stats.porRisco[risco]) stats.porRisco[risco] = 0;
    stats.porRisco[risco]++;
    
    // Por Tipo de Falha
    var tipoFalha = rnc['Tipo de Falha'] || 'Não informado';
    if (!stats.porTipoFalha[tipoFalha]) stats.porTipoFalha[tipoFalha] = 0;
    stats.porTipoFalha[tipoFalha]++;
    
    // Por Responsável
    var responsavel = rnc['Responsável pela abertura da RNC'] || 'Não atribuído';
    if (!stats.porResponsavel[responsavel]) stats.porResponsavel[responsavel] = 0;
    stats.porResponsavel[responsavel]++;
    
    // Por Mês
    var dataCriacao = rnc['Data Criação'];
    if (dataCriacao) {
      var dataObj = new Date(dataCriacao);
      if (!isNaN(dataObj.getTime())) {
        var mesAno = (dataObj.getMonth() + 1) + '/' + dataObj.getFullYear();
        if (!stats.porMes[mesAno]) stats.porMes[mesAno] = 0;
        stats.porMes[mesAno]++;
        
        // Tempo de resolução (finalizadas)
        if (status === CONFIG.STATUS_PIPELINE.FINALIZADA) {
          var dataFechamento = rnc['Data da conclusão da Ação'];
          if (dataFechamento) {
            var fechamentoObj = new Date(dataFechamento);
            if (!isNaN(fechamentoObj.getTime())) {
              var diffTime = Math.abs(fechamentoObj - dataObj);
              var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              temposResolucao.push(diffDays);
            }
          }
        }
      }
    }
    
    // Verificar atraso
    var dataLimite = rnc['Data limite para execução'];
    if (dataLimite && status !== CONFIG.STATUS_PIPELINE.FINALIZADA) {
      var limiteObj = new Date(dataLimite);
      if (!isNaN(limiteObj.getTime()) && limiteObj < today) {
        stats.rncsComAtraso++;
      }
    }
    
    // === NOVOS KPIs ===
    
    // KPI 1: Impacto Cliente
    if (tipoRnc.toLowerCase().includes('externa') && 
        tipoRnc.toLowerCase().includes('cliente')) {
      stats.impactoClienteTotal++;
    }
    
    // KPI 2: Detecção Interna
    if (tipoRnc.toLowerCase().includes('interna')) {
      stats.deteccaoInternaTotal++;
    }
    
    // KPI 3: Não Procede
    if (tipoRnc.toLowerCase().includes('não procede') || 
        tipoRnc.toLowerCase().includes('nao procede')) {
      stats.naoProcede++;
    }
    
    // KPI 5: Custo Médio por Tipo
    if (!stats.custoMedioPorTipo[tipoRnc]) {
      stats.custoMedioPorTipo[tipoRnc] = { soma: 0, count: 0 };
    }
    stats.custoMedioPorTipo[tipoRnc].soma += valor;
    stats.custoMedioPorTipo[tipoRnc].count++;
    
    // KPI 6: ISP
    var peso = pesosSeveridade[risco] || 1;
    stats.indiceSeveridadePonderado += peso;
    
    // KPI 7: Cumprimento Prazo
    if (status === CONFIG.STATUS_PIPELINE.FINALIZADA && dataLimite && dataCriacao) {
      var limiteObj = new Date(dataLimite);
      var fechamentoObj = new Date(rnc['Data da conclusão da Ação']);
      
      if (!isNaN(limiteObj.getTime()) && !isNaN(fechamentoObj.getTime())) {
        if (fechamentoObj <= limiteObj) {
          stats.finalizadasNoPrazo++;
        }
      }
    }
  }
  
  // === CÁLCULOS FINAIS ===
  
  // Tempo médio
  if (temposResolucao.length > 0) {
    var soma = temposResolucao.reduce(function(a, b) { return a + b; }, 0);
    stats.tempoMedioResolucao = Math.round(soma / temposResolucao.length);
  }
  
  // Taxa resolução
  stats.taxaResolucao = stats.total > 0 ?
    Math.round((stats.finalizadasTotal / stats.total) * 100) : 0;
  
  // KPI 1: %
  if (stats.total > 0) {
    stats.impactoClientePercentual = Math.round((stats.impactoClienteTotal / stats.total) * 100);
  }
  
  // KPI 2: %
  if (stats.total > 0) {
    stats.deteccaoInternaPercentual = Math.round((stats.deteccaoInternaTotal / stats.total) * 100);
  }
  
  // KPI 3: %
  if (stats.total > 0) {
    stats.naoProcedeTaxa = Math.round((stats.naoProcede / stats.total) * 100);
  }
  
  // KPI 5: Médias
  for (var tipo in stats.custoMedioPorTipo) {
    var dados = stats.custoMedioPorTipo[tipo];
    dados.media = dados.count > 0 ? Math.round(dados.soma / dados.count) : 0;
  }
  
  // KPI 7: %
  if (stats.finalizadasTotal > 0) {
    stats.taxaCumprimentoPrazo = Math.round((stats.finalizadasNoPrazo / stats.finalizadasTotal) * 100);
  }
  
  return stats;
}
  
  /**
   * Obtém opções para filtros de relatório
   * @return {Object} Opções disponíveis
   */
  function getReportFilterOptions() {
    try {
      Logger.logInfo('getReportFilterOptions_START');
      
      var rncs = RncOperations.getAllRncs();
      var options = {
        setores: new Set(),
        tipos: new Set(),
        status: new Set(),
        responsaveis: new Set(),
        riscos: new Set()
      };
      
      for (var i = 0; i < rncs.length; i++) {
        var rnc = rncs[i];
        
        // Setor
        var setor = rnc['Setor onde ocorreu a não conformidade'] || 
                   rnc['Setor onde foi feita abertura\n'];
        if (setor && setor.trim() !== '') {
          options.setores.add(setor.trim());
        }
        
        // Tipo
        var tipo = rnc['Tipo RNC'];
        if (tipo && tipo.trim() !== '') {
          options.tipos.add(tipo.trim());
        }
        
        // Status
        var status = rnc['Status Geral'];
        if (status && status.trim() !== '') {
          options.status.add(status.trim());
        }
        
        // Responsável
        var responsavel = rnc['Responsável pela abertura da RNC'];
        if (responsavel && responsavel.trim() !== '') {
          options.responsaveis.add(responsavel.trim());
        }
        
        // Risco
        var risco = rnc['Risco'];
        if (risco && risco.trim() !== '') {
          options.riscos.add(risco.trim());
        }
      }
      
      var result = {
        setores: Array.from(options.setores).sort(),
        tipos: Array.from(options.tipos).sort(),
        status: Array.from(options.status).sort(),
        responsaveis: Array.from(options.responsaveis).sort(),
        riscos: Array.from(options.riscos).sort()
      };
      
      Logger.logInfo('getReportFilterOptions_SUCCESS', {
        setores: result.setores.length,
        tipos: result.tipos.length,
        status: result.status.length,
        responsaveis: result.responsaveis.length,
        riscos: result.riscos.length
      });
      
      return result;
      
    } catch (error) {
      Logger.logError('getReportFilterOptions_ERROR', error);
      return {
        setores: [],
        tipos: [],
        status: [],
        responsaveis: [],
        riscos: []
      };
    }
  }
  
  // API Pública
  return {
    getDashboardData: getDashboardData,
    getKanbanData: getKanbanData,
    generateReport: generateReport,
    clearDashboardCache: clearDashboardCache,
    getReportFilterOptions: getReportFilterOptions
  };
})();