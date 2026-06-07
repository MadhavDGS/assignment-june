import ssl
# Fix for macOS: Bypass SSL certificate verification for downloading EasyOCR models
ssl._create_default_https_context = ssl._create_unverified_context
import re
import cv2
import easyocr
# ... rest of your code

from ultralytics import YOLO

# ---------------------------------------------------------
# Step 1: Initialize the OCR Reader
# Initialize the reader once and keep the variable in memory.
# ---------------------------------------------------------
print("Initializing EasyOCR...")
reader = easyocr.Reader(['en']) 

# ---------------------------------------------------------
# Step 2: Define Front and Back Images
# ---------------------------------------------------------
# Create a dictionary of the images to process.
# This simulates a real pipeline where a user provides a front and back image.
images_to_process = {
    "Front": "front_en.3.full-5.jpg",       # Target front image
    "Back": "nutrition_en.7.full.jpg"       # Target back image
}

print("Loading YOLO model...")
model = YOLO("best.pt")

for side, image_path in images_to_process.items():
    print(f"\n==========================================")
    print(f"Processing {side} of packaging ({image_path})")
    print(f"==========================================")
    
    # Load the image into a numpy array via OpenCV
    img = cv2.imread(image_path)
    
    if img is None:
        print(f"Error: Could not load image at {image_path}")
        continue

    # Run inference. (YOLO accepts OpenCV numpy arrays directly)
    results = model([img])

    # ---------------------------------------------------------
    # Step 3: Parse the Bounding Boxes
    # ---------------------------------------------------------
    for result in results:
        # Save the full image with all detected bounding boxes drawn on it
        output_filename = f"detected_{side.lower()}.jpg"
        result.save(filename=output_filename)
        print(f"Saved full detection image to {output_filename}")
        
        boxes = result.boxes
        
        for box in boxes:
            coords = box.xyxy[0].tolist()
            x1, y1, x2, y2 = [int(c) for c in coords]
            
            class_id = int(box.cls[0].item())
            class_name = model.names[class_id]
            
            roi = img[y1:y2, x1:x2]
            
            # ---------------------------------------------------------
            # Step 3.5: Smart Class Filtering
            # ---------------------------------------------------------
            if class_name.startswith("Brand_"):
                cv2.imwrite("cropped_brand.jpg", roi)
                brand_name = class_name.replace("Brand_", "").capitalize()
                print(f"\n--- Detected Brand: {brand_name} (Skipping OCR to save compute) ---")
                continue
                
            elif class_name == "Net_wt":
                cv2.imwrite("cropped_net_wt.jpg", roi)
                print(f"\n--- Detected ROI: Net Weight (Running OCR...) ---")
                roi_upscaled = cv2.resize(roi, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
                roi_gray = cv2.cvtColor(roi_upscaled, cv2.COLOR_BGR2GRAY)
                ocr_results = reader.readtext(roi_gray)
                for (bbox, text, confidence) in ocr_results:
                    print(f"Extracted Weight: '{text}' (Confidence: {confidence:.2f})")
                continue
                
            elif class_name == "ingredients":
                cv2.imwrite("cropped_ingredients.jpg", roi)
                print(f"\n--- Detected ROI: Ingredients (Skipping OCR for this demo) ---")
                continue
                
            elif class_name != "Nutrition":
                continue
                
            cv2.imwrite("cropped_Nutrition.jpg", roi)
            print(f"\n--- Detected ROI: {class_name} (Running OCR...) ---")
            
            # ---------------------------------------------------------
            # Step 4: Extract Region of Interest (ROI) & Preprocess
            # ---------------------------------------------------------
            roi_upscaled = cv2.resize(roi, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
            roi_gray = cv2.cvtColor(roi_upscaled, cv2.COLOR_BGR2GRAY)
            
            # ---------------------------------------------------------
            # Step 5: Read Text from the ROI
            # ---------------------------------------------------------
            ocr_results = reader.readtext(roi_gray)
            
            if not ocr_results:
                print("EasyOCR ran, but no text was confident enough to be returned.")
                
            for (bbox, text, confidence) in ocr_results:
                print(f"Extracted Text: '{text}' (Confidence: {confidence:.2f})")
                
            # ---------------------------------------------------------
            # Step 6: Parse Specific Nutritional Data (Improved)
            # ---------------------------------------------------------
            print("\n--- Structured Data Extraction ---")
            all_text = " ".join([text for (bbox, text, confidence) in ocr_results]).lower()
            
            match = re.search(r'calor.*?(\d+)', all_text)
            
            if match:
                calories_found = match.group(1)
                print(f"SUCCESS: Product contains {calories_found} Calories.")
            else:
                print("FAILURE: Could not confidently determine Calories.")
