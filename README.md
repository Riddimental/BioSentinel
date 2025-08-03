# 🛰️ BioSentinel-UV

**BioSentinel-UV** es una plataforma interactiva que combina inteligencia artificial con datos satelitales de la misión **Copernicus Sentinel** para detectar y visualizar en tiempo real los núcleos de biodiversidad y sus zonas de transición. Se basa en el patrón **"core-to-transition"** descrito en el artículo publicado en *Nature Ecology & Evolution*, que revela cómo la vida en la Tierra se organiza espacialmente.

---

## 🌍 ¿Por qué es importante?

La biodiversidad no se distribuye al azar: se concentra en **zonas núcleo**, desde donde se expande hacia áreas de transición con menor riqueza ecológica. Estos núcleos son esenciales para la estabilidad de ecosistemas completos. Si se ven alterados por actividades humanas o por el cambio climático, las consecuencias pueden incluir:

* Pérdida de servicios ecosistémicos (polinización, regulación hídrica, fertilidad del suelo).
* Impactos negativos en la agricultura, ganadería y economías rurales.
* Alteración de corredores biológicos esenciales para la migración y reproducción de especies.

---

## 🧭 ¿Qué hace BioSentinel-UV?

* 🛰️ **Integra datos satelitales Copernicus Sentinel (NDVI, LST) y DEM de elevación para modelar condiciones ambientales.**
* 🧠 **Entrena modelos de machine learning para predecir zonas núcleo y de transición de biodiversidad en regiones sin datos directos.**
* 📈 **Genera rejillas espaciales enriquecidas con variables ambientales y predice patrones ecológicos por grupo taxonómico.**
* 🗺️ **Visualiza los resultados en una aplicación web 3D interactiva y exporta capas como archivos GeoJSON.**
* ⚠️ **Facilita la detección de amenazas por expansión agrícola, deforestación o eventos climáticos extremos.**

---

## 🧪 Detalles técnicos

* Se utilizaron capas ambientales de:

  * **NDVI:** Sentinel-2 SR Harmonized (*COPERNICUS/S2\_SR\_HARMONIZED*)
  * **LST:** MODIS MOD11A2 v6.1 (convertida a grados Celsius)
  * **DEM:** *Copernicus DEM GLO-30* (resolución de 30 m)
* Se generó una **rejilla regular (\~1 km²)** sobre la región amazónica (Colombia), enriquecida con las variables anteriores.
* Se entrenaron modelos por taxón (`amphibians`, `mammals`, `reptiles`, `birds`) usando como inputs: NDVI, LST, elevación y coordenadas geográficas.
* Los outputs son predicciones de:

  * `biota_overlap`
  * `relative_occupancy`
  * `relative_species_richness`
* Se descartan grupos como peces (datos marítimos), insectos (caso de estudio limitado a Asia) y árboles (caso centrado en EE.UU.), aunque el flujo es escalable si se dispone de datos adecuados.

---

## 📁 Estructura del Proyecto

```plaintext
biosentinel/
├── frontend/         # Webapp 3D interactiva (Node.js + TypeScript)
├── backend/          # API REST para servir predicciones y datos
├── model/            # Modelos de ML, notebooks y scripts de predicción
│   ├── notebooks/
│   └── scripts/
├── data/             # Datos satelitales descargados o en caché local
│   └── sentinel_samples/
├── docs/             # Documentación, papers, presentaciones
├── README.md
└── .gitignore
```

---

## 👤 Público objetivo

* **Tomadores de decisión (gobiernos locales y nacionales)**: para conservación, ordenamiento territorial y monitoreo.
* **Organizaciones ambientales (ONGs, institutos de investigación)**: para priorización de áreas clave.
* **Científicos y ecólogos**: para validar hipótesis sobre patrones de biodiversidad espacial.
* **Comunidades locales y agricultores**: para comprender cómo la biodiversidad afecta su entorno y productividad.

---

## 🛠️ Tecnologías clave

* 🌍 **Copernicus Sentinel-2, MODIS y DEMs globales**
* 🤖 **Machine Learning con Python (scikit-learn, PyTorch)**
* 🗺️ **Procesamiento geoespacial con rasterio, geopandas y Earth Engine**
* 🌐 **Visualización 3D en web con Three.js o Cesium.js**
* ⚙️ **Infraestructura de despliegue en GitHub + API REST**

---

## 🚀 Estado actual

* [x] Limpieza y entrenamiento de modelos por taxón
* [x] Exportación de predicciones como CSV y GeoJSON
* [x] Consulta remota o en caché de datos NDVI, LST y DEM
* [ ] Visualización web interactiva en 3D
* [ ] API de consulta dinámica por coordenadas
* [ ] MVP completo para presentación y despliegue

---

## 📚 Referencias

* 📄 **Artículo base:** [Core-to-transition biodiversity organization (Nature Ecology & Evolution, 2024)](https://www.nature.com/articles/s41559-025-02724-5#Sec6)
* 🛰️ **Copernicus Open Access Hub:** [https://scihub.copernicus.eu/](https://scihub.copernicus.eu/)

---

## 👥 Equipo

Desarrollado para el **Hackathon Copernicus LAC 2025** por:

* PhD. María Patricia Trujillo
* PhD. César Pantoja
* PhD. Luz Ángela González
* David Alberto Guzmán
* Jhoan León
* Sebastián Díaz
