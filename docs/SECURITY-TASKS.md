# 🔧 Tasks de Segurança e Melhoria - Sistema RNC

**Baseado em**: SECURITY-AUDIT.md
**Target**: Ambiente DEV (@104)
**Status PROD**: 🔒 Bloqueado - Manter versão @103 estável

---

## 🎯 FASE 1 - CRÍTICO (Sprint Atual)

### TASK-001: [P0] Implementar Sanitização HTML Universal
**Prioridade**: 🔴 CRÍTICA
**Categoria**: Segurança - XSS Prevention
**Estimativa**: 4 horas
**Ambiente**: DEV

**Descrição Técnica**:
Criar função utilitária `sanitizeHTML()` que remove/escapa elementos perigosos antes de inserir via `innerHTML`.

**Arquivos Afetados**:
- `index.html` (criar novo módulo Utils)

**Implementação**:
```javascript
// Adicionar no início do <script> de index.html

/**
 * Sanitiza HTML removendo scripts e atributos perigosos
 * @param {string} html - HTML bruto
 * @return {string} HTML sanitizado
 */
function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html; // Força escape automático
    return temp.innerHTML;
}

/**
 * Sanitiza HTML permitindo tags seguras
 * @param {string} html - HTML bruto
 * @param {Array} allowedTags - Tags permitidas (ex: ['b', 'i', 'strong'])
 * @return {string} HTML sanitizado
 */
function sanitizeHTMLWithTags(html, allowedTags = []) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove scripts
    temp.querySelectorAll('script').forEach(el => el.remove());

    // Remove event handlers
    temp.querySelectorAll('*').forEach(el => {
        // Remove atributos on*
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });

        // Remove tags não permitidas
        if (allowedTags.length > 0 && !allowedTags.includes(el.tagName.toLowerCase())) {
            el.replaceWith(...el.childNodes);
        }
    });

    return temp.innerHTML;
}

/**
 * Escapa HTML para uso em atributos
 * @param {string} text
 * @return {string}
 */
function escapeHTMLAttr(text) {
    const map = {
        '"': '&quot;',
        "'": '&#39;',
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    };
    return String(text).replace(/["'<>&]/g, m => map[m]);
}
```

**Pontos de Aplicação** (substituir nos locais):
1. Linha 3096: `container.innerHTML = sectionHtml;`
   - Substituir por: `container.innerHTML = sanitizeHTMLWithTags(sectionHtml, ['div', 'h3', 'label', 'input', 'select', 'textarea']);`

2. Linha 3469: Template de arquivos
   ```javascript
   fileList.innerHTML = selectedFiles.map((file, index) => `
       <div class="file-item">
           <span>${sanitizeHTML(file.name)}</span>
           <button onclick="removeFile(${index})">×</button>
       </div>
   `).join('');
   ```

3. Linha 4167: Opções de select
   ```javascript
   select.innerHTML = '<option value="">Selecione uma RNC...</option>' +
       options.map(opt => `<option value="${escapeHTMLAttr(opt.value)}">${sanitizeHTML(opt.label)}</option>`).join('');
   ```

**Critério de Aceitação**:
- [x] Função sanitizeHTML criada e testada
- [x] 15+ pontos de innerHTML corrigidos
- [x] Teste manual: inserir `<script>alert('XSS')</script>` em nome de arquivo
- [x] Teste manual: inserir `<img src=x onerror=alert('XSS')>` em campos de texto
- [x] Nenhum script malicioso deve executar

**Impacto Funcional**: ⚠️ ZERO - Apenas muda sanitização interna
**Risco de Regressão**: 🟡 BAIXO - Pode quebrar HTML legítimo se mal implementado
**Rollback**: Reverter commit único

---

### TASK-002: [P0] Remover Exposição de Emails no Frontend
**Prioridade**: 🔴 CRÍTICA
**Categoria**: Segurança - Information Disclosure
**Estimativa**: 2 horas
**Ambiente**: DEV

**Descrição Técnica**:
Remover lista de emails autorizados da tela de login e buscar de configuração server-side.

**Arquivos Afetados**:
- `08.Code.js` (linhas 169-174)
- `01.Config.js` (adicionar nova config)

**Implementação**:

**Passo 1**: Remover HTML com emails
```javascript
// 08.Code.js, substituir linhas 169-174:

// ❌ REMOVER:
<div class="users-list">
  <strong>📧 Contas Autorizadas:</strong>
  <div class="user-item">📧 varejo.neoformula@gmail.com</div>
  <div class="user-item">📧 lucolicos@gmail.com</div>
  <div class="user-item">📧 producao.neoformula@gmail.com</div>
</div>

// ✅ SUBSTITUIR POR:
<div class="alert" style="background: #e3f2fd; border-color: #2196f3; border-left-color: #2196f3; color: #1565c0;">
  <strong>ℹ️ Acesso Restrito</strong>
  Este sistema é restrito a usuários autorizados da Neoformula.<br>
  Se você não consegue acessar, entre em contato com o administrador do sistema.
</div>
```

**Passo 2**: Validação server-side
```javascript
// 01.Config.js - Adicionar ao CONFIG:
AUTHORIZED_DOMAINS: ['neoformula.com', 'gmail.com'], // Domínios permitidos
```

