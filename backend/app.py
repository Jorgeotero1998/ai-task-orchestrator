import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restx import Api, Resource, fields
import requests
import time
import json
import sqlite3

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuración de Swagger
api = Api(app, version='1.0', title='AI Task Orchestrator API',
    description='Sistema de Orquestación Neural Bio-Técnica - Desarrollado por Jorge Otero',
    doc='/docs')

ns = api.namespace('api', description='Operaciones principales del sistema')

API_KEY = os.getenv('GROQ_API_KEY')
DB_PATH = 'history.db'

# Modelos de datos para Swagger
task_model = api.model('Task', {
    'title': fields.String(required=True, description='Título o mensaje de la consulta bio')
})

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS history (id TEXT, title TEXT, subtasks TEXT)')

@app.route('/auth/login', methods=['POST'])
def login():
    return jsonify({'token': 'MASTER_TOKEN_AI_BIO', 'status': 'success'}), 200

@ns.route('/tasks')
class TaskList(Resource):
    @ns.doc('list_tasks')
    def get(self):
        """Lista el historial de tareas desde la base de datos"""
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('SELECT * FROM history ORDER BY rowid DESC')
            rows = cursor.fetchall()
            history = [dict(row) for row in rows]
        return jsonify(history)

@ns.route('/orchestrate')
class Orchestrate(Resource):
    @ns.expect(task_model)
    def post(self):
        """Orquesta una nueva tarea usando IA (Groq Llama-3)"""
        data = request.get_json(silent=True) or {}
        task_title = data.get('title') or data.get('message') or 'Consulta Bio'
        try:
            r = requests.post('https://api.groq.com/openai/v1/chat/completions', 
                headers={'Authorization': f'Bearer {API_KEY}'}, 
                json={
                    'model': 'llama-3.3-70b-versatile', 
                    'messages': [
                        {'role': 'system', 'content': 'Eres un experto en biotecnología. Genera 5 pasos técnicos cortos separados por comas sin numeración.'}, 
                        {'role': 'user', 'content': task_title}
                    ]
                }, timeout=20)
            r.raise_for_status()
            ai_text = r.json()['choices'][0]['message']['content']
            steps = [s.strip() for s in ai_text.split(',')]
            entry_id = str(int(time.time() * 1000))
            steps_json = json.dumps(steps)
            with sqlite3.connect(DB_PATH) as conn:
                conn.execute('INSERT INTO history (id, title, subtasks) VALUES (?, ?, ?)', (entry_id, task_title, steps_json))
            return {'status': 'success', 'subtasks': steps}, 200
        except Exception as e:
            return {'error': str(e)}, 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
