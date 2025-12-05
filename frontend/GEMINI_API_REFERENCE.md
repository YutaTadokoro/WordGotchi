# Gemini API (Imagen) リファレンス

このドキュメントでは、WordGotchiで使用するGemini Imagen APIのリクエストとレスポンスの詳細を説明します。

## エンドポイント

### 本番API
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict
```

### プロキシ経由（WordGotchiの実装）
```
POST {PROXY_ENDPOINT}/generate
```

## リクエスト

### ヘッダー

**本番API（プロキシサーバーが送信）:**
```http
Content-Type: application/json
Authorization: Bearer {GEMINI_API_KEY}
```

**フロントエンド → プロキシ:**
```http
Content-Type: application/json
```

### リクエストボディ

```json
{
  "instances": [
    {
      "prompt": "Abstract digital art, radiant and uplifting atmosphere, featuring golden yellow, bright orange, warm amber colors with soft pink, light cream accents, flowing organic shapes, ethereal and dreamlike, high quality, artistic, emotional expression"
    }
  ],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "1:1",
    "safetyFilterLevel": "block_some",
    "personGeneration": "allow_adult"
  }
}
```

### パラメータ説明

| パラメータ | 型 | 説明 |
|----------|-----|------|
| `instances[].prompt` | string | 画像生成のためのテキストプロンプト |
| `parameters.sampleCount` | number | 生成する画像の数（1-8） |
| `parameters.aspectRatio` | string | アスペクト比（"1:1", "9:16", "16:9", "4:3", "3:4"） |
| `parameters.safetyFilterLevel` | string | 安全フィルターレベル（"block_most", "block_some", "block_few"） |
| `parameters.personGeneration` | string | 人物生成の許可（"allow_adult", "dont_allow"） |

### プロンプト例

WordGotchiでは感情に基づいて以下のようなプロンプトを生成します：

**喜び (Joy):**
```
Abstract digital art, radiant and uplifting atmosphere, 
featuring golden yellow, bright orange, warm amber colors 
with soft pink, light cream accents, flowing organic shapes, 
ethereal and dreamlike, high quality, artistic, emotional expression
```

**悲しみ (Sadness):**
```
Abstract digital art, melancholic and contemplative atmosphere, 
featuring deep blue, purple, indigo colors with soft grey, 
muted lavender accents, flowing organic shapes, ethereal and dreamlike, 
high quality, artistic, emotional expression
```

**怒り (Anger):**
```
Abstract digital art, intense and fiery atmosphere, 
featuring crimson red, dark orange, burnt sienna colors 
with black, charcoal grey accents, flowing organic shapes, 
ethereal and dreamlike, high quality, artistic, emotional expression
```

## レスポンス

### 成功時のレスポンス

```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "iVBORw0KGgoAAAANSUhEUgAAA...(base64エンコードされた画像データ)...",
      "mimeType": "image/png"
    }
  ],
  "deployedModelId": "imagen-3.0-generate-001",
  "model": "projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001",
  "modelDisplayName": "Imagen 3.0",
  "modelVersionId": "1"
}
```

### レスポンスフィールド

| フィールド | 型 | 説明 |
|----------|-----|------|
| `predictions` | array | 生成された画像の配列 |
| `predictions[].bytesBase64Encoded` | string | Base64エンコードされた画像データ |
| `predictions[].mimeType` | string | 画像のMIMEタイプ（通常は "image/png"） |
| `deployedModelId` | string | 使用されたモデルID |
| `model` | string | モデルの完全なパス |
| `modelDisplayName` | string | モデルの表示名 |
| `modelVersionId` | string | モデルのバージョンID |

### エラーレスポンス

```json
{
  "error": {
    "code": 400,
    "message": "Invalid prompt: prompt contains prohibited content",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        "fieldViolations": [
          {
            "field": "instances[0].prompt",
            "description": "Prompt violates content policy"
          }
        ]
      }
    ]
  }
}
```

### エラーコード

| コード | 説明 |
|-------|------|
| 400 | 不正なリクエスト（プロンプトが無効、パラメータエラーなど） |
| 401 | 認証エラー（APIキーが無効） |
| 403 | 権限エラー（APIが有効化されていない、プロジェクトIDが無効など） |
| 429 | レート制限超過 |
| 500 | サーバーエラー |
| 503 | サービス一時停止 |

## WordGotchiでの使用例

### 1. フロントエンド → プロキシ

```typescript
// src/services/GeminiClient.ts
const response = await fetch(`${this.config.endpoint}/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    instances: [
      {
        prompt: "Abstract digital art, radiant and uplifting atmosphere...",
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_some',
      personGeneration: 'allow_adult',
    }
  }),
});

const data = await response.json();
const imageBase64 = data.predictions[0].bytesBase64Encoded;
```

### 2. プロキシサーバー → Gemini API

```javascript
// プロキシサーバー (Node.js)
app.post('/generate', async (req, res) => {
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify(req.body)
  });
  
  const data = await response.json();
  res.json(data);
});
```

## 画像の使用

生成された画像はBase64エンコードされているため、以下のように使用できます：

```typescript
// Base64データをData URLに変換
const imageUrl = `data:image/png;base64,${imageBase64}`;

// HTMLで表示
<img src={imageUrl} alt="Generated art" />
```

## パフォーマンス

- **生成時間**: 通常5-15秒
- **タイムアウト**: 60秒（WordGotchiの設定）
- **リトライ**: 最大2回（WordGotchiの設定）
- **画像サイズ**: 1024x1024ピクセル（1:1の場合）

## レート制限

Gemini APIのレート制限は以下の通りです（プロジェクトによって異なる場合があります）：

- **リクエスト数**: 60リクエスト/分
- **画像生成数**: 60画像/分

レート制限に達した場合は、429エラーが返されます。

## セキュリティ

- APIキーは必ずプロキシサーバー側で管理
- フロントエンドにAPIキーを含めない
- プロンプトの内容をサニタイズ（必要に応じて）
- 生成された画像のコンテンツポリシー違反をチェック

## トラブルシューティング

### 認証エラー (401/403)
- APIキーが正しいか確認
- Vertex AI APIが有効化されているか確認
- プロジェクトIDが正しいか確認
- サービスアカウントに適切な権限があるか確認

### タイムアウト
- プロンプトが複雑すぎる可能性
- ネットワーク接続を確認
- タイムアウト時間を延長（60秒以上）

### コンテンツポリシー違反
- プロンプトの内容を確認
- 禁止されているキーワードを削除
- より抽象的な表現に変更

## 参考リンク

- [Vertex AI Imagen API ドキュメント](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Imagen API リファレンス](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/imagen)
- [Google Cloud Console](https://console.cloud.google.com/)
