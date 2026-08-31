"""
==========================================================================
AAPDASETU — UNIFIED PRODUCTION PYTHON WEB SERVER & API GATEWAY
==========================================================================
Hosts both frontend interfaces and the backend API on any Python host
(Render, PythonAnywhere, Railway, Heroku, AWS, or Localhost).
Zero external pip dependencies required (pure standard library).
"""

import os
import sys
import json
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Include backend directory in PYTHONPATH
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from app.api.endpoints import handle_api_request
except ImportError:
    handle_api_request = None

# Ensure proper MIME types for ES modules and modern assets
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')

PORT = int(os.environ.get('PORT', 8080))

class UnifiedAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def _set_cors_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_cors_headers(200)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. API Endpoints Route
        if path.startswith('/api/v1') and handle_api_request:
            query_params = parse_qs(parsed.query)
            params = {k: v[0] for k, v in query_params.items()}
            response_data = handle_api_request(path, method="GET", payload=params)
            self._set_cors_headers(response_data.get("status_code", 200), 'application/json; charset=utf-8')
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        # 2. Smartphone Simulator Route
        if path == '/simulation' or path == '/simulation/':
            self.path = '/simulation/index.html'

        # 3. Serve Static Files
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Handle API POST
        if path.startswith('/api/v1') and handle_api_request:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            try:
                payload = json.loads(post_data.decode('utf-8'))
            except Exception:
                payload = {}

            response_data = handle_api_request(path, method="POST", payload=payload)
            self._set_cors_headers(response_data.get("status_code", 200), 'application/json; charset=utf-8')
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        self._set_cors_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def end_headers(self):
        # Prevent caching issues in browsers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, UnifiedAppHandler)
    print(f"🚀 AapdaSetu Python Server running on port {PORT}")
    print(f"👉 Command & Control Dashboard: http://localhost:{PORT}/")
    print(f"👉 Smartphone Evacuation Simulator: http://localhost:{PORT}/simulation/")
    print(f"👉 Backend API Status: http://localhost:{PORT}/api/v1/system/health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run()
