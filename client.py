# app/client.py

import base64
import requests
from config import Config

headers = {
    "Content-Type": "application/json-rpc",
    "x-authorization-token": Config.API_KEY
}

def detect_faces(image_path):
    with open(image_path, 'rb') as image_file:
        image_read = image_file.read()
        image_64_encode = base64.b64encode(image_read).decode("ascii")

        payload = {
            "jsonrpc": "2.0",
            "method": "detectFaces",
            "id": "some-id",
            "params": {
                "image": image_64_encode
            }
        }

        response = requests.post(base64.b64decode(Config.API).decode('utf-8'), json=payload, headers=headers)
        response_data = response.json()

        if "result" in response_data:
            faces = response_data["result"].get('faces', [])
            for face in faces:
                face['x'] = int(face['x'])
                face['y'] = int(face['y'])
                face['width'] = int(face['width'])
                face['height'] = int(face['height'])

            return response_data["result"]
        else:
            raise Exception("Error detecting faces: " + response_data.get("error", {}).get("message", "Unknown error"))
