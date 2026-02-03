# AI-BIO: Orchestrator

## Descripción General
AI-BIO es un sistema de orquestación de tareas técnicas especializado en biotecnología, diseñado para desglosar objetivos estratégicos complejos en protocolos operativos detallados. La plataforma utiliza inteligencia artificial generativa a través de la API de Groq para transformar una instrucción simple en una secuencia lógica de pasos técnicos.

## Arquitectura del Sistema
El proyecto se basa en una arquitectura de microservicios contenedorizados, lo que garantiza la portabilidad y escalabilidad de cada componente.

### 1. Frontend (Capa de Presentación)
Desarrollado con **React 18** y **Vite**, enfocado en una interfaz de usuario de alta fidelidad (Hi-Fi) con estética de "Cyber-Lab".
- **Estado y Lógica:** Hooks de React (useState, useEffect) para la gestión del ciclo de vida.
- **Animaciones:** Framer Motion para transiciones suaves y estados de carga.
- **Iconografía:** Lucide-React para una identidad visual técnica.
- **Generación de Documentos:** Integración con jsPDF para la exportación de protocolos en formato PDF con formato profesional.

### 2. Backend (Capa de Lógica y Procesamiento)
Implementado con **Python 3.9** y el micro-framework **Flask**.
- **Orquestación de IA:** Integración con modelos de lenguaje de gran escala (LLM) mediante Groq Cloud API.
- **Seguridad:** Sistema de autenticación basado en JSON Web Tokens (JWT) para proteger los endpoints de la API.
- **Persistencia de Datos:** SQLite para el almacenamiento local del historial de tareas y credenciales de usuario.

### 3. Infraestructura y Despliegue
- **Contenedores:** Docker y Docker Compose para la orquestación de servicios.
- **Servidor Web:** Nginx configurado como servidor de archivos estáticos para el frontend.
- **Control de Versiones:** Git con flujo de trabajo basado en ramas (main).



## Tecnologías Utilizadas
- **Frontend:** React, Vite, Axios, Tailwind CSS (estilos embebidos), Framer Motion, jsPDF.
- **Backend:** Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Groq SDK.
- **DevOps:** Docker, Docker Compose, Nginx.
- **Base de Datos:** SQLite 3.

## Instalación y Configuración

### Requisitos Previos
- Docker Desktop instalado.
- Llave de API de Groq Cloud.

### Guía de Despliegue
1. Clonar el repositorio:
   git clone https://github.com/Jorgeotero1998/ai-task-orchestrator.git

2. Configurar variables de entorno:
   Crear un archivo .env en la raíz con la siguiente clave:
   GROQ_API_KEY=tu_api_key_aqui

3. Iniciar el sistema mediante Docker:
   docker-compose up -d --build

4. Acceso al sistema:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Funcionalidades Implementadas
- **Acceso Seguro:** Panel de login con validación de tokens.
- **Orquestación Neural:** Procesamiento de lenguaje natural para desglosar tareas técnicas.
- **Historial de Consultas:** Recuperación persistente de protocolos anteriores desde la base de datos.
- **Exportación Técnica:** Capacidad de descargar los protocolos generados en PDF para su uso en laboratorio.
- **Interfaz Adaptativa:** Diseño optimizado para visualización de alta densidad de información.

