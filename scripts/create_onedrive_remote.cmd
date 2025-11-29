@echo off
setlocal

if "%~1"=="" (
  echo Usage: create_onedrive_remote.cmd REMOTE_NAME
  exit /b 1
)

set REMOTE_NAME=%~1

echo === Creation remote OneDrive: %REMOTE_NAME% ===

where rclone >nul 2>&1
if errorlevel 1 (
  echo rclone n'est pas installe ou pas dans le PATH.
  exit /b 1
)

set "RCLONE_CONFIG=%USERPROFILE%\.config\rclone\rclone.conf"

echo Config utilisee: %RCLONE_CONFIG%

rclone config create "%REMOTE_NAME%" onedrive
if errorlevel 1 (
  echo Erreur lors de la creation du remote.
  exit /b 1
)

echo Remote cree avec succes.
rclone listremotes
endlocal
exit /b 0
