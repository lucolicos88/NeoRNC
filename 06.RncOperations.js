/**
 * ============================================
 * RNCOPERATIONS.GS - CRUD de RNCs
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 */

var RncOperations = (function() {
  'use strict';

  // ============================================
  // FASE 2.1: Cache de getAllRncs() - 70-80% ganho de performance
  // ============================================
  var rncCache = null;
  var rncCacheTimestamp = null;
  var CACHE_TTL = 2 * 60 * 1000; // 2 minutos (120000ms)

  /**
   * Verifica se o cache expirou
   * @private
   */
  function isCacheExpired() {
    if (!rncCacheTimestamp) return true;
    var now = new Date().getTime();
    return (now - rncCacheTimestamp) > CACHE_TTL;
  }

  /**
   * Invalida o cache de RNCs
   * Deve ser chamado após save/update/delete
   */
  function invalidateRncCache() {
    rncCache = null;
    rncCacheTimestamp = null;
    Logger.logDebug('RNC_CACHE_INVALIDATED', {
      message: 'Cache invalidado após modificação'
    });
  }

  // ============================================
  // FASE 2.2: Campos de data conhecidos - 40-60% ganho em serialização
  // ============================================
  var DATE_FIELDS = [
    'Data Criação',
    'Data de Abertura',
    'Data',
    'Última Edição',
    'Data da Análise',
    'Data limite para execução',
    'Data da conclusão da Ação',
    'Data Deleção'
  ];

  /**
   * Converte campos de data para ISO String (otimizado)
   * FASE 2.2: Usa lista de campos conhecidos ao invés de iterar todas as chaves
   * @param {Object} obj - Objeto RNC
   * @private
   */
  function convertDatesToISO(obj) {
    if (!obj) return obj;

    // Iterar apenas campos de data conhecidos (8 campos vs ~50)
    for (var i = 0; i < DATE_FIELDS.length; i++) {
      var field = DATE_FIELDS[i];
      if (obj[field] && obj[field] instanceof Date) {
        obj[field] = obj[field].toISOString();
      }
    }

    // Tratar nulls/undefined em todos os campos
    for (var key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        obj[key] = '';
      }
    }

    return obj;
  }

  /**
   * Gera um novo número de RNC
   * @return {string} Número da RNC no formato XXXX/YYYY
   */
  function generateRncNumber() {
    try {
      var year = new Date().getFullYear();
      var maxNumber = 0;
      
      // Buscar último número do ano atual
      var existingRncs = Database.findData(CONFIG.SHEETS.RNC, {}, {
        orderBy: 'Nº RNC',
        orderDesc: true
      });
      
      for (var i = 0; i < existingRncs.length; i++) {
        var rncNum = existingRncs[i]['Nº RNC'];
        if (rncNum) {
          var match = String(rncNum).match(/^(\d+)\/(\d{4})$/);
          if (match && match[2] == year) {
            maxNumber = Math.max(maxNumber, parseInt(match[1]));
          }
        }
      }
      
      var newNumber = String(maxNumber + 1).padStart(4, '0') + '/' + year;
      
      Logger.logInfo('generateRncNumber', { newNumber: newNumber });
      return newNumber;
      
    } catch (error) {
      Logger.logError('generateRncNumber', error);
      throw error;
    }
  }
  
  /**
   * Salva uma nova RNC
   * @param {Object} formData - Dados do formulário
   * @param {Array} files - Arquivos anexados
   * @return {Object} Resultado da operação
   */
  function saveRnc(formData, files) {
    var startTime = new Date().getTime();
    var lock = LockService.getScriptLock();
    
    try {

       // ✨ NOVO: Validar permissão para criar RNC
    var userEmail = Session.getActiveUser().getEmail();
    var permCheck = PermissionsManager.checkPermissionToSave(userEmail, 'Abertura');
    
    if (!permCheck.allowed) {
      Logger.logWarning('SAVE_RNC_PERMISSION_DENIED', {
        user: userEmail,
        message: permCheck.message
      });
      
      return {
        success: false,
        error: permCheck.message
      };
    }

      var user = Session.getActiveUser().getEmail() || 'system';
      var rncNumber = generateRncNumber();
      
      Logger.logInfo('saveRnc_START', { 
        user: user,
        rncNumber: rncNumber,
        fieldsCount: Object.keys(formData).length,
        filesCount: files ? files.length : 0
      });
      
      // Preparar dados para inserção
      var rncData = prepareRncData(formData, rncNumber, user, true);

      // ✅ DEPLOY 33: Validar dados obrigatórios e formato
      var validation = validateRncData(rncData, 'Abertura');
      if (!validation.valid) {
        Logger.logWarning('saveRnc_VALIDATION_FAILED', {
          rncNumber: rncNumber,
          errors: validation.errors
        });

        return {
          success: false,
          error: validation.errors.join('\n'),
          validationErrors: validation.errors
        };
      }
      
      // Inserir na planilha
      var insertResult = Database.insertData(CONFIG.SHEETS.RNC, rncData);

      if (!insertResult.success) {
        throw new Error('Falha ao inserir RNC na planilha');
      }

      // ✅ FASE 2.1: Invalidar cache após inserção bem-sucedida
      invalidateRncCache();

      // ✅ DEPLOY 33: Processar arquivos e retornar mensagens de erro
      var fileErrors = [];
      var fileWarnings = [];

      if (files && files.length > 0) {
        var fileResults = FileManager.uploadFiles(rncNumber, files, 'Abertura');
        Logger.logInfo('saveRnc_FILES', {
          rncNumber: rncNumber,
          filesUploaded: fileResults.uploaded,
          filesFailed: fileResults.failed
        });

        // ✅ Coletar erros de arquivo para mostrar ao usuário
        if (fileResults.errors && fileResults.errors.length > 0) {
          fileResults.errors.forEach(function(err) {
            fileErrors.push(err.userMessage || err.error);
          });
        }

        // Avisar sobre retries
        if (fileResults.warnings && fileResults.warnings.length > 0) {
          fileWarnings = fileResults.warnings;
        }
      }

      // Log de auditoria
      Logger.logInfo('saveRnc_SUCCESS', {
        rncNumber: rncNumber,
        user: user,
        duration: Logger.logPerformance('saveRnc', startTime)
      });

      // ✅ Deploy 34: Registrar criação no histórico
      HistoricoManager.registrarCriacao(rncNumber, user, rncData);

      // ✅ Deploy 66: Enviar notificação por email
      try {
        var notificationResult = NotificationManager.notifyRncCreated(rncNumber, rncData);
        if (notificationResult.success) {
          Logger.logInfo('saveRnc_NOTIFICATION_SENT', {
            rncNumber: rncNumber,
            emailsSent: notificationResult.successCount
          });
        }
      } catch (notifError) {
        Logger.logError('saveRnc_NOTIFICATION_ERROR', notifError, {
          rncNumber: rncNumber
        });
        // Não falhar a operação se notificação falhar
      }

      // ✅ Retornar sucesso com mensagens de arquivo
      var successMessage = 'RNC criada com sucesso';
      if (fileErrors.length > 0) {
        successMessage += ', mas alguns arquivos falharam:\n' + fileErrors.join('\n');
      }

      return {
        success: true,
        rncNumber: rncNumber,
        message: successMessage,
        fileErrors: fileErrors,
        fileWarnings: fileWarnings
      };
      
    } catch (error) {
      Logger.logError('saveRnc_ERROR', error, { 
        user: user,
        formData: formData 
      });
      throw error;
    }
  }
  
/**
 * Atualiza uma RNC existente
 * @param {string} rncNumber - Número da RNC
 * @param {Object} formData - Dados do formulário
 * @param {Array} files - Arquivos anexados
 * @return {Object} Resultado da operação
 */
function updateRnc(rncNumber, formData, files) {
    var startTime = new Date().getTime();
    
    try {
        // ✅ CORREÇÃO Deploy 38: Filtrar campos de input file ANTES DE TUDO
        var excludeFields = ['fileInputEdit', 'Anexo de Documentos', 'fileInput'];
        var cleanedFormData = {};
        
        for (var key in formData) {
            if (formData.hasOwnProperty(key) && excludeFields.indexOf(key) === -1) {
                cleanedFormData[key] = formData[key];
            }
        }
        
        // Substituir formData pelos dados limpos
        formData = cleanedFormData;
        
        Logger.logInfo('updateRnc_DATA_CLEANED', {
            rncNumber: rncNumber,
            cleanedFields: Object.keys(formData).length,
            excludedFields: excludeFields.join(', ')
        });

        // ✅ NOVO: BUSCAR RNC ATUAL ANTES DE VERIFICAR PERMISSÕES
        var currentRnc = getRncByNumber(rncNumber);
        if (!currentRnc) {
            throw new Error(CONFIG.ERROR_MESSAGES.RNC_NOT_FOUND);
        }

        var userEmail = Session.getActiveUser().getEmail();
        var userPerms = PermissionsManager.getUserPermissions(userEmail);
        
        // ✅ CORREÇÃO PRINCIPAL: Identificar APENAS campos que foram MODIFICADOS
        var sections = ConfigManager.getSections();
        var blockedSections = [];
        var modifiedFields = {}; // Rastrear campos modificados
        
        sections.forEach(function(section) {
            var sectionFields = ConfigManager.getFieldsForSection(section.nome);
            var hasModifiedFieldsFromSection = false;
            
            // Verificar se há campos MODIFICADOS desta seção
            sectionFields.forEach(function(field) {
                var fieldName = field.name;
                var newValue = formData[fieldName];
                var oldValue = currentRnc[fieldName];
                
                // ✅ CORREÇÃO: Verificar se o valor mudou
                if (newValue !== undefined) {
                    // Normalizar valores para comparação
                    var normalizedNew = (newValue === null || newValue === '') ? '' : String(newValue).trim();
                    var normalizedOld = (oldValue === null || oldValue === undefined || oldValue === '') ? '' : String(oldValue).trim();
                    
                    // Se os valores são diferentes, o campo foi modificado
                    if (normalizedNew !== normalizedOld) {
                        hasModifiedFieldsFromSection = true;
                        modifiedFields[fieldName] = {
                            old: normalizedOld,
                            new: normalizedNew,
                            section: section.nome
                        };
                    }
                }
            });
            
            // ✅ CORREÇÃO: Só verificar permissão se há campos MODIFICADOS
            if (hasModifiedFieldsFromSection) {
                var permissao = userPerms.permissions[section.nome];
                
                if (permissao !== 'editar') {
                    blockedSections.push(section.nome);
                }
            }
        });
        
        // Log dos campos modificados para debug
        Logger.logInfo('updateRnc_MODIFIED_FIELDS', {
            rncNumber: rncNumber,
            user: userEmail,
            modifiedFieldsCount: Object.keys(modifiedFields).length,
            modifiedFields: JSON.stringify(modifiedFields)
        });
        
        // Se há seções bloqueadas, negar salvamento
        if (blockedSections.length > 0 && !userPerms.isAdmin) {
            Logger.logWarning('UPDATE_RNC_PERMISSION_DENIED', {
                user: userEmail,
                blockedSections: blockedSections.join(', '),
                modifiedFields: Object.keys(modifiedFields).join(', ')
            });
            
            return {
                success: false,
                error: 'Você não tem permissão para editar: ' + blockedSections.join(', ')
            };
        }
        
        var user = Session.getActiveUser().getEmail() || 'system';
        
        Logger.logInfo('updateRnc_START', { 
            rncNumber: rncNumber,
            user: user,
            fieldsCount: Object.keys(formData).length,
            filesCount: files ? files.length : 0,
            modifiedFieldsCount: Object.keys(modifiedFields).length
        });
        
        // Preparar dados com status
        var updates = prepareRncData(formData, rncNumber, user, false);

        // ✅ DEPLOY 32: Determinar novo status ANTES de salvar (com validação)
        var simulatedRnc = Object.assign({}, currentRnc, updates);
        var statusResult = determineNewStatus(currentRnc, simulatedRnc);

        Logger.logInfo('updateRnc_STATUS_CHECK', {
            rncNumber: rncNumber,
            currentStatus: currentRnc['Status Geral'],
            calculatedStatus: statusResult.status,
            willChange: statusResult.statusChanged,
            validationErrors: statusResult.validation.errors,
            validationWarnings: statusResult.validation.warnings
        });

        // Verificar se houve erro de validação
        if (!statusResult.validation.valid) {
            return {
                success: false,
                error: 'Validação de status falhou: ' + statusResult.validation.errors.join('; '),
                validationErrors: statusResult.validation.errors
            };
        }

        // Aplicar novo status se mudou
        if (statusResult.statusChanged) {
            updates['Status Geral'] = statusResult.status;
            Logger.logInfo('updateRnc_STATUS_CHANGE', {
                rncNumber: rncNumber,
                oldStatus: currentRnc['Status Geral'],
                newStatus: statusResult.status
            });
        }

        // Se houve warnings, logar mas continuar
        if (statusResult.validation.warnings.length > 0) {
            Logger.logWarning('updateRnc_STATUS_WARNINGS', {
                rncNumber: rncNumber,
                warnings: statusResult.validation.warnings
            });
        }
        
        // Adicionar metadados de atualização
        var dataHoraAtual = getCurrentDateTimeBR();
        updates['Última Edição'] = dataHoraAtual;
        updates['Editado Por'] = user;
        
        // Atualizar na planilha
        var updateResult = Database.updateData(
            CONFIG.SHEETS.RNC,
            { 'Nº RNC': rncNumber },
            updates
        );

        if (!updateResult.success) {
            throw new Error('Falha ao atualizar RNC na planilha');
        }

        // ✅ FASE 2.1: Invalidar cache após atualização bem-sucedida
        invalidateRncCache();

        // ✅ Deploy 34: Registrar histórico de alterações
        if (Object.keys(modifiedFields).length > 0) {
            HistoricoManager.registrarAlteracoes(rncNumber, modifiedFields, user);
        }

        // ✅ Deploy 66: Enviar notificações por email
        try {
            // Verificar se houve mudança de status
            if (statusResult.statusChanged && updates['Status Geral']) {
                var notifStatusResult = NotificationManager.notifyStatusChanged(
                    rncNumber,
                    currentRnc['Status Geral'],
                    updates['Status Geral'],
                    user
                );
                if (notifStatusResult.success) {
                    Logger.logInfo('updateRnc_STATUS_NOTIFICATION_SENT', {
                        rncNumber: rncNumber,
                        emailsSent: notifStatusResult.successCount
                    });
                }
            }

            // Notificar sobre outras alterações
            if (Object.keys(modifiedFields).length > 0) {
                var notifUpdateResult = NotificationManager.notifyRncUpdated(
                    rncNumber,
                    modifiedFields,
                    user
                );
                if (notifUpdateResult.success) {
                    Logger.logInfo('updateRnc_NOTIFICATION_SENT', {
                        rncNumber: rncNumber,
                        emailsSent: notifUpdateResult.successCount
                    });
                }
            }
        } catch (notifError) {
            Logger.logError('updateRnc_NOTIFICATION_ERROR', notifError, {
                rncNumber: rncNumber
            });
            // Não falhar a operação se notificação falhar
        }

        // Processar arquivos se houver
        if (files && files.length > 0) {
            var fileResults = FileManager.uploadFiles(rncNumber, files, 'Edição');
            Logger.logInfo('updateRnc_FILES', {
                rncNumber: rncNumber,
                filesUploaded: fileResults.uploaded,
                filesFailed: fileResults.failed
            });
        }

        Logger.logInfo('updateRnc_SUCCESS', {
            rncNumber: rncNumber,
            user: user,
            duration: Logger.logPerformance('updateRnc', startTime)
        });

        return {
            success: true,
            message: 'RNC atualizada com sucesso',
            rncNumber: rncNumber
        };
        
    } catch (error) {
        Logger.logError('updateRnc_ERROR', error, { 
            rncNumber: rncNumber,
            user: user
        });
        throw error;
    }
}
  
  /**
   * Busca RNC por número
   * @param {string} rncNumber - Número da RNC
   * @return {Object} Dados da RNC
   */
  

function getRncByNumber(rncNumber) {
  try {
    Logger.logDebug('getRncByNumber', { rncNumber: rncNumber });
    
    var results = Database.findData(CONFIG.SHEETS.RNC, {
      'Nº RNC': rncNumber
    });
    
    if (results.length === 0) {
      Logger.logWarning('getRncByNumber_NOT_FOUND', { rncNumber: rncNumber });
      return null;
    }
    
    var rnc = results[0];

    // === ADICIONE ESTE BLOCO DE DEBUG ===
    Logger.logInfo('getRncByNumber_DEBUG_FILIAL', {
      rncNumber: rncNumber,
      todasAsChaves: Object.keys(rnc),
      chavesFiliaisFiltradas: Object.keys(rnc).filter(function(k) {
        return k.toLowerCase().includes('filial');
      }),
      valorFilialDireta: rnc['Filial de Origem'],
      valorFilialMinuscula: rnc['Filial de origem'],
      valorFilialSemEspaco: rnc['FilialdeOrigem']
    });
    
    // CORREÇÃO: Garantir que TODOS os campos estejam presentes
    // Adicionar campos que podem estar faltando
    var requiredFields = [
      'Filial de Origem',
      'Código do Cliente', 
      'Telefone do Cliente',
      'Requisição',
      'Número do pedido',
      'Prescritor',
      'Forma Farmacêutica',
      'Observações'
    ];
    
    requiredFields.forEach(function(field) {
      if (rnc[field] === undefined) {
        rnc[field] = '';
      }
    });

    // === FORMATAÇÃO DE DATAS PARA INTERFACE - Deploy 37 ===
    // ✅ FASE 2.5: Converte datas para DD/MM/YYYY para exibição
    var dateFields = [
      'Data de Abertura',
      'Data',
      'Data da Análise',
      'Data limite para execução',
      'Data da conclusão da Ação',
      'Data Criação',
      'Última Edição'
    ];

    // ✅ FASE 2.5: Consolidar logging (10-20% ganho - 1 log vs N logs)
    var formattedDates = {};

    dateFields.forEach(function(fieldName) {
      if (rnc[fieldName]) {
        // Se for objeto Date, converter para DD/MM/YYYY
        if (rnc[fieldName] instanceof Date) {
          rnc[fieldName] = formatDateBR(rnc[fieldName]);
          formattedDates[fieldName] = rnc[fieldName];
        }
        // Se for string ISO ou YYYY-MM-DD, converter
        else if (typeof rnc[fieldName] === 'string') {
          var converted = formatDateBR(rnc[fieldName]);
          if (converted) {
            rnc[fieldName] = converted;
            formattedDates[fieldName] = converted;
          }
        }
      }
    });

    // Log consolidado - 1 vez ao invés de N
    if (Object.keys(formattedDates).length > 0) {
      Logger.logDebug('getRncByNumber_DATES_FORMATTED', {
        rncNumber: rncNumber,
        formattedFields: formattedDates
      });
    }

    // ✅ Tratar nulls/undefined
    for (var key in rnc) {
      if (rnc[key] === null || rnc[key] === undefined) {
        rnc[key] = '';
      }
    }

    // === NORMALIZAÇÃO: CONVERTER NÚMEROS EM STRINGS PARA SELECTS ===
    var selectFields = [
      'Filial de Origem',
      'Código do Cliente',
      'Telefone do Cliente'
    ];
    selectFields.forEach(function(fieldName) {
      if (rnc[fieldName] !== undefined && rnc[fieldName] !== null && typeof rnc[fieldName] === 'number') {
        rnc[fieldName] = String(rnc[fieldName]);
      }
    });

    // Buscar anexos
    rnc._anexos = FileManager.getAnexosRnc(rncNumber);

    // ✅ CORRIGIDO Deploy 31: Apenas UM return (eram 3 antes - Problema #1)
    return rnc;
  } catch (error) {
    Logger.logError('getRncByNumber', error, { rncNumber: rncNumber });
    return null;
  }
}
  /**
   * Busca todas as RNCs
   * FASE 2.1: Cache implementado para 70-80% ganho de performance
   * @param {Object} filters - Filtros opcionais
   * @return {Array} Lista de RNCs
   */
  function getAllRncs(filters) {
    try {
      var hasFilters = filters && Object.keys(filters).length > 0;

      // ✅ FASE 2.1: Usar cache apenas quando não há filtros
      if (!hasFilters && rncCache && !isCacheExpired()) {
        Logger.logDebug('getAllRncs_CACHE_HIT', {
          count: rncCache.length,
          age: ((new Date().getTime() - rncCacheTimestamp) / 1000).toFixed(1) + 's'
        });
        return rncCache;
      }

      // Cache miss ou com filtros - buscar do banco
      var rncs = Database.findData(CONFIG.SHEETS.RNC, filters || {}, {
        orderBy: 'Data Criação',
        orderDesc: true
      });

      // ✅ FASE 2.2: Serializar datas (otimizado - 40-60% mais rápido)
      for (var i = 0; i < rncs.length; i++) {
        convertDatesToISO(rncs[i]);
      }

      // ✅ FASE 2.1: Armazenar em cache apenas quando não há filtros
      if (!hasFilters) {
        rncCache = rncs;
        rncCacheTimestamp = new Date().getTime();
        Logger.logDebug('getAllRncs_CACHE_MISS', {
          count: rncs.length,
          cached: true
        });
      } else {
        Logger.logDebug('getAllRncs_WITH_FILTERS', {
          count: rncs.length,
          cached: false
        });
      }

      return rncs;

    } catch (error) {
      Logger.logError('getAllRncs', error);
      return [];
    }
  }
  
  /**
   * Busca números de RNC disponíveis
   * @return {Array} Lista de números
   */
  function getAllRncNumbers() {
    try {
      var rncs = getAllRncs();
      var numbers = [];
      
      for (var i = 0; i < rncs.length; i++) {
        if (rncs[i]['Nº RNC']) {
          numbers.push(String(rncs[i]['Nº RNC']));
        }
      }
      
      // Ordenar por ano e número
      numbers.sort(function(a, b) {
        var yearA = parseInt(a.split('/')[1]) || 0;
        var numberA = parseInt(a.split('/')[0]) || 0;
        var yearB = parseInt(b.split('/')[1]) || 0;
        var numberB = parseInt(b.split('/')[0]) || 0;
        
        if (yearA !== yearB) return yearB - yearA;
        return numberB - numberA;
      });
      
      Logger.logDebug('getAllRncNumbers', { count: numbers.length });
      return numbers;
      
    } catch (error) {
      Logger.logError('getAllRncNumbers', error);
      return [];
    }
  }
  
  /**
   * Busca RNCs com termo de pesquisa
   * @param {string} searchTerm - Termo de busca
   * @return {Array} RNCs encontradas
   */
  function searchRncs(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return getAllRncs();
      }
      
      var allRncs = getAllRncs();
      var results = [];
      var termLower = searchTerm.toLowerCase();
      
      for (var i = 0; i < allRncs.length; i++) {
        var rnc = allRncs[i];
        
        // Campos para buscar
        var searchFields = [
          rnc['Nº RNC'] || '',
          rnc['Nome do Cliente'] || '',
          rnc['Status Geral'] || '',
          rnc['Responsável pela abertura da RNC'] || '',
          rnc['Descrição do Problema'] || '',
          rnc['Descrição Detalhada da RNC/Reclamação'] || '',
          rnc['Tipo RNC'] || '',
          rnc['Setor onde foi feita abertura\n'] || ''
        ];
        
        var searchText = searchFields.join(' ').toLowerCase();
        
        if (searchText.indexOf(termLower) !== -1) {
          results.push(rnc);
        }
      }
      
      Logger.logDebug('searchRncs', { 
        searchTerm: searchTerm,
        resultsCount: results.length 
      });
      
      return results;
      
    } catch (error) {
      Logger.logError('searchRncs', error, { searchTerm: searchTerm });
      return [];
    }
  }
  
