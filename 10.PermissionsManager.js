/**
 * ============================================
 * 10.PERMISSIONSMANAGER.GS - Gerenciamento de Permissões
 * Sistema RNC Neoformula - Deploy 32
 * ============================================
 */

var PermissionsManager = (function() {
  
  /**
   * Define o mapa de permissões por role
   * @private
   */
  var PERMISSIONS_MAP = {
    'Admin': {
      'Abertura': 'editar',
      'Qualidade': 'editar',
      'Liderança': 'editar'
    },
    'Abertura': {
      'Abertura': 'editar',
      'Qualidade': 'visualizar',
      'Liderança': 'visualizar'
    },
    'Qualidade': {
      'Abertura': 'visualizar',
      'Qualidade': 'editar',
      'Liderança': 'visualizar'
    },
    'Liderança': {
      'Abertura': 'visualizar',
      'Qualidade': 'visualizar',
      'Liderança': 'editar'
    },
    'Espectador': {
      'Abertura': 'visualizar',
      'Qualidade': 'visualizar',
      'Liderança': 'visualizar'
    }
  };
  
  /**
   * Obtém todas as roles de um usuário
   * @param {string} email - Email do usuário
   * @return {Array} Lista de roles
   */
  function getUserRoles(email) {
    try {
      Logger.logDebug('getUserRoles', { email: email });

      var permissions = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Email': email,
        'Ativo': 'Sim'
      });

      var roles = [];

      // Coletar todas as roles do usuário
      for (var i = 0; i < permissions.length; i++) {
        var role = permissions[i]['Role'];
        if (role && roles.indexOf(role) === -1) {
          roles.push(role);
        }
      }

      // TASK-003: Remover admin hardcoded (vulnerabilidade CRÍTICO-03)
      // Se não tem permissões na tabela, retornar Espectador
      // Admins devem ser gerenciados APENAS através da tabela de permissões
      if (roles.length === 0) {
        roles.push('Espectador');
      }

      Logger.logDebug('getUserRoles_SUCCESS', {
        email: email,
        roles: roles.join(', '),
        count: roles.length
      });

      return roles;

    } catch (error) {
      Logger.logError('getUserRoles_ERROR', error, { email: email });
      return ['Espectador']; // Fallback seguro
    }
  }

  /**
   * Deploy 66: Obtém o setor de um usuário
   * @param {string} email - Email do usuário
   * @return {string} Setor do usuário ou null
   */
  function getUserSetor(email) {
    try {
      Logger.logDebug('getUserSetor', { email: email });

      var permissions = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Email': email,
        'Ativo': 'Sim'
      });

      // Retornar o primeiro setor encontrado
      for (var i = 0; i < permissions.length; i++) {
        var setor = permissions[i]['Setor'];
        if (setor && setor.trim() !== '') {
          Logger.logDebug('getUserSetor_SUCCESS', {
            email: email,
            setor: setor
          });
          return setor.trim();
        }
      }

      Logger.logDebug('getUserSetor_NOT_FOUND', { email: email });
      return null;

    } catch (error) {
      Logger.logError('getUserSetor_ERROR', error, { email: email });
      return null;
    }
  }
  
  /**
   * Verifica se usuário tem role Admin
   * @param {Array} roles - Lista de roles do usuário
   * @return {boolean} True se é admin
   */
  function isAdmin(roles) {
    return roles.indexOf('Admin') !== -1;
  }
  
  /**
   * Obtém permissões consolidadas do usuário
   * Deploy 66: Agora inclui setor do usuário
   * @param {string} email - Email do usuário
   * @return {Object} Objeto com roles, permissões e setor
   */
  function getUserPermissions(email) {
    try {
      Logger.logInfo('getUserPermissions_START', { email: email });

      var roles = getUserRoles(email);
      var setor = getUserSetor(email); // Deploy 66: Obter setor
      var permissions = {};

      // Se é Admin, pode editar tudo
      if (isAdmin(roles)) {
        permissions = {
          'Abertura': 'editar',
          'Qualidade': 'editar',
          'Liderança': 'editar'
        };
      } else {
        // Consolidar permissões de todas as roles
        // Prioridade: editar > visualizar > negar

        roles.forEach(function(role) {
          var rolePermissions = PERMISSIONS_MAP[role] || {};

          Object.keys(rolePermissions).forEach(function(secao) {
            var permissao = rolePermissions[secao];

            // Se já tem "editar", não sobrescrever
            if (permissions[secao] === 'editar') {
              return;
            }

            // Se tem "visualizar" e a nova é "editar", sobrescrever
            if (permissions[secao] === 'visualizar' && permissao === 'editar') {
              permissions[secao] = permissao;
              return;
            }

            // Se não tem nada, definir
            if (!permissions[secao]) {
              permissions[secao] = permissao;
            }
          });
        });
      }

      var result = {
        roles: roles,
        permissions: permissions,
        isAdmin: isAdmin(roles),
        setor: setor // Deploy 66: Incluir setor
      };

      Logger.logInfo('getUserPermissions_SUCCESS', {
        email: email,
        roles: roles.join(', '),
        isAdmin: result.isAdmin,
        setor: setor || 'Nenhum',
        sections: Object.keys(permissions).length
      });

      return result;

    } catch (error) {
      Logger.logError('getUserPermissions_ERROR', error, { email: email });

      // Retornar permissões mínimas em caso de erro
      return {
        roles: ['Espectador'],
        permissions: {
          'Abertura': 'visualizar',
          'Qualidade': 'visualizar',
          'Liderança': 'visualizar'
        },
        isAdmin: false,
        setor: null // Deploy 66
      };
    }
  }
  
  /**
   * Verifica se usuário pode editar uma seção específica
   * @param {string} email - Email do usuário
   * @param {string} secao - Nome da seção
   * @return {boolean} True se pode editar
   */
  function canEditSection(email, secao) {
    try {
      var userPerms = getUserPermissions(email);
      
      // Admin pode tudo
      if (userPerms.isAdmin) {
        return true;
      }
      
      // Verificar permissão específica da seção
      var permissao = userPerms.permissions[secao];
      
      return permissao === 'editar';
      
    } catch (error) {
      Logger.logError('canEditSection_ERROR', error, { email: email, secao: secao });
      return false;
    }
  }
  
  /**
   * Valida se usuário pode salvar dados de uma seção
   * @param {string} email - Email do usuário
   * @param {string} secao - Nome da seção
   * @return {Object} Resultado da validação
   */
  function checkPermissionToSave(email, secao) {
    try {
      Logger.logDebug('checkPermissionToSave', { 
        email: email, 
        secao: secao 
      });
      
      var canEdit = canEditSection(email, secao);
      
      if (!canEdit) {
        Logger.logWarning('PERMISSION_DENIED', {
          email: email,
          secao: secao,
          action: 'save'
        });
        
        return {
          allowed: false,
          message: `Você não tem permissão para editar a seção "${secao}"`
        };
      }
      
      return {
        allowed: true,
        message: 'Permissão concedida'
      };
      
    } catch (error) {
      Logger.logError('checkPermissionToSave_ERROR', error);
      return {
        allowed: false,
        message: 'Erro ao verificar permissões'
      };
    }
  }
  
  /**
   * Adiciona uma role a um usuário
   * Deploy 67: Agora aceita setor opcional
   * @param {string} email - Email do usuário
   * @param {string} role - Role a adicionar
   * @param {string} setor - Setor do usuário (opcional)
   * @return {Object} Resultado da operação
   */
  function addUserRole(email, role, setor) {
    try {
      Logger.logInfo('addUserRole_START', { email: email, role: role, setor: setor });

      // Validar role
      var validRoles = ['Admin', 'Abertura', 'Qualidade', 'Liderança', 'Espectador'];
      if (validRoles.indexOf(role) === -1) {
        return {
          success: false,
          message: 'Role inválida: ' + role
        };
      }

      // Verificar se já existe
      var existing = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Email': email,
        'Role': role,
        'Ativo': 'Sim'
      });

      if (existing.length > 0) {
        return {
          success: false,
          message: 'Usuário já possui esta role'
        };
      }

      // Deploy 67: Incluir setor na inserção
      var newPermission = {
        'Email': email,
        'Role': role,
        'Ativo': 'Sim'
      };

      // Adicionar setor se fornecido
      if (setor && setor.trim() !== '') {
        newPermission['Setor'] = setor.trim();
      }

      // Adicionar nova role
      Database.insertData(CONFIG.SHEETS.PERMISSOES, newPermission);

      Logger.logInfo('addUserRole_SUCCESS', { email: email, role: role, setor: setor });

      return {
        success: true,
        message: 'Role adicionada com sucesso'
      };

    } catch (error) {
      Logger.logError('addUserRole_ERROR', error, { email: email, role: role });
      return {
        success: false,
        message: 'Erro ao adicionar role: ' + error.toString()
      };
    }
  }
  
  /**
   * Remove uma role de um usuário
   * @param {string} email - Email do usuário
   * @param {string} role - Role a remover
   * @return {Object} Resultado da operação
   */
  function removeUserRole(email, role) {
    try {
      Logger.logInfo('removeUserRole_START', { email: email, role: role });
      
      // Não permitir remover última role Admin se for o único admin
      if (role === 'Admin') {
        var allAdmins = Database.findData(CONFIG.SHEETS.PERMISSOES, {
          'Role': 'Admin',
          'Ativo': 'Sim'
        });
        
        if (allAdmins.length === 1 && allAdmins[0]['Email'] === email) {
          return {
            success: false,
            message: 'Não é possível remover o último Admin do sistema'
          };
        }
      }
      
      // Remover role (desativar)
      var result = Database.updateData(
        CONFIG.SHEETS.PERMISSOES,
        {
          'Email': email,
          'Role': role
        },
        {
          'Ativo': 'Não'
        }
      );
      
      Logger.logInfo('removeUserRole_SUCCESS', { email: email, role: role });
      
      return {
        success: true,
        message: 'Role removida com sucesso'
      };
      
    } catch (error) {
      Logger.logError('removeUserRole_ERROR', error, { email: email, role: role });
      return {
        success: false,
        message: 'Erro ao remover role: ' + error.toString()
      };
    }
  }
  
  /**
   * Deploy 67: Atualiza o setor de todas as permissões de um usuário
   * @param {string} email - Email do usuário
   * @param {string} novoSetor - Novo setor para o usuário
   * @return {Object} Resultado da operação
   */
  function updateUserSetor(email, novoSetor) {
    try {
      Logger.logInfo('updateUserSetor_START', { email: email, novoSetor: novoSetor });

      if (!email || !novoSetor) {
        return {
          success: false,
          message: 'Email e setor são obrigatórios'
        };
      }

      // Buscar todas as permissões ativas do usuário
      var permissions = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Email': email,
        'Ativo': 'Sim'
      });

      if (permissions.length === 0) {
        return {
          success: false,
          message: 'Nenhuma permissão encontrada para o usuário'
        };
      }

      // Atualizar setor em todas as permissões
      var updateCount = 0;
      for (var i = 0; i < permissions.length; i++) {
        var result = Database.updateData(
          CONFIG.SHEETS.PERMISSOES,
          {
            'Email': email,
            'Role': permissions[i]['Role'],
            'Ativo': 'Sim'
          },
          {
            'Setor': novoSetor.trim()
          }
        );
        if (result.success) {
          updateCount++;
        }
      }

      Logger.logInfo('updateUserSetor_SUCCESS', {
        email: email,
        novoSetor: novoSetor,
        updatedCount: updateCount
      });

      return {
        success: true,
        message: 'Setor atualizado em ' + updateCount + ' permissão(ões)'
      };

    } catch (error) {
      Logger.logError('updateUserSetor_ERROR', error, { email: email, novoSetor: novoSetor });
      return {
        success: false,
        message: 'Erro ao atualizar setor: ' + error.toString()
      };
    }
  }

  /**
   * Lista todos os usuários com suas roles
   * @return {Array} Lista de usuários
   */
  function getAllUsers() {
    try {
      Logger.logDebug('getAllUsers_START');

      var permissions = Database.findData(CONFIG.SHEETS.PERMISSOES, {
        'Ativo': 'Sim'
      });

      // Agrupar roles por email
      var usersMap = {};

      permissions.forEach(function(perm) {
        var email = perm['Email'];
        var role = perm['Role'];

        if (!usersMap[email]) {
          usersMap[email] = {
            email: email,
            roles: []
          };
        }

        if (usersMap[email].roles.indexOf(role) === -1) {
          usersMap[email].roles.push(role);
        }
      });

      // Converter para array
      var users = Object.keys(usersMap).map(function(email) {
        return usersMap[email];
      });

      Logger.logDebug('getAllUsers_SUCCESS', { count: users.length });

      return users;

    } catch (error) {
      Logger.logError('getAllUsers_ERROR', error);
      return [];
    }
  }

  // API Pública
  return {
    getUserRoles: getUserRoles,
    getUserSetor: getUserSetor, // Deploy 66
    getUserPermissions: getUserPermissions,
    canEditSection: canEditSection,
    checkPermissionToSave: checkPermissionToSave,
    addUserRole: addUserRole,
    removeUserRole: removeUserRole,
    updateUserSetor: updateUserSetor, // Deploy 67
    getAllUsers: getAllUsers,
    isAdmin: isAdmin
  };
})();