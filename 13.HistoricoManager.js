/**
 * ============================================
 * HISTORICO MANAGER - Sistema de Auditoria
 * Deploy 34 - Histórico de Alterações
 * ============================================
 *
 * Gerencia registro completo de alterações em RNCs:
 * - Rastreia quem alterou, quando, qual campo, valor anterior e novo
 * - Timeline visual de mudanças
 * - Conformidade e auditoria
 */

var HistoricoManager = (function() {

  /**
   * Registra alteração de campo no histórico
   * @param {string} rncNumber - Número da RNC
   * @param {string} fieldName - Nome do campo alterado
   * @param {string} oldValue - Valor anterior
   * @param {string} newValue - Valor novo
   * @param {string} section - Seção do campo
   * @param {string} userEmail - Email do usuário que fez a alteração
   */
  function registrarAlteracao(rncNumber, fieldName, oldValue, newValue, section, userEmail) {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      var sheet = ss.getSheetByName('Historico');

      // Criar aba Historico se não existir
      if (!sheet) {
        sheet = ss.insertSheet('Historico');

        // Configurar cabeçalhos
        sheet.getRange(1, 1, 1, 8).setValues([[
          'Timestamp',
          'Nº RNC',
          'Usuário',
          'Seção',
          'Campo',
          'Valor Anterior',
          'Valor Novo',
          'Tipo Alteração'
        ]]);

        // Formatar cabeçalho
        sheet.getRange(1, 1, 1, 8)
          .setBackground('#009688')
          .setFontColor('#ffffff')
          .setFontWeight('bold')
          .setHorizontalAlignment('center');

        // Congelar cabeçalho
        sheet.setFrozenRows(1);

        // Ajustar larguras
        sheet.setColumnWidth(1, 150); // Timestamp
        sheet.setColumnWidth(2, 100); // Nº RNC
        sheet.setColumnWidth(3, 200); // Usuário
        sheet.setColumnWidth(4, 120); // Seção
        sheet.setColumnWidth(5, 180); // Campo
        sheet.setColumnWidth(6, 200); // Valor Anterior
        sheet.setColumnWidth(7, 200); // Valor Novo
        sheet.setColumnWidth(8, 120); // Tipo
      }

      var timestamp = new Date();
      var tipoAlteracao = determinarTipoAlteracao(fieldName, oldValue, newValue);

      // Adicionar nova linha
      sheet.appendRow([
        timestamp,
        rncNumber,
        userEmail,
        section,
        fieldName,
        oldValue || '(vazio)',
        newValue || '(vazio)',
        tipoAlteracao
      ]);

      Logger.logInfo('HISTORICO_REGISTRADO', {
        rncNumber: rncNumber,
        campo: fieldName,
        usuario: userEmail,
        tipo: tipoAlteracao
      });

      return true;

    } catch (error) {
      Logger.logError('registrarAlteracao', error, {
        rncNumber: rncNumber,
        campo: fieldName
      });
      return false;
    }
  }

  /**
   * Registra múltiplas alterações de uma vez
   * @param {string} rncNumber - Número da RNC
   * @param {object} modifiedFields - Objeto com campos modificados
   * @param {string} userEmail - Email do usuário
   */
  function registrarAlteracoes(rncNumber, modifiedFields, userEmail) {
    try {
      var registrados = 0;

      Object.keys(modifiedFields).forEach(function(fieldName) {
        var change = modifiedFields[fieldName];
        var success = registrarAlteracao(
          rncNumber,
          fieldName,
          change.old,
          change.new,
          change.section,
          userEmail
        );

        if (success) registrados++;
      });

      Logger.logInfo('HISTORICO_BATCH_REGISTRADO', {
        rncNumber: rncNumber,
        totalCampos: Object.keys(modifiedFields).length,
        registrados: registrados
      });

      return {
        success: true,
        registrados: registrados
      };

    } catch (error) {
      Logger.logError('registrarAlteracoes', error, {
        rncNumber: rncNumber
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca histórico de uma RNC específica
   * @param {string} rncNumber - Número da RNC
   * @returns {Array} Array de alterações
   */
  function getHistoricoRnc(rncNumber) {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      var sheet = ss.getSheetByName('Historico');

      if (!sheet) {
        Logger.logWarning('getHistoricoRnc_NO_SHEET', { rncNumber: rncNumber });
        return [];
      }

      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var historico = [];

      // Índices das colunas
      var colRnc = headers.indexOf('Nº RNC');
      var colTimestamp = headers.indexOf('Timestamp');
      var colUsuario = headers.indexOf('Usuário');
      var colSecao = headers.indexOf('Seção');
      var colCampo = headers.indexOf('Campo');
      var colAnterior = headers.indexOf('Valor Anterior');
      var colNovo = headers.indexOf('Valor Novo');
      var colTipo = headers.indexOf('Tipo Alteração');

      Logger.logInfo('getHistoricoRnc_DEBUG', {
        rncNumber: rncNumber,
        totalRows: data.length - 1,
        colRncIndex: colRnc,
        headers: headers
      });

      // Filtrar por RNC e ordenar por data (mais recente primeiro)
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var rowRnc = row[colRnc];

        // Debug: Log comparação
        if (i <= 5) {  // Log apenas primeiras 5 linhas
          Logger.logInfo('getHistoricoRnc_ROW_CHECK', {
            row: i,
            rowRnc: rowRnc,
            rncNumber: rncNumber,
            match: rowRnc === rncNumber,
            rowRncType: typeof rowRnc,
            rncNumberType: typeof rncNumber
          });
        }

        if (String(rowRnc).trim() === String(rncNumber).trim()) {
          historico.push({
            timestamp: row[colTimestamp],
            usuario: row[colUsuario],
            secao: row[colSecao],
            campo: row[colCampo],
            valorAnterior: row[colAnterior],
            valorNovo: row[colNovo],
            tipo: row[colTipo]
          });
        }
      }

      // Ordenar por data (mais recente primeiro)
      historico.sort(function(a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      Logger.logInfo('HISTORICO_RECUPERADO', {
        rncNumber: rncNumber,
        totalAlteracoes: historico.length
      });

      return historico;

    } catch (error) {
      Logger.logError('getHistoricoRnc', error, {
        rncNumber: rncNumber
      });
      return [];
    }
  }

  /**
   * Determina o tipo de alteração baseado no campo
   */
  function determinarTipoAlteracao(fieldName, oldValue, newValue) {
    if (!oldValue || oldValue === '(vazio)') {
      return 'Criação';
    }

    if (!newValue || newValue === '(vazio)') {
      return 'Remoção';
    }

    if (fieldName.toLowerCase().includes('status')) {
      return 'Mudança Status';
    }

    if (fieldName.toLowerCase().includes('anexo') || fieldName.toLowerCase().includes('arquivo')) {
      return 'Arquivo';
    }

    return 'Edição';
  }

  /**
   * Registra criação de RNC
   */
  function registrarCriacao(rncNumber, userEmail, dadosIniciais) {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      var sheet = ss.getSheetByName('Historico');

      if (!sheet) {
        registrarAlteracao(rncNumber, 'Sistema', '', '', 'Sistema', userEmail);
        sheet = ss.getSheetByName('Historico');
      }

      var timestamp = new Date();

      sheet.appendRow([
        timestamp,
        rncNumber,
        userEmail,
        'Sistema',
        'RNC Criada',
        '',
        'RNC criada com sucesso',
        'Criação'
      ]);

      Logger.logInfo('HISTORICO_CRIACAO', {
        rncNumber: rncNumber,
        usuario: userEmail
      });

      return true;

    } catch (error) {
      Logger.logError('registrarCriacao', error, {
        rncNumber: rncNumber
      });
      return false;
    }
  }

  /**
   * Registra anexo adicionado/removido
   */
  function registrarAnexo(rncNumber, fileName, acao, userEmail) {
    try {
      var valorAnterior = acao === 'adicionar' ? '' : fileName;
      var valorNovo = acao === 'adicionar' ? fileName : '';

      return registrarAlteracao(
        rncNumber,
        'Anexo',
        valorAnterior,
        valorNovo,
        'Anexos',
        userEmail
      );

    } catch (error) {
      Logger.logError('registrarAnexo', error, {
        rncNumber: rncNumber,
        arquivo: fileName
      });
      return false;
    }
  }

  // Interface pública
  return {
    registrarAlteracao: registrarAlteracao,
    registrarAlteracoes: registrarAlteracoes,
    registrarCriacao: registrarCriacao,
    registrarAnexo: registrarAnexo,
    getHistoricoRnc: getHistoricoRnc
  };

})();