/**
 * Prepara dados da RNC para inserção/atualização
 * Deploy 32 - Sanitização de input adicionada
 * Deploy 37 - Formatação de datas padronizada
 * @private
 */
function prepareRncData(formData, rncNumber, user, isNew) {
  var rncData = {};

  // ✅ DEPLOY 32: Sanitizar dados antes de processar
  Logger.logDebug('prepareRncData_SANITIZING', {
    fieldCount: Object.keys(formData).length
  });

  var sanitizedData = sanitizeFormData(formData);

  // Mapear campos do formulário para colunas da planilha
  for (var formField in sanitizedData) {
    var columnName = FIELD_MAPPING[formField] || formField;
    var value = sanitizedData[formField];

    // ✅ TRATAMENTO ESPECIAL PARA CAMPOS DE DATA
    if (formField.toLowerCase().includes('data') ||
        formField === 'Data' ||
        columnName.toLowerCase().includes('data')) {

      // Converter para formato brasileiro DD/MM/YYYY
      rncData[columnName] = formatDateBR(value);

      Logger.logDebug('prepareRncData_DATE_CONVERTED', {
        field: formField,
        original: value,
        converted: rncData[columnName]
      });

    } else {
      // Campos normais - já sanitizados
      rncData[columnName] = value;
    }
  }

  // Adicionar campos do sistema se for nova
  if (isNew) {
    rncData['Nº RNC'] = rncNumber;
    rncData['Status Geral'] = CONFIG.STATUS_PIPELINE.ABERTURA;

    var dataHoraAtual = getCurrentDateTimeBR();
    rncData['Data Criação'] = dataHoraAtual;
    rncData['Usuário Criação'] = user;
    rncData['Última Edição'] = dataHoraAtual;
    rncData['Editado Por'] = user;
  }

  Logger.logInfo('prepareRncData_COMPLETE', {
    sanitized: true,
    fieldCount: Object.keys(rncData).length
  });

  return rncData;
}
  
  /**
   * Valida dados da RNC
   * Deploy 33 - Usa ValidaçãoRegex da planilha ConfigCampos
   * @private
   */
  function validateRncData(rncData, section) {
    var validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Obter campos da configuração (incluindo ValidaçãoRegex)
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.CONFIG_CAMPOS);
      var data = sheet.getDataRange().getValues();
      var headers = data[0];

      // Encontrar índices das colunas
      var colSeção = headers.indexOf('Seção');
      var colCampo = headers.indexOf('Campo');
      var colObrigatório = headers.indexOf('Obrigatório');
      var colValidaçãoRegex = headers.indexOf('ValidaçãoRegex');
      var colMensagemErro = headers.indexOf('MensagemErro');
      var colAtivo = headers.indexOf('Ativo');

      // Processar campos da seção
      for (var i = 1; i < data.length; i++) {
        var row = data[i];

        // Filtrar por seção e ativo
        if (row[colSeção] !== section || row[colAtivo] !== 'Sim') {
          continue;
        }

        var fieldName = row[colCampo];
        var isRequired = row[colObrigatório] === 'Sim';
        var regexPattern = row[colValidaçãoRegex];
        var errorMessage = row[colMensagemErro];

        var columnName = FIELD_MAPPING[fieldName] || fieldName;
        var value = rncData[columnName];

        // 1. Validar campos obrigatórios
        if (isRequired) {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            validation.valid = false;
            validation.errors.push('Campo obrigatório não preenchido: ' + fieldName);
            continue; // Skip regex validation if empty
          }
        }

        // 2. ✅ DEPLOY 33: Validar usando ValidaçãoRegex da planilha
        if (value && value !== '' && regexPattern && regexPattern.trim() !== '') {
          try {
            // TASK-008: Validar complexidade do regex (proteção ReDoS)
            // Verificar padrões perigosos: quantificadores aninhados, backtracking excessivo
            var dangerousPatterns = [
              /(\.\*){2,}/,           // Múltiplos .* consecutivos
              /(\.\+){2,}/,           // Múltiplos .+ consecutivos
              /(\*\+|\+\*)/,          // Quantificadores conflitantes
              /(\{.*,.*\}){2,}/       // Quantificadores aninhados
            ];

            var isDangerous = dangerousPatterns.some(function(pattern) {
              return pattern.test(regexPattern);
            });

            if (isDangerous) {
              Logger.logWarning('validateRncData_DANGEROUS_REGEX', {
                field: fieldName,
                pattern: regexPattern
              });
              validation.errors.push('Padrão de validação do campo "' + fieldName + '" é muito complexo');
              validation.valid = false;
              continue;
            }

            var regex = new RegExp(regexPattern);

            if (!regex.test(String(value))) {
              validation.valid = false;

              // Usar MensagemErro customizada ou mensagem padrão
              var errorMsg = errorMessage && errorMessage.trim() !== ''
                ? errorMessage
                : 'Campo "' + fieldName + '" está em formato inválido';

              validation.errors.push(errorMsg);

              Logger.logDebug('validateRncData_REGEX_FAIL', {
                field: fieldName,
                value: value,
                pattern: regexPattern
              });
            }
          } catch (regexError) {
            Logger.logWarning('validateRncData_INVALID_REGEX', {
              field: fieldName,
              pattern: regexPattern,
              error: regexError.toString()
            });
          }
        }
      }

      Logger.logDebug('validateRncData_COMPLETE', {
        section: section,
        valid: validation.valid,
        errorCount: validation.errors.length
      });

    } catch (error) {
      Logger.logError('validateRncData', error);
      validation.warnings.push('Não foi possível validar completamente os dados');
    }

    return validation;
  }

  /**
   * ============================================
   * DEPLOY 32: Validação de Transição de Status
   * ============================================
   */

  /**
   * Valida se uma transição de status é permitida
   * @param {string} currentStatus - Status atual
   * @param {string} newStatus - Novo status desejado
   * @param {Object} rncData - Dados completos da RNC (atuais + updates)
   * @return {Object} { valid: boolean, errors: Array }
   * @private
   */
  function validateStatusTransition(currentStatus, newStatus, rncData) {
    var validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Se status não mudou, é válido
    if (currentStatus === newStatus) {
      return validation;
    }

    Logger.logDebug('validateStatusTransition', {
      from: currentStatus,
      to: newStatus
    });

    // Definir transições válidas
    var validTransitions = {
      'Abertura RNC': ['Análise Qualidade', 'Finalizada'],
      'Análise Qualidade': ['Análise do problema e Ação Corretiva', 'Finalizada'],
      'Análise do problema e Ação Corretiva': ['Finalizada'],
      'Finalizada': [] // Não pode sair de Finalizada
    };

    // Verificar se transição é válida
    var allowedNextStates = validTransitions[currentStatus] || [];
    if (allowedNextStates.indexOf(newStatus) === -1) {
      validation.valid = false;
      validation.errors.push(
        'Transição de status inválida: "' + currentStatus + '" para "' + newStatus + '". ' +
        'Status permitidos: ' + (allowedNextStates.length > 0 ? allowedNextStates.join(', ') : 'nenhum')
      );
      return validation;
    }

    // Definir campos obrigatórios para cada status
    var requiredFieldsByStatus = {
      'Análise Qualidade': [
        'Data da Análise',
        'Risco',
        'Tipo de Falha'
      ],
      'Análise do problema e Ação Corretiva': [
        'Plano de ação',
        'Responsável pela ação corretiva'
      ],
      'Finalizada': [
        'Status da Ação Corretiva'
      ]
    };

    // Validar campos obrigatórios para o novo status
    var requiredFields = requiredFieldsByStatus[newStatus] || [];
    var missingFields = [];

    for (var i = 0; i < requiredFields.length; i++) {
      var fieldName = requiredFields[i];
      var value = rncData[fieldName];

      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(fieldName);
      }
    }

    if (missingFields.length > 0) {
      validation.valid = false;
      validation.errors.push(
        'Campos obrigatórios não preenchidos para o status "' + newStatus + '": ' +
        missingFields.join(', ')
      );
    }

    // Validações especiais
    if (newStatus === 'Finalizada') {
      // Verificar se tem pelo menos um dos critérios de finalização
      var tipoRnc = rncData['Tipo RNC'] || rncData['Tipo da RNC'] || '';
      var statusAcao = rncData['Status da Ação Corretiva'] || '';

      var isNaoProcede = tipoRnc.toLowerCase().includes('não procede') ||
                         tipoRnc.toLowerCase().includes('nao procede');
      var isAcaoConcluida = statusAcao.toLowerCase().includes('concluída') ||
                           statusAcao.toLowerCase().includes('concluida');

      if (!isNaoProcede && !isAcaoConcluida) {
        validation.warnings.push(
          'RNC sendo finalizada sem "Tipo RNC = Não Procede" ou "Status da Ação = Concluída". ' +
          'Verifique se está correto.'
        );
      }
    }

    Logger.logInfo('validateStatusTransition_RESULT', {
      from: currentStatus,
      to: newStatus,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    });

    return validation;
  }
  
 /**
 * Determina novo status baseado nos campos preenchidos
 * Deploy 32 - Validação de transição adicionada
 * REGRAS:
 * 1. Nova RNC → Abertura RNC
 * 2. Campo de Qualidade preenchido → Análise Qualidade
 * 3. Campo de Liderança preenchido → Análise do problema e Ação Corretiva
 * 4. Status Ação = Concluída OU Tipo RNC = Não Procede → Finalizada
 * @return {Object} { status: string, validation: Object }
 */