**Critério de Aceitação**:
- [x] Emails removidos do HTML
- [x] Mensagem genérica mantém usabilidade
- [x] Teste: abrir em modo anônimo, não deve ver emails
- [x] Validação server-side continua funcionando

**Impacto Funcional**: ⚠️ ZERO - Apenas remove informação visual
**Risco de Regressão**: 🟢 NENHUM
**Rollback**: Reverter commit

---

### TASK-003: [P0] Remover Admin Hardcoded
**Prioridade**: 🔴 CRÍTICA
**Categoria**: Segurança - Access Control
**Estimativa**: 1 hora
**Ambiente**: DEV

**Descrição Técnica**:
Remover verificação hardcoded de admin no código e depender exclusivamente da planilha de permissões.

**Arquivos Afetados**:
- `10.PermissionsManager.js` (linhas 68-72)

**Implementação**:
```javascript
// 10.PermissionsManager.js, linhas 66-74

// ❌ REMOVER ESTE BLOCO:
// Se não tem permissões, retornar Espectador
if (roles.length === 0) {
  // Verificar se é o email do admin padrão
  if (email === 'producao.neoformula@gmail.com') {
    roles.push('Admin');
  } else {
    roles.push('Espectador');
  }
}

// ✅ SUBSTITUIR POR:
// Se não tem permissões, retornar Espectador
if (roles.length === 0) {
  roles.push('Espectador');
  Logger.logWarning('Usuario sem permissoes definidas', { email: email });
}
```

**Passo Adicional**: Garantir que admin existe na planilha
```javascript
// Adicionar ao 08.Code.js no doGet(), após autenticação bem-sucedida:

// Garantir que pelo menos um admin existe
var allAdmins = Database.findData(CONFIG.SHEETS.PERMISSOES, {
  'Role': 'Admin',
  'Ativo': 'Sim'
});

if (allAdmins.length === 0) {
  Logger.logCritical('NENHUM_ADMIN_DEFINIDO', 'Sistema sem administradores!');
  // Opcional: criar admin automático pela primeira vez
  // Database.insertData(CONFIG.SHEETS.PERMISSOES, {
  //   'Email': 'producao.neoformula@gmail.com',
  //   'Role': 'Admin',
  //   'Ativo': 'Sim'
  // });
}
```

**Critério de Aceitação**:
- [x] Hardcode removido
- [x] Teste: remover producao.neoformula@ da planilha, não deve ter acesso admin
- [x] Teste: adicionar na planilha, deve ganhar acesso
- [x] Log de warning quando usuário sem permissões acessa

**Impacto Funcional**: ⚠️ MÍNIMO - Requer admin estar na planilha
**Risco de Regressão**: 🟡 MÉDIO - Pode trancar admin se planilha estiver vazia
**Rollback**: Reverter commit + verificar planilha de permissões

---

### TASK-004: [P1] Migrar innerHTML para textContent
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança - XSS Prevention
**Estimativa**: 3 horas
**Ambiente**: DEV

**Descrição Técnica**:
Identificar todos os usos de `innerHTML` onde apenas texto é necessário e migrar para `textContent`.

**Arquivos Afetados**:
- `index.html` (múltiplas linhas)

**Análise de Pontos**:
```javascript
// ✅ MANTER innerHTML (necessário HTML):
container.innerHTML = '<div class="alert">...</div>'; // Template com tags

// ❌ TROCAR para textContent (apenas texto):
element.innerHTML = userName; // Nome de usuário
cell.innerHTML = rncNumber; // Número de RNC
span.innerHTML = statusText; // Status
```

**Pontos Identificados para Mudança**:

1. **Contadores** (podem ser texto):
```javascript
// Linha 3505 - TROCAR:
counter.innerHTML = `<span class="counter-badge">📎 ${count}</span>`;
// POR:
counter.textContent = `📎 ${count}`;
// E adicionar classe .counter-badge via classList
```

2. **Células de tabela com dados simples**:
```javascript
// Onde houver células assim:
cell.innerHTML = data.valor;
// TROCAR POR:
cell.textContent = data.valor;
```

**Implementação Sistema de Decisão**:
```javascript
/**
 * Define se deve usar innerHTML ou textContent
 * @param {HTMLElement} element
 * @param {string} content
 * @param {boolean} allowHTML - Se true, permite HTML
 */
function setElementContent(element, content, allowHTML = false) {
    if (allowHTML) {
        element.innerHTML = sanitizeHTML(content);
    } else {
        element.textContent = content;
    }
}
```

**Pontos para Revisão Manual**:
- Linha 2828: debugLogs (pode ter HTML de verdade)
- Linha 4001: container RNC list (tem estrutura)
- Linha 4071: Select options (precisa de tags option)

**Critério de Aceitação**:
- [x] Mapeamento completo: innerHTML vs textContent
- [x] 10+ conversões realizadas
- [x] Teste: inserir `<b>teste</b>` em campo de texto, deve aparecer literalmente
- [x] Teste: UI ainda renderiza corretamente

**Impacto Funcional**: ⚠️ BAIXO - Pode quebrar formatação se mal identificado
**Risco de Regressão**: 🟡 MÉDIO - Precisa testar cada mudança
**Rollback**: Reverter commit

---

