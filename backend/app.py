import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
# CORS configurado para que el navegador no bloquee el login
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120))

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    subtasks = db.Column(db.Text)


@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    # Login simplificado: si existe el usuario, entra.
    if user:
        return jsonify({"token": "neural_token_shared_secret", "user": {"name": user.name}})
    return jsonify({"error": "No autorizado"}), 401

@app.route('/api/orchestrate', methods=['POST'])
def orchestrate():
    data = request.json
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "Eres un orquestador estratégico. Responde solo con una lista de pasos cortos, uno por línea."},
                {"role": "user", "content": data['title']}
            ]
        )
        steps = completion.choices[0].message.content.split('\n')
        steps = [s.strip() for s in steps if s.strip()]
        return jsonify({"subtasks": steps})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
