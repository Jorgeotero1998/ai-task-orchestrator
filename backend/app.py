import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
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

@app.route('/health')
def health(): return jsonify({'status': 'healthy'}), 200

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    if data.get('email') == 'admin@example.com' and data.get('password') == 'admin':
        return jsonify({
            "token": "static_token_secure",
            "user": {"email": "admin@example.com", "name": "Jorge Otero"}
        }), 200
    return jsonify({"error": "Unauthorized"}), 401

@app.route('/api/orchestrate', methods=['POST'])
def orchestrate():
    data = request.json
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": f"Desglosa este objetivo en pasos claros: {data['title']}"}]
        )
        steps = completion.choices[0].message.content.split('\n')
        return jsonify({"subtasks": [s.strip() for s in steps if s.strip()]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(email='admin@example.com').first():
            db.session.add(User(email='admin@example.com', password='admin', name='Jorge Otero'))
            db.session.commit()
    app.run(host='0.0.0.0', port=5000)
