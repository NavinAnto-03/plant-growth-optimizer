import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Conv1D, MaxPooling1D, Flatten, Dropout
from tensorflow.keras.optimizers import Adam
import joblib

class PlantGrowthModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        
    def create_model(self, input_shape):
        model = Sequential([
            Conv1D(32, 3, activation='relu', input_shape=input_shape),
            MaxPooling1D(2),
            Conv1D(64, 3, activation='relu'),
            MaxPooling1D(2),
            Flatten(),
            Dense(128, activation='relu'),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(4, activation='softmax')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def generate_synthetic_data(self, n_samples=1000):
        np.random.seed(42)
        
        light = np.random.uniform(200, 2000, n_samples)
        humidity = np.random.uniform(20, 90, n_samples)
        temperature = np.random.uniform(15, 35, n_samples)
        moisture = np.random.uniform(10, 90, n_samples)
        
        X = np.column_stack([light, humidity, temperature, moisture])
        
        y = []
        for i in range(n_samples):
            optimal_count = 0
            
            if 800 <= light[i] <= 1200:
                optimal_count += 1
            if 50 <= humidity[i] <= 70:
                optimal_count += 1
            if 20 <= temperature[i] <= 28:
                optimal_count += 1
            if 40 <= moisture[i] <= 60:
                optimal_count += 1
                
            if optimal_count == 4:
                y.append([1, 0, 0, 0])
            elif optimal_count >= 2:
                y.append([0, 1, 0, 0])
            else:
                y.append([0, 0, 1, 0])
        
        for i in range(50):
            y[np.random.randint(0, n_samples)] = [0, 0, 0, 1]
            
        return X, np.array(y)
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50):
        X_train_reshaped = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
        X_val_reshaped = X_val.reshape(X_val.shape[0], X_val.shape[1], 1)
        
        history = self.model.fit(
            X_train_reshaped, y_train,
            validation_data=(X_val_reshaped, y_val),
            epochs=epochs,
            batch_size=32,
            verbose=1
        )
        
        return history
    
    def predict(self, X):
        X_reshaped = X.reshape(X.shape[0], X.shape[1], 1)
        predictions = self.model.predict(X_reshaped)
        return predictions
    
    def save_model(self, model_path='plant_model.h5', scaler_path='scaler.pkl'):
        self.model.save(model_path)
        joblib.dump(self.scaler, scaler_path)
    
    def load_model(self, model_path='plant_model.h5', scaler_path='scaler.pkl'):
        self.model = tf.keras.models.load_model(model_path)
        self.scaler = joblib.load(scaler_path)

def main():
    plant_model = PlantGrowthModel()
    
    print("Generating synthetic data...")
    X, y = plant_model.generate_synthetic_data(2000)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)
    
    print("Scaling features...")
    X_train_scaled = plant_model.scaler.fit_transform(X_train)
    X_val_scaled = plant_model.scaler.transform(X_val)
    X_test_scaled = plant_model.scaler.transform(X_test)
    
    print("Creating model...")
    plant_model.model = plant_model.create_model((X_train_scaled.shape[1], 1))
    
    print("Training model...")
    history = plant_model.train(X_train_scaled, y_train, X_val_scaled, y_val, epochs=30)
    
    print("Saving model...")
    plant_model.save_model()
    
    test_loss, test_accuracy = plant_model.model.evaluate(
        X_test_scaled.reshape(X_test_scaled.shape[0], X_test_scaled.shape[1], 1), 
        y_test
    )
    print(f"Test accuracy: {test_accuracy:.4f}")
    
    sample_data = np.array([[900, 60, 24, 50]])
    sample_scaled = plant_model.scaler.transform(sample_data)
    prediction = plant_model.predict(sample_scaled)
    print(f"Sample prediction: {prediction}")

if __name__ == '__main__':
    main()