const fs = require('fs');

// Ler o arquivo HTML
const content = fs.readFileSync('index.html', 'utf8');

// Extrair apenas o conteúdo do script principal
const scriptMatch = content.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/);

if (!scriptMatch) {
    console.log('❌ Não foi possível extrair o script');
    process.exit(1);
}

const scriptContent = scriptMatch[1];

// Salvar o JavaScript extraído
fs.writeFileSync('temp-extracted.js', scriptContent);

console.log('✅ JavaScript extraído para temp-extracted.js');
console.log(`📊 Total de linhas: ${scriptContent.split('\n').length}`);

// Tentar verificar balanceamento de chaves
const openBraces = (scriptContent.match(/{/g) || []).length;
const closeBraces = (scriptContent.match(/}/g) || []).length;
const openParens = (scriptContent.match(/\(/g) || []).length;
const closeParens = (scriptContent.match(/\)/g) || []).length;
const openBrackets = (scriptContent.match(/\[/g) || []).length;
const closeBrackets = (scriptContent.match(/\]/g) || []).length;
const backticks = (scriptContent.match(/`/g) || []).length;

console.log('\n📊 Balanço de símbolos:');
console.log(`   { } : ${openBraces} / ${closeBraces} ${openBraces === closeBraces ? '✅' : '❌'}`);
console.log(`   ( ) : ${openParens} / ${closeParens} ${openParens === closeParens ? '✅' : '❌'}`);
console.log(`   [ ] : ${openBrackets} / ${closeBrackets} ${openBrackets === closeBrackets ? '✅' : '❌'}`);
console.log(`   \`   : ${backticks} ${backticks % 2 === 0 ? '✅' : '❌'}`);

// Procurar por padrões problemáticos
const problems = [];

// Padrão 1: } seguido de ` (possível template string mal fechada)
const pattern1 = scriptContent.match(/}\s*`/g);
if (pattern1) {
    console.log(`\n⚠️  Encontrados ${pattern1.length} padrões "} \`" que podem ser problemáticos`);
}

// Padrão 2: innerHTML com template strings
const pattern2 = scriptContent.match(/innerHTML\s*=\s*`[\s\S]{1,200}</g);
if (pattern2) {
    console.log(`\n⚠️  Encontrados ${pattern2.length} innerHTML com templates`);
    pattern2.forEach((match, i) => {
        console.log(`   ${i + 1}: ${match.substring(0, 80)}...`);
    });
}

console.log('\n✅ Validação concluída');
