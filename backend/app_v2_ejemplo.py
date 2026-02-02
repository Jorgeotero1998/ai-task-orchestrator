from flask import Flask
from flask_restx import Api, Resource

app = Flask(__name__)
api = Api(app, version='1.0', title='AI Task Orchestrator API',
    description='Documentacion automatizada de los endpoints del orquestador')

@api.route('/salud')
class Salud(Resource):
    def get(self):
        return {'estado': 'operativo'}

if __name__ == '__main__':
    app.run(debug=True)
