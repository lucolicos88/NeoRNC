/**
 * ============================================
 * FILEMANAGER.GS - Gerenciamento de Arquivos
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 *
 * @namespace FileManager
 * @description Módulo responsável pelo gerenciamento de arquivos no Google Drive.
 * Controla upload, download, validação e organização de anexos das RNCs.
 * @since Deploy 30
 */

var FileManager = (function() {
  'use strict';
  
  /**
   * Faz upload de múltiplos arquivos para o Google Drive vinculados a uma RNC.
   * Cria pasta da RNC automaticamente, valida arquivos, renomeia se configurado
   * e registra metadados na planilha de anexos com retry automático.
   *
   * @param {string} rncNumber - Número da RNC (ex: 'RNC-2024-001')
   * @param {Array<Object>} files - Array de arquivos com {name, content, size, mimeType}
   * @param {string} section - Seção de origem do upload (ex: 'abertura', 'evidencias')
   * @return {Object} {uploaded: number, failed: number, files: Array, errors: Array, warnings: Array}
   *
   * @example
   * var result = uploadFiles('RNC-2024-001', [{name: 'foto.jpg', content: base64, size: 2048}], 'abertura');
   * // Returns: {uploaded: 1, failed: 0, files: [{name: 'RNC-2024-001 - Imagem 1 de 1.jpg', id: '...'}], errors: [], warnings: []}
   *
   * @memberof FileManager
   * @since Deploy 32
   */
  function uploadFiles(rncNumber, files, section) {
    var results = {
      uploaded: 0,
      failed: 0,
      files: [],
      errors: [],
      warnings: []
    };

    if (!files || files.length === 0) {
      return results;
    }

    try {
      var user = Session.getActiveUser().getEmail() || 'system';

      Logger.logInfo('uploadFiles_START', {
        rncNumber: rncNumber,
        filesCount: files.length,
        section: section
      });

      // Obter ou criar pasta da RNC
      var rncFolder = getRncFolder(rncNumber);
      if (!rncFolder) {
        throw new Error('Não foi possível criar pasta para a RNC');
      }

      // Configurações
      var renomearArquivos = getSystemConfig('RenomearArquivos', 'Sim') === 'Sim';
      var anexosExistentes = getAnexosRnc(rncNumber);
      var proximoNumero = anexosExistentes.length + 1;

      // Processar cada arquivo
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileName = file.name;

        try {
          // Validar arquivo
          var validation = validateFile(file);
          if (!validation.valid) {
            results.failed++;
            results.errors.push({
              filename: fileName,
              error: validation.error,
              userMessage: 'Arquivo rejeitado: ' + validation.error,
              canRetry: false
            });
            continue;
          }

          // Preparar nome do arquivo
          if (renomearArquivos) {
            fileName = generateFileName(rncNumber, proximoNumero + i, files.length + anexosExistentes.length, file.name);
          }

          // ✅ DEPLOY 32: Tentar upload com retry
          var uploadResult = uploadFileWithRetry(file, fileName, rncFolder, 3);

          if (!uploadResult.success) {
            results.failed++;
            results.errors.push({
              filename: file.name,
              error: uploadResult.error,
              userMessage: uploadResult.userMessage,
              canRetry: uploadResult.canRetry,
              attempts: uploadResult.attempts
            });
            continue;
          }

          var driveFile = uploadResult.file;

          // Registrar na planilha de anexos
          var anexoData = {
            'RncNumero': rncNumber,
            'NomeArquivo': fileName,
            'NomeOriginal': file.name,
            'TipoArquivo': file.mimeType || 'unknown',
            'Tamanho': file.size || uploadResult.size,
            'DriveFileId': driveFile.getId(),
            'DataUpload': new Date(),
            'UsuarioUpload': user,
            'Seção': section,
            'Url': driveFile.getUrl()
          };

          Database.insertData(CONFIG.SHEETS.ANEXOS, anexoData);

          results.uploaded++;
          results.files.push({
            name: fileName,
            originalName: file.name,
            id: driveFile.getId(),
            url: driveFile.getUrl(),
            attempts: uploadResult.attempts
          });

          // Avisar se precisou de retry
          if (uploadResult.attempts > 1) {
            results.warnings.push({
              filename: file.name,
              message: 'Arquivo enviado após ' + uploadResult.attempts + ' tentativas'
            });
          }

          Logger.logDebug('uploadFiles_FILE_SUCCESS', {
            rncNumber: rncNumber,
            fileName: fileName,
            fileId: driveFile.getId(),
            attempts: uploadResult.attempts
          });

        } catch (fileError) {
          results.failed++;
          var errorInfo = getFileErrorInfo(fileError);

          results.errors.push({
            filename: file.name || 'unknown',
            error: fileError.toString(),
            userMessage: errorInfo.userMessage,
            canRetry: errorInfo.canRetry
          });

          Logger.logError('uploadFiles_FILE_ERROR', fileError, {
            rncNumber: rncNumber,
            fileName: file.name,
            errorType: errorInfo.type
          });
        }
      }
      
     Logger.logInfo('uploadFiles_COMPLETE', {
  rncNumber: rncNumber,
  uploaded: results.uploaded,
  failed: results.failed
});

// ✅ NOVO: Atualizar status de anexo após upload
if (results.uploaded > 0) {
  try {
    ConfigManager.updateAttachmentStatus(rncNumber);
  } catch (error) {
    Logger.logWarning('uploadFiles_UPDATE_ATTACHMENT_STATUS_ERROR', error, { rncNumber: rncNumber });
  }
}

return results;
      
    } catch (error) {
      Logger.logError('uploadFiles_ERROR', error, {
        rncNumber: rncNumber
      });
      
      results.errors.push({
        filename: 'geral',
        error: error.toString()
      });
      
      return results;
    }
  }
  
  /**
   * Obtém pasta existente da RNC no Google Drive ou cria uma nova.
   * Usa nomenclatura padronizada 'RNC_XXXX_YYYY' e verifica configuração
   * do sistema para localizar a pasta pai.
   *
   * @param {string} rncNumber - Número da RNC (ex: 'RNC-2024-001')
   * @return {Folder|null} Objeto Folder do Google Drive ou null em caso de erro
   *
   * @example
   * var folder = getRncFolder('RNC-2024-001');
   * // Returns: Folder{id: '1a2b3c...', name: 'RNC_RNC-2024-001'}
   *
   * @private
   * @since Deploy 30
   */
  function getRncFolder(rncNumber) {
    try {
      var pastaGID = getSystemConfig('PastaGID', CONFIG.DRIVE_FOLDER_ID);
      
      if (!pastaGID) {
        throw new Error('ID da pasta do Drive não configurado');
      }
      
      var parentFolder = DriveApp.getFolderById(pastaGID);
      var rncFolderName = 'RNC_' + rncNumber.replace('/', '_');
      
      // Verificar se já existe
      var existingFolders = parentFolder.getFoldersByName(rncFolderName);
      if (existingFolders.hasNext()) {
        return existingFolders.next();
      }
      
      // Criar nova pasta
      var newFolder = parentFolder.createFolder(rncFolderName);
      
      Logger.logInfo('getRncFolder_CREATED', {
        rncNumber: rncNumber,
        folderName: rncFolderName,
        folderId: newFolder.getId()
      });
      
      return newFolder;
      
    } catch (error) {
      Logger.logError('getRncFolder_ERROR', error, {
        rncNumber: rncNumber
      });
      return null;
    }
  }
  
  /**
   * Valida arquivo antes do upload verificando conteúdo, tamanho e tipo.
   * Compara com limites e extensões permitidas configuradas no sistema,
   * retornando detalhes específicos do erro caso a validação falhe.
   *
   * @param {Object} file - Objeto arquivo com {content, size, name, mimeType}
   * @return {Object} {valid: boolean, error: string|null}
   *
   * @example
   * var validation = validateFile({content: 'abc', size: 1024, name: 'test.jpg'});
   * // Returns: {valid: true, error: null}
   *
   * @private
   * @since Deploy 30
   */
  function validateFile(file) {
    var validation = {
      valid: true,
      error: null
    };
    
    try {
      // Verificar se tem conteúdo
      if (!file || !file.content) {
        validation.valid = false;
        validation.error = 'Arquivo sem conteúdo';
        return validation;
      }
      
      // Verificar tamanho
      var maxSize = getSystemConfig('MaxFileSize', CONFIG.SYSTEM.MAX_FILE_SIZE);
      if (file.size && file.size > maxSize) {
        validation.valid = false;
        validation.error = CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE;
        return validation;
      }
      
      // Verificar tipo
      if (file.name) {
        var extension = '.' + file.name.split('.').pop().toLowerCase();
        var allowedTypes = getSystemConfig('AllowedFileTypes', CONFIG.SYSTEM.ALLOWED_FILE_TYPES.join(',')).split(',');
        
        if (allowedTypes.indexOf(extension) === -1) {
          validation.valid = false;
          validation.error = CONFIG.ERROR_MESSAGES.INVALID_FILE_TYPE + ' (' + extension + ')';
          return validation;
        }
      }
      
      return validation;
      
    } catch (error) {
      validation.valid = false;
      validation.error = 'Erro na validação: ' + error.toString();
      return validation;
    }
  }
  
  /**
   * Gera nome padronizado para arquivo seguindo padrão do sistema.
   * Formato: 'RNC_XXXX_YYYY - Imagem N de TOTAL.ext', preservando
   * a extensão original e substituindo caracteres inválidos.
   *
   * @param {string} rncNumber - Número da RNC (ex: 'RNC-2024-001')
   * @param {number} currentNumber - Número sequencial do arquivo atual
   * @param {number} totalFiles - Total de arquivos da RNC
   * @param {string} originalName - Nome original do arquivo
   * @return {string} Nome padronizado do arquivo
   *
   * @example
   * var newName = generateFileName('RNC-2024-001', 3, 5, 'foto_evidencia.jpg');
   * // Returns: 'RNC_RNC-2024-001 - Imagem 3 de 5.jpg'
   *
   * @private
   * @since Deploy 30
   */
  function generateFileName(rncNumber, currentNumber, totalFiles, originalName) {
    try {
      var extension = '';
      var lastDot = originalName.lastIndexOf('.');
      if (lastDot > -1) {
        extension = originalName.substring(lastDot);
      }
      
      var cleanRncNumber = rncNumber.replace('/', '_');
      return cleanRncNumber + ' - Imagem ' + currentNumber + ' de ' + totalFiles + extension;
      
    } catch (error) {
      return originalName;
    }
  }
  
    /**
   * Busca todos os anexos vinculados a uma RNC específica.
   * Retorna estrutura padronizada com metadados completos incluindo
   * ID do Drive, URLs, datas e informações de upload.
   *
   * @param {string} rncNumber - Número da RNC (ex: 'RNC-2024-001')
   * @return {Array<Object>} Lista de anexos com {id, name, originalName, size, mimeType, uploadDate, uploadedBy, section, url}
   *
   * @example
   * var anexos = getAnexosRnc('RNC-2024-001');
   * // Returns: [{id: '1a2b3c...', name: 'RNC-2024-001 - Imagem 1.jpg', size: 2048, url: 'https://...'}]
   *
   * @memberof FileManager
   * @since Deploy 36
   */
  function getAnexosRnc(rncNumber) {
  try {
    Logger.logInfo('getAnexosRnc_START', { rncNumber: rncNumber });
    
    var anexos = Database.findData(CONFIG.SHEETS.ANEXOS, {
      'RncNumero': rncNumber
    }, {
      orderBy: 'DataUpload',
      orderDesc: false
    });
    
    var result = [];
    
    for (var i = 0; i < anexos.length; i++) {
      var attach = anexos[i];
      
      // Estrutura padronizada
      result.push({
        id: attach['DriveFileId'] || attach['ID Arquivo'] || attach['File ID'],
        name: attach['NomeArquivo'] || attach['Nome Arquivo'] || attach['Nome'],
        originalName: attach['NomeOriginal'] || attach['NomeArquivo'],
        size: attach['Tamanho'] || 0,
        mimeType: attach['TipoArquivo'] || 'unknown',
        uploadDate: attach['DataUpload'] || attach['Data Upload'] || attach['Data'],
        uploadedBy: attach['UsuarioUpload'] || attach['Usuário'] || '',
        section: attach['Seção'] || '',
        url: attach['Url'] || ''
      });
    }
    
    // Serializar datas
    for (var j = 0; j < result.length; j++) {
      if (result[j].uploadDate instanceof Date) {
        result[j].uploadDate = result[j].uploadDate.toISOString();
      }
    }
    
    Logger.logInfo('getAnexosRnc_SUCCESS', { 
      rncNumber: rncNumber,
      count: result.length 
    });
    
    return result;
    
  } catch (error) {
    Logger.logError('getAnexosRnc_ERROR', error, {
      rncNumber: rncNumber
    });
    return [];
  }
}
  
  /**
   * Deleta anexo do Google Drive e remove registro da planilha.
   * Move arquivo para lixeira do Drive e atualiza status de anexo
   * da RNC automaticamente após exclusão bem-sucedida.
   *
   * @param {string} rncNumber - Número da RNC (ex: 'RNC-2024-001')
   * @param {string} fileId - ID do arquivo no Google Drive
   * @return {Object} {success: boolean, message: string}
   *
   * @example
   * var result = deleteAnexo('RNC-2024-001', '1a2b3c4d5e');
   * // Returns: {success: true, message: 'Anexo removido com sucesso'}
   *
   * @memberof FileManager
   * @since Deploy 30
   */
  function deleteAnexo(rncNumber, fileId) {
    try {
      var user = Session.getActiveUser().getEmail() || 'system';
      
      Logger.logWarning('deleteAnexo_ATTEMPT', {
        rncNumber: rncNumber,
        fileId: fileId,
        user: user
      });
      
      // Remover do Drive
      try {
        var file = DriveApp.getFileById(fileId);
        file.setTrashed(true);
      } catch (driveError) {
        Logger.logWarning('deleteAnexo_DRIVE_ERROR', {
          error: driveError.toString(),
          fileId: fileId
        });
      }
      
      // Remover da planilha
      var result = Database.deleteData(CONFIG.SHEETS.ANEXOS, {
        'RncNumero': rncNumber,
        'DriveFileId': fileId
      });
      
      Logger.logInfo('deleteAnexo_SUCCESS', {
  rncNumber: rncNumber,
  fileId: fileId,
  user: user
});

// ✅ NOVO: Atualizar status de anexo após exclusão
try {
  ConfigManager.updateAttachmentStatus(rncNumber);
} catch (error) {
  Logger.logWarning('deleteAnexo_UPDATE_ATTACHMENT_STATUS_ERROR', error, { rncNumber: rncNumber });
}

return {
  success: result.success,
  message: 'Anexo removido com sucesso'
};
      
    } catch (error) {
      Logger.logError('deleteAnexo_ERROR', error, {
        rncNumber: rncNumber,
        fileId: fileId
      });
      throw error;
    }
  }
  
  /**
   * Faz download de anexo do Google Drive retornando conteúdo em base64.
   * Busca arquivo pelo ID e retorna metadados completos incluindo
   * conteúdo codificado, URLs e informações do arquivo.
   *
   * @param {string} fileId - ID do arquivo no Google Drive
   * @return {Object} {success: boolean, name: string, mimeType: string, content: string, size: number, url: string, downloadUrl: string}
   *
   * @example
   * var file = downloadAnexo('1a2b3c4d5e');
   * // Returns: {success: true, name: 'foto.jpg', mimeType: 'image/jpeg', content: 'base64...', size: 2048}
   *
   * @memberof FileManager
   * @since Deploy 36
   */
  function downloadAnexo(fileId) {
  try {
    Logger.logInfo('downloadAnexo_START', { fileId: fileId });
    
    var file = DriveApp.getFileById(fileId);
    
    var result = {
      success: true,
      name: file.getName(),
      mimeType: file.getMimeType(),
      content: Utilities.base64Encode(file.getBlob().getBytes()),
      size: file.getSize(),
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl()
    };
    
    Logger.logInfo('downloadAnexo_SUCCESS', { 
      fileId: fileId,
      fileName: result.name 
    });
    
    return result;
    
  } catch (error) {
    Logger.logError('downloadAnexo_ERROR', error, {
      fileId: fileId
    });
    
    throw new Error('Arquivo não encontrado ou sem permissão: ' + error.message);
  }
}
  
  /**
   * ============================================
   * DEPLOY 32: Funções de Retry e Error Handling
   * ============================================
   */

  /**
   * Tenta fazer upload de arquivo com retry automático e backoff exponencial.
   * Realiza até N tentativas com espera progressiva (2s, 4s, 8s) entre falhas,
   * retornando informações detalhadas de sucesso ou erro amigável ao usuário.
   *
   * @param {Object} file - Arquivo com {content, mimeType}
   * @param {string} fileName - Nome final do arquivo
   * @param {Folder} folder - Pasta de destino no Google Drive
   * @param {number} maxAttempts - Número máximo de tentativas (padrão: 3)
   * @return {Object} {success: boolean, file: File, size: number, attempts: number, error: string, userMessage: string, canRetry: boolean}
   *
   * @example
   * var result = uploadFileWithRetry(fileObj, 'RNC-001.jpg', folder, 3);
   * // Returns: {success: true, file: File{...}, size: 2048, attempts: 2}
   *
   * @private
   * @since Deploy 32
   */
  function uploadFileWithRetry(file, fileName, folder, maxAttempts) {
    var attempts = 0;
    var lastError = null;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        // Criar blob
        var blob = Utilities.newBlob(
          Utilities.base64Decode(file.content),
          file.mimeType || 'application/octet-stream',
          fileName
        );

        // Tentar upload
        var driveFile = folder.createFile(blob);

        Logger.logDebug('uploadFileWithRetry_SUCCESS', {
          fileName: fileName,
          attempts: attempts
        });

        return {
          success: true,
          file: driveFile,
          size: blob.getBytes().length,
          attempts: attempts
        };

      } catch (error) {
        lastError = error;

        Logger.logWarning('uploadFileWithRetry_ATTEMPT_FAILED', {
          fileName: fileName,
          attempt: attempts,
          maxAttempts: maxAttempts,
          error: error.toString()
        });

        // Se não é o último attempt, aguardar antes de tentar novamente
        if (attempts < maxAttempts) {
          var waitTime = Math.pow(2, attempts) * 1000; // Backoff exponencial: 2s, 4s, 8s
          Utilities.sleep(waitTime);
        }
      }
    }

    // Todas as tentativas falharam
    var errorInfo = getFileErrorInfo(lastError);

    return {
      success: false,
      error: lastError.toString(),
      userMessage: errorInfo.userMessage,
      canRetry: errorInfo.canRetry,
      attempts: attempts
    };
  }

  /**
   * Analisa erro de upload e retorna informações amigáveis para o usuário.
   * Categoriza erros (quota, permissão, tamanho, tipo, rede, timeout)
   * e determina se nova tentativa é viável, fornecendo mensagem adequada.
   *
   * @param {Error} error - Erro capturado durante operação de arquivo
   * @return {Object} {type: string, userMessage: string, canRetry: boolean}
   *
   * @example
   * var errorInfo = getFileErrorInfo(new Error('Storage quota exceeded'));
   * // Returns: {type: 'quota_exceeded', userMessage: 'Limite de armazenamento atingido...', canRetry: false}
   *
   * @private
   * @since Deploy 32
   */
  function getFileErrorInfo(error) {
    var errorStr = error.toString().toLowerCase();
    var info = {
      type: 'unknown',
      userMessage: 'Erro ao enviar arquivo. Tente novamente.',
      canRetry: true
    };

    // Quota excedida
    if (errorStr.includes('quota') || errorStr.includes('storage') || errorStr.includes('limite')) {
      info.type = 'quota_exceeded';
      info.userMessage = 'Limite de armazenamento atingido. Contate o administrador do sistema.';
      info.canRetry = false;
      return info;
    }

    // Permissão negada
    if (errorStr.includes('permission') || errorStr.includes('permissão') || errorStr.includes('denied')) {
      info.type = 'permission_denied';
      info.userMessage = 'Sem permissão para salvar arquivo no Drive. Contate o administrador.';
      info.canRetry = false;
      return info;
    }

    // Arquivo muito grande
    if (errorStr.includes('size') || errorStr.includes('tamanho') || errorStr.includes('large')) {
      info.type = 'file_too_large';
      info.userMessage = 'Arquivo muito grande. O tamanho máximo é 10MB.';
      info.canRetry = false;
      return info;
    }

    // Tipo de arquivo não suportado
    if (errorStr.includes('type') || errorStr.includes('tipo') || errorStr.includes('format')) {
      info.type = 'invalid_type';
      info.userMessage = 'Tipo de arquivo não suportado.';
      info.canRetry = false;
      return info;
    }

    // Timeout
    if (errorStr.includes('timeout') || errorStr.includes('time out')) {
      info.type = 'timeout';
      info.userMessage = 'Tempo esgotado ao enviar arquivo. Tente novamente.';
      info.canRetry = true;
      return info;
    }

    // Erro de rede
    if (errorStr.includes('network') || errorStr.includes('connection') || errorStr.includes('conexão')) {
      info.type = 'network_error';
      info.userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      info.canRetry = true;
      return info;
    }

    // Serviço indisponível
    if (errorStr.includes('unavailable') || errorStr.includes('indisponível') || errorStr.includes('service')) {
      info.type = 'service_unavailable';
      info.userMessage = 'Serviço temporariamente indisponível. Aguarde alguns minutos e tente novamente.';
      info.canRetry = true;
      return info;
    }

    // Erro genérico
    info.type = 'generic_error';
    info.userMessage = 'Erro ao enviar arquivo: ' + error.toString();
    info.canRetry = true;

    return info;
  }

  /**
   * ============================================
   * Função de Limpeza
   * ============================================
   */

  /**
   * Limpa anexos órfãos que não possuem RNC associada na planilha.
   * Busca todos os anexos, compara com RNCs existentes e remove
   * registros órfãos do Drive e planilha, atualizando status automaticamente.
   *
   * @return {Object} {success: boolean, orphansRemoved: number, error: string}
   *
   * @example
   * var result = cleanOrphanAttachments();
   * // Returns: {success: true, orphansRemoved: 3}
   *
   * @memberof FileManager
   * @since Deploy 30
   */
  function cleanOrphanAttachments() {
    try {
      Logger.logInfo('cleanOrphanAttachments_START');

      var anexos = Database.findData(CONFIG.SHEETS.ANEXOS, {});
      var rncs = RncOperations.getAllRncNumbers();
      var orphans = [];

      for (var i = 0; i < anexos.length; i++) {
        if (rncs.indexOf(anexos[i]['RncNumero']) === -1) {
          orphans.push(anexos[i]);
        }
      }
      
      // Remover órfãos
      for (var j = 0; j < orphans.length; j++) {
        try {
          deleteAnexo(orphans[j]['RncNumero'], orphans[j]['DriveFileId']);
        } catch (e) {
          Logger.logWarning('cleanOrphanAttachments_ITEM_ERROR', {
            error: e.toString(),
            anexo: orphans[j]
          });
        }
      }
      
      Logger.logInfo('cleanOrphanAttachments_COMPLETE', {
  orphansFound: orphans.length
});

// ✅ NOVO: Atualizar status de anexos após limpeza
if (orphans.length > 0) {
  try {
    // Atualizar status para todas as RNCs afetadas
    var rncNumbers = [];
    for (var k = 0; k < orphans.length; k++) {
      if (rncNumbers.indexOf(orphans[k]['RncNumero']) === -1) {
        rncNumbers.push(orphans[k]['RncNumero']);
      }
    }
    
    for (var l = 0; l < rncNumbers.length; l++) {
      ConfigManager.updateAttachmentStatus(rncNumbers[l]);
    }
  } catch (error) {
    Logger.logWarning('cleanOrphanAttachments_UPDATE_STATUS_ERROR', error);
  }
}

return {
  success: true,
  orphansRemoved: orphans.length
};
      
    } catch (error) {
      Logger.logError('cleanOrphanAttachments_ERROR', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  // API Pública
  return {
    uploadFiles: uploadFiles,
    getAnexosRnc: getAnexosRnc,
    deleteAnexo: deleteAnexo,
    downloadAnexo: downloadAnexo,
    cleanOrphanAttachments: cleanOrphanAttachments
  };
})();