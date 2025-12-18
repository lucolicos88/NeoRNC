@echo off
echo ========================================
echo   DEPLOY DESENVOLVIMENTO - RNC NEOFORMULA
echo ========================================
echo.

if "%CLASP_USER%"=="" set "CLASP_USER=default"

echo [0/4] Verificando autenticacao do clasp...
call clasp -u %CLASP_USER% deployments >nul 2>&1
if errorlevel 1 (
    echo ERRO: Falha de autenticacao no Google (clasp).
    echo Veja: TROUBLESHOOTING-CLASP.md
    echo Dica: este projeto foi criado por outra conta; tente set CLASP_USER=producao e faca login nela.
    pause
    exit /b 1
)
echo OK!
echo.

echo [1/4] Enviando codigo para Google Apps Script...
call clasp -u %CLASP_USER% push --force
if errorlevel 1 (
    echo ERRO: Falha no push
    pause
    exit /b 1
)
echo OK!
echo.

echo [2/4] Criando nova versao de desenvolvimento...
call clasp -u %CLASP_USER% deploy --deploymentId AKfycbxciMQecCXltv_SY_E_NdEsXOxVz2zxm5XRN88cXEMXFwnWDxYeYsUdec2OnhtNVIT5bg --description "Desenvolvimento - %date% %time%"
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
