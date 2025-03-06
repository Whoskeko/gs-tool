# Extractor de Datos de Metaetiquetas

Este proyecto permite extraer información de las metaetiquetas y datos "speakable" de diversas URLs, procesando múltiples sitios web de manera eficiente. Utiliza React y Chakra UI para la interfaz de usuario, junto con una validación de URLs y manejo de errores.

**URL en vivo:** [https://whoskeko.github.io/gs-tool/](https://whoskeko.github.io/gs-tool/)

## Descripción del Proyecto

La aplicación permite ingresar una lista de URLs y extraer datos relacionados con las siguientes metaetiquetas:

- `geo.placename`
- `geo.region`
- `speakable` (cuando está presente en el contenido JSON-LD)

Los datos extraídos se pueden descargar en un archivo CSV, y se maneja el modo oscuro/claro de la interfaz de manera dinámica.

---

## Requerimientos

- **No requiere instalación**: El proyecto está en vivo en [Github.io](https://whoskeko.github.io/gs-tool/).
- **Navegador compatible**: El sitio es accesible desde cualquier navegador moderno (Chrome, Firefox, etc.).

---

## Características

1. **Interfaz de Usuario (UI)**:
   - Tema oscuro/claro.
   - Formulario de entrada para agregar URLs.
   - Tabla para mostrar resultados de extracción.
   - Botón para descargar los datos extraídos en formato CSV.

2. **Validación de URLs**:
   - Verifica que las URLs sean válidas antes de intentar extraer datos.
   - Si alguna URL no es válida, se muestra un mensaje de error y el proceso se detiene.

3. **Extracción de Datos**:
   - Extrae el `geoPlaceName` y `geoRegion` de las metaetiquetas.
   - Busca información `speakable` en los scripts de tipo JSON-LD.
   - Muestra los resultados en una tabla con opciones de descarga en CSV.

4. **Manejo de Errores**:
   - Si la URL es inválida o no se puede acceder, muestra un mensaje claro.
   - Proporciona retroalimentación de los problemas específicos con las URLs, permitiendo al usuario solucionar los errores.

---

## Funcionalidad del Código

### Procesamiento de URLs:

Cuando el usuario ingresa una lista de URLs, estas son procesadas de la siguiente manera:

1. **Validación de URL**:
   Antes de hacer la extracción, la aplicación valida si la URL tiene un formato correcto usando una expresión regular que verifica si la URL comienza con `http://` o `https://`. Si no es válida, se muestra un mensaje de error y el proceso se detiene.

2. **Conversión de URLs sin protocolo**:
   Si la URL no contiene el protocolo (`http://` o `https://`), se agrega automáticamente el protocolo `https://` para que la URL sea válida y se pueda acceder correctamente.

3. **Extracción de Datos**:
   Una vez validadas las URLs, la aplicación hace uso de un `fetch` para obtener el contenido HTML de las páginas. Posteriormente, se analizan las metaetiquetas relevantes y los datos JSON-LD para extraer información.

4. **Manejo de Resultados**:
   Los datos extraídos se muestran en una tabla. Si la extracción tiene problemas (por ejemplo, una URL no tiene los datos esperados), se muestra un mensaje específico.

### Manejo de Errores:

- Si una URL es incorrecta o hay problemas al obtener datos de una página, la aplicación no detiene la ejecución, sino que maneja el error y permite al usuario ver qué URLs tienen problemas.

### Descargar los Resultados:

- El resultado de la extracción se puede descargar como un archivo CSV usando el componente `CSVLink` de `react-csv`.

---

## Detalles Técnicos

### Componentes Principales:
1. **`ChakraProvider`**: Utilizado para la interfaz visual, con soporte para un tema oscuro/claro.
2. **`fetchHTML`**: Función que se encarga de obtener el contenido HTML de una URL utilizando `fetch`.
3. **`extractMetaData`**: Extrae los datos relevantes de la página HTML obtenida, como `geoPlaceName`, `geoRegion` y `speakable`.
4. **`isValidURL`**: Función que valida que las URLs sean correctas utilizando una expresión regular.
5. **`handleExtract`**: Función principal para procesar las URLs, extraer los datos y manejar errores.

---

## Workarounds y Consideraciones

- **Problemas de CORS**:
  - Este proyecto utiliza el navegador para hacer peticiones `fetch`, lo cual puede estar bloqueado por políticas de CORS (Cross-Origin Resource Sharing). En estos casos, no se puede acceder a recursos externos si el servidor no permite estas peticiones.
  - Se recomienda tener en cuenta que algunas URLs podrían no ser accesibles dependiendo de las políticas del servidor, en cuyo caso se mostrará un error específico.

- **Compatibilidad de URLs sin `http://` o `https://`**:
  - Aunque las URLs sin protocolo son técnicamente válidas, en este proyecto se agrega automáticamente `https://` para garantizar que las URLs sean accesibles y que la extracción de datos se realice correctamente.

---

## Conclusiones

Este proyecto ofrece una forma sencilla y eficiente de extraer meta información relevante de diversas páginas web. La validación de URLs, la extracción de datos y el manejo adecuado de errores contribuyen a una experiencia de usuario fluida y robusta.

---

¡Si tienes alguna pregunta o necesitas ayuda adicional, no dudes en contactarnos!
