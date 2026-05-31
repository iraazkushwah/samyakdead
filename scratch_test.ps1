Get-Content -Path app.js | Select-String -Pattern "ocr","iframe" | Out-String | Write-Host
