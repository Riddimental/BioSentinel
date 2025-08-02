import rasterio
import matplotlib.pyplot as plt
import rasterio
from PIL import Image
import numpy as np

# Ruta al archivo TIFF
input_tif = "lst_amazon_july2023.tif"

# Abrir el archivo .tif y leer la primera banda como array 2D
with rasterio.open(input_tif) as src:
    array = src.read(1)

# Normalizar el array a 0–255 (uint8)
array_min, array_max = np.nanmin(array), np.nanmax(array)
array_norm = ((array - array_min) / (array_max - array_min) * 255).astype(np.uint8)

# Convertir el array normalizado a imagen PNG en escala de grises
imagen = Image.fromarray(array_norm, mode='L')
imagen.save("salida.png")
