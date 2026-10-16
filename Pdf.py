from pathlib import Path
import re
from xml.sax.saxutils import escape
from Catalogo import leer_catalogo, buscar_imagen, separar_referencia, buscar_logo
from reportlab.lib.utils import ImageReader

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether
)


# =============================
# CARPETA DE SALIDA
# =============================

CARPETA_SALIDA = Path(
    "documentos_generados"
)


# =============================
# LIMPIAR NOMBRE DE ARCHIVO
# =============================

def limpiar_nombre_archivo(texto):

    texto = texto.strip()

    texto = re.sub(
        r'[\\/:*?"<>|]',
        "_",
        texto
    )

    texto = texto.replace(
        " ",
        "_"
    )

    return texto


# =============================
# OBTENER RUTA DISPONIBLE
# =============================

def obtener_ruta_disponible(
    carpeta,
    nombre_base
):

    ruta = (
        carpeta
        / f"{nombre_base}.pdf"
    )


    # Si todavía no existe,
    # utilizar el nombre normal.

    if not ruta.exists():

        return ruta


    # Si ya existe, agregar
    # _2, _3, _4...

    numero = 2


    while True:

        ruta = (
            carpeta
            / f"{nombre_base}_{numero}.pdf"
        )


        if not ruta.exists():

            return ruta


        numero += 1


# =============================
# GENERAR PDF DE PROFORMA
# =============================

