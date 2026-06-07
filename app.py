import ssl
import cv2
import easyocr
import re
import base64
import numpy as np
import os
import json
from dotenv import load_dotenv
from google import genai
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

load_dotenv(override=True)
ssl._create_default_https_context = ssl._create_unverified_context

api_key = os.getenv("GEMINI_API_KEY")
print(f"Loaded API Key: {'YES' if api_key else 'NO'}")

app = FastAPI(
    title="Product Nutrition API",
    description="Backend service for extracting nutritional information from product images and providing AI-based health analysis.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR and YOLO models
reader = easyocr.Reader(['en'])
model = YOLO("best.pt")

class GradeRequest(BaseModel):
    brand: str | None = None
    net_weight: str | None = None
    ingredients: str | None = None
    nutrition: str | None = None

class AnalyzeResponse(BaseModel):
    brand: str | None = None
    net_weight: str | None = None
    ingredients: str | None = None
    nutrition: str | None = None
    front_annotated: str | None = None
    back_annotated: str | None = None

class GradeResponse(BaseModel):
    health_grade: str | None = None
    health_explanation: str | None = None

class ErrorResponse(BaseModel):
    error: str

@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"], summary="Analyze Product Packaging Images")
async def analyze(
    front_image: UploadFile | None = File(None),
    back_image: UploadFile | None = File(None)
):
    product_data = {
        "brand": None,
        "net_weight": None,
        "ingredients": None,
        "nutrition": None,
        "front_annotated": None,
        "back_annotated": None
    }
    
    images = {}
    if front_image:
        images["front"] = await front_image.read()
    if back_image:
        images["back"] = await back_image.read()
        
    if not images:
        return {"error": "No images provided"}

    for side, image_bytes in images.items():
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            continue
            
        results = model([img])
        
        annotated_img = results[0].plot()
        _, buffer = cv2.imencode('.jpg', annotated_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        if side == "front":
            product_data["front_annotated"] = f"data:image/jpeg;base64,{img_base64}"
        else:
            product_data["back_annotated"] = f"data:image/jpeg;base64,{img_base64}"
        
        for result in results:
            for box in result.boxes:
                coords = box.xyxy[0].tolist()
                class_id = int(box.cls[0].item())
                class_name = model.names[class_id]
                
                # Extract region of interest (ROI) from the bounding box
                x1, y1, x2, y2 = map(int, coords)
                roi = img[y1:y2, x1:x2]
                
                if class_name.startswith("Brand_"):
                    # We can run OCR here, but the YOLO class name itself identifies the brand.
                    # This dynamic replacement ensures the code scales to hundreds of new brands automatically.
                    product_data["brand"] = class_name.replace("Brand_", "").capitalize()
                    
                elif class_name in ["Net_wt", "Net_wts"]:
                    # Upscale image before processing to improve text recognition
                    roi_upscaled = cv2.resize(roi, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
                    roi_gray = cv2.cvtColor(roi_upscaled, cv2.COLOR_BGR2GRAY)
                    ocr_results = reader.readtext(roi_gray)
                    raw_text = " ".join([t[1] for t in ocr_results])
                    product_data["net_weight"] = raw_text
                    
                elif class_name == "ingredients":
                    roi_upscaled = cv2.resize(roi, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
                    roi_gray = cv2.cvtColor(roi_upscaled, cv2.COLOR_BGR2GRAY)
                    ocr_results = reader.readtext(roi_gray)
                    raw_text = " ".join([t[1] for t in ocr_results])
                    product_data["ingredients"] = raw_text
                    
                elif class_name == "Nutrition":
                    roi_upscaled = cv2.resize(roi, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
                    roi_gray = cv2.cvtColor(roi_upscaled, cv2.COLOR_BGR2GRAY)
                    ocr_results = reader.readtext(roi_gray)
                    raw_text = " ".join([t[1] for t in ocr_results])
                    product_data["nutrition"] = raw_text

    return product_data

@app.post("/grade", response_model=GradeResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}, tags=["AI Grading"], summary="Get AI Health Grade via Gemini")
async def grade_product(req: GradeRequest):
    if not api_key:
        return JSONResponse(content={"error": "API Key not configured"})
        
    if not req.ingredients and not req.nutrition:
        return JSONResponse(content={"error": "No data provided"})
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
You are an expert nutritionist. Review the following product data:
Brand: {req.brand or 'Unknown'}
Net Weight: {req.net_weight or 'Unknown'}
Ingredients: {req.ingredients or 'None found'}
Nutrition: {req.nutrition or 'None found'}

Provide a Health Grade (A, B, C, D, or F) and a 1 to 2 sentence explanation of why.
Return ONLY a valid JSON object in this format:
{{"grade": "B", "explanation": "Your explanation here."}}
"""
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        # Clean markdown formatting from the Gemini response to parse JSON
        response_text = response.text.replace('```json', '').replace('```', '').strip()
        grade_data = json.loads(response_text)
        return {
            "health_grade": grade_data.get("grade"),
            "health_explanation": grade_data.get("explanation")
        }
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
