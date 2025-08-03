import ee
import geopandas as gpd
import os

# Inicializar Earth Engine
ee.Initialize(project='biosentinel-uv')

# Polígono del Amazonas (entrenamiento)
amazon_polygon = ee.Geometry.Polygon([
   [
      [-60.365238, -7.886508],
      [-76.811428, -7.886508],
      [-76.811428, 5.640415],
      [-60.365238, 5.640415],
      [-60.365238, -7.886508]
   ]
])

def geometry_from_geojson(geom):
   geo_type = geom['type']
   coords = geom['coordinates']

   def close_ring(ring):
      if ring[0] != ring[-1]:
         ring.append(ring[0])
      return ring

   if geo_type == 'Polygon':
      ring = close_ring(coords[0])
      return ee.Geometry.Polygon([ring])
   elif geo_type == 'MultiPolygon':
      fixed_coords = []
      for polygon in coords:
         fixed_polygon = []
         for ring in polygon:
               fixed_polygon.append(close_ring(ring))
         fixed_coords.append(fixed_polygon)
      return ee.Geometry.MultiPolygon(fixed_coords)
   else:
      raise ValueError(f"Tipo de geometría no soportado: {geo_type}")

def create_feature_collection(gdf):
   features = []
   for idx, row in gdf.iterrows():
      geom = geometry_from_geojson(row['geometry'].__geo_interface__)
      feature = ee.Feature(geom).set('id', idx)
      features.append(feature)
   return ee.FeatureCollection(features).filterBounds(amazon_polygon)

def extract_and_export_batch(fc, export_name_base,
                           start_date='2023-01-01', end_date='2024-01-01'):

   s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate(start_date, end_date)
                  .filterBounds(amazon_polygon)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))

   def add_ndvi(img):
      return img.addBands(img.normalizedDifference(['B8', 'B4']).rename('NDVI'))

   s2_ndvi_mean = s2_collection.map(add_ndvi).select('NDVI').mean()
   dem = (ee.ImageCollection("COPERNICUS/DEM/GLO30")
                  .filterBounds(amazon_polygon)
                  .select("DEM")
                  .mosaic())


   modis_lst_mean = (ee.ImageCollection('MODIS/061/MOD11A2')
                     .filterDate(start_date, end_date)
                     .filterBounds(amazon_polygon)
                     .select('LST_Day_1km')
                     .mean())

   # Soil Moisture Active Passive (SMAP) surface soil moisture (daily):
   smap_mean = (ee.ImageCollection('NASA_USDA/HSL/SMAP10KM_soil_moisture')
                  .filterDate(start_date, end_date)
                  .filterBounds(amazon_polygon)
                  .select('ssm')
                  .mean())


   combined_image = s2_ndvi_mean.addBands([dem, modis_lst_mean, smap_mean])

   stats_fc = combined_image.reduceRegions(
      collection=fc,
      reducer=ee.Reducer.mean(),
      scale=5000,
      tileScale=4
   )

   task = ee.batch.Export.table.toDrive(
      collection=stats_fc,
      description=f'Export_{export_name_base}',
      folder='EarthEngineExports',
      fileNamePrefix=f'{export_name_base}',
      fileFormat='CSV'
   )
   task.start()
   print(f"Tarea iniciada para {export_name_base}: {task.id}")

def split_gdf_chunks(gdf, chunk_size):
   return [gdf.iloc[i:i + chunk_size] for i in range(0, len(gdf), chunk_size)]

def process_geojson(filepath):
   print(f"Procesando: {filepath}")
   gdf = gpd.read_file(filepath)
   gdf = gdf[gdf.geometry.notnull()]
   gdf['geometry'] = gdf['geometry'].simplify(tolerance=0.001, preserve_topology=True)
   export_name = os.path.basename(filepath).replace('.geojson', '')

   chunks = split_gdf_chunks(gdf, chunk_size=2000)
   print(f"Se dividió en {len(chunks)} chunks")

   for idx, chunk_gdf in enumerate(chunks):
      fc = create_feature_collection(chunk_gdf)
      export_name_chunk = f"{export_name}_chunk_{idx}"
      extract_and_export_batch(fc, export_name_chunk)

def main():
   folder = '../../docs/Ground Truth GeoJsons'
   geojson_files = [f for f in os.listdir(folder) if f.endswith('.geojson')]

   #for geojson_file in geojson_files:
   #    path = os.path.join(folder, geojson_file)
   #    process_geojson(path)

   path = os.path.join(folder, geojson_files)
   process_geojson(path)
if __name__ == "__main__":
   main()
   print("Todas las tareas han sido enviadas.")