function determineNewStatus(currentRnc, updates) {
    try {
        var currentStatus = currentRnc['Status Geral'] || CONFIG.STATUS_PIPELINE.ABERTURA;
        var proposedStatus = currentStatus; // Status proposto

        Logger.logInfo('determineNewStatus_START', {
            currentStatus: currentStatus,
            updateFields: Object.keys(updates)
        });

        // === REGRA 1: NÃO PROCEDE = FINALIZADA IMEDIATAMENTE ===
        var tipoRnc = updates['Tipo RNC'] || updates['Tipo da RNC'] || currentRnc['Tipo RNC'] || currentRnc['Tipo da RNC'];

        if (tipoRnc && (tipoRnc.toLowerCase().includes('não procede'))) {
            Logger.logInfo('determineNewStatus_NAO_PROCEDE', {
                rncNumber: currentRnc['Nº RNC'],
                changing: currentStatus + ' -> Finalizada'
            });
            proposedStatus = CONFIG.STATUS_PIPELINE.FINALIZADA;
        }

        // === REGRA 4: STATUS DA AÇÃO CORRETIVA = CONCLUÍDA → FINALIZADA ===
        else {
          var statusAcao = updates['Status da Ação Corretiva'] || currentRnc['Status da Ação Corretiva'];

          if (statusAcao && (
              statusAcao.toLowerCase().includes('concluída') ||
              statusAcao.toLowerCase().includes('concluida')
          )) {
              Logger.logInfo('determineNewStatus_ACAO_CONCLUIDA', {
                  rncNumber: currentRnc['Nº RNC'],
                  statusAcao: statusAcao,
                  changing: currentStatus + ' -> Finalizada'
              });
              proposedStatus = CONFIG.STATUS_PIPELINE.FINALIZADA;
          }

          // === REGRA 2: CAMPOS DE LIDERANÇA = ANÁLISE E AÇÃO ===
          else {
            var camposLideranca = [
                'Plano de ação',
                'Status da Ação Corretiva',
                'Data limite para execução',
                'Data da conclusão da Ação',
                'Responsável pela ação corretiva'
            ];

            var liderancaFilled = false;
            for (var i = 0; i < camposLideranca.length; i++) {
                var campo = camposLideranca[i];
                var valor = updates[campo];

                if (valor && String(valor).trim() !== '') {
                    Logger.logInfo('determineNewStatus_LIDERANCA_FILLED', {
                        campo: campo,
                        currentStatus: currentStatus
                    });

                    if (currentStatus !== CONFIG.STATUS_PIPELINE.ANALISE_ACAO &&
                        currentStatus !== CONFIG.STATUS_PIPELINE.FINALIZADA) {
                        proposedStatus = CONFIG.STATUS_PIPELINE.ANALISE_ACAO;
                        liderancaFilled = true;
                        break;
                    }
                }
            }

            // === REGRA 3: CAMPOS DE QUALIDADE = ANÁLISE QUALIDADE ===
            if (!liderancaFilled) {
              var camposQualidade = [
                  'Setor onde ocorreu a não conformidade',
                  'Data da Análise',
                  'Risco',
                  'Tipo de Falha',
                  'Análise da Causa Raiz (relatório)',
                  'Ação Corretiva Imediata'
              ];

              for (var j = 0; j < camposQualidade.length; j++) {
                  var campoQ = camposQualidade[j];
                  var valorQ = updates[campoQ];

                  if (valorQ && String(valorQ).trim() !== '') {
                      Logger.logInfo('determineNewStatus_QUALIDADE_FILLED', {
                          campo: campoQ,
                          currentStatus: currentStatus
                      });

                      if (currentStatus === CONFIG.STATUS_PIPELINE.ABERTURA) {
                          proposedStatus = CONFIG.STATUS_PIPELINE.ANALISE_QUALIDADE;
                          break;
                      }
                  }
              }
            }
          }
        }

        // ✅ DEPLOY 32: Validar transição de status
        if (proposedStatus !== currentStatus) {
          // Merge de dados atuais + updates para validação
          var mergedData = {};
          for (var key in currentRnc) {
            mergedData[key] = currentRnc[key];
          }
          for (var key in updates) {
            mergedData[key] = updates[key];
          }

          var validation = validateStatusTransition(currentStatus, proposedStatus, mergedData);

          if (!validation.valid) {
            Logger.logWarning('determineNewStatus_VALIDATION_FAILED', {
              from: currentStatus,
              to: proposedStatus,
              errors: validation.errors
            });

            // Retornar status atual se validação falhou
            return {
              status: currentStatus,
              validation: validation,
              statusChanged: false
            };
          }

          // Transição válida
          Logger.logInfo('determineNewStatus_VALIDATED', {
            from: currentStatus,
            to: proposedStatus,
            warnings: validation.warnings
          });

          return {
            status: proposedStatus,
            validation: validation,
            statusChanged: true
          };
        }

        // === NENHUMA MUDANÇA DE STATUS ===
        Logger.logInfo('determineNewStatus_NO_CHANGE', {
            currentStatus: currentStatus
        });

        return {
          status: currentStatus,
          validation: { valid: true, errors: [], warnings: [] },
          statusChanged: false
        };

    } catch (error) {
        Logger.logError('determineNewStatus_ERROR', error);
        return {
          status: currentStatus || CONFIG.STATUS_PIPELINE.ABERTURA,
          validation: {
            valid: false,
            errors: ['Erro ao determinar status: ' + error.toString()],
            warnings: []
          },
          statusChanged: false
        };
    }
}
  
  /**
   * Deleta uma RNC (soft delete - marca como deletada)
   * @param {string} rncNumber - Número da RNC
   * @return {Object} Resultado da operação
   */
  function deleteRnc(rncNumber) {
    try {
      var user = Session.getActiveUser().getEmail() || 'system';
      
      Logger.logWarning('deleteRnc_ATTEMPT', { 
        rncNumber: rncNumber,
        user: user
      });
      
      // Verificar se existe
      var rnc = getRncByNumber(rncNumber);
      if (!rnc) {
        throw new Error(CONFIG.ERROR_MESSAGES.RNC_NOT_FOUND);
      }
      
      // Soft delete - apenas marcar como deletada
      var updates = {
        'Status Geral': 'DELETADA',
        'Última Edição': new Date(),
        'Editado Por': user,
        'Data Deleção': new Date(),
        'Deletado Por': user
      };
      
      var result = Database.updateData(
        CONFIG.SHEETS.RNC,
        { 'Nº RNC': rncNumber },
        updates
      );

      // ✅ FASE 2.1: Invalidar cache após deleção bem-sucedida
      if (result.success) {
        invalidateRncCache();
      }

      Logger.logWarning('deleteRnc_SUCCESS', {
        rncNumber: rncNumber,
        user: user
      });
      
      return {
        success: result.success,
        message: 'RNC marcada como deletada'
      };
      
    } catch (error) {
      Logger.logError('deleteRnc_ERROR', error, { rncNumber: rncNumber });
      throw error;
    }
  }
  
  /**
   * Restaura uma RNC deletada
   * @param {string} rncNumber - Número da RNC
   * @return {Object} Resultado da operação
   */
  function restoreRnc(rncNumber) {
    try {
      var user = Session.getActiveUser().getEmail() || 'system';
      
      Logger.logInfo('restoreRnc_ATTEMPT', { 
        rncNumber: rncNumber,
        user: user
      });
      
      var rnc = getRncByNumber(rncNumber);
      if (!rnc) {
        throw new Error(CONFIG.ERROR_MESSAGES.RNC_NOT_FOUND);
      }
      
      if (rnc['Status Geral'] !== 'DELETADA') {
        throw new Error('RNC não está deletada');
      }
      
      var updates = {
        'Status Geral': CONFIG.STATUS_PIPELINE.ABERTURA,
        'Última Edição': new Date(),
        'Editado Por': user
      };
      
      var result = Database.updateData(
        CONFIG.SHEETS.RNC,
        { 'Nº RNC': rncNumber },
        updates
      );
      
      Logger.logInfo('restoreRnc_SUCCESS', { 
        rncNumber: rncNumber,
        user: user
      });
      
      return {
        success: result.success,
        message: 'RNC restaurada com sucesso'
      };
      
    } catch (error) {
      Logger.logError('restoreRnc_ERROR', error, { rncNumber: rncNumber });
      throw error;
    }
  }
  
  /**
 * Busca RNCs por setor
 * Deploy 66: Usa campo "Setor onde ocorreu a não conformidade"
 */
