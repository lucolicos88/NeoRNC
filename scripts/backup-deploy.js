#!/usr/bin/env node

/**
 * ============================================
 * BACKUP & DEPLOY - Sistema de Versionamento
 * ============================================
 *
 * Arquiva a versão atual antes de fazer novo deploy
 * Uso: node backup-deploy.js "Descrição do deploy"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// CONFIGURAÇÕES
// ============================================
const ARCHIVES_DIR = 'archives';
const FILES_TO_BACKUP = [
    'index.html',
    '01.Config.js',
    '02.Logger.js',
    '03.Database.js',
    '04.ConfigManager.js',
    '05.FileManager.js',
    '06.RncOperations.js',
    '07.Reports.js',
    '08.Code.js',
    '09. Tests.js',
    '10.PermissionsManager.js',
    '11.PrintRNC.js',
    '12.MenuPlanilha.js',
    '13.HistoricoManager.js',
    'Abrirpdf.html',
    'appsscript.json'
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getDeployNumber() {
    try {
        // Ler último deploy do git
        const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf-8' });
        const match = lastCommit.match(/Deploy (\d+)/i);
        if (match) {
            return parseInt(match[1]) + 1;
        }
    } catch (e) {
        console.warn('⚠️  Não foi possível detectar número do deploy, usando 38');
    }
    return 38;
}

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function createBackup(deployNumber, description) {
    const date = getCurrentDate();
    const backupDir = path.join(ARCHIVES_DIR, `deploy-${deployNumber - 1}_${date}`);

    console.log('📦 Criando backup da versão atual...');
    console.log(`   Destino: ${backupDir}`);

    // Criar diretório de backup
    if (!fs.existsSync(ARCHIVES_DIR)) {
        fs.mkdirSync(ARCHIVES_DIR);
    }
    fs.mkdirSync(backupDir, { recursive: true });

    // Copiar arquivos
    let copiedFiles = 0;
    FILES_TO_BACKUP.forEach(file => {
        const src = file;
        const dest = path.join(backupDir, file);

        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            copiedFiles++;
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ⚠️  ${file} (não encontrado)`);
        }
    });

    // Criar arquivo de metadata
    const metadata = {
        deployNumber: deployNumber - 1,
        date: date,
        timestamp: new Date().toISOString(),
        description: description || 'Backup automático',
        files: copiedFiles,
        git: {
            branch: execSync('git branch --show-current', { encoding: 'utf-8' }).trim(),
            commit: execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim().substring(0, 7),
            message: execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim()
        }
    };

    fs.writeFileSync(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    console.log(`\n✅ Backup concluído: ${copiedFiles} arquivos copiados\n`);
    return backupDir;
}

function updateChangelog(deployNumber, description) {
    const changelogPath = 'CHANGELOG.md';
    const date = getCurrentDate();
    const entry = `
## Deploy ${deployNumber} - ${date}

${description}

**Arquivos Modificados:** Ver \`archives/deploy-${deployNumber}_${date}/\`

---
`;

    let changelog = '';
    if (fs.existsSync(changelogPath)) {
        changelog = fs.readFileSync(changelogPath, 'utf-8');
        // Inserir após o título
        const lines = changelog.split('\n');
        const insertIndex = lines.findIndex(line => line.startsWith('##')) || 2;
        lines.splice(insertIndex, 0, entry);
        changelog = lines.join('\n');
    } else {
        changelog = `# CHANGELOG - Histórico de Deploys\n\n${entry}`;
    }

    fs.writeFileSync(changelogPath, changelog);
    console.log('📝 CHANGELOG.md atualizado\n');
}

function deploy(deployNumber, description) {
    console.log('🚀 Iniciando deploy...\n');

    try {
        // 1. Clasp push
        console.log('📤 Pushing para Apps Script...');
        execSync('clasp push', { stdio: 'inherit' });

        // 2. Clasp deploy
        console.log('\n📦 Criando deployment...');
        const deployDesc = `Deploy ${deployNumber} - ${description}`;
        const result = execSync(`clasp deploy --description "${deployDesc}"`, { encoding: 'utf-8' });
        console.log(result);

        // 3. Git commit
        console.log('\n💾 Commitando no git...');
        execSync('git add -A', { stdio: 'inherit' });

        const commitMsg = `Deploy ${deployNumber} - ${description}

🎉 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;

        execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

        console.log('\n✅ Deploy concluído com sucesso!\n');
        return true;

    } catch (error) {
        console.error('\n❌ Erro durante o deploy:', error.message);
        return false;
    }
}

// ============================================
// MAIN
// ============================================

function main() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   BACKUP & DEPLOY - NeoRNC System         ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Obter descrição do deploy
    const description = process.argv[2];
    if (!description) {
        console.error('❌ Erro: Informe a descrição do deploy');
        console.log('\nUso: node backup-deploy.js "Descrição do deploy"\n');
        console.log('Exemplo: node backup-deploy.js "Adiciona notificações por email"\n');
        process.exit(1);
    }

    // Obter número do deploy
    const deployNumber = getDeployNumber();
    console.log(`📍 Preparando Deploy ${deployNumber}`);
    console.log(`📝 Descrição: ${description}\n`);

    // Confirmar
    console.log('⚠️  Este processo irá:');
    console.log('   1. Criar backup da versão atual');
    console.log('   2. Fazer push para Apps Script');
    console.log('   3. Criar novo deployment');
    console.log('   4. Commitar no git');
    console.log('   5. Atualizar CHANGELOG\n');

    // Criar backup
    const backupDir = createBackup(deployNumber, description);

    // Atualizar changelog
    updateChangelog(deployNumber, description);

    // Deploy
    const success = deploy(deployNumber, description);

    if (success) {
        console.log('╔════════════════════════════════════════════╗');
        console.log('║           🎉 SUCESSO!                     ║');
        console.log('╚════════════════════════════════════════════╝\n');
        console.log(`✅ Deploy ${deployNumber} realizado com sucesso`);
        console.log(`📦 Backup salvo em: ${backupDir}`);
        console.log(`📝 CHANGELOG atualizado\n`);
    } else {
        console.log('\n⚠️  Deploy falhou, mas backup foi criado em:', backupDir);
        process.exit(1);
    }
}

// Executar
main();
