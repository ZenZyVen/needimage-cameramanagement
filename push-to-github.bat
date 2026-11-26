@echo off
title Push CineVault to GitHub
echo ========================================================
echo   Pushing CineVault to GitHub
echo   Repository: https://github.com/ZenZyVen/needimage-cameramanagement.git
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code pushed to GitHub successfully!
) else (
    echo [ERROR] Push failed. Please check your GitHub credentials or permissions.
)
pause