### TASK-005: [P1] Adicionar Content Security Policy
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança - Defense in Depth
**Estimativa**: 2 horas
**Ambiente**: DEV

**Descrição Técnica**:
Adicionar meta tag CSP restringindo fontes de scripts, estilos e recursos.

**Arquivos Afetados**:
- `index.html` (head)
- `08.Code.js` (adicionar header HTTP se possível via HtmlService)

**Implementação**:

**Passo 1**: Análise de Recursos Externos
```
✅ Permitidos (CDNs necessários):
- https://cdn.jsdelivr.net (Chart.js)
- https://cdnjs.cloudflare.com (jsPDF)
- https://fonts.googleapis.com (Google Fonts)
- https://fonts.gstatic.com (Google Fonts assets)

❌ Bloquear:
- Inline scripts perigosos
- eval()
- Recursos de origens não confiáveis
```

**Passo 2**: Meta Tag CSP
```html
<!-- Adicionar em index.html após linha 5: -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self'
        'unsafe-inline'
        https://cdn.jsdelivr.net
        https://cdnjs.cloudflare.com;
    style-src 'self'
        'unsafe-inline'
        https://fonts.googleapis.com;
    font-src 'self'
        https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
">
```

**Passo 3**: Remover 'unsafe-inline' Gradualmente (Task futura)
```javascript
// Comentário no código:
// TODO: Migrar scripts inline para arquivo externo
// TODO: Migrar estilos inline para classes
// Isso permitirá remover 'unsafe-inline' do CSP
```

**Passo 4**: Teste de CSP
```javascript
// Adicionar no início do script:
if (window.console) {
    console.log('CSP Status:', document.querySelector('meta[http-equiv="Content-Security-Policy"]') ? 'Ativo' : 'Inativo');
}
```

**Critério de Aceitação**:
- [x] CSP configurado e ativo
- [x] Console não mostra erros de CSP violation em uso normal
- [x] Chart.js carrega
- [x] jsPDF funciona
- [x] Fontes Google carregam
- [x] Teste: tentar injetar `<script>` externo, deve bloquear

**Impacto Funcional**: ⚠️ ALTO - Pode quebrar funcionalidades se mal configurado
**Risco de Regressão**: 🔴 ALTO - Testar extensivamente
**Rollback**: Remover meta tag

**Notas**:
- Manter 'unsafe-inline' por enquanto devido a scripts inline no HTML
- Fase 2: migrar para arquivo .js externo e remover unsafe-inline

---

## 🎯 FASE 2 - ALTO (Próxima Sprint)

### TASK-006: [P1] Implementar Validação de Entrada Universal
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança - Input Validation
**Estimativa**: 6 horas
**Ambiente**: DEV

**Descrição Técnica**:
Criar módulo de validação centralizado para todos os inputs do usuário.

**Arquivos Afetados**:
- Criar novo: `99.Validator.js`
- `index.html` (adicionar validações em forms)

**Implementação**:

**Passo 1**: Criar módulo Validator
```javascript
// 99.Validator.js

var Validator = (function() {
  'use strict';

  /**
   * Valida email
   * @param {string} email
   * @return {Object} {valid: boolean, error: string}
   */
  function validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return {valid: false, error: 'Email é obrigatório'};
    }

    var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) {
      return {valid: false, error: 'Email inválido'};
    }

    return {valid: true};
  }

  /**
   * Valida texto geral
   * @param {string} text
   * @param {Object} options - {required, minLength, maxLength, pattern}
   * @return {Object}
   */
  function validateText(text, options) {
    options = options || {};

    // Required
    if (options.required && (!text || text.trim() === '')) {
      return {valid: false, error: 'Campo obrigatório'};
    }

    if (!text) return {valid: true}; // Opcional e vazio

    // Min length
    if (options.minLength && text.length < options.minLength) {
      return {
        valid: false,
        error: 'Mínimo de ' + options.minLength + ' caracteres'
      };
    }

    // Max length
    if (options.maxLength && text.length > options.maxLength) {
      return {
        valid: false,
        error: 'Máximo de ' + options.maxLength + ' caracteres'
      };
    }

    // Pattern
    if (options.pattern && !options.pattern.test(text)) {
      return {
        valid: false,
        error: options.patternError || 'Formato inválido'
      };
    }

    return {valid: true};
  }

  /**
   * Valida número
   * @param {any} value
   * @param {Object} options - {required, min, max, integer}
   * @return {Object}
   */
  function validateNumber(value, options) {
    options = options || {};

    if (options.required && (value === null || value === undefined || value === '')) {
      return {valid: false, error: 'Número obrigatório'};
    }

    if (value === null || value === undefined || value === '') {
      return {valid: true}; // Opcional e vazio
    }

    var num = Number(value);

    if (isNaN(num)) {
      return {valid: false, error: 'Deve ser um número'};
    }

    if (options.integer && !Number.isInteger(num)) {
      return {valid: false, error: 'Deve ser um número inteiro'};
    }

    if (options.min !== undefined && num < options.min) {
      return {valid: false, error: 'Mínimo: ' + options.min};
    }

    if (options.max !== undefined && num > options.max) {
      return {valid: false, error: 'Máximo: ' + options.max};
    }

    return {valid: true, value: num};
  }

  /**
   * Valida data
   * @param {string} dateStr - Data em formato DD/MM/YYYY
   * @param {Object} options - {required, minDate, maxDate}
   * @return {Object}
   */
  function validateDate(dateStr, options) {
    options = options || {};

    if (options.required && !dateStr) {
      return {valid: false, error: 'Data obrigatória'};
    }

    if (!dateStr) return {valid: true};

    // Regex DD/MM/YYYY
    var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    var match = dateStr.match(regex);

    if (!match) {
      return {valid: false, error: 'Data inválida. Use DD/MM/AAAA'};
    }

    var day = parseInt(match[1]);
    var month = parseInt(match[2]);
    var year = parseInt(match[3]);

    var date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
      return {valid: false, error: 'Data inválida'};
    }

    // Min/Max date
    if (options.minDate && date < options.minDate) {
      return {valid: false, error: 'Data muito antiga'};
    }

    if (options.maxDate && date > options.maxDate) {
      return {valid: false, error: 'Data muito recente'};
    }

    return {valid: true, value: date};
  }

  /**
   * Valida objeto com múltiplos campos
   * @param {Object} data
   * @param {Object} schema - {campo: {type, ...options}}
   * @return {Object} {valid: boolean, errors: {campo: error}}
   */
  function validateObject(data, schema) {
    var errors = {};
    var valid = true;

    for (var field in schema) {
      if (!schema.hasOwnProperty(field)) continue;

      var rules = schema[field];
      var value = data[field];
      var result;

      switch (rules.type) {
        case 'email':
          result = validateEmail(value);
          break;
        case 'text':
          result = validateText(value, rules);
          break;
        case 'number':
          result = validateNumber(value, rules);
          break;
        case 'date':
          result = validateDate(value, rules);
          break;
        default:
          result = {valid: true};
      }

      if (!result.valid) {
        errors[field] = result.error;
        valid = false;
      }
    }

    return {valid: valid, errors: errors};
  }

  // API Pública
  return {
    validateEmail: validateEmail,
    validateText: validateText,
    validateNumber: validateNumber,
    validateDate: validateDate,
    validateObject: validateObject
  };
})();
```

