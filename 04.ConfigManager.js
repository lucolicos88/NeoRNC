/**
 * ============================================
 * CONFIGMANAGER.GS - Gerenciamento de Configurações
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * Deploy 33 - Cache de configuração
 * ============================================
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
   * Obtém valor do cache
   * @param {string} key - Chave do cache
   * @return {*} Valor ou null
   * @private
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
   * Salva valor no cache
   * @param {string} key - Chave do cache
   * @param {*} value - Valor a cachear
   * @private
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
   * Limpa cache específico
   * @param {string} key - Chave do cache
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
 * Obtém campos configurados para uma seção
 * Deploy 33 - Com cache (10 minutos)
 * @param {string} sectionName - Nome da seção
 * @return {Array} Lista de campos
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
   * Obtém todas as seções configuradas
   * Deploy 33 - Com cache (10 minutos)
   * @return {Array} Lista de seções
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
   * Obtém listas configuradas
   * Deploy 33 - Com cache (10 minutos)
   * @return {Object} Objeto com todas as listas
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
   * Salva ou atualiza uma lista
   * @param {string} listName - Nome da lista
   * @param {Array} items - Itens da lista
   * @return {Object} Resultado da operação
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
   * Deleta uma lista
   * @param {string} listName - Nome da lista
   * @return {Object} Resultado da operação
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
   * Salva configuração de campo
   * @param {Object} fieldData - Dados do campo
   * @return {Object} Resultado da operação
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
   * Deleta configuração de campo
   * @param {string} secao - Seção do campo
   * @param {string} campo - Nome do campo
   * @return {Object} Resultado da operação
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
   * Obtém todos os campos configurados
   * @return {Array} Lista de campos
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
   * Salva configuração de seção
   * @param {Object} sectionData - Dados da seção
   * @return {Object} Resultado da operação
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
   * Deleta uma seção
   * @param {string} sectionName - Nome da seção
   * @return {Object} Resultado da operação
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
 * Adiciona apenas a coluna do novo campo criado
 * @param {string} fieldName - Nome do campo a adicionar
 * @return {Object} Resultado da operação
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
 * Remove coluna do campo deletado
 * @param {string} fieldName - Nome do campo a remover
 * @return {Object} Resultado da operação
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
 * Sincronização completa entre ConfigCampos e aba RNC
 * @param {boolean} forceReorder - Se deve reorganizar completamente
 * @return {Object} Resultado da operação
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
 * Reorganização completa dos headers
 * @private
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
 * Sincronização incremental
 * @private
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
 * Formata headers
 * @private
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
 * Atualiza status de anexos para uma RNC
 * @param {string} rncNumber - Número da RNC
 * @return {Object} Resultado da operação
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
   * Deploy 68: Obtém lista de setores da planilha Listas
   * @return {Array} Lista de setores
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

// API Pública
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