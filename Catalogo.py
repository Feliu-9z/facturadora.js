"""Catálogo de imágenes; conserva rutas, guiones y ceros originales."""
from pathlib import Path
import re


def leer_catalogo(carpeta):
    carpeta = Path(carpeta)
    if not carpeta.is_dir():
        raise FileNotFoundError(f"No existe la biblioteca: {carpeta}")
    referencias = {}
    avisos = []
    for archivo in sorted(carpeta.iterdir()):
        if not archivo.is_file() or archivo.suffix.lower() not in {'.jpg', '.jpeg', '.png'}:
            continue
        nombre = archivo.stem.strip().upper()
        coincidencia = re.fullmatch(r'(.+\d)([A-Z]{2,3})', nombre)
        if coincidencia:
            base, color = coincidencia.groups()
        elif re.fullmatch(r'.*\d', nombre):
            base, color = nombre, ''
        else:
            avisos.append(f'Nombre sin referencia reconocible: {archivo.name}')
            continue
        variantes = referencias.setdefault(base, {})
        if color in variantes:
            raise ValueError(f'Imágenes duplicadas para {base} ({color}): {variantes[color]} / {archivo.name}')
        variantes[color] = archivo.name
    return referencias, avisos


def validar_seleccion(referencia, catalogo):
    coincidencia = re.fullmatch(r'(.+)\(([A-Z]{2,3})\)', referencia)
    base, color = coincidencia.groups() if coincidencia else (referencia, '')
    if base not in catalogo or color not in catalogo[base]:
        raise ValueError(f'Referencia o color no disponible: {referencia}')
    return base, color


def separar_referencia(referencia):
    nombre = referencia.strip().upper()
    coincidencia = re.fullmatch(r'(.+)\(([A-Z]{2,3})\)', nombre)
    return coincidencia.groups() if coincidencia else (nombre, '')


def buscar_imagen(referencia, carpeta, catalogo=None):
    if catalogo is None:
        catalogo, _ = leer_catalogo(carpeta)
    base, color = separar_referencia(referencia)
    nombre = catalogo.get(base, {}).get(color)
    return Path(carpeta) / nombre if nombre else None


def buscar_logo(carpeta_proyecto):
    referencias = Path(carpeta_proyecto) / "referencias"
    for ruta in [referencias / "LOGOUNLIMITED.png", referencias / "diseno_v2" / "LOGOUNLIMITED.png"]:
        if ruta.is_file():
            return ruta
    return None
