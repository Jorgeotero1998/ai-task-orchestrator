import pytest
from app import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_ai_orchestration_flow(client):
    """Prueba el flujo completo: Envío de tarea -> Respuesta de IA"""
    payload = {
        "task": "Extracción de ADN",
        "parameters": {"sample": "tejido vegetal"}
    }
    # Simulamos el POST al endpoint de orquestación
    response = client.post('/api/orchestrate', 
                           data=json.dumps(payload),
                           content_type='application/json')
    
    assert response.status_code == 200
    data = response.get_json()
    assert "protocol" in data or "steps" in data
    print("✅ Test de Orquestación: PASADO")

def test_auth_protected_routes(client):
    """Verifica que las rutas protegidas requieran token"""
    response = client.get('/api/history')
    assert response.status_code == 401  # Unauthorized
    print("✅ Test de Seguridad JWT: PASADO")
