from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from urllib.parse import quote

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import FastAPI, Request
from fastapi.responses import (
    HTMLResponse,
    Response,
    FileResponse
)
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
    model_validator
)
BASE = Path(__file__).resolve().parent

sys.path.insert(
    0,
    str(BASE.parent)
)


from Pdf import generar_pdf_proforma
from Catalogo import leer_catalogo, validar_seleccion, buscar_imagen, buscar_logo
from fastapi import HTTPException


def catalogo_actual():
    return leer_catalogo(BASE.parent / "imgreferencias")



# =============================
# CREAR APLICACIÓN
# =============================

app = FastAPI(
    title="Tangerine Unlimited", docs_url=None, redoc_url=None, openapi_url=None
)


@app.get("/healthz")
def estado_servicio():
    catalogo, avisos = catalogo_actual()
    if not catalogo or avisos or buscar_logo(BASE.parent) is None:
        raise HTTPException(status_code=503, detail="Biblioteca o logo incompletos")
    return {"estado": "ok"}


@app.get("/api/referencias")
def obtener_referencias():
    try:
        referencias, avisos = catalogo_actual()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error))
    return {"referencias": {base: {"colores": sorted(c for c in variantes if c),
                                  "sin_color": "" in variantes}
                            for base, variantes in referencias.items()}, "avisos": avisos}


@app.get("/api/referencias/imagen")
def imagen_referencia(referencia: str):
    try:
        catalogo, _ = catalogo_actual()
        ruta = buscar_imagen(referencia, BASE.parent / "imgreferencias", catalogo)
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(status_code=503, detail=str(error))
    if ruta is None or not ruta.is_file():
        raise HTTPException(status_code=404, detail="Imagen no disponible para esta referencia y color")
    return FileResponse(ruta, headers={"Cache-Control": "no-cache"})


@app.get("/api/empresa/logo")
def logo_empresa():
    ruta = buscar_logo(BASE.parent)
    if ruta is None:
        raise HTTPException(status_code=404, detail="Logo no disponible")
    return FileResponse(ruta, media_type="image/png", headers={"Cache-Control": "no-cache"})


# =============================
# ARCHIVOS ESTÁTICOS
# =============================

app.mount(
    "/static",
    StaticFiles(directory=str(BASE / "static")),
    name="static"
)


# =============================
# PLANTILLAS
# =============================

templates = Jinja2Templates(
    directory=str(BASE / "templates")
)


# =============================
# PÁGINA PRINCIPAL
# =============================

@app.get(
    "/",
    response_class=HTMLResponse
)
async def inicio(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="inicio.html"
    )

# =============================
# NUEVA PROFORMA
# =============================

@app.get(
    "/proforma",
    response_class=HTMLResponse
)
async def proforma(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="proforma.html"
    )

# =============================
# DATOS Y GENERACIÓN DE PDF
# =============================

class ProductoProforma(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    referencia: str = Field(min_length=1, max_length=100)
    cantidad: int = Field(gt=0, strict=True)
    precio: Decimal = Field(gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)

    @field_validator("referencia")
    @classmethod
    def normalizar_referencia(cls, valor):
        return valor.upper()


class DatosProforma(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    cliente: str = Field(min_length=1, max_length=200)
    pais: str = Field(default="", max_length=100)
    idioma: Literal["es", "en"] = "es"
    transfer: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    productos: list[ProductoProforma] = Field(min_length=1, max_length=1000)

    @model_validator(mode="after")
    def validar_duplicados(self):
        catalogo, _ = catalogo_actual()
        for producto in self.productos:
            validar_seleccion(producto.referencia, catalogo)
        referencias = [p.referencia for p in self.productos]
        if len(referencias) != len(set(referencias)):
            raise ValueError("Hay referencias duplicadas")
        return self


@app.post("/generar-proforma")
def generar_proforma(
    datos: DatosProforma
):

    # =============================
    # FECHA ACTUAL
    # =============================

    fecha_actual = datetime.now(
        ZoneInfo("America/Panama")
    ).strftime(
        "%d/%m/%Y"
    )


    # =============================
    # PREPARAR PRODUCTOS
    # =============================

    productos_pdf = []


    for producto in datos.productos:

        precio = producto.precio.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )


        subtotal = (
            precio
            * producto.cantidad
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )


        productos_pdf.append(
            {
                "referencia":
                    producto.referencia,

                "cantidad":
                    producto.cantidad,

                "precio":
                    precio,

                "subtotal":
                    subtotal
            }
        )


    # =============================
    # TRANSFER
    # =============================

    transfer = datos.transfer.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


    # =============================
    # GENERAR PDF
    # =============================

    # Cada solicitud genera un archivo aislado; se borra tras leer sus bytes.
    with TemporaryDirectory(prefix="proforma-") as carpeta_documentos:
        ruta_pdf = generar_pdf_proforma(
            cliente=datos.cliente, pais=datos.pais, fecha=fecha_actual,
            productos=productos_pdf, transfer=transfer, idioma=datos.idioma,
            carpeta_salida=carpeta_documentos
        )
        contenido = ruta_pdf.read_bytes()
        nombre = ruta_pdf.name
    return Response(
        content=contenido, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename*=UTF-8''" + quote(nombre, safe=""),
                 "Cache-Control": "no-store"}
    )