**Passo 2**: Aplicar no Backend
```javascript
// Exemplo em 06.RncOperations.js

function createRnc(data) {
  // Validar dados
  var validation = Validator.validateObject(data, {
    'Nº RNC': {type: 'text', required: true, pattern: /^RNC-\d+$/},
    'Data Abertura': {type: 'date', required: true},
    'Cliente': {type: 'text', required: true, minLength: 3, maxLength: 100},
    'Custo': {type: 'number', min: 0}
  });

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      message: 'Dados inválidos'
    };
  }

  // Continuar com criação...
}
```

**Critério de Aceitação**:
- [x] Módulo Validator criado e testado
- [x] Validações aplicadas em createRnc, updateRnc
- [x] Teste: enviar dados inválidos, deve rejeitar
- [x] Teste: enviar dados válidos, deve aceitar
- [x] Mensagens de erro claras para usuário

**Impacto Funcional**: ⚠️ MÉDIO - Pode rejeitar dados que antes passavam
**Risco de Regressão**: 🟡 MÉDIO - Validações muito rígidas podem frustrar usuários
**Rollback**: Remover validações, manter função para uso futuro

---

### TASK-007: [P1] Corrigir Comparações de Igualdade
**Prioridade**: 🟠 ALTA
**Categoria**: Boas Práticas - Type Safety
**Estimativa**: 2 horas
**Ambiente**: DEV

**Descrição Técnica**:
Substituir todas as comparações `==` por `===` e `!=` por `!==` para evitar coerção implícita de tipos.

**Arquivos Afetados**:
- `03.Database.js` (linhas 177, 179, 197)
- Todos os arquivos `.js` do backend

**Implementação**:

**Busca e Substituição**:
```bash
# Comando para encontrar todas as ocorrências:
grep -n "==" *.js | grep -v "===" | grep -v "!=="
```

**Análise Manual**:
```javascript
// ❌ ERRADO:
if (value == compareValue) { } // Linha 177

// ✅ CORRETO:
if (value === compareValue) { }

// ❌ ERRADO:
if (role != 'Admin') { }

// ✅ CORRETO:
if (role !== 'Admin') { }

// ⚠️ ATENÇÃO - Casos válidos de ==:
if (value == null) { } // Checa null OU undefined
// Pode ser mantido ou substituir por:
if (value === null || value === undefined) { }
```

**Pontos Identificados**:

1. **03.Database.js linha 177**:
```javascript
// ANTES:
case '=':
case '==':
    return value == compareValue;

// DEPOIS:
case '=':
case '==':
    return value === compareValue;
```

2. **03.Database.js linha 179**:
```javascript
// ANTES:
case '!=':
    return value != compareValue;

// DEPOIS:
case '!=':
    return value !== compareValue;
```

3. **03.Database.js linha 197**:
```javascript
// ANTES:
default:
    return value == compareValue;

// DEPOIS:
default:
    return value === compareValue;
```

