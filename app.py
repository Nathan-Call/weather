from flask import Flask, request, jsonify
from flask_cors import CORS# DELETE IN PRODUCTION?
import os
import json
import requests

# Initialize Flask application
app = Flask(__name__)
CORS(app)# DELETE IN PRODUCTION?
# Endpoint to process a bit string


@app.route('/zip-lookup/<id_value>', methods=['GET'])
def zip_lookup(id_value):
    
    def get_record_by_id(file_path, id_value):
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            with open(file_path, 'r') as file:
                data = json.load(file)
                return data.get(id_value, None)
        except FileNotFoundError as e:
            print(e)
            return None
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON in file: {file_path}")
            return None
        
    file_path = 'us_zip.json'
    record = get_record_by_id(file_path, id_value)
    
    if record:
        return jsonify(record), 200
    else:
        return jsonify({"error": "Record not found"}), 404
    

@app.route('/air-quality-api/<id_value>', methods=['GET'])
def air_quality_api(id_value):
    
    API_KEY = 'API_KEY'
    BASE_URL = 'https://www.airnowapi.org/aq/observation/zipCode/current/'

    # Prepare the request parameters
    params = {
        'format': 'application/json',
        'zipCode': id_value,
        'distance': '25',  # You can adjust the distance as needed
        'API_KEY': API_KEY
    }

    try:
        # Make the request to the AirNow API
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()  # Raise an error for bad status codes

        # Parse the JSON response
        data = response.json()

        # Return the AQI data as JSON
        return jsonify(data)

    except requests.exceptions.RequestException as e:
        # Handle any errors that occur during the request
        return jsonify({'error': str(e)}), 500

# Run the application
if __name__ == '__main__':
    app.run(debug=True)