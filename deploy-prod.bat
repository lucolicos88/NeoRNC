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
