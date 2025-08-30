@echo off
echo ================================================================
echo          DEMARRAGE PROPRE DE MACROEDITOR
echo ================================================================

echo [1/5] Arret de toutes les instances Electron...
taskkill /F /IM electron.exe >nul 2>&1

echo [2/5] Suppression du cache de compilation...
rmdir /S /Q dist >nul 2>&1

echo [3/5] Recompilation complete...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: La compilation a echoue!
    pause
    exit /b 1
)

echo [4/5] Attente de 2 secondes...
timeout /t 2 /nobreak >nul

echo [5/5] Lancement de MacroEditor...
echo ================================================================
echo Application demarre! Regardez les logs ci-dessous:
echo ================================================================
npm run electron
