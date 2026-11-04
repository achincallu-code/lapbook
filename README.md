# Lapbook — Fundamentos de desarrollo web

Lapbook educativa diseñada como un libro desplegable. La portada abre una vista interior con tarjetas plegables sobre etiquetas HTML, Jinja2, propiedades CSS y comandos SQL.

Cada ficha incluye una explicación ampliada, un ejemplo interactivo y un reto con retroalimentación. El avance se guarda localmente en el navegador. La lapbook se mantiene plana y puede ampliarse con el gesto de pellizcar; el botón permite restablecer el zoom. También incluye un proyecto integrador para personalizar una ficha de estudiante y observar cómo colaboran HTML, Jinja2, CSS y SQL; la vista previa funciona localmente y no consulta una base de datos.

## Ejecutar

1. (Opcional) Crea un entorno virtual: `python -m venv .venv`
2. Actívalo en Windows: `.venv\Scripts\activate`
3. Instala las dependencias: `pip install -r requirements.txt`
4. Inicia la aplicación: `python main.py`
5. Abre `http://127.0.0.1:5000` en el navegador.

## Publicar en Render

1. Sube este proyecto a un repositorio de GitHub.
2. En Render, crea un **Blueprint** y conecta ese repositorio; Render detectará `render.yaml`.
3. Confirma la creación del servicio web y espera a que termine el despliegue.

El Blueprint instala las dependencias de `requirements.txt` y ejecuta `gunicorn main:app`. No se necesita una base de datos ni configurar variables de entorno para esta aplicación.

## Estructura

```text
lapbook/
├── main.py
├── render.yaml
├── requirements.txt
└── app/
    ├── __init__.py
    ├── templates/
    │   └── index.html
    └── static/
        ├── css/
        │   └── style.css
        └── js/
            └── main.js
```
