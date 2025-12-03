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

const HistoricoManager = (function() {

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
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      let sheet = ss.getSheetByName('Historico');

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

      const timestamp = new Date();
      const tipoAlteracao = determinarTipoAlteracao(fieldName, oldValue, newValue);

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
      let registrados = 0;

      Object.keys(modifiedFields).forEach(function(fieldName) {
        const change = modifiedFields[fieldName];
        const success = registrarAlteracao(
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
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = ss.getSheetByName('Historico');

      if (!sheet) {
        return [];
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const historico = [];

      // Índices das colunas
      const colRnc = headers.indexOf('Nº RNC');
      const colTimestamp = headers.indexOf('Timestamp');
      const colUsuario = headers.indexOf('Usuário');
      const colSecao = headers.indexOf('Seção');
      const colCampo = headers.indexOf('Campo');
      const colAnterior = headers.indexOf('Valor Anterior');
      const colNovo = headers.indexOf('Valor Novo');
      const colTipo = headers.indexOf('Tipo Alteração');

      // Filtrar por RNC e ordenar por data (mais recente primeiro)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        if (row[colRnc] === rncNumber) {
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
      historico.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      let sheet = ss.getSheetByName('Historico');

      if (!sheet) {
        registrarAlteracao(rncNumber, 'Sistema', '', '', 'Sistema', userEmail);
        sheet = ss.getSheetByName('Historico');
      }

      const timestamp = new Date();

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
      const valorAnterior = acao === 'adicionar' ? '' : fileName;
      const valorNovo = acao === 'adicionar' ? fileName : '';

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
