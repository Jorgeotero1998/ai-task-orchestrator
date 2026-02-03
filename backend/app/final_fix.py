import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from sqlalchemy import text

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://user_aibio:password_safe_123@db:5432/aibio_db')
db = SQLAlchemy(app)

with app.app_context():
    hpw = generate_password_hash('admin')
    tablas = ['user', 'users']
    
    for t in tablas:
        try:
            # Crear tabla si no existe
            db.session.execute(text(f'CREATE TABLE IF NOT EXISTS "{t}" (id SERIAL PRIMARY KEY, email VARCHAR(120) UNIQUE, password VARCHAR(255))'))
            # Limpiar versiones viejas
            db.session.execute(text(f'DELETE FROM "{t}" WHERE email = :e'), {"e": "admin@example.com"})
            # Insertar version encriptada
            db.session.execute(text(f'INSERT INTO "{t}" (email, password) VALUES (:e, :p)'), {"e": "admin@example.com", "p": hpw})
            # Insertar version texto plano (por si acaso)
            db.session.execute(text(f'INSERT INTO "{t}" (email, password) VALUES (:e, :p)'), {"e": "admin_plain@example.com", "p": "admin"})
            print(f"TABLA {t}: OK")
        except Exception as e:
            print(f"TABLA {t}: Error {e}")
    
    db.session.commit()
    print("FIN_DEL_PROCESO")
