# API プロキシサーバー実装例

このドキュメントでは、Claude APIとGemini APIのプロキシサーバーの実装例を示します。

## 必要な環境変数

プロキシサーバー側で以下の環境変数を設定してください：

```bash
# Claude API
CLAUDE_API_KEY=your_claude_api_key_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
```

## Claude API プロキシ

### Node.js + Express の実装例

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 8000;

// 環境変数から設定を読み込み
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// CORS設定
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Claude APIエンドポイント
app.post('/messages', async (req, res) => {
  try {
    console.log('📥 Received Claude API request');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Claude API error:', errorData);
      return res.status(response.status).json(errorData);
    }
    
    const data = await response.json();
    console.log('✅ Claude API response received');
    res.json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Claude proxy server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${!!CLAUDE_API_KEY}`);
});
```

### Python + Flask の実装例

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173'])

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

@app.route('/messages', methods=['POST'])
def claude_messages():
    try:
        print('📥 Received Claude API request')
        
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            json=request.json
        )
        
        if not response.ok:
            print(f'❌ Claude API error: {response.status_code}')
            return jsonify(response.json()), response.status_code
        
        print('✅ Claude API response received')
        return jsonify(response.json())
        
    except Exception as e:
        print(f'❌ Proxy error: {str(e)}')
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print(f'🚀 Claude proxy server running on http://localhost:8000')
    print(f'🔑 API Key configured: {bool(CLAUDE_API_KEY)}')
    app.run(host='0.0.0.0', port=8000, debug=True)
```

## Gemini API プロキシ

## Node.js + Express の実装例

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 8001;

// 環境変数から設定を読み込み
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const MODEL = 'imagen-3.0-generate-001';

// CORS設定
app.use(cors({
  origin: 'http://localhost:5173', // Vite開発サーバーのURL
  credentials: true
}));

app.use(express.json());

// 画像生成エンドポイント
app.post('/generate', async (req, res) => {
  try {
    console.log('📥 Received image generation request');
    
    // Gemini APIエンドポイント
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL}:predict`;
    
    // Gemini APIにリクエストを転送
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error:', errorData);
      return res.status(response.status).json(errorData);
    }
    
    const data = await response.json();
    console.log('✅ Image generated successfully');
    res.json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Gemini proxy server running on http://localhost:${PORT}`);
  console.log(`📝 Project ID: ${PROJECT_ID}`);
  console.log(`🔑 API Key configured: ${!!GEMINI_API_KEY}`);
});
```

## Python + Flask の実装例

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173'])

# 環境変数から設定を読み込み
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
MODEL = 'imagen-3.0-generate-001'

@app.route('/generate', methods=['POST'])
def generate_image():
    try:
        print('📥 Received image generation request')
        
        # Gemini APIエンドポイント
        endpoint = f'https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/{MODEL}:predict'
        
        # Gemini APIにリクエストを転送
        response = requests.post(
            endpoint,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GEMINI_API_KEY}'
            },
            json=request.json
        )
        
        if not response.ok:
            print(f'❌ Gemini API error: {response.status_code}')
            return jsonify(response.json()), response.status_code
        
        print('✅ Image generated successfully')
        return jsonify(response.json())
        
    except Exception as e:
        print(f'❌ Proxy error: {str(e)}')
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print(f'🚀 Gemini proxy server running on http://localhost:8001')
    print(f'📝 Project ID: {PROJECT_ID}')
    print(f'🔑 API Key configured: {bool(GEMINI_API_KEY)}')
    app.run(host='0.0.0.0', port=8001, debug=True)
```

## 起動方法

### Node.js版

```bash
# 依存関係のインストール
npm install express cors node-fetch

# 環境変数を設定して起動
GEMINI_API_KEY=your_key GOOGLE_CLOUD_PROJECT_ID=your_project node server.js
```

### Python版

```bash
# 依存関係のインストール
pip install flask flask-cors requests

# 環境変数を設定して起動
GEMINI_API_KEY=your_key GOOGLE_CLOUD_PROJECT_ID=your_project python server.py
```

## セキュリティ上の注意

1. **APIキーの保護**: APIキーは必ず環境変数で管理し、コードにハードコードしないでください
2. **CORS設定**: 本番環境では、適切なオリジンのみを許可してください
3. **レート制限**: 必要に応じてレート制限を実装してください
4. **ログ**: 本番環境では、機密情報をログに出力しないように注意してください

## トラブルシューティング

### 認証エラー (401/403)
- APIキーが正しく設定されているか確認
- Vertex AI APIが有効化されているか確認
- プロジェクトIDが正しいか確認

### CORS エラー
- プロキシサーバーのCORS設定を確認
- フロントエンドのURLが許可されているか確認

### タイムアウト
- Gemini APIは画像生成に時間がかかる場合があります
- プロキシサーバーのタイムアウト設定を調整してください
