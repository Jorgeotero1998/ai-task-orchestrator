import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import requests
import time
import json
import sqlite3

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}})

API_KEY = os.getenv('GROQ_API_KEY')
DB_PATH = 'history.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS history (id TEXT, title TEXT, subtasks TEXT)')

@app.route('/auth/login', methods=['POST'])
def login():
    return jsonify({'token': 'MASTER_TOKEN_AI_BIO', 'status': 'success'}), 200

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute('SELECT * FROM history ORDER BY rowid DESC')
        rows = cursor.fetchall()
        history = [dict(row) for row in rows]
    return jsonify(history), 200

@app.route('/api/orchestrate', methods=['POST'])
def orchestrate():
    data = request.get_json(silent=True) or {}
    task_title = data.get('title') or data.get('message') or 'Consulta Bio'
    try:
        r = requests.post('https://api.groq.com/openai/v1/chat/completions', headers={'Authorization': f'Bearer {API_KEY}'}, json={'model': 'llama-3.3-70b-versatile', 'messages': [{'role': 'system', 'content': 'Eres un experto en biotecnología. Genera 5 pasos técnicos cortos separados por comas sin numeración.'}, {'role': 'user', 'content': task_title}]}, timeout=20)
        r.raise_for_status()
        ai_text = r.json()['choices'][0]['message']['content']
        steps = [s.strip() for s in ai_text.split(',')]
        entry_id = str(int(time.time() * 1000))
        steps_json = json.dumps(steps)
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute('INSERT INTO history (id, title, subtasks) VALUES (?, ?, ?)', (entry_id, task_title, steps_json))
        return jsonify({'status': 'success', 'subtasks': steps}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
