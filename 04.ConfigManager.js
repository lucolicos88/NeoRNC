/**
 * ============================================
 * CONFIGMANAGER.GS - Gerenciamento de Configurações
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * Deploy 33 - Cache de configuração
 * Deploy 120 - Documentação JSDoc completa
 * ============================================
 *
 * @namespace ConfigManager
 * @description Módulo responsável pelo gerenciamento de configurações do sistema RNC.
 * Controla seções, campos, listas e sincronização com a planilha principal.
 * Implementa sistema de cache para otimização de performance.
 *
 * @since Deploy 30
 */

var ConfigManager = (function() {
  'use strict';

  /**
   * ============================================
   * DEPLOY 33: Cache de Configuração
   * ✅ DEPLOY 116 - FASE 5: Atualizado para usar CONFIG.CACHE.MEDIUM
   * ============================================
   */

  var CACHE_TTL = CONFIG.CACHE.MEDIUM; // 5 minutos (estratégia unificada)
  var CACHE_PREFIX = 'config_';

  /**
   * Obtém valor do cache de configurações do sistema.
   * Busca dados previamente armazenados em cache para otimizar performance
   * e reduzir acesso à planilha do Google Sheets.
   *
   * @param {string} key - Chave do cache a ser buscada
   * @return {*} Valor do cache parseado como JSON ou null se não encontrado
   * @private
   *
   * @example
   * var cached = getFromCache('sections');
   * // Returns: [{nome: 'Abertura', descricao: '...'}] ou null
   *
   * @since Deploy 33
   */
  function getFromCache(key) {
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(CACHE_PREFIX + key);
      if (cached) {
        Logger.logDebug('getFromCache_HIT', { key: key });
        return JSON.parse(cached);
      }
      Logger.logDebug('getFromCache_MISS', { key: key });
      return null;
    } catch (error) {
      Logger.logWarning('getFromCache_ERROR', { key: key, error: error.toString() });
      return null;
    }
  }

  /**
   * Salva valor no cache de configurações do sistema.
   * Armazena dados em cache com TTL configurado para otimizar performance
   * de futuras consultas às mesmas configurações.
   *
   * @param {string} key - Chave do cache onde o valor será armazenado
   * @param {*} value - Valor a ser armazenado (será convertido para JSON)
   * @private
   *
   * @example
   * var sections = [{nome: 'Abertura', descricao: 'Seção de abertura'}];
   * saveToCache('sections', sections);
   * // Returns: undefined (armazena no cache)
   *
   * @since Deploy 33
   */
  function saveToCache(key, value) {
    try {
      var cache = CacheService.getScriptCache();
      cache.put(CACHE_PREFIX + key, JSON.stringify(value), CACHE_TTL);
      Logger.logDebug('saveToCache_SUCCESS', { key: key, ttl: CACHE_TTL });
    } catch (error) {
      Logger.logWarning('saveToCache_ERROR', { key: key, error: error.toString() });
    }
  }

  /**
   * Limpa cache específico ou todos os caches de configuração.
   * Permite invalidação manual do cache quando configurações são alteradas,
   * garantindo que próximas consultas busquem dados atualizados.
   *
   * @param {string} key - Chave do cache a limpar (opcional, se vazio limpa todos)
   * @return {void}
   *
   * @example
   * clearCache('sections');
   * // Returns: undefined (limpa cache de seções)
   *
   * @example
   * clearCache();
   * // Returns: undefined (limpa todos os caches de configuração)
   *
   * @since Deploy 33
   */
  function clearCache(key) {
    try {
      var cache = CacheService.getScriptCache();
      if (key) {
        cache.remove(CACHE_PREFIX + key);
        Logger.logInfo('clearCache_KEY', { key: key });
      } else {
        // Limpar todos os caches de configuração
        cache.remove(CACHE_PREFIX + 'sections');
        cache.remove(CACHE_PREFIX + 'lists');
        cache.remove(CACHE_PREFIX + 'permissions');
        Logger.logInfo('clearCache_ALL');
      }
    } catch (error) {
      Logger.logError('clearCache_ERROR', error);
    }
  }

  /**
   * Obtém campos configurados para uma seção específica.
   * Busca todos os campos ativos da seção ordenados por ordem de exibição,
   * implementando cache para otimizar performance em consultas subsequentes.
   *
   * @param {string} sectionName - Nome da seção (ex: 'Abertura', 'Qualidade', 'Liderança')
   * @return {Array} Lista de objetos com configuração dos campos da seção
   *
   * @example
   * var fields = ConfigManager.getFieldsForSection('Abertura');
   * // Returns: [{name: 'Produto', type: 'text', required: true, placeholder: 'Nome do produto', list: '', order: 1}]
   *
   * @since Deploy 33
   */
  function getFieldsForSection(sectionName) {
  try {
    // ✅ DEPLOY 33: Tentar obter do cache
    var cacheKey = 'fields_' + sectionName;
    var cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - buscar do banco
    var fields = Database.findData(CONFIG.SHEETS.CONFIG_CAMPOS, {
      'Seção': sectionName,
      'Ativo': 'Sim'
    }, {
      orderBy: 'Ordem'
    });
    
    var result = [];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      result.push({
        name: field['Campo'],
        type: field['Tipo'],
        required: field['Obrigatório'] === 'Sim',
        placeholder: field['Placeholder'] || '',
        list: field['Lista'] || '',            // ✅ CORRIGIDO: 'list' em inglês
        order: parseInt(field['Ordem']) || 999  // ✅ BONUS: padronizar 'order' também
      });
    }

    Logger.logDebug('getFieldsForSection', {
      section: sectionName,
      fieldsCount: result.length
    });

    // ✅ DEPLOY 33: Salvar no cache
    saveToCache(cacheKey, result);

    return result;
    
  } catch (error) {
    Logger.logError('getFieldsForSection', error, { section: sectionName });
    return [];
  }
}
  
  /**
   * Obtém todas as seções configuradas do sistema.
   * Retorna lista de seções ativas ordenadas por ordem de exibição,
   * com cache implementado para otimização de performance.
   *
   * @return {Array} Lista de objetos representando seções do sistema
   *
   * @example
   * var sections = ConfigManager.getSections();
   * // Returns: [{nome: 'Abertura', descricao: 'Dados iniciais', ordem: 1, ativo: 'Sim'}]
   *
   * @since Deploy 33
   */
  function getSections() {
    try {
      // ✅ DEPLOY 33: Tentar obter do cache
      var cached = getFromCache('sections');
      if (cached) {
        return cached;
      }

      // Cache miss - buscar do banco
      var sections = Database.findData(CONFIG.SHEETS.CONFIG_SECOES, {
        'Ativo': 'Sim'
      }, {
        orderBy: 'Ordem'
      });

      var result = [];
      for (var i = 0; i < sections.length; i++) {
        result.push({
          nome: sections[i]['Nome'],
          descricao: sections[i]['Descrição'],
          ordem: parseInt(sections[i]['Ordem']) || 999,
          ativo: sections[i]['Ativo']
        });
      }

      Logger.logDebug('getSections', { count: result.length });

      // ✅ DEPLOY 33: Salvar no cache
      saveToCache('sections', result);

      return result;
      
    } catch (error) {
      Logger.logError('getSections', error);
      return [];
    }
  }
  
  /**
   * Obtém todas as listas configuradas do sistema.
   * Retorna objeto com todas as listas disponíveis para campos tipo 'select',
   * processando a planilha de listas e implementando cache.
   *
   * @return {Object} Objeto onde chaves são nomes das listas e valores são arrays de itens
   *
   * @example
   * var lists = ConfigManager.getLists();
   * // Returns: {Setores: ['Produção', 'Qualidade'], TipoRNC: ['Produto', 'Processo']}
   *
   * @since Deploy 33
   */
  function getLists() {
    try {
      // ✅ DEPLOY 33: Tentar obter do cache
      var cached = getFromCache('lists');
      if (cached) {
        return cached;
      }

      // Cache miss - buscar do banco
      var sheet = Database.getSheet(CONFIG.SHEETS.LISTAS);

      if (sheet.getLastRow() <= 1) {
        return {};
      }

      var data = sheet.getDataRange().getValues();
      var lists = {};

      // Headers são os nomes das listas
      var headers = data[0];
      for (var i = 0; i < headers.length; i++) {
        if (headers[i]) {
          lists[headers[i]] = [];

          // Adicionar valores da lista
          for (var j = 1; j < data.length; j++) {
            if (data[j][i] && String(data[j][i]).trim() !== '') {
              lists[headers[i]].push(String(data[j][i]).trim());
            }
          }
        }
      }

      Logger.logDebug('getLists', { listsCount: Object.keys(lists).length });

      // ✅ DEPLOY 33: Salvar no cache
      saveToCache('lists', lists);

      return lists;
      
    } catch (error) {
      Logger.logError('getLists', error);
      return {};
    }
  }
  
  /**
   * Salva ou atualiza uma lista de opções no sistema.
   * Cria nova coluna se a lista não existir ou atualiza coluna existente,
   * utilizado para gerenciar opções de campos tipo 'select'.
   *
   * @param {string} listName - Nome da lista a ser salva ou atualizada
   * @param {Array} items - Array de strings com os itens da lista
   * @return {Object} Objeto com resultado da operação (success, configChanged, action, listName)
   *
   * @example
   * var result = ConfigManager.saveList('Setores', ['Produção', 'Qualidade', 'Logística']);
   * // Returns: {success: true, configChanged: true, action: 'updated', listName: 'Setores'}
   *
   * @since Deploy 120
   */
  function saveList(listName, items) {
    try {
      Logger.logInfo('saveList_START', {
        listName: listName,
        itemsCount: items.length
      });
      
      var sheet = Database.getSheet(CONFIG.SHEETS.LISTAS);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Encontrar ou criar coluna
      var colIndex = headers.indexOf(listName);
      if (colIndex === -1) {
        colIndex = headers.length;
        sheet.getRange(1, colIndex + 1).setValue(listName);
      }
      
      // Limpar coluna existente
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, colIndex + 1, sheet.getLastRow() - 1, 1).clearContent();
      }
      
      // Adicionar novos itens
      for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].trim()) {
          sheet.getRange(i + 2, colIndex + 1).setValue(items[i].trim());
        }
      }
      
      Logger.logInfo('saveList_SUCCESS', { listName: listName });
      return { 
        success: true, 
        configChanged: true,
        action: 'updated',
        listName: listName
      };
      
    } catch (error) {
      Logger.logError('saveList_ERROR', error, { listName: listName });
      throw error;
    }
  }
  
  /**
   * Deleta uma lista de opções do sistema.
   * Remove completamente a coluna da lista da planilha de Listas,
   * impedindo seu uso em campos tipo 'select'.
   *
   * @param {string} listName - Nome da lista a ser deletada
   * @return {Object} Objeto com resultado da operação (success, configChanged, action, listName)
   *
   * @example
   * var result = ConfigManager.deleteList('SetoresAntigos');
   * // Returns: {success: true, configChanged: true, action: 'deleted', listName: 'SetoresAntigos'}
   *
   * @since Deploy 120
   */
  function deleteList(listName) {
    try {
      Logger.logWarning('deleteList_ATTEMPT', { listName: listName });
      
      var sheet = Database.getSheet(CONFIG.SHEETS.LISTAS);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var colIndex = headers.indexOf(listName);
      
      if (colIndex !== -1) {
        sheet.deleteColumn(colIndex + 1);
        Logger.logInfo('deleteList_SUCCESS', { listName: listName });
        return { 
            success: true, 
            configChanged: true,
            action: 'deleted',
            listName: listName
          };
      }
      
      return { success: false, message: 'Lista não encontrada' };
      
    } catch (error) {
      Logger.logError('deleteList_ERROR', error, { listName: listName });
      throw error;
    }
  }
  
  /**
   * Salva configuração de campo do sistema.
   * Cria novo campo ou atualiza campo existente na configuração,
   * sincronizando automaticamente com a planilha RNC principal.
   *
   * @param {Object} fieldData - Objeto com dados completos do campo a salvar
   * @param {string} fieldData.secao - Seção onde o campo será exibido
   * @param {string} fieldData.campo - Nome do campo
   * @param {string} fieldData.tipo - Tipo do campo (text, number, select, date, etc)
   * @param {string} fieldData.obrigatorio - Se o campo é obrigatório ('Sim' ou 'Não')
   * @param {string} fieldData.placeholder - Texto de placeholder do campo
   * @param {string} fieldData.lista - Nome da lista (se tipo for select)
   * @param {number} fieldData.ordem - Ordem de exibição do campo
   * @param {string} fieldData.ativo - Se o campo está ativo ('Sim' ou 'Não')
   * @return {Object} Objeto com resultado da operação (success, configChanged, action, fieldName)
   *
   * @example
   * var result = ConfigManager.saveFieldConfiguration({
   *   secao: 'Abertura',
   *   campo: 'Produto',
   *   tipo: 'text',
   *   obrigatorio: 'Sim',
   *   placeholder: 'Nome do produto',
   *   lista: '',
   *   ordem: 1,
   *   ativo: 'Sim'
   * });
   * // Returns: {success: true, configChanged: true, action: 'created', fieldName: 'Produto'}
   *
   * @since Deploy 120
   */
  function saveFieldConfiguration(fieldData) {
    try {
      Logger.logInfo('saveFieldConfiguration_START', { field: fieldData.campo });
      
      // Verificar se já existe
      var existing = Database.findData(CONFIG.SHEETS.CONFIG_CAMPOS, {
        'Seção': fieldData.secao,
        'Campo': fieldData.campo
      });
      
      var data = {
        'Seção': fieldData.secao,
        'Campo': fieldData.campo,
        'Tipo': fieldData.tipo,
        'Obrigatório': fieldData.obrigatorio,
        'Placeholder': fieldData.placeholder || '',
        'Lista': fieldData.lista || '',
        'Ordem': fieldData.ordem || 999,
        'Ativo': fieldData.ativo || 'Sim',
        'ValidaçãoRegex': fieldData.validacaoRegex || '',
        'MensagemErro': fieldData.mensagemErro || ''
      };
      
      if (existing.length > 0) {
        // Atualizar
        var result = Database.updateData(
          CONFIG.SHEETS.CONFIG_CAMPOS,
          {
            'Seção': fieldData.secao,
            'Campo': fieldData.campo
          },
          data
        );
      } else {
        // Inserir
        var result = Database.insertData(CONFIG.SHEETS.CONFIG_CAMPOS, data);
      }
      
      Logger.logInfo('saveFieldConfiguration_SUCCESS', { field: fieldData.campo });

// ✅ CORREÇÃO: Só adicionar coluna se for campo realmente novo
fullSyncRncWithConfig(false);

// ✅ NOVO: Sinalizar que houve mudança na configuração
return { 
  success: true, 
  configChanged: true,
  action: existing.length > 0 ? 'updated' : 'created',
  fieldName: fieldData.campo
};
      
    } catch (error) {
      Logger.logError('saveFieldConfiguration_ERROR', error, { fieldData: fieldData });
      throw error;
    }
  }
  
  /**
   * Deleta configuração de campo do sistema.
   * Remove campo da configuração e sincroniza automaticamente com planilha RNC,
   * removendo a coluna correspondente da planilha principal.
   *
   * @param {string} secao - Nome da seção onde o campo está localizado
   * @param {string} campo - Nome do campo a ser deletado
   * @return {Object} Objeto com resultado da operação (success, configChanged, action, fieldName)
   *
   * @example
   * var result = ConfigManager.deleteFieldConfiguration('Abertura', 'ProdutoAntigo');
   * // Returns: {success: true, configChanged: true, action: 'deleted', fieldName: 'ProdutoAntigo'}
   *
   * @since Deploy 120
   */
  function deleteFieldConfiguration(secao, campo) {
    try {
      Logger.logWarning('deleteFieldConfiguration_ATTEMPT', {
        secao: secao,
        campo: campo
      });
      
      var result = Database.deleteData(CONFIG.SHEETS.CONFIG_CAMPOS, {
        'Seção': secao,
        'Campo': campo
      });
      
      Logger.logInfo('deleteFieldConfiguration_SUCCESS', {
      secao: secao,
      campo: campo
    });

    // ✅ NOVO: Remover coluna do campo deletado
    fullSyncRncWithConfig(false);

    // ✅ NOVO: Sinalizar que houve mudança na configuração
      return { 
        success: true, 
        configChanged: true,
        action: 'deleted',
        fieldName: campo
      };
      
    } catch (error) {
      Logger.logError('deleteFieldConfiguration_ERROR', error, {
        secao: secao,
        campo: campo
      });
      throw error;
    }
  }
  
  /**
   * Obtém todos os campos configurados do sistema.
   * Retorna lista completa de campos de todas as seções, ordenados por ordem de exibição,
   * utilizado para sincronização e validação de configuração.
   *
   * @return {Array} Array de objetos com dados completos de todos os campos configurados
   *
   * @example
   * var allFields = ConfigManager.getAllFieldsFromConfig();
   * // Returns: [{secao: 'Abertura', campo: 'Produto', tipo: 'text', obrigatorio: 'Sim', ...}]
   *
   * @since Deploy 120
   */
  function getAllFieldsFromConfig() {
    try {
      var fields = Database.findData(CONFIG.SHEETS.CONFIG_CAMPOS, {}, {
        orderBy: 'Ordem'
      });
      
      var result = [];
      for (var i = 0; i < fields.length; i++) {
        result.push({
          secao: fields[i]['Seção'],
          campo: fields[i]['Campo'],
          tipo: fields[i]['Tipo'],
          obrigatorio: fields[i]['Obrigatório'],
          placeholder: fields[i]['Placeholder'],
          lista: fields[i]['Lista'],
          ordem: fields[i]['Ordem'],
          ativo: fields[i]['Ativo'],
          validacaoRegex: fields[i]['ValidaçãoRegex'] || '',
          mensagemErro: fields[i]['MensagemErro'] || ''
        });
      }
      
      Logger.logDebug('getAllFieldsFromConfig', { count: result.length });
      return result;
      
    } catch (error) {
      Logger.logError('getAllFieldsFromConfig', error);
      return [];
    }
  }
  
  /**
   * Salva configuração de seção do sistema.
   * Cria nova seção ou atualiza seção existente, controlando agrupamento de campos
   * no formulário de RNC e ordem de exibição.
   *
   * @param {Object} sectionData - Objeto com dados completos da seção
   * @param {string} sectionData.nome - Nome da seção
   * @param {string} sectionData.descricao - Descrição da seção
   * @param {number} sectionData.ordem - Ordem de exibição da seção
   * @param {string} sectionData.ativo - Se a seção está ativa ('Sim' ou 'Não')
   * @return {Object} Objeto com resultado da operação (success, configChanged, action, sectionName)
   *
   * @example
   * var result = ConfigManager.saveSection({
   *   nome: 'Abertura',
   *   descricao: 'Dados iniciais da RNC',
   *   ordem: 1,
   *   ativo: 'Sim'
   * });
   * // Returns: {success: true, configChanged: true, action: 'updated', sectionName: 'Abertura'}
   *
   * @since Deploy 120
   */
  function saveSection(sectionData) {
    try {
      Logger.logInfo('saveSection_START', { section: sectionData.nome });
      
      var existing = Database.findData(CONFIG.SHEETS.CONFIG_SECOES, {
        'Nome': sectionData.nome
      });
      
      var data = {
        'Nome': sectionData.nome,
        'Descrição': sectionData.descricao,
        'Ordem': sectionData.ordem,
        'Ativo': sectionData.ativo
      };
      
      if (existing.length > 0) {
        var result = Database.updateData(
          CONFIG.SHEETS.CONFIG_SECOES,
          { 'Nome': sectionData.nome },
          data
        );
      } else {
        var result = Database.insertData(CONFIG.SHEETS.CONFIG_SECOES, data);
      }
      
      Logger.logInfo('saveSection_SUCCESS', { section: sectionData.nome });
      return { 
          success: true, 
          configChanged: true,
          action: existing.length > 0 ? 'updated' : 'created',
          sectionName: sectionData.nome
        };
      
    } catch (error) {
      Logger.logError('saveSection_ERROR', error, { sectionData: sectionData });
      throw error;
    }
  }
  
  /**
   * Deleta uma seção do sistema.
   * Remove seção da configuração, impedindo seu uso no formulário de RNC.
   * Atenção: não remove campos associados à seção.
   *
   * @param {string} sectionName - Nome da seção a ser deletada
   * @return {Object} Objeto com resultado da operação (success, configChanged, action, sectionName)
   *
   * @example
   * var result = ConfigManager.deleteSection('SecaoAntiga');
   * // Returns: {success: true, configChanged: true, action: 'deleted', sectionName: 'SecaoAntiga'}
   *
   * @since Deploy 120
   */
  function deleteSection(sectionName) {
    try {
      Logger.logWarning('deleteSection_ATTEMPT', { section: sectionName });
      
      var result = Database.deleteData(CONFIG.SHEETS.CONFIG_SECOES, {
        'Nome': sectionName
      });
      
      Logger.logInfo('deleteSection_SUCCESS', { section: sectionName });
      return { 
          success: true, 
          configChanged: true,
          action: 'deleted',
          sectionName: sectionName
        };
      
    } catch (error) {
      Logger.logError('deleteSection_ERROR', error, { section: sectionName });
      throw error;
    }
  }
  
  /**
   * Adiciona coluna de novo campo na planilha RNC.
   * Cria coluna no final da planilha quando novo campo é configurado,
   * aplicando formatação padrão de header e auto-redimensionamento.
   *
   * @param {string} fieldName - Nome do campo cuja coluna será adicionada
   * @return {Object} Objeto com resultado da operação (success, fieldName, columnPosition)
   *
   * @example
   * var result = ConfigManager.addFieldColumn('Novo Campo');
   * // Returns: {success: true, fieldName: 'Novo Campo', columnPosition: 15}
   *
   * @since Deploy 120
   */
  function addFieldColumn(fieldName) {
  try {
    Logger.logInfo('addFieldColumn_START', { fieldName: fieldName });
    
    var rncSheet = Database.getSheet(CONFIG.SHEETS.RNC);
    var currentHeaders = rncSheet.getRange(1, 1, 1, rncSheet.getLastColumn()).getValues()[0];
    
    // Verificar se a coluna já existe
    if (currentHeaders.indexOf(fieldName) !== -1) {
      Logger.logInfo('addFieldColumn_ALREADY_EXISTS', { fieldName: fieldName });
      return { success: true, message: 'Coluna já existe' };
    }
    
    // Adicionar nova coluna no final
    var newColumn = rncSheet.getLastColumn() + 1;
    rncSheet.getRange(1, newColumn).setValue(fieldName);
    
    // Formatar header
    rncSheet.getRange(1, newColumn)
      .setFontWeight('bold')
      .setBackground('#009688')
      .setFontColor('#ffffff');
    
    // Auto-resize
    rncSheet.autoResizeColumn(newColumn);
    
    Logger.logInfo('addFieldColumn_SUCCESS', { 
      fieldName: fieldName,
      columnPosition: newColumn
    });
    
    return { 
      success: true, 
      fieldName: fieldName,
      columnPosition: newColumn
    };
    
  } catch (error) {
    Logger.logError('addFieldColumn_ERROR', error, { fieldName: fieldName });
    throw error;
  }
}

  /**
   * Remove coluna de campo deletado da planilha RNC.
   * Deleta coluna da planilha quando campo é removido da configuração,
   * mantendo sincronização entre configuração e planilha.
   *
   * @param {string} fieldName - Nome do campo cuja coluna será removida
   * @return {Object} Objeto com resultado da operação (success, fieldName, removedFromPosition)
   *
   * @example
   * var result = ConfigManager.removeFieldColumn('Campo Antigo');
   * // Returns: {success: true, fieldName: 'Campo Antigo', removedFromPosition: 12}
   *
   * @since Deploy 120
   */
  function removeFieldColumn(fieldName) {
  try {
    Logger.logInfo('removeFieldColumn_START', { fieldName: fieldName });
    
    var rncSheet = Database.getSheet(CONFIG.SHEETS.RNC);
    var currentHeaders = rncSheet.getRange(1, 1, 1, rncSheet.getLastColumn()).getValues()[0];
    
    var columnIndex = currentHeaders.indexOf(fieldName);
    if (columnIndex === -1) {
      Logger.logInfo('removeFieldColumn_NOT_FOUND', { fieldName: fieldName });
      return { success: true, message: 'Coluna não encontrada' };
    }
    
    // Deletar coluna (índice + 1 porque Sheets usa base 1)
    rncSheet.deleteColumn(columnIndex + 1);
    
    Logger.logInfo('removeFieldColumn_SUCCESS', { 
      fieldName: fieldName,
      columnPosition: columnIndex + 1
    });
    
    return { 
      success: true, 
      fieldName: fieldName,
      removedFromPosition: columnIndex + 1
    };
    
  } catch (error) {
    Logger.logError('removeFieldColumn_ERROR', error, { fieldName: fieldName });
    throw error;
  }
}

  /**
   * Sincronização completa entre configuração de campos e planilha RNC.
   * Garante que todos os campos configurados tenham colunas correspondentes na planilha,
   * removendo colunas órfãs e adicionando colunas faltantes de forma incremental.
   *
   * @param {boolean} forceReorder - Se true, reorganiza completamente headers (apenas se não há dados)
   * @return {Object} Objeto com resultado da operação (success, action, headersCount ou changes)
   *
   * @example
   * var result = ConfigManager.fullSyncRncWithConfig(false);
   * // Returns: {success: true, action: 'incremental_sync', changes: {added: ['NovoCampo'], removed: []}}
   *
   * @since Deploy 120
   */
  function fullSyncRncWithConfig(forceReorder) {
  forceReorder = forceReorder || false;
  
  try {
    Logger.logInfo('fullSyncRncWithConfig_START', { forceReorder: forceReorder });
    
    // Obter todos os campos ativos ordenados
    var allFields = Database.findData(CONFIG.SHEETS.CONFIG_CAMPOS, {
      'Ativo': 'Sim'
    }, {
      orderBy: 'Ordem'
    });
    
    // Agrupar campos por seção
    var fieldsBySection = {
      'Abertura': [],
      'Qualidade': [],
      'Liderança': []
    };
    
    for (var i = 0; i < allFields.length; i++) {
      var field = allFields[i];
      var secao = field['Seção'];
      
      if (fieldsBySection[secao]) {
        fieldsBySection[secao].push({
          nome: field['Campo'],
          ordem: parseInt(field['Ordem']) || 999
        });
      }
    }
    
    // Ordenar dentro de cada seção
    for (var secao in fieldsBySection) {
      fieldsBySection[secao].sort(function(a, b) { return a.ordem - b.ordem; });
    }
    
    // Montar headers ideais
    var idealHeaders = [
      'Nº RNC', 'Status Geral', 'Data Criação', 'Usuário Criação'
    ];
    
    // Adicionar campos por seção
    var secoes = ['Abertura', 'Qualidade', 'Liderança'];
    for (var s = 0; s < secoes.length; s++) {
      var secaoNome = secoes[s];
      for (var f = 0; f < fieldsBySection[secaoNome].length; f++) {
        idealHeaders.push(fieldsBySection[secaoNome][f].nome);
      }
    }
    
    // Adicionar coluna de anexos se não configurada
    var temAnexoConfig = false;
    for (var a = 0; a < allFields.length; a++) {
      if (allFields[a]['Campo'] === 'Anexo de Documentos') {
        temAnexoConfig = true;
        break;
      }
    }
    
    if (!temAnexoConfig) {
      idealHeaders.push('Anexo de Documentos');
    }
    
    // Adicionar campos de controle
    idealHeaders.push('Última Edição', 'Editado Por');
    
    // Obter estado atual
    var rncSheet = Database.getSheet(CONFIG.SHEETS.RNC);
    var currentHeaders = [];
    
    if (rncSheet.getLastColumn() > 0) {
      currentHeaders = rncSheet.getRange(1, 1, 1, rncSheet.getLastColumn()).getValues()[0];
    }
    
    var hasData = rncSheet.getLastRow() > 1;
    
    if (forceReorder || !hasData) {
      // Reorganização completa
      return fullReorganizeHeaders(rncSheet, idealHeaders, hasData);
    } else {
      // Sincronização incremental
      return incrementalSync(rncSheet, idealHeaders, currentHeaders);
    }
    
  } catch (error) {
    Logger.logError('fullSyncRncWithConfig_ERROR', error);
    throw error;
  }
}

  /**
   * Reorganização completa dos headers da planilha RNC.
   * Redefine completamente a ordem das colunas conforme configuração,
   * só pode ser executado quando planilha está vazia para evitar perda de dados.
   *
   * @param {Sheet} rncSheet - Objeto da planilha RNC
   * @param {Array} idealHeaders - Array com nomes dos headers na ordem ideal
   * @param {boolean} hasData - Se a planilha contém dados (throw error se true)
   * @return {Object} Objeto com resultado da operação (success, action, headersCount)
   * @private
   *
   * @example
   * var result = fullReorganizeHeaders(sheet, ['Nº RNC', 'Status', 'Produto'], false);
   * // Returns: {success: true, action: 'full_reorganize', headersCount: 3}
   *
   * @since Deploy 120
   */
  function fullReorganizeHeaders(rncSheet, idealHeaders, hasData) {
  if (hasData) {
    throw new Error('Não é possível reorganizar headers quando há dados');
  }
  
  // Limpar headers atuais
  if (rncSheet.getLastColumn() > 0) {
    rncSheet.getRange(1, 1, 1, rncSheet.getLastColumn()).clearContent();
  }
  
  // Definir novos headers
  rncSheet.getRange(1, 1, 1, idealHeaders.length).setValues([idealHeaders]);
  
  // Formatar
  formatHeaders(rncSheet, 1, idealHeaders.length);
  
  return {
    success: true,
    action: 'full_reorganize',
    headersCount: idealHeaders.length
  };
}

  /**
   * Sincronização incremental entre configuração e planilha RNC.
   * Adiciona colunas de novos campos e remove colunas órfãs sem reorganizar,
   * permite sincronização segura mesmo com dados na planilha.
   *
   * @param {Sheet} rncSheet - Objeto da planilha RNC
   * @param {Array} idealHeaders - Array com nomes dos headers esperados
   * @param {Array} currentHeaders - Array com headers atuais da planilha
   * @return {Object} Objeto com resultado da operação (success, action, changes)
   * @private
   *
   * @example
   * var result = incrementalSync(sheet, ['Nº RNC', 'Produto'], ['Nº RNC']);
   * // Returns: {success: true, action: 'incremental_sync', changes: {added: ['Produto'], removed: []}}
   *
   * @since Deploy 120
   */
  function incrementalSync(rncSheet, idealHeaders, currentHeaders) {
  var changes = {
    added: [],
    removed: []
  };
  
  // Identificar colunas para adicionar
  for (var i = 0; i < idealHeaders.length; i++) {
    if (currentHeaders.indexOf(idealHeaders[i]) === -1) {
      changes.added.push(idealHeaders[i]);
    }
  }
  
  // Identificar colunas órfãs para remover
  var systemHeaders = ['Nº RNC', 'Status Geral', 'Data Criação', 'Usuário Criação', 'Última Edição', 'Editado Por'];
  
  for (var j = 0; j < currentHeaders.length; j++) {
    var header = currentHeaders[j];
    if (header && 
        idealHeaders.indexOf(header) === -1 && 
        systemHeaders.indexOf(header) === -1) {
      changes.removed.push(header);
    }
  }
  
  // Adicionar novas colunas
  if (changes.added.length > 0) {
    var startCol = rncSheet.getLastColumn() + 1;
    rncSheet.getRange(1, startCol, 1, changes.added.length).setValues([changes.added]);
    formatHeaders(rncSheet, startCol, changes.added.length);
  }
  
  // Remover colunas órfãs
  var updatedHeaders = currentHeaders.slice(); // Cópia
  for (var k = changes.removed.length - 1; k >= 0; k--) {
    var colIndex = updatedHeaders.indexOf(changes.removed[k]);
    if (colIndex !== -1) {
      rncSheet.deleteColumn(colIndex + 1);
      updatedHeaders.splice(colIndex, 1);
    }
  }
  
  return {
    success: true,
    action: 'incremental_sync',
    changes: changes
  };
}

  /**
   * Formata headers da planilha RNC com estilo padrão.
   * Aplica formatação visual aos headers (negrito, fundo verde, texto branco)
   * e auto-redimensiona colunas para melhor visualização.
   *
   * @param {Sheet} sheet - Objeto da planilha a formatar
   * @param {number} startCol - Coluna inicial da formatação (base 1)
   * @param {number} count - Quantidade de colunas a formatar
   * @return {void}
   * @private
   *
   * @example
   * formatHeaders(sheet, 1, 10);
   * // Returns: undefined (formata colunas 1 a 10)
   *
   * @since Deploy 120
   */
  function formatHeaders(sheet, startCol, count) {
  sheet.getRange(1, startCol, 1, count)
    .setFontWeight('bold')
    .setBackground('#009688')
    .setFontColor('#ffffff');
  
  for (var i = startCol; i < startCol + count; i++) {
    sheet.autoResizeColumn(i);
  }
}

  /**
   * Atualiza status de anexos de uma RNC específica.
   * Verifica planilha de anexos e atualiza campo 'Anexo de Documentos' na RNC,
   * indicando se há ou não arquivos anexados.
   *
   * @param {string} rncNumber - Número da RNC a verificar anexos
   * @return {Object} Objeto com resultado da operação (success, hasAttachments)
   *
   * @example
   * var result = ConfigManager.updateAttachmentStatus('RNC-2024-001');
   * // Returns: {success: true, hasAttachments: 'Sim'}
   *
   * @since Deploy 120
   */
  function updateAttachmentStatus(rncNumber) {
  try {
    var attachments = Database.findData(CONFIG.SHEETS.ANEXOS, {
      'RncNumero': rncNumber
    });
    
    var hasAttachments = attachments.length > 0 ? 'Sim' : 'Não';
    
    var result = Database.updateData(CONFIG.SHEETS.RNC, {
      'Nº RNC': rncNumber
    }, {
      'Anexo de Documentos': hasAttachments
    });
    
    return { success: true, hasAttachments: hasAttachments };
    
  } catch (error) {
    Logger.logError('updateAttachmentStatus_ERROR', error, { rncNumber: rncNumber });
    throw error;
  }
}



  /**
   * Obtém lista de setores da planilha Listas.
   * Busca especificamente a coluna 'Setores' da planilha de listas,
   * utilizado para popular campos de seleção de setor no sistema.
   *
   * @return {Array} Array de strings com nomes dos setores disponíveis
   *
   * @example
   * var setores = ConfigManager.getSetoresFromListas();
   * // Returns: ['Produção', 'Qualidade', 'Logística', 'Administrativo']
   *
   * @since Deploy 68
   */
  function getSetoresFromListas() {
    try {
      Logger.logDebug('getSetoresFromListas_START');

      // Usar getLists() que já tem cache
      var lists = getLists();

      // Retornar lista de setores (coluna "Setores")
      var setores = lists['Setores'] || [];

      Logger.logInfo('getSetoresFromListas_SUCCESS', {
        count: setores.length
      });

      return setores;

    } catch (error) {
      Logger.logError('getSetoresFromListas_ERROR', error);
      return [];
    }
  }

  /**
   * ============================================
   * API PÚBLICA DO MÓDULO
   * ============================================
   *
   * Exposição das funções públicas do ConfigManager.
   * Todas as funções estão documentadas com JSDoc completo.
   *
   * @public
   * @since Deploy 30
   */
  return {
    getFieldsForSection: getFieldsForSection,
    getSections: getSections,
    getLists: getLists,
    saveList: saveList,
    deleteList: deleteList,
    saveFieldConfiguration: saveFieldConfiguration,
    deleteFieldConfiguration: deleteFieldConfiguration,
    getAllFieldsFromConfig: getAllFieldsFromConfig,
    saveSection: saveSection,
    deleteSection: deleteSection,
    addFieldColumn: addFieldColumn,
    removeFieldColumn: removeFieldColumn,
    fullSyncRncWithConfig: fullSyncRncWithConfig,
    updateAttachmentStatus: updateAttachmentStatus,
    clearCache: clearCache,                           // ✅ DEPLOY 33
    getSetoresFromListas: getSetoresFromListas        // ✅ DEPLOY 68: Novo
  };
})();