Write-Host "ローカルサーバーを起動しています..." -ForegroundColor Green
Write-Host "ブラウザで http://localhost:8000 にアクセスしてください" -ForegroundColor Yellow
Write-Host "サーバーを停止するには Ctrl+C を押してください" -ForegroundColor Yellow
python -m http.server 8000

