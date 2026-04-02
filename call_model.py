import base64
import requests
import json

with open('/Users/edy/Documents/个人项目开发/WeiMeng-workflows/PixPin_2026-03-27_11-12-35.png', 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode('utf-8')

data = {
    "model": "qwen-image-2.0-pro",
    "input": {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "image": f"data:image/png;base64,{img_base64}"
                    },
                    {
                        "text": "根据图片中的样式生成春夏秋冬四个季节，和对应配套的衣服"
                    }
                ]
            }
        ]
    },
    "parameters": {
        "n": 4,
        "negative_prompt": " ",
        "prompt_extend": True,
        "watermark": False,
        "size": "2048*2048"
    }
}

response = requests.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-****'
    },
    json=data
)

print(response.text)


"""
(base) edy@edydeMacBook-Pro backend % uv run /Users/edy/Documents/个人项 目开发/WeiMeng-workflows/call_model.py
{"output":{"choices":[{"finish_reason":"stop","message":{"content":[{"image":"https://dashscope-7c2c.oss-accelerate.aliyuncs.com/7d/2e/20260402/f22125ef/8a3a5639-3a9e-4d2e-910d-c817a3809d70.png?Expires=1775668548&OSSAccessKeyId=LTAI5tPxpiCM2hjmWrFXrym1&Signature=edlU%2BWj%2FRxxQ0UxkhEf%2FaoJ%2Bydk%3D"}],"role":"assistant"}}]},"usage":{"height":2048,"image_count":1,"width":2048},"request_id":"5098b4b5-4dfe-9eb4-81af-ac2995830f02"}
(base) edy@edydeMacBook-Pro backend % 
(base) edy@edydeMacBook-Pro backend % 

"""
