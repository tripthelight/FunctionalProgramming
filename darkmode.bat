@echo off
echo [🔄 다크 모드로 설정 중...]

:: 레지스트리 값 변경
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v AppsUseLightTheme /t REG_DWORD /d 0 /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v SystemUsesLightTheme /t REG_DWORD /d 0 /f >nul

:: 탐색기 재시작 (적용 시도)
echo 탐색기 재시작 중...
taskkill /f /im explorer.exe >nul
start explorer.exe

echo 다크 모드 설정이 완료되었습니다. 일부 앱은 다시 실행해야 적용됩니다.
pause