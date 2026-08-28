"""
==========================================================================
AEGIS-MESH FASTAPI BACKEND SERVER ENGINE
==========================================================================
Dual-mode server: Supports FastAPI ASGI app + built-in Python HTTP server engine.
"""

import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.endpoints import handle_api_request

# ==========================================================================
# 1. STANDALONE PYTHON HTTP SERVER (ZERO EXTERNAL PIP DEPENDENCIES)
# ==========================================================================
class AegisBackendRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query_params = parse_qs(parsed.query)

        # Flatten query params
        params = {k: v[0] for k, v in query_params.items()}

        response_data = handle_api_request(path, method="GET", payload=params)
        
        status = response_data.get("status_code", 200)
        self._set_headers(status)
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

        status = response_data.get("status_code", 200)
        self._set_headers(status)
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def log_message(self, format, *args):
        # Clean custom logging
        sys.stdout.write(f"[AEGIS-BACKEND] {self.address_string()} - {format % args}\n")

def run_standalone_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, AegisBackendRequestHandler)
    print(f"⚡ [AEGIS-BACKEND] Python Gateway Server running on http://localhost:{port}")
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_standalone_server(port)
