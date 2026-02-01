# AI-BIO: Sistema de Orquestación Neural
### Desarrollado por Jorge Otero

AI-BIO es una plataforma Full-Stack diseñada para la gestión inteligente de tareas biotecnológicas. El sistema utiliza Modelos de Lenguaje de Gran Escala (LLM) para desglosar objetivos complejos en pasos técnicos accionables, garantizando la seguridad de los datos y la persistencia del historial.

---

## Funcionalidades Clave
* Orquestación de IA: Integración con Llama 3.3 vía Groq Cloud para generar flujos de trabajo técnicos.
* Persistencia de Datos: Sistema de historial basado en SQLite que retiene las consultas incluso tras reiniciar el sistema.
* Interfaz de Alto Impacto: UI construida con React 19, utilizando Glassmorphism y animaciones fluidas con Framer Motion.
* Arquitectura Robusta: Aislamiento total mediante contenedores Docker y redes virtuales.

## Tecnologías y Herramientas
* Frontend: React.js (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
* Backend: Python (Flask), SQLite (Persistencia SQL), Requests (API de IA).
* Infraestructura: Docker y Docker Compose (Orquestación de microservicios).
* Seguridad: Variables de Env (.env), Manejo de Errores (Error Handling) en tiempo real.

## Arquitectura del Proyecto
El sistema se divide en dos microservicios principales:
1. Container ai_bio_frontend: Servidor de interfaz de usuario optimizado.
2. Container ai_bio_backend: API RESTful que gestiona la lógica de IA y el acceso a la base de datos.

## Instalación y Despliegue
Para ejecutar este proyecto localmente usando Docker:

`ash
# Clonar el repositorio
git clone [https://github.com/Jorgeotero1998/ai-task-orchestrator.git](https://github.com/Jorgeotero1998/ai-task-orchestrator.git)

# Levantar la infraestructura completa
docker-compose up -d --build
`

---
Jorge Otero | Proyecto Full-Stack con arquitectura de contenedores y persistencia de datos.
