# Nutrition Extractor AI

An end-to-end computer vision and LLM application that extracts nutritional information from product packaging and generates an AI-powered health analysis.

## Architecture Overview

This project is built using a decoupled architecture:
- **Frontend**: React (Vite), TailwindCSS, Framer Motion for dynamic animations.
- **Backend API**: FastAPI.
- **Computer Vision Pipeline**:
  - **YOLOv8**: Custom-trained model to detect specific regions of interest (ROIs) on packaging, such as the `Brand`, `Net Weight`, `Ingredients`, and `Nutrition Facts` blocks.
  - **EasyOCR**: Optical Character Recognition to extract text from the detected YOLO regions. OpenCV is used for preprocessing (upscaling, grayscaling) to improve OCR accuracy.
- **AI Analytics Layer**: 
  - **Google Gemini 3.5 Flash**: Evaluates the extracted ingredients and nutrition data, combined with brand context, to assign a comprehensive health grade (A-F) with a reasoning summary.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js & npm

### Backend Setup
1. Clone the repository and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set your environment variables by creating a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Ensure the custom YOLO model (`best.pt`) is in the root directory.
4. Start the FastAPI server:
   ```bash
   uvicorn app:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Architectural Trade-offs & Deployment Constraints

When scaling or deploying this application to production, there are a few engineering decisions and constraints to keep in mind:

- **Compute & Memory Limits**: The combination of FastAPI, YOLOv8 inference, and EasyOCR is computationally heavy. Deploying this stack on a free-tier PaaS (like Render's 512MB RAM tier) will likely result in an Out-Of-Memory (OOM) error.
- **OCR Limitations**: EasyOCR struggles on highly curved or reflective packaging (like glossy wrappers or glass bottles). 
- **Future Optimizations**: For production deployment under strict memory constraints, the local YOLO/EasyOCR pipeline should be offloaded to a dedicated GPU instance, or the OCR pipeline should be replaced entirely by a multimodal cloud vision API (e.g., Gemini 1.5 Pro Vision or AWS Textract) to remove the massive local memory overhead.

## API Documentation

The backend endpoints are strictly typed using Pydantic models. Once the backend is running, you can visit the interactive Swagger UI to view the API schema at:
`http://127.0.0.1:8000/docs`