function getRncsBySetor(setor) {
    try {
        if (!setor || setor === 'Todos') {
            return getAllRncs();
        }

        // Deploy 66: Usar campo correto de setor
        var filters = {};
        filters['Setor onde ocorreu a não conformidade'] = setor;

        var rncs = Database.findData(CONFIG.SHEETS.RNC, filters, {
            orderBy: 'Data Criação',
            orderDesc: true
        });

        for (var i = 0; i < rncs.length; i++) {
            for (var key in rncs[i]) {
                if (rncs[i][key] instanceof Date) {
                    rncs[i][key] = rncs[i][key].toISOString();
                }
            }
        }

        Logger.logInfo('getRncsBySetor', { setor: setor, count: rncs.length });
        return rncs;

    } catch (error) {
        Logger.logError('getRncsBySetor', error);
        return [];
    }
}

/**
 * Deploy 67: Busca RNCs do setor do usuário
 * Retorna RNCs onde o usuário está no setor de abertura OU setor da não conformidade
 * @param {string} email - Email do usuário
 * @return {Array} Lista de RNCs do setor do usuário
 */
function getRncsByUserSetor(email) {
    try {
        Logger.logDebug('getRncsByUserSetor_START', { email: email });

        // Obter setor do usuário
        var userSetor = PermissionsManager.getUserSetor(email);

        if (!userSetor) {
            Logger.logWarning('getRncsByUserSetor_NO_SETOR', { email: email });
            return [];
        }

        // Deploy 67: Buscar TODAS as RNCs e filtrar por ambos os setores
        var allRncs = getAllRncs();
        var filteredRncs = [];

        for (var i = 0; i < allRncs.length; i++) {
            var rnc = allRncs[i];
            var setorAbertura = rnc['Setor onde foi feita abertura'] || '';
            var setorNaoConformidade = rnc['Setor onde ocorreu a não conformidade'] || '';

            // Incluir RNC se o usuário está no setor de abertura OU setor da não conformidade
            if (setorAbertura === userSetor || setorNaoConformidade === userSetor) {
                filteredRncs.push(rnc);
            }
        }

        Logger.logInfo('getRncsByUserSetor_SUCCESS', {
            email: email,
            setor: userSetor,
            count: filteredRncs.length
        });

        return filteredRncs;

    } catch (error) {
        Logger.logError('getRncsByUserSetor_ERROR', error, { email: email });
        return [];
    }
}

