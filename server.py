#!/usr/bin/env python3
"""
Deez Backend Server
Serves the frontend + proxies API calls to Google Sheets.
"""

import json
import os
import time
import uuid
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from google.oauth2 import service_account
from googleapiclient.discovery import build

# --- Load .env ---
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    # Remove surrounding quotes
                    val = val.strip().strip('"').strip("'")
                    os.environ[key.strip()] = val

load_env()

SHEET_ID = os.environ.get('GOOGLE_SHEET_ID', '')
SERVICE_EMAIL = os.environ.get('GOOGLE_SERVICE_ACCOUNT_EMAIL', '')
PRIVATE_KEY = os.environ.get('GOOGLE_PRIVATE_KEY', '').replace('\\n', '\n')

# --- Google Sheets Setup ---
def get_sheets_service():
    creds = service_account.Credentials.from_service_account_info(
        {
            "type": "service_account",
            "project_id": "united-bongo-389609",
            "private_key_id": "",
            "private_key": PRIVATE_KEY,
            "client_email": SERVICE_EMAIL,
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        },
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    return build('sheets', 'v4', credentials=creds)

sheets_service = None

def get_service():
    global sheets_service
    if sheets_service is None:
        sheets_service = get_sheets_service()
    return sheets_service

# --- Sheet Helpers ---
def ensure_sheets():
    """Create 'Users' and 'Interactions' tabs if they don't exist."""
    svc = get_service()
    meta = svc.spreadsheets().get(spreadsheetId=SHEET_ID).execute()
    existing = [s['properties']['title'] for s in meta.get('sheets', [])]

    requests = []
    for name in ['Users', 'Interactions']:
        if name not in existing:
            requests.append({
                'addSheet': {'properties': {'title': name}}
            })

    if requests:
        svc.spreadsheets().batchUpdate(
            spreadsheetId=SHEET_ID,
            body={'requests': requests}
        ).execute()

    # Add headers if sheets are empty
    for name, headers in [
        ('Users', ['userId', 'name', 'animal', 'data', 'lastSync']),
        ('Interactions', ['id', 'fromId', 'fromName', 'fromAnimal', 'toId', 'type', 'timestamp', 'seen']),
    ]:
        result = svc.spreadsheets().values().get(
            spreadsheetId=SHEET_ID, range=f'{name}!A1:A1'
        ).execute()
        if not result.get('values'):
            svc.spreadsheets().values().update(
                spreadsheetId=SHEET_ID, range=f'{name}!A1',
                valueInputOption='RAW',
                body={'values': [headers]}
            ).execute()

_sheets_initialized = False

def init_sheets():
    global _sheets_initialized
    if not _sheets_initialized:
        ensure_sheets()
        _sheets_initialized = True

def read_sheet(tab):
    svc = get_service()
    result = svc.spreadsheets().values().get(
        spreadsheetId=SHEET_ID, range=f'{tab}!A:Z'
    ).execute()
    rows = result.get('values', [])
    if len(rows) < 2:
        return [], rows[0] if rows else []
    headers = rows[0]
    data = []
    for row in rows[1:]:
        entry = {}
        for i, h in enumerate(headers):
            entry[h] = row[i] if i < len(row) else ''
        data.append(entry)
    return data, headers

def append_row(tab, values):
    svc = get_service()
    svc.spreadsheets().values().append(
        spreadsheetId=SHEET_ID, range=f'{tab}!A:A',
        valueInputOption='RAW',
        body={'values': [values]}
    ).execute()

def update_cell(tab, row_index, col_index, value):
    """row_index is 0-based data row (excludes header), col_index is 0-based."""
    svc = get_service()
    # Convert to A1 notation
    col_letter = chr(ord('A') + col_index)
    cell = f'{tab}!{col_letter}{row_index + 2}'  # +2 for 1-based + header
    svc.spreadsheets().values().update(
        spreadsheetId=SHEET_ID, range=cell,
        valueInputOption='RAW',
        body={'values': [[value]]}
    ).execute()

def update_row(tab, row_index, values):
    """Update an entire row. row_index is 0-based data row."""
    svc = get_service()
    end_col = chr(ord('A') + len(values) - 1)
    range_str = f'{tab}!A{row_index + 2}:{end_col}{row_index + 2}'
    svc.spreadsheets().values().update(
        spreadsheetId=SHEET_ID, range=range_str,
        valueInputOption='RAW',
        body={'values': [values]}
    ).execute()

# --- API Handlers ---

def handle_sync(body):
    init_sheets()
    user_id = body.get('userId', '')
    name = body.get('name', '')
    animal = body.get('animal', 0)
    data = body.get('data', {})
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    if not user_id or not name:
        return {'ok': False, 'error': 'Missing userId or name'}

    users, _ = read_sheet('Users')

    # Find or create user
    found = False
    for i, u in enumerate(users):
        if u.get('userId') == user_id:
            update_row('Users', i, [user_id, name, str(animal), json.dumps(data), now])
            found = True
            break

    if not found:
        append_row('Users', [user_id, name, str(animal), json.dumps(data), now])

    # Re-read all users
    users, _ = read_sheet('Users')
    user_list = []
    for u in users:
        udata = {}
        try:
            udata = json.loads(u.get('data', '{}'))
        except:
            pass
        user_list.append({
            'userId': u.get('userId', ''),
            'name': u.get('name', ''),
            'animal': int(u.get('animal', 0)),
            'data': udata,
            'lastSync': u.get('lastSync', ''),
            'isMe': u.get('userId') == user_id,
        })

    # Get unseen interactions for this user
    interactions, _ = read_sheet('Interactions')
    notifications = []
    for i, inter in enumerate(interactions):
        if inter.get('toId') == user_id and inter.get('seen', '') not in ('TRUE', 'true', True):
            notifications.append({
                'id': inter.get('id', ''),
                'fromId': inter.get('fromId', ''),
                'fromName': inter.get('fromName', ''),
                'fromAnimal': int(inter.get('fromAnimal', 0)),
                'type': inter.get('type', ''),
                'timestamp': inter.get('timestamp', ''),
            })
            # Mark as seen
            update_cell('Interactions', i, 7, 'TRUE')

    return {'ok': True, 'users': user_list, 'notifications': notifications}


def handle_interact(body):
    init_sheets()
    from_id = body.get('fromId', '')
    from_name = body.get('fromName', '')
    from_animal = body.get('fromAnimal', 0)
    to_id = body.get('toId', '')
    itype = body.get('type', '')
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    if not from_id or not to_id or not itype:
        return {'ok': False, 'error': 'Missing fields'}

    row_id = str(uuid.uuid4())[:8]
    append_row('Interactions', [row_id, from_id, from_name, str(from_animal), to_id, itype, now, 'FALSE'])
    return {'ok': True, 'id': row_id}


def handle_ping():
    return {'ok': True, 'msg': 'Deez backend is running!', 'sheetId': SHEET_ID}


# --- HTTP Server ---

class DeezHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api':
            params = parse_qs(parsed.query)
            action = params.get('action', [''])[0]
            self.send_cors_headers()

            if action == 'ping':
                self.send_json(handle_ping())
            else:
                self.send_json({'ok': False, 'error': 'Use POST for API calls'})
            return

        # Serve static files
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api':
            content_len = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_len)
            try:
                body = json.loads(body_bytes)
            except:
                body = {}

            action = body.get('action', '')
            self.send_cors_headers()

            try:
                if action == 'sync':
                    self.send_json(handle_sync(body))
                elif action == 'interact':
                    self.send_json(handle_interact(body))
                elif action == 'ping':
                    self.send_json(handle_ping())
                else:
                    self.send_json({'ok': False, 'error': f'Unknown action: {action}'})
            except Exception as e:
                self.send_json({'ok': False, 'error': str(e)})
            return

        self.send_response(405)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_cors_headers()
        self.send_response(204)
        self.end_headers()

    def send_cors_headers(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data):
        self.wfile.write(json.dumps(data).encode())

    # Suppress request logs for cleaner output
    def log_message(self, format, *args):
        if '/api' in str(args[0]) if args else False:
            print(f"  API: {args[0]}")


def main():
    port = 8000
    print(f"""
╔══════════════════════════════════════╗
║     🪷  DEEZ - Server Running  🪷    ║
╠══════════════════════════════════════╣
║                                      ║
║  Local:   http://localhost:{port}       ║
║  Network: http://YOUR_IP:{port}         ║
║                                      ║
║  Sheet: {SHEET_ID[:20]}...  ║
║                                      ║
║  Share the network URL with friends  ║
║  on the same WiFi!                   ║
║                                      ║
╚══════════════════════════════════════╝
""")
    server = HTTPServer(('0.0.0.0', port), DeezHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()

if __name__ == '__main__':
    main()
