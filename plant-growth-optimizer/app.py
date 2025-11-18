from flask import Flask, request, jsonify, send_from_directory
import os
from PIL import Image

app = Flask(__name__)

class PlantGrowthModel:
    def __init__(self):
        self.plant_ranges = {
            'Tomato': {'light': (800, 1500), 'humidity': (50, 70), 'temp': (20, 28), 'moisture': (40, 60)},
            'Lettuce': {'light': (600, 1200), 'humidity': (60, 80), 'temp': (15, 22), 'moisture': (50, 70)},
            'Basil': {'light': (700, 1300), 'humidity': (50, 70), 'temp': (18, 26), 'moisture': (40, 60)},
            'Rose': {'light': (1000, 1800), 'humidity': (40, 60), 'temp': (18, 25), 'moisture': (35, 55)},
            'Succulent': {'light': (1000, 2000), 'humidity': (30, 50), 'temp': (20, 30), 'moisture': (20, 40)},
            'Orchid': {'light': (500, 1000), 'humidity': (50, 80), 'temp': (18, 24), 'moisture': (30, 50)}
        }
        
    def predict_health(self, light, humidity, temperature, moisture, plant_type):
        """Simple rule-based health prediction"""
        if plant_type not in self.plant_ranges:
            return 'unknown', 0.8
            
        ranges = self.plant_ranges[plant_type]
        
        optimal_count = 0
        total_params = 4
        
        if ranges['light'][0] <= light <= ranges['light'][1]:
            optimal_count += 1
        if ranges['humidity'][0] <= humidity <= ranges['humidity'][1]:
            optimal_count += 1
        if ranges['temp'][0] <= temperature <= ranges['temp'][1]:
            optimal_count += 1
        if ranges['moisture'][0] <= moisture <= ranges['moisture'][1]:
            optimal_count += 1
            
        confidence = optimal_count / total_params
        
        if optimal_count == 4:
            return 'optimal', confidence
        elif optimal_count >= 2:
            return 'warning', confidence
        else:
            return 'critical', confidence

