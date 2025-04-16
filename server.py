from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import os
import time

app = Flask(__name__)
CORS(app)

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    filename = file.filename
    encrypted_data = base64.b64encode(file.read()).decode('utf-8')
    with open(f"storage/{filename}", 'w') as f:
        f.write(encrypted_data)
    return jsonify({"message": "File uploaded successfully"})

@app.route('/download/<filename>', methods=['GET'])
def download_file():
    with open(f"storage/{filename}", 'r') as f:
        encrypted_data = f.read()
    decrypted_data = base64.b64decode(encrypted_data)
    with open(f"temp/{filename}", 'wb') as f:
        f.write(decrypted_data)
    return send_file(f"temp/{filename}", as_attachment=True)

@app.route('/files', methods=['GET'])
def list_files():
    files = os.listdir('storage')
    return jsonify(files)

@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file():
    os.remove(f"storage/{filename}")
    return jsonify({"message": "File deleted successfully"})

@app.route('/create', methods=['POST'])
def create_file():
    filename = request.json['filename']
    with open(f"storage/{filename}", 'w') as f:
        f.write(base64.b64encode(b"").decode('utf-8'))
    return jsonify({"message": "File created successfully"})

@app.route('/rename/<filename>', methods=['POST'])
def rename_file():
    new_name = request.json['new_name']
    os.rename(f"storage/{filename}", f"storage/{new_name}")
    return jsonify({"message": "File renamed successfully"})

@app.route('/edit/<filename>', methods=['POST'])
def edit_file():
    content = base64.b64encode(request.json['content'].encode('utf-8')).decode('utf-8')
    with open(f"storage/{filename}", 'w') as f:
        f.write(content)
    return jsonify({"message": "File edited successfully"})

@app.route('/append/<filename>', methods=['POST'])
def append_to_file():
    with open(f"storage/{filename}", 'r') as f:
        current = base64.b64decode(f.read()).decode('utf-8')
    content = current + request.json['content']
    with open(f"storage/{filename}", 'w') as f:
        f.write(base64.b64encode(content.encode('utf-8')).decode('utf-8'))
    return jsonify({"message": "Content appended successfully"})

@app.route('/size/<filename>', methods=['GET'])
def check_file_size():
    size = os.path.getsize(f"storage/{filename}")
    return jsonify({"size": size})

@app.route('/modified/<filename>', methods=['GET'])
def check_last_modified():
    modified = time.ctime(os.path.getmtime(f"storage/{filename}"))
    return jsonify({"last_modified": modified})

@app.route('/clear/<filename>', methods=['POST'])
def clear_file():
    with open(f"storage/{filename}", 'w') as f:
        f.write(base64.b64encode(b"").decode('utf-8'))
    return jsonify({"message": "File cleared successfully"})

if __name__ == '__main__':
    os.makedirs('storage', exist_ok=True)
    os.makedirs('temp', exist_ok=True)
    app.run(debug=True)
