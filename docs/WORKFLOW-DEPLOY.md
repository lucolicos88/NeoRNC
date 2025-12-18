# 🚀 Workflow de Deploy - VS Code + Clasp

## 📋 Fluxo Completo Simplificado

### 1. Desenvolvimento Local (VS Code)

```bash
# Altere seus arquivos no VS Code normalmente
# Exemplo: editar 01.Config.js, 06.RncOperations.js, etc.
```

### 2. Enviar para Google Apps Script

```bash
# No terminal do VS Code (Ctrl + `)
cd c:\Users\Usuario\OneDrive\Documents\GitHub\NeoRNC

# Enviar código para Google Apps Script
clasp push --force

# Verificar se enviou corretamente
clasp deployments
```

**O que acontece:**
- Código vai para @HEAD (versão de rascunho)
- NÃO cria nova versão pública ainda
- NÃO afeta implantações existentes

### 3. Criar Nova Versão de Desenvolvimento

```bash
# Opção A: Criar nova implantação
clasp deploy --description "Desenvolvimento - Descrição da alteração"

# Opção B: Atualizar implantação existente (RECOMENDADO)
clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Desenvolvimento - Atualizado"
```

**Diferença:**
- **Opção A**: Cria nova URL (precisa atualizar links)
- **Opção B**: Mantém mesma URL de desenvolvimento (MELHOR!)

### 4. Sincronizar com Git (Backup)

```bash
# Adicionar alterações
git add .

# Commit com mensagem descritiva
git commit -m "feat: descrição da alteração"

# Enviar para GitHub
git push origin main
```

## 🎯 Comando Único - Deploy Completo

Crie este script para executar tudo de uma vez:

```bash
# Windows (PowerShell)
clasp push --force && clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Dev - Atualizado" && git add . && git commit -m "Update: auto deploy" && git push origin main
```

## 📊 Estrutura de IDs

### Suas Implantações Atuais:

```
┌─────────────────────────────────────────────────────────────────┐
│ PRODUÇÃO (NUNCA ALTERAR SEM TESTAR)                             │
├─────────────────────────────────────────────────────────────────┤
│ ID: AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A
│ Versão: @51                                                      │
│ URL: https://script.google.com/macros/s/AKfycbyJpwJg...         │
│ Status: ATIVO - Usuários usando                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DESENVOLVIMENTO (USAR PARA TESTES)                              │
├─────────────────────────────────────────────────────────────────┤
│ ID: AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg
│ Versão: @53 → ATUALIZAR SEMPRE ESTE                            │
│ URL: https://script.google.com/macros/s/AKfycbxciMQ...         │
│ Status: DESENVOLVIMENTO - Atualizar sempre                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DEPLOY 31 (VERSÃO NOVA - @54)                                   │
├─────────────────────────────────────────────────────────────────┤
│ ID: AKfycbx4omJ31TURCvdRF-xJebIq6vWBQ_A7xPFhXBR21KSpjsb04yqICzeY8A6l9HKFTC90OA
│ Versão: @54                                                      │
│ URL: https://script.google.com/macros/s/AKfycbx4omJ...         │
│ Status: NOVA - Precisa testar antes de promover                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Cenários Práticos

### Cenário 1: Corrigi um Bug

```bash
# 1. Edite o arquivo no VS Code
# 2. Terminal:
clasp push --force
clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Fix: corrigido bug X"

# 3. Teste na URL de desenvolvimento
# 4. Se OK, commit no git:
git add .
git commit -m "fix: corrigido bug X"
git push origin main
```

### Cenário 2: Nova Funcionalidade

```bash
# 1. Desenvolva no VS Code
# 2. Terminal:
clasp push --force
clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Feature: nova funcionalidade Y"

# 3. Teste por alguns dias
# 4. Se estável, promover para produção:
clasp deploy --deploymentId AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A --description "Produção - Nova funcionalidade Y"

# 5. Commit:
git add .
git commit -m "feat: nova funcionalidade Y"
git push origin main
```

### Cenário 3: Promover Deploy 31 para Desenvolvimento

**OPÇÃO ATUAL: Você tem Deploy 31 na versão @54, mas quer usar no Desenvolvimento**

```bash
# Atualizar o ID de Desenvolvimento para usar código @54
clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Desenvolvimento - Deploy 31"
```

**O que isso faz:**
- Atualiza o deployment de Desenvolvimento (ID ...IT5bg)
- Mantém a mesma URL de desenvolvimento
- Agora o desenvolvimento aponta para o código atual (@HEAD)

## 🎨 Criar Script Automatizado

