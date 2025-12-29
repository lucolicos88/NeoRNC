/**
 * ✅ DEPLOY 115 - FASE 4: Teste da função isValidEmail() unificada
 * Execute este teste no Apps Script Editor para validar a função
 */

function testIsValidEmail() {
  Logger.log('========================================');
  Logger.log('TESTE: isValidEmail() - Versão Unificada');
  Logger.log('========================================\n');

  // Caso 1: Email válido - retorno objeto
  var test1 = isValidEmail('user@example.com');
  Logger.log('Teste 1 - Email válido (objeto):');
  Logger.log('  Input: "user@example.com"');
  Logger.log('  Output: ' + JSON.stringify(test1));
  Logger.log('  ✅ Esperado: { valid: true, error: null }\n');

  // Caso 2: Email inválido - retorno objeto
  var test2 = isValidEmail('invalid-email');
  Logger.log('Teste 2 - Email inválido (objeto):');
  Logger.log('  Input: "invalid-email"');
  Logger.log('  Output: ' + JSON.stringify(test2));
  Logger.log('  ✅ Esperado: { valid: false, error: "..." }\n');

  // Caso 3: Email válido - retorno boolean
  var test3 = isValidEmail('user@example.com', true);
  Logger.log('Teste 3 - Email válido (boolean):');
  Logger.log('  Input: "user@example.com", true');
  Logger.log('  Output: ' + test3);
  Logger.log('  ✅ Esperado: true\n');

  // Caso 4: Email inválido - retorno boolean
  var test4 = isValidEmail('invalid', true);
  Logger.log('Teste 4 - Email inválido (boolean):');
  Logger.log('  Input: "invalid", true');
  Logger.log('  Output: ' + test4);
  Logger.log('  ✅ Esperado: false\n');

  // Caso 5: Email vazio - retorno objeto
  var test5 = isValidEmail('');
  Logger.log('Teste 5 - Email vazio (objeto):');
  Logger.log('  Input: ""');
  Logger.log('  Output: ' + JSON.stringify(test5));
  Logger.log('  ✅ Esperado: { valid: false, error: "Email não pode estar vazio" }\n');

  // Caso 6: Email muito longo - retorno objeto
  var longEmail = 'a'.repeat(101) + '@example.com';
  var test6 = isValidEmail(longEmail);
  Logger.log('Teste 6 - Email muito longo (objeto):');
  Logger.log('  Input: "' + longEmail.substring(0, 20) + '..." (101+ chars)');
  Logger.log('  Output: ' + JSON.stringify(test6));
  Logger.log('  ✅ Esperado: { valid: false, error: "Email muito longo..." }\n');

  // Caso 7: Email com caracteres especiais inválidos
  var test7 = isValidEmail('user#invalid@example.com', true);
  Logger.log('Teste 7 - Caracteres inválidos (boolean):');
  Logger.log('  Input: "user#invalid@example.com", true');
  Logger.log('  Output: ' + test7);
  Logger.log('  ✅ Esperado: false\n');

  Logger.log('========================================');
  Logger.log('TESTES CONCLUÍDOS!');
  Logger.log('Verifique se todos os outputs correspondem aos esperados.');
  Logger.log('========================================');
}
