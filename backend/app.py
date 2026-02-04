import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

client = Groq(api_key="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")

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

@app.route('/auth/login', methods=['POST'])
def login():
    return jsonify({"token": "neural_fixed", "user": {"name": "Jorge Otero"}}), 200

@app.route('/api/orchestrate', methods=['POST'])
def orchestrate():
    data = request.json
    title = data.get('title', '')
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": f"Desglosa '{title}' en una lista de 5 pasos cortos. No escribas introducciones, solo los pasos uno por linea."}]
        )
        content = completion.choices[0].message.content
        # Dividir por lineas y limpiar para que aparezca como lista
        steps = [line.strip('* ').strip() for line in content.split('\n') if len(line.strip()) > 5]
        
        # Guardar en la base de datos para que aparezca en el historial
        new_task = Task(title=title, description=content)
        db.session.add(new_task)
        db.session.commit()
        
        return jsonify({"subtasks": steps})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{"id": t.id, "title": t.title} for t in tasks]), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