**Script de Verificação**:
```javascript
// Adicionar teste em 09.Tests.js

function testEqualityOperators() {
    // Teste de comparação estrita
    var tests = [
        {a: '0', b: 0, shouldMatch: false}, // String vs Number
        {a: null, b: undefined, shouldMatch: false},
        {a: '', b: 0, shouldMatch: false},
        {a: false, b: 0, shouldMatch: false}
    ];

    tests.forEach(function(test) {
        var result = Database.applyOperator(test.a, '==', test.b);
        if (result !== test.shouldMatch) {
            Logger.logError('Equality test failed', null, test);
        }
    });
}
```

**Critério de Aceitação**:
- [x] Todas as ocorrências de `==` substituídas por `===`
- [x] Todas as ocorrências de `!=` substituídas por `!==`
- [x] Testes passam
- [x] Revisão manual de casos especiais (== null)
- [x] Funcionalidades existentes continuam funcionando

**Impacto Funcional**: ⚠️ MÉDIO - Pode mudar comportamento de comparações
**Risco de Regressão**: 🟡 MÉDIO - Filtros podem parar de funcionar
**Rollback**: Reverter commit

---

### TASK-008: [P1] Sanitizar Logs e Remover Dados Sensíveis
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança - Data Protection
**Estimativa**: 3 horas
**Ambiente**: DEV

**Descrição Técnica**:
Implementar níveis de log e remover dados sensíveis (emails, dados pessoais) dos logs.

**Arquivos Afetados**:
- `02.Logger.js`
- Todos os pontos que fazem log

**Implementação**:

**Passo 1**: Adicionar sanitização no Logger
```javascript
// 02.Logger.js - Adicionar após linha 1:

/**
 * Mascara dados sensíveis para logs
 * @param {any} data
 * @return {any}
 */
function maskSensitiveData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  var masked = {};
  var sensitiveFields = ['email', 'password', 'senha', 'token', 'cpf', 'rg'];

  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      var lowerKey = key.toLowerCase();
      var value = data[key];

      // Mascarar campos sensíveis
      if (sensitiveFields.some(function(f) { return lowerKey.indexOf(f) !== -1; })) {
        if (typeof value === 'string' && value.length > 0) {
          // Mostrar apenas primeiros 2 e últimos 2 caracteres
          if (value.length > 4) {
            masked[key] = value.substring(0, 2) + '***' + value.substring(value.length - 2);
          } else {
            masked[key] = '***';
          }
        } else {
          masked[key] = '***';
        }
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
  }

  return masked;
}

// Adicionar ao Logger.logDebug, logInfo, etc:
function logDebug(action, data) {
  // ... código existente ...
  data = maskSensitiveData(data); // Adicionar esta linha
  // ... resto do código ...
}
```

**Passo 2**: Implementar Níveis de Log
```javascript
// 02.Logger.js - Adicionar configuração:

var LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Configurar nível mínimo (via Properties Service)
var CURRENT_LOG_LEVEL = PropertiesService.getScriptProperties()
  .getProperty('LOG_LEVEL') || LOG_LEVEL.INFO;

// Modificar funções de log:
function logDebug(action, data) {
  if (CURRENT_LOG_LEVEL > LOG_LEVEL.DEBUG) return; // Não logar DEBUG em prod
  // ... resto do código ...
}
```

**Passo 3**: Remover Logs Excessivos
```javascript
// Identificar e remover logs desnecessários:

// ❌ REMOVER:
console.log('🔍 [doGet] Email detectado: ' + user); // Expõe email

// ✅ SUBSTITUIR:
Logger.logDebug('doGet', {userAuthenticated: true}); // Não expõe email
```

**Pontos para Atualização**:
1. `08.Code.js` linha 35: Remover log de email
2. `10.PermissionsManager.js` linha 49: Mascarar email
3. Todos os `console.log` que mostram emails

**Critério de Aceitação**:
- [x] Função maskSensitiveData implementada
- [x] Níveis de log configurados
- [x] 10+ pontos de log sanitizados
- [x] Teste: verificar logs, emails devem aparecer mascarados (ab***@em***.com)
- [x] Em produção, DEBUG logs não aparecem

**Impacto Funcional**: ⚠️ ZERO - Apenas afeta logs
**Risco de Regressão**: 🟢 NENHUM
**Rollback**: Reverter commit

---

### TASK-009: [P2] Implementar Rate Limiting
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança - DoS Prevention
**Estimativa**: 4 horas
**Ambiente**: DEV

**Descrição Técnica**:
Adicionar throttling nas chamadas google.script.run para prevenir spam e abuse.

**Arquivos Afetados**:
- `index.html` (criar módulo RateLimiter)
- Wrapper em torno de google.script.run

**Implementação**:

**Passo 1**: Criar Rate Limiter
```javascript
// Adicionar no index.html após funções utilitárias:

/**
 * Rate Limiter para google.script.run
 */
var RateLimiter = (function() {
    var callCounts = {}; // {functionName: {count: X, resetTime: timestamp}}
    var MAX_CALLS_PER_MINUTE = 30; // Máximo de chamadas por minuto por função
    var WINDOW_MS = 60000; // 1 minuto

    /**
     * Verifica se chamada está dentro do limite
     * @param {string} functionName
     * @return {boolean}
     */
    function checkLimit(functionName) {
        var now = Date.now();

        if (!callCounts[functionName]) {
            callCounts[functionName] = {
                count: 0,
                resetTime: now + WINDOW_MS
            };
        }

        var info = callCounts[functionName];

        // Reset do contador se janela expirou
        if (now >= info.resetTime) {
            info.count = 0;
            info.resetTime = now + WINDOW_MS;
        }

        // Verificar limite
        if (info.count >= MAX_CALLS_PER_MINUTE) {
            return false;
        }

        info.count++;
        return true;
    }

    /**
     * Wrapper para google.script.run com rate limiting
     * @param {string} functionName
     * @return {Object} Proxy do google.script.run
     */
    function withRateLimit(functionName) {
        if (!checkLimit(functionName)) {
            showError('Muitas requisições. Aguarde um momento e tente novamente.');
            throw new Error('Rate limit exceeded for ' + functionName);
        }

        return google.script.run;
    }

    return {
        checkLimit: checkLimit,
        withRateLimit: withRateLimit
    };
})();
```

