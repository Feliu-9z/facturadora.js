# Facturadora Unlimited: versión web

Incluye las 151 imágenes, el logo y el formulario actual. No incluye clientes, proformas anteriores, entornos virtuales ni respaldos.

## Publicar

1. Crea un repositorio privado en GitHub. Sube el contenido de esta carpeta a la raíz del repositorio (render.yaml y requirements.txt deben quedar en la raíz).
2. Crea una cuenta en https://dashboard.render.com y conecta GitHub.
3. En Render elige New > Blueprint y selecciona el repositorio. Autoriza acceso solo a ese repositorio.
4. Comprueba que el servicio usa el plan Free antes de crearlo. El archivo render.yaml proporciona los comandos y la configuración.
5. Espera a que el servicio figure como Live y abre su dirección HTTPS. Prueba /proforma desde el teléfono usando datos móviles.
6. Agrega CD002 en BL y NA, revisa las imágenes y descarga el PDF. Repite con CD008 y una proforma de varias páginas.

Si prefieres New > Web Service: deja Root Directory vacío, usa Python, Build Command `pip install -r requirements.txt`, Start Command `uvicorn app:app --app-dir Facturadoraweb --host 0.0.0.0 --port $PORT`, Health Check Path `/healthz` y el plan Free.

## Uso y datos

No hay usuarios ni contraseña: cualquiera que consiga la URL puede usar la herramienta y consultar las imágenes. Un repositorio privado mantiene privado el código, no la aplicación publicada.

El servicio gratuito se suspende tras 15 minutos sin actividad y tarda en arrancar al volver. Tu laptop no necesita estar encendida. Los PDF se generan en carpetas temporales independientes, se descargan y se borran del servidor; guarda cada PDF que necesites conservar. No hay historial ni guardado automático de formularios.

Para actualizar referencias, sube las imágenes al repositorio y vuelve a desplegar. No dependas de archivos añadidos manualmente al servidor: su almacenamiento es efímero.

## Ejecutar localmente

Instala requirements.txt en un entorno virtual y ejecuta desde esta carpeta:

    uvicorn app:app --app-dir Facturadoraweb --reload

Abre http://127.0.0.1:8000/proforma.
