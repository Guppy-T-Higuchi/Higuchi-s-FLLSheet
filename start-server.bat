@echo off
echo ローカルサーバーを起動しています...
echo ブラウザで http://localhost:8000 にアクセスしてください
echo サーバーを停止するには Ctrl+C を押してください
python -m http.server 8000
pause