def generar_pdf_proforma(
    cliente,
    pais,
    fecha,
    productos,
    transfer,
    idioma="es",
    carpeta_salida=None
):

    # =============================
    # TEXTOS / IDIOMA
    # =============================

    textos = {

        "es": [
            "PROFORMA",
            "Cliente:",
            "País:",
            "Fecha:",
            "Referencia",
            "Cantidad",
            "Precio Unitario",
            "Subtotal",
            "Cantidad total:",
            "Subtotal:",
            "Transfer:",
            "Total:"
        ],

        "en": [
            "PROFORMA INVOICE",
            "Customer:",
            "Country:",
            "Date:",
            "Reference",
            "Quantity",
            "Unit Price",
            "Subtotal",
            "Total quantity:",
            "Subtotal:",
            "Transfer:",
            "Total:"
        ]
    }


    if idioma not in textos:

        raise ValueError(
            "Idioma no válido"
        )


    etiquetas = textos[idioma]


    # =============================
    # CARPETA DE SALIDA
    # =============================

    salida = (
        Path(carpeta_salida)
        if carpeta_salida is not None
        else CARPETA_SALIDA
    )


    salida.mkdir(
        parents=True,
        exist_ok=True
    )


    # =============================
    # NOMBRE DEL ARCHIVO
    # =============================

    cliente_archivo = limpiar_nombre_archivo(
        cliente
    )


    pais_archivo = limpiar_nombre_archivo(
        pais
    )


    # =============================
    # CREAR NOMBRE BASE
    # =============================

    if pais_archivo:

        nombre_base = (
            f"Proforma."
            f"{cliente_archivo}."
            f"{pais_archivo}"
        )

    else:

        nombre_base = (
            f"Proforma."
            f"{cliente_archivo}"
        )


    # =============================
    # OBTENER RUTA FINAL
    # =============================

    ruta_pdf = obtener_ruta_disponible(
        salida,
        nombre_base
    )


    # =============================
    # DOCUMENTO
    # =============================

    documento = SimpleDocTemplate(
        str(ruta_pdf),
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm
    )


    elementos = []


    # =============================
    # ESTILOS
    # =============================

    estilos = getSampleStyleSheet()


    estilo_empresa = ParagraphStyle(
        "Empresa",
        parent=estilos["Title"],
        alignment=TA_CENTER,
        fontSize=18,
        spaceAfter=5
    )


    estilo_documento = ParagraphStyle(
        "Documento",
        parent=estilos["Heading2"],
        alignment=TA_CENTER,
        fontSize=13,
        spaceAfter=10
    )


    estilo_total = ParagraphStyle(
        "Total",
        parent=estilos["Normal"],
        alignment=TA_RIGHT,
        fontSize=11,
        leading=16
    )


    # =============================
    # ENCABEZADO
    # =============================

    ruta_logo = buscar_logo(Path(__file__).resolve().parent)
    if ruta_logo is not None:
        ancho, alto = ImageReader(str(ruta_logo)).getSize()
        escala = min(7.2 * cm / ancho, 2.4 * cm / alto)
        logo = Image(str(ruta_logo), width=ancho * escala, height=alto * escala)
        logo.hAlign = "CENTER"
        elementos.extend([logo, Spacer(1, 0.15 * cm)])
    else:
        elementos.append(Paragraph("TANGERINE UNLIMITED", estilo_empresa))


    elementos.append(
        Paragraph(
            etiquetas[0],
            estilo_documento
        )
    )


    # =============================
    # DATOS GENERALES
    # =============================

    datos_cliente = [
        [
            etiquetas[1],
            cliente
        ],
        [
            etiquetas[2],
            pais if pais else "-"
        ],
        [
            etiquetas[3],
            fecha
        ]
    ]


    tabla_cliente = Table(
        datos_cliente,
        colWidths=[
            3 * cm,
            12 * cm
        ]
    )


    tabla_cliente.setStyle(
        TableStyle(
            [
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold"
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6
                )
            ]
        )
    )


    elementos.append(
        tabla_cliente
    )

    elementos.append(
        Spacer(
            1,
            0.5 * cm
        )
    )


    # =============================
    # TABLA DE PRODUCTOS
    # =============================

    carpeta_imagenes = Path(__file__).resolve().parent / "imgreferencias"
    catalogo, _ = leer_catalogo(carpeta_imagenes) if carpeta_imagenes.is_dir() else ({}, [])
    estilo_celda = ParagraphStyle("CeldaProducto", parent=estilos["Normal"], fontSize=9, leading=11)
    datos_productos = [[etiquetas[4], "Imagen" if idioma == "es" else "Image",
                        etiquetas[5], etiquetas[6], etiquetas[7]]]
    for producto in productos:
        base, color = separar_referencia(producto["referencia"])
        ruta_imagen = buscar_imagen(producto["referencia"], carpeta_imagenes, catalogo)
        imagen = Paragraph("Sin imagen" if idioma == "es" else "No image", estilo_celda)
        if ruta_imagen is not None and ruta_imagen.is_file():
            try:
                ancho, alto = ImageReader(str(ruta_imagen)).getSize()
                escala = min(2 * cm / ancho, 2 * cm / alto)
                imagen = Image(str(ruta_imagen), width=ancho * escala, height=alto * escala)
                imagen.hAlign = "CENTER"
            except (OSError, ValueError):
                pass
        datos_productos.append([
            Paragraph(escape(base), estilo_celda), imagen, str(producto["cantidad"]),
            f"${producto['precio']:,.2f}", f"${producto['subtotal']:,.2f}"])
    tabla_productos = Table(datos_productos,
        colWidths=[4 * cm, 3 * cm, 2.5 * cm, 4 * cm, 4.5 * cm], repeatRows=1)

    tabla_productos.setStyle(
        TableStyle(
            [
                # Encabezado

                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.black
                ),

                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white
                ),

                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold"
                ),

                # Tabla completa

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey
                ),

                (
                    "ALIGN",
                    (1, 1),
                    (-1, -1),
                    "CENTER"
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                )
            ]
        )
    )


    elementos.append(
        tabla_productos
    )

    elementos.append(
        Spacer(
            1,
            0.25 * cm
        )
    )


    # =============================
    # CALCULAR TOTALES
    # =============================

    cantidad_total = sum(
        producto["cantidad"]
        for producto in productos
    )


    subtotal_general = sum(
        producto["subtotal"]
        for producto in productos
    )


    total = (
        subtotal_general
        + transfer
    )


    # =============================
    # TABLA DE TOTALES
    # =============================

    datos_totales = [
        [
            etiquetas[8],
            str(cantidad_total)
        ],
        [
            etiquetas[9],
            f"${subtotal_general:,.2f}"
        ],
        [
            etiquetas[10],
            f"${transfer:,.2f}"
        ],
        [
            etiquetas[11],
            f"${total:,.2f}"
        ]
    ]


    tabla_totales = Table(
        datos_totales,
        colWidths=[
            4 * cm,
            4 * cm
        ],
        hAlign="RIGHT"
    )


    tabla_totales.setStyle(
        TableStyle(
            [
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold"
                ),

                (
                    "ALIGN",
                    (1, 0),
                    (1, -1),
                    "RIGHT"
                ),

                (
                    "LINEABOVE",
                    (0, -1),
                    (-1, -1),
                    1,
                    colors.black
                ),

                (
                    "FONTNAME",
                    (0, -1),
                    (-1, -1),
                    "Helvetica-Bold"
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                )
            ]
        )
    )


    elementos.append(
        KeepTogether([tabla_totales])
    )


    # =============================
    # CONSTRUIR PDF
    # =============================

    documento.build(
        elementos
    )


    # Devolver ruta al programa principal

    return ruta_pdf