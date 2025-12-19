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
   * Deploy 72.5: Link corrigido - abre sistema e navega para RNC
   * @param {string} rncNumber - Número da RNC
   * @return {string} URL completa para a RNC
   */
  function getRncLink(rncNumber) {
    try {
      var scriptUrl = ScriptApp.getService().getUrl();
      // Link abre o sistema diretamente na RNC específica
      return scriptUrl + '#rnc=' + encodeURIComponent(rncNumber);
    } catch (error) {
      Logger.logError('getRncLink_ERROR', error);
      return 'Link indisponível';
    }
  }

  /**
   * Cria template HTML base para emails
   * Deploy 72.5: Email profissional com logo
   * @param {string} title - Título do email
   * @param {string} content - Conteúdo HTML
   * @return {string} HTML completo do email
   */
  function createEmailTemplate(title, content) {
    var logoUrl = 'https://neoformula.com.br/cdn/shop/files/Logotipo-NeoFormula-Manipulacao-Homeopatia_76b2fa98-5ffa-4cc3-ac0a-6d41e1bc8810.png?height=200&v=1677088468';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #009688 0%, #00796B 100%); color: white; padding: 30px; text-align: center; }
        .header img { max-width: 200px; height: auto; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .info-box { background: #f8f9fa; border-left: 4px solid #009688; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box h3 { margin-top: 0; color: #009688; font-size: 16px; }
        .info-row { margin: 8px 0; }
        .info-label { font-weight: bold; color: #555; }
        .info-value { color: #333; }
        .btn { display: inline-block; background: #009688; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 500; }
        .btn:hover { background: #00796B; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .alert-success { background: #e8f5e9; border-left-color: #4CAF50; }
        .alert-warning { background: #fff8e1; border-left-color: #FFC107; }
        .alert-info { background: #e3f2fd; border-left-color: #2196F3; }
        .change-item { background: white; border: 1px solid #e0e0e0; padding: 12px; margin: 10px 0; border-radius: 4px; }
        .change-field { font-weight: bold; color: #009688; margin-bottom: 5px; }
        .change-old { color: #F44336; text-decoration: line-through; }
        .change-new { color: #4CAF50; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="Neoformula Logo">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Sistema RNC Neoformula</strong> - Elaborado por: TI Neoformula</p>
            <p>Esta é uma mensagem automática. Não responda este email.</p>
            <p style="margin-top: 10px; color: #999;">© ${new Date().getFullYear()} Neoformula. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Formata valor para exibição no email (datas em DD/MM/YYYY)
   * Deploy 72.8: Formatar datas automaticamente
   * @param {*} value - Valor a formatar
   * @return {string} Valor formatado
   */
  function formatValueForEmail(value) {
    if (!value || value === '(vazio)') return value || '(vazio)';

    var strValue = String(value);

    // Detectar e formatar datas no formato YYYY-MM-DD ou ISO
    if (strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return formatDateBR(value);
      } catch (e) {
        return strValue;
      }
    }

    return strValue;
  }

  /**
   * Envia email de notificação
   * Deploy 72.5: Usa nome "Sistema de RNC" e HTML
   * @param {Array} recipients - Lista de emails destinatários
   * @param {string} subject - Assunto do email
   * @param {string} htmlBody - Corpo do email em HTML
   * @param {string} rncNumber - Número da RNC (para histórico)
   * @private
   */
  function sendEmail(recipients, subject, htmlBody, rncNumber) {
    try {
      if (!recipients || recipients.length === 0) {
        Logger.logWarning('sendEmail_NO_RECIPIENTS', { subject: subject });
        return { success: false, message: 'Nenhum destinatário' };
      }

      Logger.logInfo('sendEmail_START', {
        recipientsCount: recipients.length,
        subject: subject,
        rncNumber: rncNumber
      });

      // Enviar email para cada destinatário
      var successCount = 0;
      var failCount = 0;
      var sentTo = [];

      for (var i = 0; i < recipients.length; i++) {
        try {
          // Deploy 72.7.3: Usar nome personalizado "Sistema de RNC"
          MailApp.sendEmail({
            to: recipients[i],
            subject: subject,
            htmlBody: htmlBody,
            name: 'Sistema de RNC'
          });
          successCount++;
          sentTo.push(recipients[i]);
        } catch (emailError) {
          Logger.logError('sendEmail_INDIVIDUAL_ERROR', emailError, {
            recipient: recipients[i]
          });
          failCount++;
        }
      }

      // Deploy 72.7.5: Registrar no histórico da RNC com todos os destinatários
      if (rncNumber && successCount > 0) {
        try {
          HistoricoManager.registrarAlteracao(
            rncNumber,
            'Email enviado para ' + sentTo.join(', '),
            '',
            subject,
            'Notificações',
            'Sistema'
          );
        } catch (histError) {
          Logger.logError('sendEmail_HISTORICO_ERROR', histError, {
            rncNumber: rncNumber
          });
          // Não falhar o envio se histórico falhar
        }
      }

      // Deploy 72.7.4: Log completo com todos os destinatários
      Logger.logInfo('sendEmail_RECIPIENTS_LOG', {
        rncNumber: rncNumber,
        assunto: subject,
        totalDestinatarios: sentTo.length,
        destinatarios: sentTo,
        timestamp: new Date().toISOString()
      });

      Logger.logInfo('sendEmail_SUCCESS', {
        successCount: successCount,
        failCount: failCount,
        rncNumber: rncNumber
      });

      return {
        success: true,
        successCount: successCount,
        failCount: failCount,
        sentTo: sentTo
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

      // Deploy 72.5: Montar email HTML profissional
      var subject = '[RNC] Nova RNC Criada - ' + rncNumber;
      var link = getRncLink(rncNumber);
      var setorNaoConformidade = rncData['Setor onde ocorreu a não conformidade'] || 'N/A';

      // Obter link de anexos se existir
      var linkAnexos = rncData['Anexo de Documentos'] || rncData['Link Anexos'] || '';

      // Deploy 72.7.3: Debug - Log campos de data disponíveis
      Logger.logInfo('notifyRncCreated_DATA_DEBUG', {
        rncNumber: rncNumber,
        'Data de Abertura': rncData['Data de Abertura'],
        'Data': rncData['Data'],
        'Data Criação': rncData['Data Criação'],
        'Todas as chaves': Object.keys(rncData).filter(function(k) { return k.toLowerCase().includes('data'); })
      });

      var content = `
        <p style="font-size: 16px; color: #555;">Uma nova RNC foi criada e necessita de atenção.</p>

        <div class="info-box">
          <h3>📋 Dados da Abertura</h3>
          <div class="info-row"><span class="info-label">Número:</span> <span class="info-value" style="font-size: 18px; font-weight: bold; color: #009688;">${rncNumber}</span></div>
          <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${rncData['Status Geral'] || 'Abertura RNC'}</span></div>
          <div class="info-row"><span class="info-label">Setor de Abertura:</span> <span class="info-value">${setorAbertura}</span></div>
          <div class="info-row"><span class="info-label">Responsável pela Abertura:</span> <span class="info-value">${rncData['Responsável pela abertura da RNC'] || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Data da Abertura:</span> <span class="info-value">${rncData['Data de Abertura'] || rncData['Data'] || rncData['Data Criação'] || formatDateBR(new Date()) || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Tipo da RNC:</span> <span class="info-value">${rncData['Tipo da RNC'] || 'N/A'}</span></div>
          ${linkAnexos ? `<div class="info-row"><span class="info-label">Link dos Anexos:</span> <span class="info-value"><a href="${linkAnexos}" style="color: #009688; text-decoration: underline;" target="_blank">Acessar Anexos</a></span></div>` : ''}
        </div>

        ${rncData['Descrição Detalhada da RNC/Reclamação'] ? `
        <div class="info-box alert-info">
          <h3>📝 Descrição da RNC</h3>
          <p style="margin: 0; white-space: pre-wrap;">${rncData['Descrição Detalhada da RNC/Reclamação']}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="btn">🔍 Visualizar RNC no Sistema</a>
        </div>

        <p style="font-size: 13px; color: #999; text-align: center; margin-top: 20px;">
          Clique no botão acima para acessar o sistema e visualizar todos os detalhes da RNC.
        </p>
      `;

      var htmlBody = createEmailTemplate('📋 Nova RNC Criada', content);

      // Deploy 72.5: Enviar email HTML com registro no histórico
      var result = sendEmail(recipients, subject, htmlBody, rncNumber);

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

      // Deploy 72.8: Montar email HTML profissional com datas formatadas
      var subject = '[RNC] Atualização - ' + rncNumber;
      var link = getRncLink(rncNumber);

      // Montar lista de alterações em HTML com datas formatadas
      var changesHtml = '';
      var changeCount = 0;
      for (var field in changes) {
        if (changes.hasOwnProperty(field)) {
          var change = changes[field];
          var oldValueFormatted = formatValueForEmail(change.old);
          var newValueFormatted = formatValueForEmail(change.new);

          changesHtml += `
            <div class="change-item">
              <div class="change-field">📌 ${field}</div>
              <div style="margin-top: 8px;">
                <div class="change-old">Anterior: ${oldValueFormatted}</div>
                <div class="change-new">✓ Novo: ${newValueFormatted}</div>
              </div>
            </div>
          `;
          changeCount++;
        }
      }

      var content = `
        <p style="font-size: 16px; color: #555;">A RNC <strong>${rncNumber}</strong> foi atualizada.</p>

        <div class="info-box">
          <h3>📋 Dados da RNC</h3>
          <div class="info-row"><span class="info-label">Número:</span> <span class="info-value" style="font-size: 18px; font-weight: bold; color: #009688;">${rncNumber}</span></div>
          <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${rnc['Status Geral'] || 'N/A'}</span></div>
        </div>

        <div class="info-box alert-info">
          <h3>✏️ Alterações Realizadas (${changeCount})</h3>
          ${changesHtml}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="btn">🔍 Visualizar RNC no Sistema</a>
        </div>

        <p style="font-size: 13px; color: #999; text-align: center; margin-top: 20px;">
          Clique no botão acima para acessar o sistema e visualizar todos os detalhes da RNC.
        </p>
      `;

      var htmlBody = createEmailTemplate('✏️ RNC Atualizada', content);

      // Deploy 72.5: Enviar email HTML com registro no histórico
      var result = sendEmail(recipients, subject, htmlBody, rncNumber);

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

      // Deploy 72.5: Montar email HTML profissional
      var subject = '[RNC] Mudança de Status - ' + rncNumber + ' → ' + newStatus;
      var link = getRncLink(rncNumber);

      // Determinar classe de alerta e mensagem baseado no status
      var statusAlert = '';
      var statusClass = 'alert-info';
      var statusIcon = '🔄';

      if (newStatus === 'Finalizada') {
        statusClass = 'alert-success';
        statusIcon = '✅';
        statusAlert = '<p style="font-size: 15px; font-weight: 500; color: #4CAF50; margin: 15px 0;">Esta RNC foi FINALIZADA com sucesso!</p>';
      } else if (newStatus === 'Análise Qualidade') {
        statusClass = 'alert-warning';
        statusIcon = '⚠️';
        statusAlert = '<p style="font-size: 15px; font-weight: 500; color: #FF9800; margin: 15px 0;">Esta RNC está aguardando ANÁLISE DE QUALIDADE.</p>';
      } else if (newStatus === 'Análise do problema e Ação Corretiva') {
        statusClass = 'alert-info';
        statusIcon = '🔧';
        statusAlert = '<p style="font-size: 15px; font-weight: 500; color: #2196F3; margin: 15px 0;">Esta RNC está aguardando AÇÃO CORRETIVA.</p>';
      }

      var content = `
        <p style="font-size: 16px; color: #555;">O status da RNC <strong>${rncNumber}</strong> foi alterado.</p>

        <div class="info-box ${statusClass}">
          <h3>${statusIcon} Mudança de Status</h3>
          <div class="change-item" style="background: white;">
            <div class="change-old">Status Anterior: ${oldStatus}</div>
            <div class="change-new" style="font-size: 16px; margin-top: 10px;">✓ Novo Status: ${newStatus}</div>
          </div>
          <div style="margin-top: 15px; font-size: 13px; color: #666;">
            <strong>Alterado por:</strong> ${userEmail}
          </div>
          ${statusAlert}
        </div>

        <div class="info-box">
          <h3>📋 Dados da RNC</h3>
          <div class="info-row"><span class="info-label">Número:</span> <span class="info-value" style="font-size: 18px; font-weight: bold; color: #009688;">${rncNumber}</span></div>
          <div class="info-row"><span class="info-label">Setor de Abertura:</span> <span class="info-value">${setorAbertura || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Setor da Não Conformidade:</span> <span class="info-value">${setorNaoConformidade || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Cliente:</span> <span class="info-value">${rnc['Nome do Cliente'] || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Tipo:</span> <span class="info-value">${rnc['Tipo RNC'] || 'N/A'}</span></div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="btn">🔍 Visualizar RNC no Sistema</a>
        </div>

        <p style="font-size: 13px; color: #999; text-align: center; margin-top: 20px;">
          Clique no botão acima para acessar o sistema e visualizar todos os detalhes da RNC.
        </p>
      `;

      var htmlBody = createEmailTemplate('🔄 Status Alterado', content);

      // Deploy 72.5: Enviar email HTML com registro no histórico
      var result = sendEmail(recipients, subject, htmlBody, rncNumber);

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

  /**
   * Reenvio manual de notificação para uma RNC
   * Deploy 72.5: Permite reenvio manual em caso de falha
   * @param {string} rncNumber - Número da RNC
   * @param {string} notificationType - Tipo: 'created', 'updated', 'statusChanged'
   * @param {Array} additionalRecipients - Emails adicionais (opcional)
   * @return {Object} Resultado do envio
   */
  function manualNotify(rncNumber, notificationType, additionalRecipients) {
    try {
      Logger.logInfo('manualNotify_START', {
        rncNumber: rncNumber,
        type: notificationType
      });

      // Buscar RNC
      var rnc = RncOperations.getRncByNumber(rncNumber);
      if (!rnc) {
        return {
          success: false,
          message: 'RNC não encontrada: ' + rncNumber
        };
      }

      var result;

      switch (notificationType) {
        case 'created':
          result = notifyRncCreated(rncNumber, rnc);
          break;

        case 'statusChanged':
          // Para status changed, usar status atual
          result = notifyStatusChanged(
            rncNumber,
            'Status anterior',
            rnc['Status Geral'] || 'Abertura RNC',
            'Sistema (envio manual)'
          );
          break;

        case 'updated':
          // Para updated, criar um resumo genérico
          result = notifyRncUpdated(
            rncNumber,
            { 'Informação': { old: '', new: 'Notificação manual reenviada' } },
            'Sistema (envio manual)'
          );
          break;

        default:
          return {
            success: false,
            message: 'Tipo de notificação inválido: ' + notificationType
          };
      }

      // Se forneceu emails adicionais, enviar também para eles
      if (additionalRecipients && additionalRecipients.length > 0) {
        var subject = '[RNC] Notificação Manual - ' + rncNumber;
        var link = getRncLink(rncNumber);

        var content = `
          <p style="font-size: 16px; color: #555;">Você recebeu uma notificação manual sobre a RNC <strong>${rncNumber}</strong>.</p>

          <div class="info-box">
            <h3>📋 Dados da RNC</h3>
            <div class="info-row"><span class="info-label">Número:</span> <span class="info-value" style="font-size: 18px; font-weight: bold; color: #009688;">${rncNumber}</span></div>
            <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${rnc['Status Geral'] || 'Abertura RNC'}</span></div>
            <div class="info-row"><span class="info-label">Cliente:</span> <span class="info-value">${rnc['Nome do Cliente'] || 'N/A'}</span></div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" class="btn">🔍 Visualizar RNC no Sistema</a>
          </div>
        `;

        var htmlBody = createEmailTemplate('📧 Notificação Manual', content);
        sendEmail(additionalRecipients, subject, htmlBody, rncNumber);
      }

      Logger.logInfo('manualNotify_SUCCESS', {
        rncNumber: rncNumber,
        type: notificationType,
        emailsSent: result.successCount
      });

      return result;

    } catch (error) {
      Logger.logError('manualNotify_ERROR', error, {
        rncNumber: rncNumber,
        type: notificationType
      });
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
    notifyStatusChanged: notifyStatusChanged,
    manualNotify: manualNotify
  };
})();