class FileAnalyzer:
    def __init__(self):
        self.plant_keywords = {
            'Tomato': ['tomato', 'solanum lycopersicum', 'nightshade', 'fruit', 'vegetable'],
            'Lettuce': ['lettuce', 'lactuca sativa', 'leafy', 'green', 'salad'],
            'Basil': ['basil', 'ocimum basilicum', 'herb', 'aromatic', 'culinary'],
            'Rose': ['rose', 'rosa', 'flower', 'thorn', 'fragrant'],
            'Succulent': ['succulent', 'cactus', 'desert', 'drought', 'fleshy'],
            'Orchid': ['orchid', 'orchidaceae', 'flower', 'tropical', 'epiphyte']
        }
        
        self.health_indicators = {
            'good': ['healthy', 'green', 'vibrant', 'thriving', 'lush', 'strong'],
            'warning': ['yellow', 'wilting', 'drooping', 'spots', 'pale', 'weak'],
            'critical': ['brown', 'dying', 'dead', 'rotten', 'infected', 'pests']
        }
    
    def analyze_image(self, image_file):
        """Analyze plant image for basic information"""
        try:
            # Get file size first
            image_file.seek(0, 2)  # Seek to end
            file_size = image_file.tell()
            image_file.seek(0)  # Reset to beginning
            
            image = Image.open(image_file)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Basic image analysis
            analysis = {
                'filename': image_file.filename,
                'file_type': 'image',
                'dimensions': f"{image.width}x{image.height}",
                'size_kb': round(file_size / 1024, 2)
            }
            
            # Basic color analysis (simplified)
            rgb_image = image.convert('RGB')
            pixels = list(rgb_image.getdata())
            green_pixels = sum(1 for r, g, b in pixels if g > r and g > b and g > 100)
            total_pixels = len(pixels)
            green_ratio = green_pixels / total_pixels if total_pixels > 0 else 0
            
            analysis['green_ratio'] = round(green_ratio, 3)
            
            if green_ratio > 0.3:
                analysis['health_indicators'] = ['healthy_green_color']
                analysis['recommendations'] = ['Plant appears healthy based on color analysis']
            elif green_ratio > 0.1:
                analysis['health_indicators'] = ['moderate_green_color']
                analysis['recommendations'] = ['Plant may need more nutrients or light']
            else:
                analysis['health_indicators'] = ['low_green_color']
                analysis['recommendations'] = ['Plant shows signs of stress - check watering and light conditions']
            
            analysis['analysis_text'] = f"Image analysis: {analysis['dimensions']}, Green ratio: {analysis['green_ratio']}"
            
            return analysis
            
        except Exception as e:
            return {
                'filename': image_file.filename,
                'file_type': 'image',
                'error': f"Image analysis failed: {str(e)}"
            }
    
    def analyze_text_file(self, text_file):
        """Analyze text file for plant information"""
        try:
            text = text_file.read().decode('utf-8')
            
            analysis = {
                'filename': text_file.filename,
                'file_type': 'text',
                'extracted_text': text.lower()[:500] + "..." if len(text) > 500 else text.lower()
            }
            
            analysis.update(self.analyze_text_content(text))
            
            return analysis
            
        except Exception as e:
            return {
                'filename': text_file.filename,
                'file_type': 'text',
                'error': f"Text analysis failed: {str(e)}"
            }
    
    def analyze_text_content(self, text):
        """Analyze text content for plant-related information"""
        text_lower = text.lower()
        analysis = {}
        
        # Detect plant type
        detected_plants = []
        for plant_type, keywords in self.plant_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_plants.append(plant_type)
        
        if detected_plants:
            analysis['plant_type_detected'] = ', '.join(detected_plants)
        
        # Detect health indicators
        health_indicators = []
        for health_status, indicators in self.health_indicators.items():
            found_indicators = [indicator for indicator in indicators if indicator in text_lower]
            if found_indicators:
                health_indicators.extend(found_indicators)
        
        if health_indicators:
            analysis['health_indicators'] = health_indicators
        
        # Generate recommendations based on analysis
        recommendations = []
        if 'yellow' in text_lower:
            recommendations.append("Yellow leaves may indicate overwatering or nutrient deficiency")
        if 'brown' in text_lower:
            recommendations.append("Brown spots could indicate fungal infection or sunburn")
        if 'wilting' in text_lower or 'drooping' in text_lower:
            recommendations.append("Wilting may indicate underwatering or root issues")
        if 'pests' in text_lower:
            recommendations.append("Pest infestation detected - consider organic pest control")
        
        if recommendations:
            analysis['recommendations'] = recommendations
        
        analysis['analysis_text'] = self.generate_analysis_summary(detected_plants, health_indicators)
        
        return analysis
    
    def generate_analysis_summary(self, plants, health_indicators):
        """Generate a summary of the analysis"""
        summary_parts = []
        
        if plants:
            summary_parts.append(f"Detected plant types: {', '.join(plants)}")
        else:
            summary_parts.append("No specific plant type detected in text")
        
        if health_indicators:
            if any(ind in ['healthy', 'green', 'vibrant'] for ind in health_indicators):
                summary_parts.append("Text suggests plant is in good health")
            elif any(ind in ['yellow', 'wilting', 'spots'] for ind in health_indicators):
                summary_parts.append("Text indicates some plant stress")
            elif any(ind in ['brown', 'dying', 'dead'] for ind in health_indicators):
                summary_parts.append("Text suggests critical plant health issues")
        
        return ' '.join(summary_parts) if summary_parts else "Limited plant information found in text"

