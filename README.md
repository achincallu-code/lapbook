# Lapbook — Fundamentos de desarrollo web

Lapbook educativa diseñada como un libro desplegable. La portada abre una vista interior con tarjetas plegables sobre etiquetas HTML, Jinja2, propiedades CSS y comandos SQL.

Cada ficha incluye una explicación ampliada, un ejemplo interactivo y un reto con retroalimentación. El avance se guarda localmente en el navegador. También incluye un proyecto integrador para personalizar una ficha de estudiante y observar cómo colaboran HTML, Jinja2, CSS y SQL; la vista previa funciona localmente y no consulta una base de datos.

## Ejecutar

1. (Opcional) Crea un entorno virtual: `python -m venv .venv`
2. Actívalo en Windows: `.venv\Scripts\activate`
3. Instala las dependencias: `pip install -r requirements.txt`
4. Inicia la aplicación: `python main.py`
5. Abre `http://127.0.0.1:5000` en el navegador.

## Estructura

```text
lapbook/
├── main.py
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