**Passo 2**: Aplicar em Chamadas Críticas
```javascript
// ANTES:
google.script.run
    .withSuccessHandler(callback)
    .withFailureHandler(errorHandler)
    .getRncList();

// DEPOIS:
RateLimiter.withRateLimit('getRncList')
    .withSuccessHandler(callback)
    .withFailureHandler(errorHandler)
    .getRncList();
```

**Passo 3**: Throttling para Eventos de UI
```javascript
/**
 * Throttle function - limita execuções
 * @param {Function} func
 * @param {number} delay
 * @return {Function}
 */
function throttle(func, delay) {
    var lastCall = 0;
    return function(...args) {
        var now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

/**
 * Debounce function - atrasa execução
 * @param {Function} func
 * @param {number} delay
 * @return {Function}
 */
function debounce(func, delay) {
    var timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Aplicar em search:
var searchInput = document.getElementById('searchRnc');
searchInput.addEventListener('input', debounce(function() {
    performSearch(this.value);
}, 500)); // Aguarda 500ms após usuário parar de digitar
```

**Pontos para Aplicação**:
1. Todas as chamadas a `google.script.run`
2. Event listeners de input/search
3. Event listeners de scroll (para infinite scroll, se houver)

**Critério de Aceitação**:
- [x] RateLimiter implementado
- [x] Throttle/Debounce implementados
- [x] Aplicado em 10+ chamadas críticas
- [x] Teste: clicar rapidamente 50x, deve bloquear após limite
- [x] Mensagem amigável ao usuário quando limite atingido
- [x] Teste: aguardar 1 minuto, contador deve resetar

**Impacto Funcional**: ⚠️ BAIXO - Usuários normais não notarão
**Risco de Regressão**: 🟡 MÉDIO - Limite muito baixo frustra usuários legítimos
**Rollback**: Reverter commit

---

### TASK-010: [P2] Implementar Cache com TTL
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança + Performance
**Estimativa**: 3 horas
**Ambiente**: DEV

**Descrição Técnica**:
Adicionar Time-To-Live ao cache de planilhas para evitar dados desatualizados e possível vazamento entre sessões.

**Arquivos Afetados**:
- `03.Database.js`

**Implementação**:

**Substituir cache simples por cache com TTL**:
```javascript
// 03.Database.js - Substituir linhas 11-12:

// ❌ REMOVER:
var sheetCache = {};
var spreadsheetCache = null;

// ✅ ADICIONAR:
var CacheManager = (function() {
  var cache = {};
  var DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Estrutura de item do cache
   * @typedef {Object} CacheItem
   * @property {any} value - Valor em cache
   * @property {number} expiresAt - Timestamp de expiração
   */

  /**
   * Adiciona item ao cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttlMs - TTL em milisegundos
   */
  function set(key, value, ttlMs) {
    ttlMs = ttlMs || DEFAULT_TTL_MS;
    cache[key] = {
      value: value,
      expiresAt: Date.now() + ttlMs
    };
  }

  /**
   * Busca item do cache
   * @param {string} key
   * @return {any} Valor ou null se expirado/inexistente
   */
  function get(key) {
    var item = cache[key];

    if (!item) {
      return null;
    }

    // Verificar expiração
    if (Date.now() >= item.expiresAt) {
      delete cache[key];
      return null;
    }

    return item.value;
  }

  /**
   * Remove item do cache
   * @param {string} key
   */
  function remove(key) {
    delete cache[key];
  }

  /**
   * Limpa todo o cache
   */
  function clear() {
    cache = {};
  }

  /**
   * Remove itens expirados
   */
  function cleanup() {
    var now = Date.now();
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        if (now >= cache[key].expiresAt) {
          delete cache[key];
        }
      }
    }
  }

  // Executar cleanup periodicamente
  setInterval(cleanup, 60000); // A cada 1 minuto

  return {
    set: set,
    get: get,
    remove: remove,
    clear: clear
  };
})();
```

