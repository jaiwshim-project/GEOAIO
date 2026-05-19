# axbiz.tistory.com 자동 발행 — Windows 작업 스케줄러 등록
# 실행: PowerShell (관리자)에서 .\scripts\setup-task-scheduler.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$PublisherScript = Join-Path $ScriptDir "axbiz-auto-publisher.js"

$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    Write-Error "Node.js가 설치되지 않았습니다."
    exit 1
}

$Action = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument "`"$PublisherScript`"" `
    -WorkingDirectory $ProjectDir

$Trigger = New-ScheduledTaskTrigger -Daily -At "09:00"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

Register-ScheduledTask `
    -TaskName "axbiz-tistory-auto-publish" `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "axbiz.tistory.com 백링크 포스트 자동 발행 (매일 9:00)" `
    -RunLevel Highest `
    -Force

Write-Host "✅ 작업 스케줄러 등록 완료: axbiz-tistory-auto-publish"
Write-Host "   매일 오전 9:00에 자동 실행됩니다."
Write-Host ""
Write-Host "확인: Get-ScheduledTask -TaskName 'axbiz-tistory-auto-publish'"
Write-Host "수동 실행: Start-ScheduledTask -TaskName 'axbiz-tistory-auto-publish'"
Write-Host "삭제: Unregister-ScheduledTask -TaskName 'axbiz-tistory-auto-publish' -Confirm:`$false"