/**
 * Lista setores únicos
 */
function getSetoresUnicos() {
    try {
        var rncs = getAllRncs();
        var setoresSet = {};
        
        for (var i = 0; i < rncs.length; i++) {
            var setor = rncs[i]['Setor onde foi feita abertura\n'] || '';
            if (setor && setor.trim() !== '') {
                setoresSet[setor.trim()] = true;
            }
        }
        
        var setores = Object.keys(setoresSet).sort();
        Logger.logInfo('getSetoresUnicos', { count: setores.length });
        return setores;
        
    } catch (error) {
        Logger.logError('getSetoresUnicos', error);
        return [];
    }
}

/**
 * Números de RNC por setor
 */
function getRncNumbersBySetor(setor) {
    try {
        var rncs = getRncsBySetor(setor);
        var numbers = [];
        
        for (var i = 0; i < rncs.length; i++) {
            if (rncs[i]['Nº RNC']) {
                numbers.push(String(rncs[i]['Nº RNC']));
            }
        }
        
        numbers.sort(function(a, b) {
            var yearA = parseInt(a.split('/')[1]) || 0;
            var numberA = parseInt(a.split('/')[0]) || 0;
            var yearB = parseInt(b.split('/')[1]) || 0;
            var numberB = parseInt(b.split('/')[0]) || 0;
            
            if (yearA !== yearB) return yearB - yearA;
            return numberB - numberA;
        });
        
        return numbers;
        
    } catch (error) {
        Logger.logError('getRncNumbersBySetor', error);
        return [];
    }
}

  
// API Pública
return {
    generateRncNumber: generateRncNumber,
    saveRnc: saveRnc,
    updateRnc: updateRnc,
    getRncByNumber: getRncByNumber,
    getAllRncs: getAllRncs,
    getAllRncNumbers: getAllRncNumbers,
    searchRncs: searchRncs,
    deleteRnc: deleteRnc,
    restoreRnc: restoreRnc,
    prepareRncData: prepareRncData,
    determineNewStatus: determineNewStatus,
    getRncsBySetor: getRncsBySetor,
    getRncsByUserSetor: getRncsByUserSetor, // Deploy 66
    getSetoresUnicos: getSetoresUnicos,
    getRncNumbersBySetor: getRncNumbersBySetor
};
})();

// Adicione esta linha para tornar prepareRncData testável:
var prepareRncData = RncOperations.prepareRncData || function() { return {}; };
