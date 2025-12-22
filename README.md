# 樋口式FLLスコアシート

FIRST LEGO LEAGUE CHALLENGE用の練習用スコア計算ツール

## 使い方

### 方法1: ローカルサーバーを使用（推奨）

1. **Pythonがインストールされている場合:**
   - `start-server.bat`（Windows）をダブルクリック
   - または、コマンドプロンプトで以下を実行:
     ```
     python -m http.server 8000
     ```
   - ブラウザで `http://localhost:8000` にアクセス

2. **Node.jsがインストールされている場合:**
   - コマンドプロンプトで以下を実行:
     ```
     npx serve
     ```
   - または:
     ```
     npx http-server
     ```

### 方法2: JSON読み込みボタンを使用

1. `index.html`をブラウザで直接開く（`file://`プロトコル）
2. 「JSON読み込み」ボタンをクリック
3. `rules.json`ファイルを選択

## ファイル構成

- `index.html` - メインのHTMLファイル
- `app.js` - アプリケーションロジック
- `styles.css` - スタイルシート
- `rules.json` - ルール定義ファイル
- `title.png` - タイトル画像

## 注意事項

- `file://`プロトコルで直接開いた場合、JSONの自動読み込みは動作しません（CORS制限）
- ローカルサーバー経由でアクセスするか、JSON読み込みボタンで手動読み込みしてください

