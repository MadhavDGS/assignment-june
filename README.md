# Nutrition Extractor

This is a personal project I built to extract nutrition facts and ingredients directly from product images and grade how healthy they are.

Basically, I custom-trained a YOLOv8 model to detect where the text blocks are on the packaging (like the brand logo, net weight, ingredients list, etc). Then I pass those specific cropped areas to EasyOCR to actually read the text. 

Once the text is extracted, the FastAPI backend sends it over to Gemini 3.5 Flash to analyze the ingredients and assign a health grade. 

**Tech Stack:**
- **Frontend**: React (Vite) and TailwindCSS
- **Backend**: FastAPI 
- **AI/ML**: YOLOv8, OpenCV, EasyOCR, Google Gemini API
