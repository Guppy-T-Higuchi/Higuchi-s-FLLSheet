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

## JSON設定（rules.json）

### 基本構造

```json
{
  "missions": [
    {
      "name": "ミッション名",
      "hasPenalty": true,
      "criteria": [...]
    }
  ]
}
```

### 基準の依存関係

複数のチェック項目がある場合、`dependsOn`プロパティで依存関係を設定できます。

**独立した項目（それぞれ点数が付く）:**
```json
{
  "criteria": [
    {
      "description": "条件1",
      "type": "boolean",
      "points": 10
    },
    {
      "description": "条件2",
      "type": "boolean",
      "points": 20
    }
  ]
}
```

**依存関係がある項目（1つ目が「はい」でないと2つ目は無効）:**
```json
{
  "criteria": [
    {
      "description": "条件1",
      "type": "boolean",
      "points": 10
    },
    {
      "description": "条件2（条件1が達成された場合のみ有効）",
      "type": "boolean",
      "points": 20,
      "dependsOn": 0
    }
  ]
}
```

- `dependsOn`: 依存する基準のインデックス（0から始まる）
- 依存元の基準が「はい」でない場合、依存先は自動的に無効化されます
- 無効化された項目は薄く表示され、入力できません

## 注意事項

- `file://`プロトコルで直接開いた場合、JSONの自動読み込みは動作しません（CORS制限）
- ローカルサーバー経由でアクセスするか、JSON読み込みボタンで手動読み込みしてください
- A4横向きに自動的にスケーリングされます（項目数が多い場合）