Crie um arquivo `deploy-dev.bat` na pasta do projeto:

```batch
@echo off
echo ========================================
echo   DEPLOY DESENVOLVIMENTO - RNC NEOFORMULA
echo ========================================
echo.

echo [1/4] Enviando codigo para Google Apps Script...
call clasp push --force
if errorlevel 1 (
    echo ERRO: Falha no push
    pause
    exit /b 1
)
echo OK!
echo.

echo [2/4] Criando nova versao de desenvolvimento...
call clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Desenvolvimento - %date% %time%"
if errorlevel 1 (
    echo ERRO: Falha no deploy
    pause
    exit /b 1
)
echo OK!
echo.

echo [3/4] Adicionando ao Git...
git add .
echo OK!
echo.

echo [4/4] Sincronizando com GitHub...
set /p commit_msg="Digite mensagem do commit: "
git commit -m "%commit_msg%"
git push origin main
echo OK!
echo.

echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo URL Desenvolvimento:
echo https://script.google.com/macros/s/AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg/exec
echo.
pause
```

**Como usar:**
1. Salve como `deploy-dev.bat` na pasta do projeto
2. Dê duplo clique no arquivo
3. Digite a mensagem do commit
4. Pronto!

## 🛡️ Script para Produção (com confirmação)

Crie `deploy-prod.bat`:

```batch
@echo off
echo ========================================
echo   DEPLOY PRODUCAO - RNC NEOFORMULA
echo ========================================
echo.
echo ATENCAO: Isso vai atualizar a versao de PRODUCAO!
echo Usuarios estao usando esta versao.
echo.
set /p confirm="Tem certeza? (S/N): "
if /i not "%confirm%"=="S" (
    echo Deploy cancelado.
    pause
    exit /b 0
)
echo.

echo [1/3] Enviando codigo para Google Apps Script...
call clasp push --force
if errorlevel 1 (
    echo ERRO: Falha no push
    pause
    exit /b 1
)
echo OK!
echo.

echo [2/3] Criando nova versao de PRODUCAO...
call clasp deploy --deploymentId AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A --description "Producao - %date% %time%"
if errorlevel 1 (
    echo ERRO: Falha no deploy
    pause
    exit /b 1
)
echo OK!
echo.

echo [3/3] Criando tag no Git...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%b%%a)
set tag=prod-%mydate%
git tag %tag%
git push origin %tag%
echo Tag criada: %tag%
echo.

echo ========================================
echo   DEPLOY PRODUCAO CONCLUIDO!
echo ========================================
echo.
echo URL Producao:
echo https://script.google.com/macros/s/AKfycbyJpwJgX131dSRvuvP_9ijoKBX1Bz6Ttpp5gGBmThhdCjsH7cqsORvhrMjYKibGnIGd8A/exec
echo.
pause
```

## 📝 Checklist Rápido

### Deploy Desenvolvimento:
```
[ ] 1. Editar código no VS Code
[ ] 2. clasp push --force
[ ] 3. clasp deploy --deploymentId ...IT5bg (desenvolvimento)
[ ] 4. Testar na URL de desenvolvimento
[ ] 5. git add . && git commit -m "msg" && git push
```

### Deploy Produção:
```
[ ] 1. Testar MUITO em desenvolvimento
[ ] 2. Validar com usuários de teste
[ ] 3. Fazer backup da versão atual
[ ] 4. clasp deploy --deploymentId ...Gd8A (produção)
[ ] 5. Monitorar logs por 24h
[ ] 6. Criar tag no git
```

## 🆘 Troubleshooting

### Erro: "Unknown deployment"
**Solução:** Verifique se o deploymentId está correto
```bash
clasp deployments
```

### Erro: "Push was rejected"
**Solução:** Use --force
```bash
clasp push --force
```

### Não sei qual versão está em cada implantação
**Solução:** Liste todas
```bash
clasp deployments
```

## 🎯 Comandos Rápidos

```bash
# Ver versões
clasp deployments

# Ver versão atual do código
clasp version

# Criar nova versão
clasp version "Descrição"

# Push + Deploy Dev (comando único)
clasp push --force && clasp deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Dev Update"

# Ver logs do Apps Script
clasp logs

# Abrir projeto no navegador
clasp open
```

---

**Resumo:**
1. Desenvolva no VS Code
2. `clasp push --force` (envia código)
3. `clasp deploy --deploymentId ...` (atualiza versão específica)
4. Teste
5. Git commit/push

**Mantenha sempre a mesma URL de desenvolvimento usando o mesmo deploymentId!**