# Initialize models
model = PlantGrowthModel()
file_analyzer = FileAnalyzer()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/analyze', methods=['POST'])
def analyze_plant_data():
    try:
        data = request.json
        
        light = float(data.get('light', 0))
        humidity = float(data.get('humidity', 0))
        temperature = float(data.get('temperature', 0))
        moisture = float(data.get('moisture', 0))
        plant_type = data.get('plant_type', 'Tomato')
        
        health_status, confidence = model.predict_health(light, humidity, temperature, moisture, plant_type)
        
        recommendations = generate_recommendations(light, humidity, temperature, moisture, plant_type)
        
        return jsonify({
            "status": "success",
            "health_status": health_status,
            "confidence": confidence,
            "recommendations": recommendations
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/analyze-files', methods=['POST'])
def analyze_uploaded_files():
    try:
        if 'files' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No files uploaded"
            }), 400
        
        files = request.files.getlist('files')
        plant_type = request.form.get('plant_type', 'Unknown')
        
        if not files or all(file.filename == '' for file in files):
            return jsonify({
                "status": "error",
                "message": "No files selected"
            }), 400
        
        analysis_results = []
        
        for file in files:
            if file.filename == '':
                continue
                
            file_extension = file.filename.lower().split('.')[-1]
            
            if file_extension in ['jpg', 'jpeg', 'png']:
                result = file_analyzer.analyze_image(file)
            elif file_extension == 'txt':
                result = file_analyzer.analyze_text_file(file)
            else:
                result = {
                    'filename': file.filename,
                    'file_type': 'unsupported',
                    'error': f"Unsupported file type: {file_extension}. Supported: JPG, PNG, TXT"
                }
            
            analysis_results.append(result)
        
        return jsonify({
            "status": "success",
            "analysis": analysis_results
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def generate_recommendations(light, humidity, temperature, moisture, plant_type):
    recommendations = []
    
    optimal_ranges = {
        'Tomato': {'light': (800, 1500), 'humidity': (50, 70), 'temp': (20, 28), 'moisture': (40, 60)},
        'Lettuce': {'light': (600, 1200), 'humidity': (60, 80), 'temp': (15, 22), 'moisture': (50, 70)},
        'Basil': {'light': (700, 1300), 'humidity': (50, 70), 'temp': (18, 26), 'moisture': (40, 60)},
        'Rose': {'light': (1000, 1800), 'humidity': (40, 60), 'temp': (18, 25), 'moisture': (35, 55)},
        'Succulent': {'light': (1000, 2000), 'humidity': (30, 50), 'temp': (20, 30), 'moisture': (20, 40)},
        'Orchid': {'light': (500, 1000), 'humidity': (50, 80), 'temp': (18, 24), 'moisture': (30, 50)}
    }
    
    ranges = optimal_ranges.get(plant_type, optimal_ranges['Tomato'])
    
    if light < ranges['light'][0]:
        recommendations.append(f"Increase light to {ranges['light'][0]}-{ranges['light'][1]} lux")
    elif light > ranges['light'][1]:
        recommendations.append(f"Reduce light to {ranges['light'][0]}-{ranges['light'][1]} lux")
    else:
        recommendations.append("Light level is optimal")
    
    if humidity < ranges['humidity'][0]:
        recommendations.append(f"Increase humidity to {ranges['humidity'][0]}-{ranges['humidity'][1]}%")
    elif humidity > ranges['humidity'][1]:
        recommendations.append(f"Reduce humidity to {ranges['humidity'][0]}-{ranges['humidity'][1]}%")
    else:
        recommendations.append("Humidity level is optimal")
    
    if temperature < ranges['temp'][0]:
        recommendations.append(f"Increase temperature to {ranges['temp'][0]}-{ranges['temp'][1]}°C")
    elif temperature > ranges['temp'][1]:
        recommendations.append(f"Reduce temperature to {ranges['temp'][0]}-{ranges['temp'][1]}°C")
    else:
        recommendations.append("Temperature is optimal")
    
    if moisture < ranges['moisture'][0]:
        recommendations.append(f"Water plant to reach {ranges['moisture'][0]}-{ranges['moisture'][1]}% soil moisture")
    elif moisture > ranges['moisture'][1]:
        recommendations.append(f"Reduce watering to reach {ranges['moisture'][0]}-{ranges['moisture'][1]}% soil moisture")
    else:
        recommendations.append("Soil moisture is optimal")
    
    return recommendations

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)