/**
 * ============================================
 * 10.PERMISSIONSMANAGER.GS - Gerenciamento de Permissões
 * Sistema RNC Neoformula - Deploy 32
 * ============================================
 *
 * @namespace PermissionsManager
 * @description Módulo responsável pelo gerenciamento completo de permissões de usuários.
 * Controla roles, setores e permissões de acesso às seções do sistema RNC.
 * @since Deploy 32
 */

var PermissionsManager = (function() {

  /**
   * Define o mapa de permissões por role, controlando o nível de acesso
   * de cada tipo de usuário às diferentes seções do sistema.
   *
   * @type {Object.<string, Object.<string, string>>}
   * @private
   * @constant
   * @since Deploy 32
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
   * Obtém todas as roles ativas de um usuário consultando a planilha de permissões.
   * Retorna 'Espectador' como fallback caso não haja permissões cadastradas.
   *
   * @param {string} email - Email do usuário a ser consultado
   * @return {Array.<string>} Lista de roles atribuídas ao usuário
   *
   * @example
   * var roles = getUserRoles('usuario@exemplo.com');
   * // Returns: ['Abertura', 'Qualidade']
   *
   * @memberof PermissionsManager
   * @private
   * @since Deploy 32
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
   * Obtém o setor associado ao usuário consultando a planilha de permissões.
   * Retorna o primeiro setor encontrado nas permissões ativas do usuário.
   *
   * @param {string} email - Email do usuário a ser consultado
   * @return {string|null} Nome do setor do usuário ou null se não encontrado
   *
   * @example
   * var setor = getUserSetor('usuario@exemplo.com');
   * // Returns: 'Produção' ou null
   *
   * @memberof PermissionsManager
   * @private
   * @since Deploy 66
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
   * Verifica se o usuário possui a role de administrador do sistema.
   * Utilizada internamente para determinar permissões totais de edição.
   *
   * @param {Array.<string>} roles - Lista de roles do usuário a verificar
   * @return {boolean} true se possui role Admin, false caso contrário
   *
   * @example
   * var ehAdmin = isAdmin(['Abertura', 'Admin']);
   * // Returns: true
   *
   * @memberof PermissionsManager
   * @since Deploy 32
   */
  function isAdmin(roles) {
    return roles.indexOf('Admin') !== -1;
  }
  
  /**
   * Obtém permissões consolidadas do usuário incluindo roles, permissões por seção e setor.
   * Consolida múltiplas roles com prioridade: editar > visualizar > negar.
   *
   * @param {string} email - Email do usuário a ser consultado
   * @return {Object} Objeto com propriedades:
   *   - roles {Array.<string>} - Lista de roles do usuário
   *   - permissions {Object.<string, string>} - Mapa de permissões por seção
   *   - isAdmin {boolean} - Indica se é administrador
   *   - setor {string|null} - Setor do usuário
   *
   * @example
   * var perms = getUserPermissions('usuario@exemplo.com');
   * // Returns: {
   * //   roles: ['Abertura'],
   * //   permissions: { 'Abertura': 'editar', 'Qualidade': 'visualizar', 'Liderança': 'visualizar' },
   * //   isAdmin: false,
   * //   setor: 'Produção'
   * // }
   *
   * @memberof PermissionsManager
   * @since Deploy 32
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
   * Verifica se o usuário possui permissão para editar uma seção específica do sistema.
   * Administradores sempre têm permissão de edição em todas as seções.
   *
   * @param {string} email - Email do usuário a verificar
   * @param {string} secao - Nome da seção a verificar ('Abertura', 'Qualidade', 'Liderança')
   * @return {boolean} true se pode editar, false caso contrário
   *
   * @example
   * var canEdit = canEditSection('usuario@exemplo.com', 'Abertura');
   * // Returns: true ou false
   *
   * @memberof PermissionsManager
   * @since Deploy 32
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
   * Valida se o usuário possui permissão para salvar dados em uma seção específica.
   * Retorna objeto com resultado da validação e mensagem explicativa.
   *
   * @param {string} email - Email do usuário a validar
   * @param {string} secao - Nome da seção a validar
   * @return {Object} Objeto com propriedades:
   *   - allowed {boolean} - Indica se a ação é permitida
   *   - message {string} - Mensagem explicativa do resultado
   *
   * @example
   * var result = checkPermissionToSave('usuario@exemplo.com', 'Qualidade');
   * // Returns: { allowed: true, message: 'Permissão concedida' }
   *
   * @memberof PermissionsManager
   * @since Deploy 32
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
   * Adiciona uma nova role a um usuário na planilha de permissões.
   * Valida se a role é válida e se o usuário já não possui essa role.
   *
   * @param {string} email - Email do usuário a receber a role
   * @param {string} role - Role a adicionar (Admin, Abertura, Qualidade, Liderança, Espectador)
   * @param {string} [setor] - Setor do usuário (opcional)
   * @return {Object} Objeto com propriedades:
   *   - success {boolean} - Indica se a operação foi bem-sucedida
   *   - message {string} - Mensagem descritiva do resultado
   *
   * @example
   * var result = addUserRole('usuario@exemplo.com', 'Qualidade', 'Produção');
   * // Returns: { success: true, message: 'Role adicionada com sucesso' }
   *
   * @memberof PermissionsManager
   * @since Deploy 67
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
   * Remove uma role de um usuário marcando-a como inativa na planilha de permissões.
   * Impede a remoção do último administrador do sistema por segurança.
   *
   * @param {string} email - Email do usuário a ter role removida
   * @param {string} role - Role a remover
   * @return {Object} Objeto com propriedades:
   *   - success {boolean} - Indica se a operação foi bem-sucedida
   *   - message {string} - Mensagem descritiva do resultado
   *
   * @example
   * var result = removeUserRole('usuario@exemplo.com', 'Espectador');
   * // Returns: { success: true, message: 'Role removida com sucesso' }
   *
   * @memberof PermissionsManager
   * @since Deploy 32
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
   * Atualiza o setor de todas as permissões ativas de um usuário.
   * Aplica a mudança em todos os registros de permissão do usuário simultaneamente.
   *
   * @param {string} email - Email do usuário a ter setor atualizado
   * @param {string} novoSetor - Novo setor a ser atribuído
   * @return {Object} Objeto com propriedades:
   *   - success {boolean} - Indica se a operação foi bem-sucedida
   *   - message {string} - Mensagem descritiva do resultado
   *
   * @example
   * var result = updateUserSetor('usuario@exemplo.com', 'Logística');
   * // Returns: { success: true, message: 'Setor atualizado em 2 permissão(ões)' }
   *
   * @memberof PermissionsManager
   * @since Deploy 67
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
   * Lista todos os usuários ativos do sistema com suas respectivas roles e setores.
   * Agrupa múltiplas roles de um mesmo usuário em um único objeto.
   *
   * @return {Array.<Object>} Lista de objetos de usuário, cada um com propriedades:
   *   - email {string} - Email do usuário
   *   - roles {Array.<string>} - Lista de roles do usuário
   *   - setor {string} - Setor do usuário
   *
   * @example
   * var usuarios = getAllUsers();
   * // Returns: [
   * //   { email: 'user1@exemplo.com', roles: ['Admin'], setor: 'TI' },
   * //   { email: 'user2@exemplo.com', roles: ['Abertura', 'Qualidade'], setor: 'Produção' }
   * // ]
   *
   * @memberof PermissionsManager
   * @since Deploy 71
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
        var setor = perm['Setor'] || '';

        if (!usersMap[email]) {
          usersMap[email] = {
            email: email,
            roles: [],
            setor: setor  // Deploy 71: Incluir setor
          };
        }

        if (usersMap[email].roles.indexOf(role) === -1) {
          usersMap[email].roles.push(role);
        }

        // Deploy 71: Atualizar setor se ainda não estiver definido
        if (!usersMap[email].setor && setor) {
          usersMap[email].setor = setor;
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

  /**
   * API Pública do PermissionsManager
   * Expõe métodos para gerenciamento de permissões, roles e setores de usuários.
   *
   * @public
   * @since Deploy 32
   */
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