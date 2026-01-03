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

/**
 * @namespace HistoricoManager
 * @description Sistema de auditoria e rastreamento de alterações em RNCs.
 * Gerencia histórico completo com timeline, usuários, campos modificados e tipos de alteração.
 *
 * @since Deploy 34
 */
var HistoricoManager = (function() {

  /**
   * Registra uma alteração individual de campo no histórico da RNC.
   * Cria automaticamente a aba 'Historico' se não existir e adiciona registro completo
   * incluindo timestamp, usuário, seção, campo, valores anterior/novo e tipo de alteração.
   *
   * @param {string} rncNumber - Número identificador da RNC (ex: "RNC-2025-001")
   * @param {string} fieldName - Nome do campo que foi alterado (ex: "Descrição", "Status")
   * @param {string} oldValue - Valor anterior do campo antes da alteração
   * @param {string} newValue - Novo valor do campo após a alteração
   * @param {string} section - Seção onde o campo está localizado (ex: "Dados Básicos", "Análise")
   * @param {string} userEmail - Email do usuário que realizou a alteração
   * @return {boolean} true se registrou com sucesso, false em caso de erro
   *
   * @example
   * var success = registrarAlteracao('RNC-2025-001', 'Status', 'Aberta', 'Em Análise', 'Dados Básicos', 'user@email.com');
   * // Returns: true
   *
   * @since Deploy 120
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
   * Registra múltiplas alterações de campos em lote (batch) no histórico da RNC.
   * Processa um objeto com múltiplos campos modificados e registra cada alteração individualmente,
   * retornando estatísticas de sucesso e total de campos registrados.
   *
   * @param {string} rncNumber - Número identificador da RNC (ex: "RNC-2025-001")
   * @param {Object} modifiedFields - Objeto contendo campos modificados com estrutura {fieldName: {old: valor, new: valor, section: seção}}
   * @param {string} userEmail - Email do usuário que realizou as alterações
   * @return {Object} Objeto com {success: boolean, registrados: number, error?: string}
   *
   * @example
   * var changes = {
   *   'Status': {old: 'Aberta', new: 'Em Análise', section: 'Dados Básicos'},
   *   'Responsável': {old: 'João', new: 'Maria', section: 'Análise'}
   * };
   * var result = registrarAlteracoes('RNC-2025-001', changes, 'user@email.com');
   * // Returns: {success: true, registrados: 2}
   *
   * @since Deploy 120
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
   * Recupera todo o histórico de alterações de uma RNC específica ordenado cronologicamente.
   * Busca na aba 'Historico' todas as alterações relacionadas ao número da RNC informado,
   * retornando array com timestamp, usuário, seção, campo, valores e tipo de cada alteração.
   *
   * @param {string} rncNumber - Número identificador da RNC para buscar histórico (ex: "RNC-2025-001")
   * @return {Array<Object>} Array de objetos com {timestamp, usuario, secao, campo, valorAnterior, valorNovo, tipo}, ordenado do mais recente ao mais antigo
   *
   * @example
   * var historico = getHistoricoRnc('RNC-2025-001');
   * // Returns: [{timestamp: '2025-01-02T10:30:00.000Z', usuario: 'user@email.com', secao: 'Dados Básicos', campo: 'Status', valorAnterior: 'Aberta', valorNovo: 'Em Análise', tipo: 'Mudança Status'}]
   *
   * @since Deploy 120
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
          // ✅ Converter Date para string para evitar problemas de serialização
          var timestampStr = row[colTimestamp];
          if (timestampStr instanceof Date) {
            timestampStr = timestampStr.toISOString();
          }

          historico.push({
            timestamp: timestampStr,
            usuario: String(row[colUsuario] || ''),
            secao: String(row[colSecao] || ''),
            campo: String(row[colCampo] || ''),
            valorAnterior: String(row[colAnterior] || ''),
            valorNovo: String(row[colNovo] || ''),
            tipo: String(row[colTipo] || '')
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
   * Determina automaticamente o tipo de alteração baseado no contexto do campo e valores.
   * Analisa nome do campo e valores anterior/novo para classificar como Criação, Remoção,
   * Mudança Status, Arquivo ou Edição, facilitando filtros e visualizações do histórico.
   *
   * @param {string} fieldName - Nome do campo alterado para análise contextual
   * @param {string} oldValue - Valor anterior do campo (vazio indica criação)
   * @param {string} newValue - Novo valor do campo (vazio indica remoção)
   * @return {string} Tipo da alteração: 'Criação', 'Remoção', 'Mudança Status', 'Arquivo' ou 'Edição'
   *
   * @example
   * var tipo = determinarTipoAlteracao('Status', 'Aberta', 'Fechada');
   * // Returns: 'Mudança Status'
   *
   * @since Deploy 120
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
   * Registra o evento de criação inicial de uma nova RNC no histórico.
   * Cria entrada especial marcando o momento de criação da RNC, incluindo usuário criador
   * e timestamp, servindo como primeiro registro na timeline de auditoria.
   *
   * @param {string} rncNumber - Número identificador da RNC recém-criada (ex: "RNC-2025-001")
   * @param {string} userEmail - Email do usuário que criou a RNC
   * @param {Object} dadosIniciais - Objeto com dados iniciais da RNC (opcional, não utilizado atualmente)
   * @return {boolean} true se registrou com sucesso, false em caso de erro
   *
   * @example
   * var success = registrarCriacao('RNC-2025-001', 'user@email.com', {});
   * // Returns: true
   *
   * @since Deploy 120
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
   * Registra adição ou remoção de arquivo anexo no histórico da RNC.
   * Cria registro específico para operações com anexos, diferenciando entre upload e exclusão
   * de arquivos, registrando nome do arquivo e usuário responsável pela ação.
   *
   * @param {string} rncNumber - Número identificador da RNC (ex: "RNC-2025-001")
   * @param {string} fileName - Nome do arquivo anexado ou removido
   * @param {string} acao - Tipo de ação realizada: 'adicionar' ou 'remover'
   * @param {string} userEmail - Email do usuário que realizou a operação com o anexo
   * @return {boolean} true se registrou com sucesso, false em caso de erro
   *
   * @example
   * var success = registrarAnexo('RNC-2025-001', 'documento.pdf', 'adicionar', 'user@email.com');
   * // Returns: true
   *
   * @since Deploy 120
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
