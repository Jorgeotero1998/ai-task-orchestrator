import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Verifica que el servidor backend responda"""
    rv = client.get('/')
    assert rv.status_code in [200, 404] # Depende de tu ruta raíz
