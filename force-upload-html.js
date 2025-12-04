#!/usr/bin/env node

/**
 * Script para forçar upload do index.html para Google Apps Script
 * Usa a API do clasp internamente
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Forçando upload do index.html...\n');

// Ler o index.html local
const htmlContent = fs.readFileSync('index.html', 'utf-8');

// Verificar se tem a função nova
if (!htmlContent.includes('DEPLOY 39: RELATORIO PDF MEGA COMPLETO')) {
    console.error('❌ ERRO: index.html local não tem a função Deploy 39!');
    process.exit(1);
}

console.log('✅ index.html local verificado (tem Deploy 39)');
console.log(`   Tamanho: ${(htmlContent.length / 1024).toFixed(1)}KB\n`);

// Estratégia: Renomear arquivo temporariamente
console.log('📝 Renomeando index.html para index2.html...');
fs.renameSync('index.html', 'index2.html');

try {
    // Push sem index.html
    console.log('📤 Push 1: Removendo index.html antigo...');
    execSync('clasp push --force', { stdio: 'inherit' });

    // Renomear de volta
    console.log('\n📝 Renomeando index2.html de volta para index.html...');
    fs.renameSync('index2.html', 'index.html');

    // Push com index.html novo
    console.log('📤 Push 2: Adicionando index.html novo...');
    execSync('clasp push --force', { stdio: 'inherit' });

    console.log('\n✅ Upload forçado com sucesso!');
    console.log('\n🚀 Criando novo deployment...');
    const result = execSync('clasp deploy --description "Deploy 40 - Force sync index.html"', { encoding: 'utf-8' });
    console.log(result);

    console.log('\n🎉 SUCESSO! Teste o novo deployment.');

} catch (error) {
    console.error('\n❌ Erro:', error.message);
    // Restaurar nome se falhar
    if (fs.existsSync('index2.html')) {
        fs.renameSync('index2.html', 'index.html');
    }
    process.exit(1);
}