**Atualizar funções que usam cache**:
```javascript
// getSpreadsheet - Substituir:
function getSpreadsheet() {
  try {
    var cached = CacheManager.get('spreadsheet');
    if (cached) {
      return cached;
    }

    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    CacheManager.set('spreadsheet', ss);
    return ss;

  } catch (error) {
    Logger.logError('getSpreadsheet', error);
    throw new Error(CONFIG.ERROR_MESSAGES.SPREADSHEET_NOT_FOUND);
  }
}

// getSheet - Substituir:
function getSheet(name, headers) {
  try {
    var cacheKey = 'sheet_' + name;
    var cached = CacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(name);

    if (!sheet) {
      Logger.logInfo('Creating new sheet', { sheetName: name });
      sheet = ss.insertSheet(name);

      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length)
          .setFontWeight('bold')
          .setBackground('#009688')
          .setFontColor('#ffffff');

        for (var i = 1; i <= headers.length; i++) {
          sheet.autoResizeColumn(i);
        }
      }
    }

    CacheManager.set(cacheKey, sheet);
    return sheet;

  } catch (error) {
    Logger.logError('getSheet', error, { sheetName: name });
    throw error;
  }
}
```

**Adicionar função para invalidar cache**:
```javascript
// Adicionar em 03.Database.js:

/**
 * Invalida cache de uma sheet específica
 * @param {string} sheetName
 */
function invalidateSheetCache(sheetName) {
  CacheManager.remove('sheet_' + sheetName);
  Logger.logDebug('Cache invalidated', { sheet: sheetName });
}

/**
 * Invalida todo o cache
 */
function invalidateAllCache() {
  CacheManager.clear();
  Logger.logInfo('All cache cleared');
}

// Adicionar à API pública:
return {
  // ... funções existentes ...
  invalidateSheetCache: invalidateSheetCache,
  invalidateAllCache: invalidateAllCache
};
```

**Invalidar cache em operações de escrita**:
```javascript
// insertData, updateData, deleteData - Adicionar ao final:
invalidateSheetCache(sheetName);
```

**Critério de Aceitação**:
- [x] CacheManager implementado
- [x] TTL configurável
- [x] Cleanup automático de itens expirados
- [x] Funções de invalidação
- [x] Teste: modificar planilha manualmente, após 5 min mudanças aparecem
- [x] Teste: inserir dados via app, cache invalidado imediatamente

**Impacto Funcional**: ⚠️ BAIXO - Pode causar delay de 5 min em mudanças manuais
**Risco de Regressão**: 🟡 MÉDIO - Cache mal implementado pode mostrar dados velhos
**Rollback**: Reverter para cache simples

---

### TASK-011: [P2] Implementar Proteção CSRF
**Prioridade**: 🟠 ALTA
**Categoria**: Segurança - CSRF
**Estimativa**: 5 horas
**Ambiente**: DEV

**Descrição Técnica**:
Implementar tokens anti-CSRF para proteger contra Cross-Site Request Forgery.

**Arquivos Afetados**:
- `08.Code.js` (gerar token na sessão)
- `index.html` (enviar token em requisições)
- Backend (validar token)

**Implementação**:

**Passo 1**: Gerar token CSRF
```javascript
// 08.Code.js - Adicionar função:

/**
 * Gera token CSRF para a sessão
 * @return {string} Token único
 */
function generateCsrfToken() {
  var token = Utilities.getUuid();
  var cache = CacheService.getUserCache();

  // Armazenar token com TTL de 1 hora
  cache.put('csrf_token', token, 3600);

  Logger.logDebug('CSRF token generated');
  return token;
}

/**
 * Valida token CSRF
 * @param {string} token
 * @return {boolean}
 */
function validateCsrfToken(token) {
  if (!token) {
    Logger.logWarning('CSRF token missing');
    return false;
  }

  var cache = CacheService.getUserCache();
  var expectedToken = cache.get('csrf_token');

  if (!expectedToken) {
    Logger.logWarning('CSRF token expired or not found');
    return false;
  }

  if (token !== expectedToken) {
    Logger.logWarning('CSRF token mismatch', {
      provided: token.substring(0, 8) + '...',
      expected: expectedToken.substring(0, 8) + '...'
    });
    return false;
  }

  Logger.logDebug('CSRF token valid');
  return true;
}
```

**Passo 2**: Incluir token no HTML
```javascript
// 08.Code.js em doGet() - Adicionar:

var csrfToken = generateCsrfToken();

// Passar token para template:
var template = HtmlService.createHtmlOutputFromFile('index');
template.setTitle('RNC • Neoformula');
template.csrf_token = csrfToken; // ❌ Não funciona assim no Apps Script

// Apps Script não permite passar variáveis diretamente
// Solução: criar endpoint para buscar token
```

**Alternativa - Endpoint para Token**:
```javascript
// 08.Code.js - Adicionar:

/**
 * Retorna token CSRF para o cliente
 * @return {string}
 */
function getCsrfToken() {
  var token = generateCsrfToken();
  return token;
}
```

**Passo 3**: Buscar e armazenar token no frontend
```javascript
// index.html - Adicionar após DOMContentLoaded:

var csrfToken = null;

// Buscar token ao carregar página
google.script.run
  .withSuccessHandler(function(token) {
    csrfToken = token;
    console.log('✅ CSRF token obtained');
  })
  .withFailureHandler(function(error) {
    console.error('❌ Failed to get CSRF token:', error);
    showError('Erro ao inicializar segurança. Recarregue a página.');
  })
  .getCsrfToken();
```

**Passo 4**: Enviar token em todas as requisições
```javascript
// index.html - Modificar wrapper de apiCall:

function apiCall(functionName, args) {
  return new Promise((resolve, reject) => {
    if (!csrfToken) {
      reject(new Error('CSRF token not initialized'));
      return;
    }

    // Adicionar token aos argumentos
    var argsWithToken = args ? args.slice() : [];
    argsWithToken.push(csrfToken); // Token como último argumento

    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName].apply(null, argsWithToken);
  });
}
```

