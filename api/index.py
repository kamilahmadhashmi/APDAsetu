"""
==========================================================================
VERCEL SERVERLESS FUNCTION HANDLER FOR AEGIS-MESH BACKEND
==========================================================================
"""

import sys
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Include backend in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.api.endpoints import handle_api_request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query_params = parse_qs(parsed.query)
        params = {k: v[0] for k, v in query_params.items()}

        response_data = handle_api_request(path, method="GET", payload=params)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'

        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception:
            payload = {}

        response_data = handle_api_request(path, method="POST", payload=payload)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))
