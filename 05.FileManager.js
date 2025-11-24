/**
 * ============================================
 * FILEMANAGER.GS - Gerenciamento de Arquivos
 * Sistema RNC Neoformula - Deploy 30 Modularizado
 * ============================================
 */

var FileManager = (function() {
  'use strict';
  
  /**
   * Faz upload de arquivos para o Google Drive
   * @param {string} rncNumber - Número da RNC
   * @param {Array} files - Array de arquivos
   * @param {string} section - Seção de origem
   * @return {Object} Resultado do upload
   */
  function uploadFiles(rncNumber, files, section) {
    var results = {
      uploaded: 0,
      failed: 0,
      files: [],
      errors: []
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
        try {
          var file = files[i];
          
          // Validar arquivo
          var validation = validateFile(file);
          if (!validation.valid) {
            results.failed++;
            results.errors.push({
              filename: file.name,
              error: validation.error
            });
            continue;
          }
          
          // Preparar nome do arquivo
          var fileName = file.name;
          if (renomearArquivos) {
            fileName = generateFileName(rncNumber, proximoNumero + i, files.length + anexosExistentes.length, file.name);
          }
          
          // Criar blob e fazer upload
          var blob = Utilities.newBlob(
            Utilities.base64Decode(file.content),
            file.mimeType || 'application/octet-stream',
            fileName
          );
          
          var driveFile = rncFolder.createFile(blob);
          
          // Registrar na planilha de anexos
          var anexoData = {
            'RncNumero': rncNumber,
            'NomeArquivo': fileName,
            'NomeOriginal': file.name,
            'TipoArquivo': file.mimeType || 'unknown',
            'Tamanho': file.size || blob.getBytes().length,
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
            id: driveFile.getId(),
            url: driveFile.getUrl()
          });
          
          Logger.logDebug('uploadFiles_FILE_SUCCESS', {
            rncNumber: rncNumber,
            fileName: fileName,
            fileId: driveFile.getId()
          });
          
        } catch (fileError) {
          results.failed++;
          results.errors.push({
            filename: file.name || 'unknown',
            error: fileError.toString()
          });
          
          Logger.logError('uploadFiles_FILE_ERROR', fileError, {
            rncNumber: rncNumber,
            fileName: file.name
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
   * Obtém ou cria pasta da RNC no Drive
   * @private
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
   * Valida arquivo antes do upload
   * @private
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
   * Gera nome padronizado para arquivo
   * @private
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
 * Busca anexos de uma RNC
 * @param {string} rncNumber - Número da RNC
 * @return {Array} Lista de anexos
 * Deploy 36 - Estrutura padronizada
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
   * Deleta anexo
   * @param {string} rncNumber - Número da RNC
   * @param {string} fileId - ID do arquivo no Drive
   * @return {Object} Resultado da operação
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
 * Faz download de anexo
 * @param {string} fileId - ID do arquivo no Drive
 * @return {Object} Dados do arquivo
 * Deploy 36 - Retorno padronizado
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
   * Limpa anexos órfãos (sem RNC associada)
   * @return {Object} Resultado da limpeza
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