**Passo 5**: Validar token no backend
```javascript
// Modificar funções críticas para aceitar e validar token:

// ANTES:
function createRnc(data) { ... }

// DEPOIS:
function createRnc(data, csrfToken) {
  // Validar CSRF
  if (!validateCsrfToken(csrfToken)) {
    return {
      success: false,
      error: 'CSRF_TOKEN_INVALID',
      message: 'Token de segurança inválido. Recarregue a página.'
    };
  }

  // Continuar com lógica normal...
}

// Aplicar em:
// - createRnc
// - updateRnc
// - deleteRnc
// - saveRncSection
// - addUserRole
// - removeUserRole
// - Outras operações de escrita
```

**Critério de Aceitação**:
- [x] Token CSRF gerado por sessão
- [x] Token enviado em todas as requisições de escrita
- [x] Backend valida token
- [x] Teste: remover token da requisição, deve rejeitar
- [x] Teste: usar token expirado, deve rejeitar
- [x] Teste: usar token válido, deve aceitar

**Impacto Funcional**: ⚠️ MÉDIO - Adiciona overhead em requisições
**Risco de Regressão**: 🔴 ALTO - Se mal implementado, pode quebrar todas as operações
**Rollback**: Remover validação de token, manter geração para compatibilidade

**Notas**:
- Operações de leitura podem não precisar de CSRF (GET idempotente)
- Operações de escrita (POST) DEVEM ter CSRF
- Cache do token expira em 1 hora, usuário precisa recarregar

---

## 📊 RESUMO EXECUTIVO DAS TASKS

### Fase 1 (Sprint Atual - 2 Semanas)
| Task | Prioridade | Estimativa | Complexidade | Risco Regressão |
|------|-----------|-----------|--------------|-----------------|
| TASK-001 | P0 | 4h | Média | Baixo |
| TASK-002 | P0 | 2h | Baixa | Nenhum |
| TASK-003 | P0 | 1h | Baixa | Médio |
| TASK-004 | P1 | 3h | Média | Médio |
| TASK-005 | P1 | 2h | Alta | Alto |
| **TOTAL** | - | **12h** | - | - |

### Fase 2 (Próxima Sprint - 2 Semanas)
| Task | Prioridade | Estimativa | Complexidade | Risco Regressão |
|------|-----------|-----------|--------------|-----------------|
| TASK-006 | P1 | 6h | Alta | Médio |
| TASK-007 | P1 | 2h | Baixa | Médio |
| TASK-008 | P1 | 3h | Média | Nenhum |
| TASK-009 | P2 | 4h | Alta | Médio |
| TASK-010 | P2 | 3h | Média | Médio |
| TASK-011 | P2 | 5h | Alta | Alto |
| **TOTAL** | - | **23h** | - | - |

**Total Fase 1+2**: 35 horas (~4-5 dias úteis)

---

## ✅ PROCESSO DE VALIDAÇÃO EM DEV

Para cada task implementada:

1. **Desenvolvimento Local**
   - Implementar mudança
   - Teste unitário (se aplicável)
   - Teste manual local

2. **Deploy para DEV**
   ```bash
   clasp push --force
   clasp deploy --description "TASK-XXX: [Descrição]"
   ```

3. **Teste em DEV** (mínimo 24h)
   - Funcionalidade principal
   - Casos de borda
   - Performance
   - Logs e erros

4. **Aprovação**
   - Se passou em DEV por 24-48h sem issues
   - Documentar no CHANGELOG
   - Marcar como pronto para PROD

5. **Deploy para PROD** (após múltiplas tasks validadas)
   ```bash
   clasp deploy --description "PROD - Deploy XX - [Lista de tasks]"
   ```

---

## 🚨 CONTINGÊNCIA E ROLLBACK

Se qualquer task causar problemas em DEV:

1. **Identificar problema**
   - Logs
   - Reprodução do erro
   - Impacto

2. **Decisão**
   - [ ] Fix rápido (< 1h) → Corrigir e redeployar
   - [ ] Fix complexo → Rollback e reabrir task

3. **Rollback**
   ```bash
   git revert [commit-hash]
   git push origin main
   clasp push --force
   ```

4. **Comunicação**
   - Atualizar SECURITY-TASKS.md com status
   - Documentar lições aprendidas
   - Replanejar task

---

## 📞 DÚVIDAS E ESCLARECIMENTOS

Antes de implementar qualquer task:

1. **Ler completa a descrição técnica**
2. **Verificar arquivos afetados**
3. **Entender critérios de aceitação**
4. **Se houver ambiguidade**: PERGUNTAR ao invés de assumir

Pontos que podem precisar esclarecimento:
- Limites de rate limiting (muito restritivo vs muito permissivo)
- TTL de cache (muito curto vs muito longo)
- Quais tags HTML são seguras para whitelist
- Nível de log padrão em produção

---

**Documento vivo**: Este arquivo deve ser atualizado conforme tasks são completadas, novos problemas são descobertos, ou requisitos mudam.

**Última Atualização**: 05/12/2024
**Próxima Revisão**: Após conclusão Fase 1
