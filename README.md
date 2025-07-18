# 🛰️ BioSentinel

**BioSentinel** es una plataforma interactiva que utiliza inteligencia artificial e imágenes satelitales Sentinel para identificar y visualizar en tiempo real las zonas núcleo y de transición de biodiversidad, basándose en el patrón descrito en el paper publicado en *Nature Ecology & Evolution* sobre la organización “core-to-transition” de la vida en la Tierra.

## 🌱 ¿Por qué importa?

La biodiversidad global sigue un patrón no aleatorio: especies se concentran en núcleos (corazones de biodiversidad), desde donde se filtran hacia zonas de transición con menor riqueza biológica. Si estas zonas núcleo se ven afectadas, toda la red ecológica regional sufre desequilibrios que impactan directamente cultivos, ganadería, polinizadores y economías rurales.

## 🔍 Qué hace BioSentinel

- 📡 Interpola imágenes satelitales Sentinel y datos del estudio científico para detectar zonas de alta relevancia ecológica.
- 🧠 Usa modelos de machine learning para inferir zonas núcleo y de transición en regiones sin datos directos.
- 🗺️ Proporciona una visualización web 3D interactiva del planeta con capas de calor ecológico.
- ⚠️ Facilita la detección de riesgos por intervención humana o climática en ecosistemas clave.

---

## 📁 Estructura del Proyecto

```plaintext
biosentinel/
├── frontend/         # Webapp 3D con Node.js y TypeScript
├── backend/          # API REST y procesamiento intermedio
├── model/            # Códigos y notebooks de IA y análisis
│   ├── notebooks/
│   └── scripts/
├── data/             # Imágenes Sentinel y datos de entrenamiento
│   └── sentinel_samples/
├── docs/             # Presentaciones, papers, documentación
├── README.md
└── .gitignore
````

---

## 👥 A quién va dirigido

* **Gobiernos locales y nacionales:** para políticas de conservación y ordenamiento territorial.
* **ONGs ambientales:** para priorizar zonas vulnerables y ejecutar campañas de protección.
* **Investigadores:** para explorar patrones de biodiversidad y validar predicciones.
* **Agricultores y comunidades rurales:** para entender cómo la biodiversidad impacta su entorno productivo.

---

## 🛠️ Tecnologías clave

* Imágenes satelitales Sentinel (Copernicus)
* Machine Learning con Python y PyTorch
* Webapp 3D con Node.js + TypeScript + Three.js / Cesium.js
* Mapas interactivos con Leaflet o WebGL
* Infraestructura en GitHub y despliegue web

---

## 📦 Estado del desarrollo

* [x] Estructura inicial del repositorio
* [ ] Prototipo del modelo de interpolación
* [ ] Visualización 3D en frontend
* [ ] API para servir los datos procesados
* [ ] MVP funcional para presentación

---

## 📚 Referencias

* **Paper Base:** [Core-to-transition biodiversity organization (Nature E\&E, 2024)](https://www.nature.com/articles/s41559-024-02561-6)
* **Sentinel Data Hub:** [https://scihub.copernicus.eu/](https://scihub.copernicus.eu/)

---

## 🧠 Contribuciones

Este proyecto fue desarrollado como parte de la \[Hackathon Copernicus LAC 2025].

Equipo:

PhD. Maria Patricia Trujillo

PhD. Cesar Pantoja

David Alberto Guzman

Jhoan Leon

Sebastian Diaz
