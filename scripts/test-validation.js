/**
 * Testes para Validação de Campos - Deploy 33
 * Execute este arquivo no Apps Script para testar as validações
 */

function testFieldValidation() {
  Logger.log('========================================');
  Logger.log('TESTES DE VALIDAÇÃO - DEPLOY 33');
  Logger.log('========================================\n');

  // Teste 1: Validação de Email
  Logger.log('--- Teste 1: Validação de Email ---');
  testEmail('user@example.com', true);
  testEmail('invalid-email', false);
  testEmail('user@', false);
  testEmail('', false);
  Logger.log('');

  // Teste 2: Validação de Telefone
  Logger.log('--- Teste 2: Validação de Telefone ---');
  testPhone('(11) 98765-4321', true);
  testPhone('11987654321', true);
  testPhone('1234', false);
  testPhone('(99) 99999-9999', true);
  Logger.log('');

  // Teste 3: Validação de CPF
  Logger.log('--- Teste 3: Validação de CPF ---');
  testCPF('123.456.789-09', true);  // CPF válido
  testCPF('11111111111', false);     // CPF inválido (todos iguais)
  testCPF('12345678901', false);     // CPF inválido (checksum errado)
  testCPF('123456', false);          // CPF inválido (poucos dígitos)
  Logger.log('');

  // Teste 4: Validação de CNPJ
  Logger.log('--- Teste 4: Validação de CNPJ ---');
  testCNPJ('11.222.333/0001-81', true);  // CNPJ válido
  testCNPJ('11111111111111', false);      // CNPJ inválido (todos iguais)
  testCNPJ('12345678901234', false);      // CNPJ inválido (checksum errado)
  Logger.log('');

  // Teste 5: Validação de Data
  Logger.log('--- Teste 5: Validação de Data ---');
  testDate('01/12/2025', 'DD/MM/YYYY', true);
  testDate('32/12/2025', 'DD/MM/YYYY', false);  // Dia inválido
  testDate('01-12-2025', 'DD/MM/YYYY', false);  // Formato errado
  testDate('', 'DD/MM/YYYY', false);
  Logger.log('');

  // Teste 6: Validação de Número
  Logger.log('--- Teste 6: Validação de Número ---');
  testNumber(100, { min: 0, max: 200 }, true);
  testNumber(300, { min: 0, max: 200 }, false);
  testNumber(5.5, { integer: true }, false);
  testNumber(-10, { positive: true }, false);
  Logger.log('');

  // Teste 7: Validação de CEP
  Logger.log('--- Teste 7: Validação de CEP ---');
  testCEP('01310-100', true);
  testCEP('01310100', true);
  testCEP('12345', false);
  testCEP('11111111', false);
  Logger.log('');

  // Teste 8: Validação de Múltiplos Campos
  Logger.log('--- Teste 8: Validação de Múltiplos Campos ---');
  var testData = {
    'Email': 'user@example.com',
    'Telefone': '(11) 98765-4321',
    'CPF': '123.456.789-09'
  };
  var validations = {
    'Email': { type: 'email' },
    'Telefone': { type: 'phone' },
    'CPF': { type: 'cpf' }
  };
  var result = validateFields(testData, validations);
  Logger.log('Dados válidos: ' + JSON.stringify(testData));
  Logger.log('Resultado: ' + (result.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'));
  if (!result.valid) {
    Logger.log('Erros: ' + result.errors.join(', '));
  }
  Logger.log('');

  // Teste 9: Validação com Erros
  Logger.log('--- Teste 9: Validação com Erros ---');
  var invalidData = {
    'Email': 'invalid-email',
    'Telefone': '1234',
    'CPF': '11111111111'
  };
  result = validateFields(invalidData, validations);
  Logger.log('Dados inválidos: ' + JSON.stringify(invalidData));
  Logger.log('Resultado: ' + (result.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'));
  if (!result.valid) {
    Logger.log('Erros encontrados:');
    result.errors.forEach(function(error) {
      Logger.log('  - ' + error);
    });
  }
  Logger.log('');

  Logger.log('========================================');
  Logger.log('TESTES CONCLUÍDOS');
  Logger.log('========================================');
}

// Helper functions
function testEmail(email, expected) {
  var result = isValidEmail(email);
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' Email: "' + email + '" - ' +
             (result.valid ? 'Válido' : 'Inválido: ' + result.error));
}

function testPhone(phone, expected) {
  var result = isValidPhone(phone);
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' Telefone: "' + phone + '" - ' +
             (result.valid ? 'Válido' : 'Inválido: ' + result.error));
}

function testCPF(cpf, expected) {
  var result = isValidCPF(cpf);
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' CPF: "' + cpf + '" - ' +
             (result.valid ? 'Válido' : 'Inválido: ' + result.error));
}

function testCNPJ(cnpj, expected) {
  var result = isValidCNPJ(cnpj);
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' CNPJ: "' + cnpj + '" - ' +
             (result.valid ? 'Válido' : 'Inválido: ' + result.error));
}

function testDate(date, format, expected) {
  var result = isValidDate(date, format, {});
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' Data: "' + date + '" - ' +
             (result.valid ? 'Válida' : 'Inválida: ' + result.error));
}

function testNumber(num, options, expected) {
  var result = isValidNumber(num, options);
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' Número: "' + num + '" (options: ' + JSON.stringify(options) + ') - ' +
             (result.valid ? 'Válido' : 'Inválido: ' + result.error));
}

function testCEP(cep, expected) {
  var result = isValidCEP(cep);
  var status = result.valid === expected ? '✅' : '❌';
  Logger.log(status + ' CEP: "' + cep + '" - ' +
             (result.valid ? 'Válido' : 'Inválido: ' + result.error));
}
