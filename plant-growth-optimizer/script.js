let sensorData = {
    light: 0,
    humidity: 0,
    temperature: 0,
    moisture: 0
};

let dataHistory = {
    labels: [],
    light: [],
    humidity: [],
    temperature: [],
    moisture: []
};

let uploadedFiles = [];
let chart;

const lightValue = document.getElementById('light-value');
const humidityValue = document.getElementById('humidity-value');
const tempValue = document.getElementById('temp-value');
const moistureValue = document.getElementById('moisture-value');
const plantTypeSelect = document.getElementById('plant-type');
const simulateBtn = document.getElementById('simulate-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const analyzeImageBtn = document.getElementById('analyze-image-btn');
const recommendationsList = document.getElementById('recommendations-list');
const plantStatus = document.getElementById('plant-status');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const filePreview = document.getElementById('file-preview');

document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeFileUpload();
    simulateSensorData();
});

function initializeChart() {
    const ctx = document.getElementById('data-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataHistory.labels,
            datasets: [
                {
                    label: 'Light (lux)',
                    data: dataHistory.light,
                    borderColor: '#ffa726',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Humidity (%)',
                    data: dataHistory.humidity,
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Temperature (°C)',
                    data: dataHistory.temperature,
                    borderColor: '#ef5350',
                    backgroundColor: 'rgba(239, 83, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Moisture (%)',
                    data: dataHistory.moisture,
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initializeFileUpload() {
    console.log('Initializing file upload...');
    
    // Browse button click
    browseBtn.addEventListener('click', function(e) {
        console.log('Browse button clicked');
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed', e.target.files);
        handleFileSelect(e);
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
        console.log('Drag over');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        console.log('Drag leave');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files);
        handleFiles(files);
    });

    // Also make the entire upload area clickable
    uploadArea.addEventListener('click', function(e) {
        if (e.target === uploadArea || e.target.classList.contains('upload-content')) {
            console.log('Upload area clicked');
            fileInput.click();
        }
    });
}

function handleFileSelect(e) {
    const files = e.target.files;
    console.log('Files selected:', files);
    handleFiles(files);
}

function handleFiles(files) {
    console.log('Handling files:', files);
    
    if (!files || files.length === 0) {
        console.log('No files selected');
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name, file.type, file.size);
        
        if (isValidFileType(file) && isValidFileSize(file)) {
            // Check if file already exists
            if (!uploadedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
                uploadedFiles.push(file);
                addFilePreview(file);
                console.log('File added:', file.name);
            } else {
                console.log('File already exists:', file.name);
            }
        } else {
            alert(`File ${file.name} is not supported or too large. Supported: JPG, PNG, TXT. Max size: 10MB`);
            console.log('Invalid file:', file.name);
        }
    }
    
    // Update button state
    updateAnalyzeButtonState();
    
    fileInput.value = ''; // Reset input
}

function isValidFileType(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'text/plain'];
    const isValid = validTypes.includes(file.type);
    console.log('File type validation:', file.type, isValid);
    return isValid;
}

function isValidFileSize(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const isValid = file.size <= maxSize;
    console.log('File size validation:', file.name, file.size, 'bytes', isValid);
    return isValid;
}

function addFilePreview(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-preview-item';
    fileItem.setAttribute('data-filename', file.name);
    
    const reader = new FileReader();
    
    if (file.type.startsWith('image/')) {
        reader.onload = function(e) {
            fileItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <button type="button" class="remove-file" data-filename="${file.name}">×</button>
            `;
            
            // Add event listener to remove button
            const removeBtn = fileItem.querySelector('.remove-file');
            removeBtn.addEventListener('click', function() {
                removeFile(file.name);
            });
        };
        reader.readAsDataURL(file);
    } else {
        fileItem.innerHTML = `
            <div class="file-icon">📄</div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <div class="file-type">${file.type}</div>
            <button type="button" class="remove-file" data-filename="${file.name}">×</button>
        `;
        
        // Add event listener to remove button
        const removeBtn = fileItem.querySelector('.remove-file');
        removeBtn.addEventListener('click', function() {
            removeFile(file.name);
        });
    }
    
    filePreview.appendChild(fileItem);
    console.log('File preview added for:', file.name);
}

function removeFile(fileName) {
    console.log('Removing file:', fileName);
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    
    // Remove from DOM
    const fileItem = document.querySelector(`.file-preview-item[data-filename="${fileName}"]`);
    if (fileItem) {
        fileItem.remove();
    }
    
    // Update button state
    updateAnalyzeButtonState();
    console.log('File removed:', fileName, 'Remaining files:', uploadedFiles.length);
}

function updateAnalyzeButtonState() {
    if (uploadedFiles.length > 0) {
        analyzeImageBtn.disabled = false;
        analyzeImageBtn.style.opacity = '1';
    } else {
        analyzeImageBtn.disabled = true;
        analyzeImageBtn.style.opacity = '0.6';
    }
}

function renderFilePreviews() {
    filePreview.innerHTML = '';
    uploadedFiles.forEach(file => addFilePreview(file));
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function simulateSensorData() {
    const plantType = plantTypeSelect.value;
    
    const plantRanges = {
        'Tomato': { light: [800, 1500], humidity: [50, 70], temp: [20, 28], moisture: [40, 60] },
        'Lettuce': { light: [600, 1200], humidity: [60, 80], temp: [15, 22], moisture: [50, 70] },
        'Basil': { light: [700, 1300], humidity: [50, 70], temp: [18, 26], moisture: [40, 60] },
        'Rose': { light: [1000, 1800], humidity: [40, 60], temp: [18, 25], moisture: [35, 55] },
        'Succulent': { light: [1000, 2000], humidity: [30, 50], temp: [20, 30], moisture: [20, 40] },
        'Orchid': { light: [500, 1000], humidity: [50, 80], temp: [18, 24], moisture: [30, 50] }
    };
    
    const ranges = plantRanges[plantType];
    
    sensorData = {
        light: Math.floor(Math.random() * (ranges.light[1] - ranges.light[0]) + ranges.light[0]),
        humidity: Math.floor(Math.random() * (ranges.humidity[1] - ranges.humidity[0]) + ranges.humidity[0]),
        temperature: parseFloat((Math.random() * (ranges.temp[1] - ranges.temp[0]) + ranges.temp[0]).toFixed(1)),
        moisture: Math.floor(Math.random() * (ranges.moisture[1] - ranges.moisture[0]) + ranges.moisture[0])
    };
    
    updateSensorDisplay();
    
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    dataHistory.labels.push(timeString);
    dataHistory.light.push(sensorData.light);
    dataHistory.humidity.push(sensorData.humidity);
    dataHistory.temperature.push(sensorData.temperature);
    dataHistory.moisture.push(sensorData.moisture);
    
    if (dataHistory.labels.length > 10) {
        dataHistory.labels.shift();
        dataHistory.light.shift();
        dataHistory.humidity.shift();
        dataHistory.temperature.shift();
        dataHistory.moisture.shift();
    }
    
    chart.update();
}

function updateSensorDisplay() {
    lightValue.textContent = sensorData.light;
    humidityValue.textContent = sensorData.humidity;
    tempValue.textContent = sensorData.temperature.toFixed(1);
    moistureValue.textContent = sensorData.moisture;
}

async function analyzeWithAI() {
    recommendationsList.innerHTML = '<p class="placeholder">Analyzing sensor data with AI...</p>';
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                light: sensorData.light,
                humidity: sensorData.humidity,
                temperature: sensorData.temperature,
                moisture: sensorData.moisture,
                plant_type: plantTypeSelect.value
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            displayRecommendations(result.recommendations);
            updatePlantStatus(result.health_status, result.confidence);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error analyzing data:', error);
        const recommendations = generateRecommendations();
        displayRecommendations(recommendations);
        const healthStatus = assessPlantHealth();
        updatePlantStatus(healthStatus.status, 0.8);
    }
}

async function analyzeUploadedFiles() {
    if (uploadedFiles.length === 0) {
        alert('Please upload plant images or documents first.');
        return;
    }

    recommendationsList.innerHTML = '<p class="placeholder">Analyzing uploaded files with AI...</p>';
    analyzeImageBtn.disabled = true;
    analyzeImageBtn.textContent = 'Analyzing...';

    try {
        const formData = new FormData();
        uploadedFiles.forEach(file => {
            formData.append('files', file);
        });
        formData.append('plant_type', plantTypeSelect.value);

        const response = await fetch('/analyze-files', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
            displayFileAnalysisResults(result.analysis);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Error analyzing files:', error);
        recommendationsList.innerHTML = '<p class="placeholder">Error analyzing files. Please try again.</p>';
    } finally {
        analyzeImageBtn.disabled = false;
        analyzeImageBtn.textContent = 'Analyze Uploaded Files';
    }
}

function displayFileAnalysisResults(analysis) {
    recommendationsList.innerHTML = '';
    
    if (!analysis || analysis.length === 0) {
        recommendationsList.innerHTML = '<p class="placeholder">No analysis results available.</p>';
        return;
    }
    
    analysis.forEach((item, index) => {
        const resultElement = document.createElement('div');
        resultElement.className = 'image-analysis-result';
        
        let content = `
            <h4>Analysis for ${item.filename}</h4>
            <p><strong>File Type:</strong> ${item.file_type}</p>
        `;
        
        if (item.error) {
            content += `<p class="error"><strong>Error:</strong> ${item.error}</p>`;
        } else {
            if (item.dimensions) {
                content += `<p><strong>Dimensions:</strong> ${item.dimensions}</p>`;
            }
            
            if (item.size_kb) {
                content += `<p><strong>Size:</strong> ${item.size_kb} KB</p>`;
            }
            
            if (item.green_ratio !== undefined) {
                content += `<p><strong>Green Ratio:</strong> ${item.green_ratio}</p>`;
            }
            
            if (item.plant_type_detected) {
                content += `<p><strong>Detected Plant:</strong> ${item.plant_type_detected}</p>`;
            }
            
            if (item.health_indicators && item.health_indicators.length > 0) {
                content += `<p><strong>Health Indicators:</strong> ${item.health_indicators.join(', ')}</p>`;
            }
            
            if (item.recommendations && item.recommendations.length > 0) {
                content += `<p><strong>Recommendations:</strong></p><ul>`;
                item.recommendations.forEach(rec => {
                    content += `<li>${rec}</li>`;
                });
                content += `</ul>`;
            }
            
            if (item.analysis_text) {
                content += `<p><strong>Analysis Summary:</strong> ${item.analysis_text}</p>`;
            }
            
            if (item.extracted_text) {
                content += `<p><strong>Extracted Text:</strong> ${item.extracted_text}</p>`;
            }
        }
        
        resultElement.innerHTML = content;
        recommendationsList.appendChild(resultElement);
    });
}

function generateRecommendations() {
    const plantType = plantTypeSelect.value;
    const recommendations = [];
    
    const optimalRanges = {
        'Tomato': { light: [800, 1500], humidity: [50, 70], temp: [20, 28], moisture: [40, 60] },
        'Lettuce': { light: [600, 1200], humidity: [60, 80], temp: [15, 22], moisture: [50, 70] },
        'Basil': { light: [700, 1300], humidity: [50, 70], temp: [18, 26], moisture: [40, 60] },
        'Rose': { light: [1000, 1800], humidity: [40, 60], temp: [18, 25], moisture: [35, 55] },
        'Succulent': { light: [1000, 2000], humidity: [30, 50], temp: [20, 30], moisture: [20, 40] },
        'Orchid': { light: [500, 1000], humidity: [50, 80], temp: [18, 24], moisture: [30, 50] }
    };
    
    const ranges = optimalRanges[plantType];
    
    if (sensorData.light < ranges.light[0]) {
        recommendations.push(`Increase light to ${ranges.light[0]}-${ranges.light[1]} lux for ${plantType}`);
    } else if (sensorData.light > ranges.light[1]) {
        recommendations.push(`Reduce light to ${ranges.light[0]}-${ranges.light[1]} lux for ${plantType}`);
    } else {
        recommendations.push(`Light level optimal for ${plantType}`);
    }
    
    if (sensorData.humidity < ranges.humidity[0]) {
        recommendations.push(`Increase humidity to ${ranges.humidity[0]}-${ranges.humidity[1]}% for ${plantType}`);
    } else if (sensorData.humidity > ranges.humidity[1]) {
        recommendations.push(`Reduce humidity to ${ranges.humidity[0]}-${ranges.humidity[1]}% for ${plantType}`);
    } else {
        recommendations.push(`Humidity level optimal for ${plantType}`);
    }
    
    if (sensorData.temperature < ranges.temp[0]) {
        recommendations.push(`Increase temperature to ${ranges.temp[0]}-${ranges.temp[1]}°C for ${plantType}`);
    } else if (sensorData.temperature > ranges.temp[1]) {
        recommendations.push(`Reduce temperature to ${ranges.temp[0]}-${ranges.temp[1]}°C for ${plantType}`);
    } else {
        recommendations.push(`Temperature optimal for ${plantType}`);
    }
    
    if (sensorData.moisture < ranges.moisture[0]) {
        recommendations.push(`Water plant to reach ${ranges.moisture[0]}-${ranges.moisture[1]}% soil moisture for ${plantType}`);
    } else if (sensorData.moisture > ranges.moisture[1]) {
        recommendations.push(`Reduce watering to reach ${ranges.moisture[0]}-${ranges.moisture[1]}% soil moisture for ${plantType}`);
    } else {
        recommendations.push(`Soil moisture optimal for ${plantType}`);
    }
    
    return recommendations;
}

function assessPlantHealth() {
    const plantType = plantTypeSelect.value;
    const optimalRanges = {
        'Tomato': { light: [800, 1500], humidity: [50, 70], temp: [20, 28], moisture: [40, 60] },
        'Lettuce': { light: [600, 1200], humidity: [60, 80], temp: [15, 22], moisture: [50, 70] },
        'Basil': { light: [700, 1300], humidity: [50, 70], temp: [18, 26], moisture: [40, 60] },
        'Rose': { light: [1000, 1800], humidity: [40, 60], temp: [18, 25], moisture: [35, 55] },
        'Succulent': { light: [1000, 2000], humidity: [30, 50], temp: [20, 30], moisture: [20, 40] },
        'Orchid': { light: [500, 1000], humidity: [50, 80], temp: [18, 24], moisture: [30, 50] }
    };
    
    const ranges = optimalRanges[plantType];
    let optimalCount = 0;
    
    if (sensorData.light >= ranges.light[0] && sensorData.light <= ranges.light[1]) optimalCount++;
    if (sensorData.humidity >= ranges.humidity[0] && sensorData.humidity <= ranges.humidity[1]) optimalCount++;
    if (sensorData.temperature >= ranges.temp[0] && sensorData.temperature <= ranges.temp[1]) optimalCount++;
    if (sensorData.moisture >= ranges.moisture[0] && sensorData.moisture <= ranges.moisture[1]) optimalCount++;
    
    if (optimalCount === 4) {
        return { status: 'optimal', message: `${plantType} is in optimal condition!` };
    } else if (optimalCount >= 2) {
        return { status: 'warning', message: `${plantType} needs some adjustments.` };
    } else {
        return { status: 'critical', message: `${plantType} health is critical!` };
    }
}

function displayRecommendations(recommendations) {
    recommendationsList.innerHTML = '';
    
    if (recommendations.length === 0) {
        recommendationsList.innerHTML = '<p class="placeholder">No recommendations available.</p>';
        return;
    }
    
    recommendations.forEach(rec => {
        const recElement = document.createElement('div');
        recElement.className = 'recommendation-item';
        recElement.textContent = rec;
        recommendationsList.appendChild(recElement);
    });
}

function updatePlantStatus(status, confidence) {
    plantStatus.innerHTML = '';
    
    const healthStatus = assessPlantHealth();
    const statusElement = document.createElement('div');
    statusElement.className = `status ${healthStatus.status}`;
    statusElement.textContent = `${healthStatus.message} (${(confidence * 100).toFixed(1)}% confidence)`;
    plantStatus.appendChild(statusElement);
}

// Event listeners
simulateBtn.addEventListener('click', simulateSensorData);
analyzeBtn.addEventListener('click', analyzeWithAI);
analyzeImageBtn.addEventListener('click', analyzeUploadedFiles);
plantTypeSelect.addEventListener('change', simulateSensorData);

updateAnalyzeButtonState();