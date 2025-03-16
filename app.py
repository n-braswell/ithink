from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = 'data.json'

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {"text": ""}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

@app.route('/load', methods=['GET'])
def load_text():
    return jsonify(load_data())

@app.route('/save', methods=['POST'])
def save_text():
    data = request.get_json()
    save_data({"text": data.get("text", "")})
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True) 