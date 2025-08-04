import os
import numpy as np
import geopandas as gpd
import rasterio
from shapely.geometry import Point
from joblib import load
import pandas as pd
import ee
import geemap

# Inicializa Google Earth Engine con tu proyecto
ee.Initialize(project='biosentinel-uv')

# Configuración general
TAXON = "amphibians"
MODEL_PATH = f"./model/BS-1.0/models/{TAXON}_model.pkl"
RESOLUTION = 0.01  # grados (aprox. 1 km)
OUTPUT_DIR = "./model/BS-1.0/scripts/output"
DATA_DIR = "./cached_layers"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

def get_bbox_from_point(lon, lat, radius_km=50):
    """
    Calcula bbox cuadrado alrededor de un punto con lado = 2*radius_km.
    Convierte km a grados asumiendo ~111 km por grado.
    """
    deg_radius = radius_km / 111  # aproximación
    return {
        "min_lon": lon - deg_radius,
        "max_lon": lon + deg_radius,
        "min_lat": lat - deg_radius,
        "max_lat": lat + deg_radius,
    }

def download_layer_if_missing(path, gee_image, band, bbox, scale=1000):
    if os.path.exists(path):
        print(f"✅ {os.path.basename(path)} ya descargado.")
        return

    region = ee.Geometry.Rectangle([bbox["min_lon"], bbox["min_lat"], bbox["max_lon"], bbox["max_lat"]])
    image = gee_image.select(band).clip(region)

    print(f"⬇️ Descargando {os.path.basename(path)} desde Google Earth Engine...")
    geemap.ee_export_image(
        image,
        filename=path,
        region=region,
        scale=scale,
        file_per_band=False,
        crs="EPSG:4326"
    )

def get_gee_layers(bbox):
    region = ee.Geometry.Rectangle([bbox["min_lon"], bbox["min_lat"], bbox["max_lon"], bbox["max_lat"]])

    ndvi = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
        .filterDate("2023-01-01", "2023-12-31") \
        .filterBounds(region) \
        .median() \
        .normalizedDifference(['B8', 'B4']).rename('NDVI')

    lst = ee.ImageCollection("MODIS/061/MOD11A2") \
        .filterDate("2023-01-01", "2023-12-31") \
        .select("LST_Day_1km") \
        .mean() \
        .multiply(0.02).subtract(273.15).rename("LST")  # Kelvin a °C

    dem = ee.ImageCollection("COPERNICUS/DEM/GLO30") \
        .mosaic() \
        .select('DEM') \
        .rename('DEM')

    return ndvi, lst, dem

def generate_grid(bbox, resolution=RESOLUTION):
    lon_vals = np.arange(bbox["min_lon"], bbox["max_lon"], resolution)
    lat_vals = np.arange(bbox["min_lat"], bbox["max_lat"], resolution)
    return [(lon, lat) for lon in lon_vals for lat in lat_vals]

def extract_raster_values(points, raster_path):
    if not os.path.exists(raster_path):
        raise FileNotFoundError(f"{raster_path} no fue encontrado.")
    with rasterio.open(raster_path) as src:
        values = list(src.sample(points))
        return np.array(values).squeeze()

def build_geojson(points, predictions_df, output_path):
    gdf = gpd.GeoDataFrame(
        predictions_df,
        geometry=[Point(xy) for xy in points],
        crs="EPSG:4326"
    )
    gdf.to_file(output_path, driver="GeoJSON")
    print(f"📍 GeoJSON guardado en: {output_path}")
    return gdf

def run_model_for_location(lon, lat, radius_km=50):
    print(f"🚀 Procesando ubicación: lon={lon}, lat={lat} con radio {radius_km} km")

    bbox = get_bbox_from_point(lon, lat, radius_km)

    # Definir paths dinámicos para evitar sobreescritura
    region_name = f"loc_{lon}_{lat}_{radius_km}km".replace('.', '_').replace('-', 'm')
    ndvi_path = f"{DATA_DIR}/{region_name}_NDVI.tif"
    lst_path = f"{DATA_DIR}/{region_name}_LST.tif"
    dem_path = f"{DATA_DIR}/{region_name}_DEM.tif"
    output_geojson = f"{OUTPUT_DIR}/{region_name}_predictions.geojson"

    # Descargar capas si es necesario
    ndvi_img, lst_img, dem_img = get_gee_layers(bbox)
    download_layer_if_missing(ndvi_path, ndvi_img, "NDVI", bbox)
    download_layer_if_missing(lst_path, lst_img, "LST", bbox)
    download_layer_if_missing(dem_path, dem_img, "DEM", bbox)

    # Generar grilla
    points = generate_grid(bbox)

    # Extraer valores
    ndvi = extract_raster_values(points, ndvi_path)
    lst = extract_raster_values(points, lst_path)
    dem = extract_raster_values(points, dem_path)

    # Construir DataFrame
    df = pd.DataFrame({
        "longitude": [pt[0] for pt in points],
        "latitude": [pt[1] for pt in points],
        "NDVI": ndvi,
        "LST_C": lst,
        "DEM": dem
    })

    # Cargar modelo y predecir
    print(f"🤖 Cargando modelo para {TAXON}...")
    model = load(MODEL_PATH)
    y_pred = model.predict(df[["NDVI", "LST_C", "DEM", "longitude", "latitude"]])
    df[["Biota_Overlap", "Rel_Occupancy", "Rel_Species_Richness"]] = y_pred

    # Guardar GeoJSON
    gdf = build_geojson(points, df, output_geojson)

    print("✅ Proceso finalizado.")
    return gdf


if __name__ == "__main__":
    # Ejemplo: centro del Chiribiquete y radio 50km
    lon_input = -76.5
    lat_input = 2.7
    radius_km_input = 50  # o 100

    run_model_for_location(lon_input, lat_input, radius_km=radius_km_input)
