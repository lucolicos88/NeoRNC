/**
 * ============================================
 * 14.NOTIFICATIONMANAGER.GS - Sistema de Notificações
 * Sistema RNC Neoformula - Deploy 66
 * ============================================
 *
 * Gerencia envio de notificações por email para usuários
 * baseado no setor da RNC.
 */

var NotificationManager = (function() {
  'use strict';

  /**
   * Obtém usuários de um setor específico
   * @param {string} setor - Nome do setor
   * @return {Array} Lista de emails de usuários do setor
   */
  function getUsersBySetor(setor) {
    try {
      Logger.logDebug('getUsersBySetor_START', { setor: setor });

      if (!setor || setor.trim() === '') {
        return [];
      }

      var permissions = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Setor': setor,
        'Ativo': 'Sim'
      });

      var emails = [];

      for (var i = 0; i < permissions.length; i++) {
        var email = permissions[i]['Email'];
        if (email && emails.indexOf(email) === -1) {
          emails.push(email);
        }
      }

      Logger.logInfo('getUsersBySetor_SUCCESS', {
        setor: setor,
        usersCount: emails.length
      });

      return emails;

    } catch (error) {
      Logger.logError('getUsersBySetor_ERROR', error, { setor: setor });
      return [];
    }
  }

  /**
   * Obtém todos os administradores do sistema
   * @return {Array} Lista de emails de administradores
   */
  function getAdminUsers() {
    try {
      var admins = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Role': 'Admin',
        'Ativo': 'Sim'
      });

      var emails = [];

      for (var i = 0; i < admins.length; i++) {
        var email = admins[i]['Email'];
        if (email && emails.indexOf(email) === -1) {
          emails.push(email);
        }
      }

      Logger.logDebug('getAdminUsers_SUCCESS', { count: emails.length });
      return emails;

    } catch (error) {
      Logger.logError('getAdminUsers_ERROR', error);
      return [];
    }
  }

  /**
   * Monta o link para visualizar uma RNC específica
   * @param {string} rncNumber - Número da RNC
   * @return {string} URL completa para a RNC
   */
  function getRncLink(rncNumber) {
    try {
      var scriptUrl = ScriptApp.getService().getUrl();
      return scriptUrl + '?rnc=' + encodeURIComponent(rncNumber);
    } catch (error) {
      Logger.logError('getRncLink_ERROR', error);
      return 'Link indisponível';
    }
  }

  /**
   * Envia email de notificação
   * @param {Array} recipients - Lista de emails destinatários
   * @param {string} subject - Assunto do email
   * @param {string} body - Corpo do email
   * @private
   */
  function sendEmail(recipients, subject, body) {
    try {
      if (!recipients || recipients.length === 0) {
        Logger.logWarning('sendEmail_NO_RECIPIENTS', { subject: subject });
        return { success: false, message: 'Nenhum destinatário' };
      }

      Logger.logInfo('sendEmail_START', {
        recipientsCount: recipients.length,
        subject: subject
      });

      // Enviar email para cada destinatário
      var successCount = 0;
      var failCount = 0;

      for (var i = 0; i < recipients.length; i++) {
        try {
          MailApp.sendEmail({
            to: recipients[i],
            subject: subject,
            body: body,
            noReply: true
          });
          successCount++;
        } catch (emailError) {
          Logger.logError('sendEmail_INDIVIDUAL_ERROR', emailError, {
            recipient: recipients[i]
          });
          failCount++;
        }
      }

      Logger.logInfo('sendEmail_SUCCESS', {
        successCount: successCount,
        failCount: failCount
      });

      return {
        success: true,
        successCount: successCount,
        failCount: failCount
      };

    } catch (error) {
      Logger.logError('sendEmail_ERROR', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Notifica usuários sobre criação de nova RNC
   * Deploy 67: Notifica setor de ABERTURA + Admins
   * @param {string} rncNumber - Número da RNC criada
   * @param {Object} rncData - Dados da RNC
   * @return {Object} Resultado da notificação
   */
  function notifyRncCreated(rncNumber, rncData) {
    try {
      Logger.logInfo('notifyRncCreated_START', { rncNumber: rncNumber });

      // Deploy 67: Obter setor onde foi feita a ABERTURA
      var setorAbertura = rncData['Setor onde foi feita abertura'] || '';

      if (!setorAbertura || setorAbertura.trim() === '') {
        Logger.logWarning('notifyRncCreated_NO_SETOR', { rncNumber: rncNumber });
        return { success: false, message: 'Setor de abertura não definido' };
      }

      // Obter usuários do setor de abertura
      var recipients = getUsersBySetor(setorAbertura);

      // Incluir admins
      var admins = getAdminUsers();
      admins.forEach(function(admin) {
        if (recipients.indexOf(admin) === -1) {
          recipients.push(admin);
        }
      });

      if (recipients.length === 0) {
        Logger.logWarning('notifyRncCreated_NO_USERS', {
          rncNumber: rncNumber,
          setor: setorAbertura
        });
        return { success: false, message: 'Nenhum usuário no setor' };
      }

      // Montar email
      var subject = '[RNC] Nova RNC Criada - ' + rncNumber;
      var link = getRncLink(rncNumber);

      var setorNaoConformidade = rncData['Setor onde ocorreu a não conformidade'] || 'N/A';

      var body = 'Uma nova RNC foi criada e necessita de atenção.\n\n';
      body += '=== DADOS DA RNC ===\n';
      body += 'Número: ' + rncNumber + '\n';
      body += 'Setor de Abertura: ' + setorAbertura + '\n';
      body += 'Setor da Não Conformidade: ' + setorNaoConformidade + '\n';
      body += 'Status: ' + (rncData['Status Geral'] || 'Abertura RNC') + '\n';
      body += 'Responsável: ' + (rncData['Responsável pela abertura da RNC'] || 'N/A') + '\n';
      body += 'Cliente: ' + (rncData['Nome do Cliente'] || 'N/A') + '\n';
      body += 'Tipo: ' + (rncData['Tipo RNC'] || 'N/A') + '\n';
      body += 'Data de Abertura: ' + (rncData['Data de Abertura'] || 'N/A') + '\n\n';
      body += 'Descrição:\n' + (rncData['Descrição Detalhada da RNC/Reclamação'] || 'N/A') + '\n\n';
      body += '=== ACESSO ===\n';
      body += 'Visualizar RNC: ' + link + '\n\n';
      body += '---\n';
      body += 'Sistema RNC Neoformula v' + CONFIG.VERSION + '\n';
      body += 'Esta é uma mensagem automática. Não responda este email.';

      // Enviar email
      var result = sendEmail(recipients, subject, body);

      Logger.logInfo('notifyRncCreated_SUCCESS', {
        rncNumber: rncNumber,
        setorAbertura: setorAbertura,
        recipientsCount: recipients.length,
        emailsSent: result.successCount
      });

      return result;

    } catch (error) {
      Logger.logError('notifyRncCreated_ERROR', error, { rncNumber: rncNumber });
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Notifica usuários sobre atualização de RNC
   * @param {string} rncNumber - Número da RNC
   * @param {Object} changes - Alterações realizadas
   * @param {string} userEmail - Email do usuário que fez a alteração
   * @return {Object} Resultado da notificação
   */
  function notifyRncUpdated(rncNumber, changes, userEmail) {
    try {
      Logger.logInfo('notifyRncUpdated_START', {
        rncNumber: rncNumber,
        changesCount: Object.keys(changes).length
      });

      // Buscar RNC completa
      var rnc = RncOperations.getRncByNumber(rncNumber);
      if (!rnc) {
        return { success: false, message: 'RNC não encontrada' };
      }

      var setor = rnc['Setor onde ocorreu a não conformidade'] || '';

      if (!setor || setor.trim() === '') {
        Logger.logWarning('notifyRncUpdated_NO_SETOR', { rncNumber: rncNumber });
        return { success: false, message: 'Setor não definido' };
      }

      // Obter usuários do setor
      var recipients = getUsersBySetor(setor);

      // Incluir admins
      var admins = getAdminUsers();
      admins.forEach(function(admin) {
        if (recipients.indexOf(admin) === -1) {
          recipients.push(admin);
        }
      });

      // Remover o próprio usuário que fez a alteração
      recipients = recipients.filter(function(email) {
        return email !== userEmail;
      });

      if (recipients.length === 0) {
        Logger.logDebug('notifyRncUpdated_NO_OTHER_USERS', {
          rncNumber: rncNumber
        });
        return { success: false, message: 'Nenhum outro usuário para notificar' };
      }

      // Montar email
      var subject = '[RNC] Atualização - ' + rncNumber;
      var link = getRncLink(rncNumber);

      var body = 'A RNC ' + rncNumber + ' foi atualizada.\n\n';
      body += '=== DADOS DA RNC ===\n';
      body += 'Número: ' + rncNumber + '\n';
      body += 'Setor: ' + setor + '\n';
      body += 'Status Atual: ' + (rnc['Status Geral'] || 'N/A') + '\n';
      body += 'Alterado por: ' + userEmail + '\n\n';

      body += '=== ALTERAÇÕES REALIZADAS ===\n';
      var changeCount = 0;
      for (var field in changes) {
        if (changes.hasOwnProperty(field)) {
          var change = changes[field];
          body += '• ' + field + ':\n';
          body += '  Anterior: ' + (change.old || '(vazio)') + '\n';
          body += '  Novo: ' + (change.new || '(vazio)') + '\n';
          changeCount++;
        }
      }

      body += '\n=== ACESSO ===\n';
      body += 'Visualizar RNC: ' + link + '\n\n';
      body += '---\n';
      body += 'Sistema RNC Neoformula v' + CONFIG.VERSION + '\n';
      body += 'Esta é uma mensagem automática. Não responda este email.';

      // Enviar email
      var result = sendEmail(recipients, subject, body);

      Logger.logInfo('notifyRncUpdated_SUCCESS', {
        rncNumber: rncNumber,
        changeCount: changeCount,
        recipientsCount: recipients.length,
        emailsSent: result.successCount
      });

      return result;

    } catch (error) {
      Logger.logError('notifyRncUpdated_ERROR', error, { rncNumber: rncNumber });
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Notifica usuários sobre mudança de status da RNC
   * Deploy 67: Notifica setor ABERTURA + setor NÃO CONFORMIDADE + Admins
   * @param {string} rncNumber - Número da RNC
   * @param {string} oldStatus - Status anterior
   * @param {string} newStatus - Novo status
   * @param {string} userEmail - Email do usuário que alterou
   * @return {Object} Resultado da notificação
   */
  function notifyStatusChanged(rncNumber, oldStatus, newStatus, userEmail) {
    try {
      Logger.logInfo('notifyStatusChanged_START', {
        rncNumber: rncNumber,
        oldStatus: oldStatus,
        newStatus: newStatus
      });

      // Buscar RNC completa
      var rnc = RncOperations.getRncByNumber(rncNumber);
      if (!rnc) {
        return { success: false, message: 'RNC não encontrada' };
      }

      // Deploy 67: Obter AMBOS os setores
      var setorAbertura = rnc['Setor onde foi feita abertura'] || '';
      var setorNaoConformidade = rnc['Setor onde ocorreu a não conformidade'] || '';

      var recipients = [];

      // Adicionar usuários do setor de abertura
      if (setorAbertura && setorAbertura.trim() !== '') {
        var usersAbertura = getUsersBySetor(setorAbertura);
        usersAbertura.forEach(function(email) {
          if (recipients.indexOf(email) === -1) {
            recipients.push(email);
          }
        });
      }

      // Adicionar usuários do setor da não conformidade
      if (setorNaoConformidade && setorNaoConformidade.trim() !== '') {
        var usersNaoConf = getUsersBySetor(setorNaoConformidade);
        usersNaoConf.forEach(function(email) {
          if (recipients.indexOf(email) === -1) {
            recipients.push(email);
          }
        });
      }

      // Incluir admins
      var admins = getAdminUsers();
      admins.forEach(function(admin) {
        if (recipients.indexOf(admin) === -1) {
          recipients.push(admin);
        }
      });

      // Remover o próprio usuário que fez a alteração
      recipients = recipients.filter(function(email) {
        return email !== userEmail;
      });

      if (recipients.length === 0) {
        Logger.logDebug('notifyStatusChanged_NO_OTHER_USERS', {
          rncNumber: rncNumber
        });
        return { success: false, message: 'Nenhum outro usuário para notificar' };
      }

      // Montar email
      var subject = '[RNC] Mudança de Status - ' + rncNumber + ' → ' + newStatus;
      var link = getRncLink(rncNumber);

      var body = 'O status da RNC ' + rncNumber + ' foi alterado.\n\n';
      body += '=== MUDANÇA DE STATUS ===\n';
      body += 'Status Anterior: ' + oldStatus + '\n';
      body += 'Novo Status: ' + newStatus + '\n';
      body += 'Alterado por: ' + userEmail + '\n\n';

      body += '=== DADOS DA RNC ===\n';
      body += 'Número: ' + rncNumber + '\n';
      body += 'Setor de Abertura: ' + (setorAbertura || 'N/A') + '\n';
      body += 'Setor da Não Conformidade: ' + (setorNaoConformidade || 'N/A') + '\n';
      body += 'Cliente: ' + (rnc['Nome do Cliente'] || 'N/A') + '\n';
      body += 'Tipo: ' + (rnc['Tipo RNC'] || 'N/A') + '\n\n';

      // Adicionar informações específicas do novo status
      if (newStatus === 'Finalizada') {
        body += '✅ Esta RNC foi FINALIZADA.\n\n';
      } else if (newStatus === 'Análise Qualidade') {
        body += '⚠️ Esta RNC está aguardando ANÁLISE DE QUALIDADE.\n\n';
      } else if (newStatus === 'Análise do problema e Ação Corretiva') {
        body += '🔧 Esta RNC está aguardando AÇÃO CORRETIVA.\n\n';
      }

      body += '=== ACESSO ===\n';
      body += 'Visualizar RNC: ' + link + '\n\n';
      body += '---\n';
      body += 'Sistema RNC Neoformula v' + CONFIG.VERSION + '\n';
      body += 'Esta é uma mensagem automática. Não responda este email.';

      // Enviar email
      var result = sendEmail(recipients, subject, body);

      Logger.logInfo('notifyStatusChanged_SUCCESS', {
        rncNumber: rncNumber,
        oldStatus: oldStatus,
        newStatus: newStatus,
        setorAbertura: setorAbertura,
        setorNaoConformidade: setorNaoConformidade,
        recipientsCount: recipients.length,
        emailsSent: result.successCount
      });

      return result;

    } catch (error) {
      Logger.logError('notifyStatusChanged_ERROR', error, { rncNumber: rncNumber });
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  // API Pública
  return {
    getUsersBySetor: getUsersBySetor,
    getAdminUsers: getAdminUsers,
    getRncLink: getRncLink,
    notifyRncCreated: notifyRncCreated,
    notifyRncUpdated: notifyRncUpdated,
    notifyStatusChanged: notifyStatusChanged
  };
})();
