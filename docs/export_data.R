# get the code from the source paper and excecute this file on its root

library(sf)
library(dplyr)

# CRS estándar para exportar: WGS 84
standard_crs <- 4326

# Función para exportar GeoJSON de un taxón con geometría y atributos
exportar_cluster_geojson <- function(grid_file, clust_file, taxon_name, output_geojson) {
  if (!file.exists(grid_file)) {
    cat("❌ No se encontró el archivo de grilla:", grid_file, "\n")
    return()
  }
  if (!file.exists(clust_file)) {
    cat("❌ No se encontró el archivo de clustering:", clust_file, "\n")
    return()
  }
  
  # Cargar grilla y clustering
  grid <- readRDS(grid_file)
  clust <- readRDS(clust_file)
  
  # Asegurar columnas como carácter
  grid <- grid %>% mutate(ID = as.character(ID))
  clust <- clust %>% mutate(cell = as.character(cell))
  
  # Renombrar columna para hacer join
  grid <- grid %>% rename(cell = ID)
  
  # Convertir a objeto sf si no lo es
  if (!inherits(grid, "sf")) {
    grid <- st_as_sf(grid)
  }
  
  # Asegurar CRS válido (forzar a WGS84 si no tiene)
  if (is.na(st_crs(grid))) {
    st_crs(grid) <- standard_crs
  } else {
    grid <- st_transform(grid, crs = standard_crs)
  }
  
  # Join por cell
  df <- grid %>%
    inner_join(clust, by = "cell") %>%
    mutate(taxon = taxon_name)
  
  # Validar geometrías
  df <- st_make_valid(df)
  
  # Exportar como GeoJSON
  st_write(df, output_geojson, delete_dsn = TRUE, quiet = TRUE)
  cat("✔️ GeoJSON exportado para", taxon_name, "en:", output_geojson, "\n")
}

# Lista de taxones con info
taxa_info <- list(
  list("grids/grid_1.rds", "02_Op_db_clust_Taxo_Amph.rds", "Amphibians", "amphibians_cluster.geojson"),
  list("grids/grid_1.rds", "02_Op_db_clust_Taxo_Mamm.rds", "Mammals", "mammals_cluster.geojson"),
  list("grids/grid_1.rds", "02_Op_db_clust_Taxo_Bird.rds", "Birds", "birds_cluster.geojson"),
  list("grids/grid_1.rds", "02_Op_db_clust_Taxo_Rept.rds", "Reptiles", "reptiles_cluster.geojson"),
  list("grids/grid_1.rds", "02_Op_db_clust_Taxo_Drag.rds", "Dragonflies", "dragonflies_cluster.geojson"),
  list("grids/grid_05.rds", "02_Op_db_clust_Taxo_Tree.rds", "Trees", "trees_cluster.geojson"),
  list("grids/grid_4.rds", "02_Op_db_clust_Taxo_Rays.rds", "Rays", "rays_cluster.geojson")
)

# Ejecutar exportación para cada taxón
for (taxon in taxa_info) {
  exportar_cluster_geojson(taxon[[1]], taxon[[2]], taxon[[3]], taxon[[4]])
}
