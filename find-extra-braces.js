const fs = require('fs');

const js = fs.readFileSync('temp-extracted.js', 'utf8');
const lines = js.split('\n');

let balance = 0;
const problems = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Contar { e } nesta linha (ignorando strings e comentários é complexo, mas vamos tentar)
    // Remover strings entre aspas duplas e simples
    let cleaned = line.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");

    // Remover template strings (aproximado - pode não ser perfeito)
    cleaned = cleaned.replace(/`[^`]*`/g, '``');

    // Remover comentários de linha
    const commentIndex = cleaned.indexOf('//');
    if (commentIndex !== -1) {
        cleaned = cleaned.substring(0, commentIndex);
    }

    const openCount = (cleaned.match(/{/g) || []).length;
    const closeCount = (cleaned.match(/}/g) || []).length;

    balance += openCount - closeCount;

    if (balance < 0) {
        problems.push({
            line: i + 1,
            balance: balance,
            content: line.trim().substring(0, 80),
            opens: openCount,
            closes: closeCount
        });
    }
}

console.log('🔍 Procurando por chaves extras...\n');
console.log(`📊 Balanço final: ${balance}\n`);

if (problems.length > 0) {
    console.log(`❌ Encontradas ${problems.length} linhas onde o balanço ficou negativo:\n`);
    problems.forEach(p => {
        console.log(`Linha ${p.line} (balanço: ${p.balance}, opens: ${p.opens}, closes: ${p.closes}):`);
        console.log(`   ${p.content}`);
        console.log('');
    });
} else {
    console.log('✅ Nenhuma linha com balanço negativo detectada');
    console.log('⚠️  As chaves extras podem estar distribuídas ao longo do código');
}

// Procurar padrões suspeitos
console.log('\n🔍 Procurando padrões suspeitos...\n');

// Procurar por }} (duas chaves fechando juntas)
const doubleClose = [];
lines.forEach((line, i) => {
    if (line.includes('}}') && !line.includes('}}')) {
        doubleClose.push({ line: i + 1, content: line.trim().substring(0, 80) });
    }
});

if (doubleClose.length > 0) {
    console.log(`⚠️  Encontradas ${doubleClose.length} ocorrências de "}}":\n`);
    doubleClose.slice(0, 10).forEach(p => {
        console.log(`Linha ${p.line}: ${p.content}`);
    });
}

// Procurar por linhas que são apenas }
const onlyClose = [];
lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '}' || trimmed === '};') {
        onlyClose.push({ line: i + 1, prev: lines[i-1]?.trim().substring(0, 60) || '' });
    }
});

console.log(`\n📋 Encontradas ${onlyClose.length} linhas que são apenas "}"`);
console.log('Últimas 20 ocorrências:\n');
onlyClose.slice(-20).forEach(p => {
    console.log(`Linha ${p.line}: } (anterior: ${p.prev})`);
});
