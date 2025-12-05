
from fastapi import FastAPI, HTTPException
import anthropic
from dotenv import load_dotenv
import os
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal
from google import genai
from PIL import Image
from io import BytesIO
from google.genai import types
import base64

load_dotenv()

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    max_tokens: int
    messages: List[Message]


@app.get("/hello")
async def read_root():
    return {"Hello": "World"}

@app.post("/messages")
async def generate_text(request: ChatRequest):
    try:
        # Anthropic APIを呼び出し
        message = client.messages.create(
            model=request.model,
            max_tokens=request.max_tokens,
            messages=[msg.dict() for msg in request.messages]
        )
        
        return message
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    

class Instance(BaseModel):
    prompt: str = Field(..., description="画像生成のプロンプト")

class Parameters(BaseModel):
    sampleCount: int = Field(1, ge=1, le=8, description="生成する画像の数")
    aspectRatio: Literal["1:1", "9:16", "16:9", "4:3", "3:4"] = Field(
        "1:1", 
        description="画像のアスペクト比"
    )
    safetyFilterLevel: Literal["block_most", "block_some", "block_few"] = Field(
        "block_some",
        description="安全フィルターレベル"
    )
    personGeneration: Literal["allow_adult", "dont_allow"] = Field(
        "allow_adult",
        description="人物生成の許可設定"
    )

class ImageGenerationRequest(BaseModel):
    instances: List[Instance] = Field(..., min_items=1, description="プロンプトのリスト")
    parameters: Parameters = Field(..., description="生成パラメータ")

google_client = genai.Client(api_key=os.environ.get("GOOGLE_GENAI_API_KEY"))

@app.post("/generate")
async def generate_image(request: ImageGenerationRequest):
    prompt = request.instances[0].prompt

    try :
        response = google_client.models.generate_images(
            model='imagen-4.0-generate-001',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images= request.parameters.sampleCount,
                aspect_ratio= request.parameters.aspectRatio,   
            )
        )

        generated_image = response.generated_images[0]

        # MIMEタイプを取得(通常は 'image/jpeg' など)
        mime_type = generated_image.image.mime_type
        print(generate_image)
        image_base64 = base64.b64encode(generated_image.image.image_bytes).decode('utf-8')

        return {
            "predictions" :[
                {
                    "bytesBase64Encoded": image_base64,
                    "mimeType": mime_type
                }
            ]
        }
    except Exception as e:
        print(e)
        # 画像が生成されなかった場合
        return {"error": "画像が生成されませんでした"}

