# OAI MIZUSHIMA YR-02 — Flight Telemetry Monitor

Panel web de monitorización de telemetría de vuelo para vehículos de **Stormworks**. Recibe los datos enviados por el vehículo, los distribuye entre módulos independientes y los presenta en un dashboard configurable. También permite registrar sesiones de vuelo en archivos JSON.

El sistema funciona en modo **solo lectura** respecto al vehículo: recibe y visualiza telemetría, pero no envía órdenes de control.

## Contenido

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Arranque con Docker](#arranque-con-docker-recomendado)
- [Arranque local con Python](#arranque-local-con-python)
- [Envío de telemetría](#envío-de-telemetría)
- [Configuración JSON](#configuración-json)
  - [Configuración principal del frontend](#1-configjson)
  - [Tarjetas](#2-cardsjson)
  - [Barra de misión](#3-missionbarjson)
  - [Monitor de misión](#4-missionmonitorjson)
  - [Información del proyecto](#5-projectdatajson)
  - [Diagnósticos](#6-systemdiagnosticsjson)
  - [Detector de eventos](#7-systemeventsjson)
  - [Gráficas](#8-telemetrygraphsjson)
  - [Temas](#9-themesjson)
  - [Esquema de telemetría](#10-telemetry_schemajson)
  - [Grabador de vuelo](#11-recorder_configjson)
- [API disponible](#api-disponible)
- [Notas y limitaciones actuales](#notas-y-limitaciones-actuales)

## Características

## Características

- Dashboard distribuido en columnas y construido dinámicamente a partir de configuración.
- Recepción de telemetría mediante HTTP y distribución de los datos entre módulos independientes.
- Indicador de conexión con el servidor y detección de pérdida de recepción de telemetría.
- Módulos de visualización configurables para presentar variables recibidas: tarjetas, indicadores de estado, bloques informativos y gráficas históricas.
- Configuración de las variables, etiquetas, unidades, formatos y agrupaciones que utilizan los módulos compatibles.
- Monitorización de señales y sistemas mediante diagnósticos configurables.
- Registro y detección de cambios en señales, así como de eventos asociados a campos de estado definidos en la configuración.
- Gráficas históricas con series y fuentes de datos configurables, dentro de las opciones soportadas por el módulo.
- Flight Recorder para guardar muestras seleccionadas de telemetría en archivos JSON.
- Selector de temas visuales, con persistencia de la selección en el navegador.
- Configuración separada para la estructura del dashboard, los módulos, las fuentes de datos, las gráficas, los temas y el backend.

La configuración incluida actualmente utiliza estas capacidades para mostrar información de un vehículo de Stormworks. Estos elementos describen el **perfil de ejemplo incluido**, no requisitos ni límites del dashboard. Para adaptar el monitor a otra fuente de telemetría se pueden cambiar el esquema de datos y las referencias de los módulos compatibles. Para incorporar una visualización o un comportamiento que no exista todavía, es necesario desarrollar e integrar un módulo JavaScript.

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| Python 3.12 | Entorno de ejecución del servidor |
| Flask | Aplicación web y API HTTP |
| HTML5 | Estructura de la interfaz |
| CSS3 | Diseño, distribución responsive y temas |
| JavaScript ES Modules | Lógica del frontend y arquitectura modular |
| JSON | Configuración, intercambio de telemetría y registros de vuelo |
| Docker | Construcción y ejecución aislada del servidor |
| Docker Compose | Orquestación del contenedor |

No se utiliza una base de datos: la telemetría actual se mantiene en memoria y las grabaciones se guardan como archivos JSON. La interfaz carga las fuentes Orbitron, Rajdhani y Share Tech Mono desde Google Fonts, por lo que su descarga requiere conexión a Internet.

## Estructura del proyecto

```text
Server/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── telemetry-monitor/
    ├── app.py
    └── app/
        ├── __init__.py
        ├── config.py
        ├── config/
        │   ├── backend/
        │   │   ├── recorder_config.json
        │   │   └── telemetry_schema.json
        │   └── frontend/
        │       ├── config.json
        │       ├── themes.json
        │       └── modules/
        │           ├── cards.json
        │           ├── missionBar.json
        │           ├── missionMonitor.json
        │           ├── projectData.json
        │           ├── systemDiagnostics.json
        │           ├── systemEvents.json
        │           └── telemetryGraphs.json
        ├── logs/                  # Grabaciones de vuelo
        ├── routes/                # Rutas HTTP y endpoints API
        ├── services/              # Servicios de telemetría y grabación
        ├── static/
        │   ├── js/
        │   │   ├── core/           # Estado, módulos, dashboard y temas
        │   │   └── modules/        # Módulos funcionales del frontend
        │   └── modularStylesheet/  # Estructura, responsive, temas y efectos
        └── templates/
            └── index.html
```

## Requisitos

Para el arranque recomendado:

- Docker Engine o Docker Desktop.
- Docker Compose v2 (`docker compose`).

Para ejecutar sin Docker:

- Python 3.12.
- pip.

## Arranque con Docker (recomendado)

Ejecutar los comandos desde la carpeta `Server/`, donde se encuentra `docker-compose.yml`.

Construir la imagen e iniciar el servidor:

```bash
docker compose up --build -d
```

Consultar los logs:

```bash
docker compose logs -f
```

Detener el servidor:

```bash
docker compose down
```

Abrir el dashboard en el navegador:

```text
http://localhost:8080
```

El contenedor expone el puerto `8080` y monta `./telemetry-monitor` en `/app`. Por tanto, las modificaciones en los archivos del proyecto y las grabaciones de `app/logs/` quedan en la carpeta local.

## Arranque local con Python

Desde `Server/`:

```bash
python -m venv .venv
```

Activar el entorno virtual:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

Instalar dependencias e iniciar:

```bash
pip install -r requirements.txt
python telemetry-monitor/app.py
```

Abrir `http://localhost:8080`. La dependencia Python declarada actualmente es Flask.

## Envío de telemetría

El servidor recibe los datos mediante una petición **HTTP GET** a `/telemetry`, usando los nombres de las variables como parámetros de consulta. Por ejemplo:

```text
http://localhost:8080/telemetry?stage=TAKEOFF&status=RUNNING&alt=125.5&vs=8.2&rps=32.4&main=1
```

También puede probarse desde consola:

```bash
curl "http://localhost:8080/telemetry?stage=TAKEOFF&status=RUNNING&alt=125.5&vs=8.2&rps=32.4&main=1"
```

Los nombres admitidos están definidos en `config/backend/telemetry_schema.json`. Los campos numéricos se convierten a `float`; `stage` y `status` se conservan como texto. Las claves desconocidas se ignoran. El servidor añade `timestamp` automáticamente al recibir cada paquete.

El endpoint `/api/telemetry` devuelve el último estado recibido en formato JSON. La interfaz consulta este endpoint periódicamente; el indicador de vehículo desconectado se activa cuando pasan aproximadamente 2 segundos sin recibir telemetría.

> Sustituye `localhost` por la IP o el nombre de host del equipo que ejecuta el servidor cuando la telemetría proceda de otro dispositivo de la red.

## Configuración JSON

Todos los archivos deben conservar un JSON válido: comillas dobles, comas correctas y sin comentarios dentro del archivo. Se recomienda hacer una copia antes de modificar la configuración.

La configuración permite adaptar el dashboard a distintos conjuntos de telemetría sin cambiar el código de los módulos ya disponibles. El flujo habitual consiste en declarar las variables recibidas en `telemetry_schema.json` y después referenciarlas desde las configuraciones de tarjetas, indicadores, diagnósticos, eventos o gráficas. Los módulos tienen formatos y tipos de representación concretos; JSON permite parametrizar esos módulos, pero no crear por sí solo nuevos tipos de componentes.

Las rutas siguientes son relativas a `telemetry-monitor/app/`.

### 1. `config/frontend/config.json`

Es el archivo principal del frontend. Controla qué módulos se inicializan, qué contenedores aparecen en el dashboard y cómo se resuelven las implementaciones de los módulos.

**`modules`** activa o desactiva los módulos mediante `true` o `false`:

```json
"modules": {
    "eventLog": true,
    "systemEventDetector": true,
    "flightRecorder": true,
    "missionBar": true,
    "systemDiagnostics": true,
    "systemInformation": true,
    "missionMonitor": true,
    "telemetryGraphs": true,
    "cardsModule": true
}
```

**`dashboard`** define la distribución de los contenedores:

- `columns`: número de columnas.
- `gap`: separación entre columnas, en píxeles.
- `items`: elementos que se crean en el dashboard.
- `id`: identificador HTML único del contenedor.
- `module`: clave del módulo que ocupará el contenedor.
- `section`: sección o instancia que utiliza un módulo múltiple, como `cardsModule`.
- `column`: columna de destino, empezando por 1.
- `order`: orden dentro de esa columna, empezando por 1.

Ejemplo de elemento:

```json
{
    "id": "telemetryGraphs",
    "module": "telemetryGraphs",
    "column": 2,
    "order": 1
}
```

El número de columna no puede superar `columns`, y los `id` no pueden repetirse. Los módulos `missionBar` y `flightRecorder` disponen además de contenedores fijos en la plantilla HTML.

**`registry`** relaciona cada módulo con su implementación:

- `name`: nombre utilizado en los mensajes de consola.
- `path`: ruta del módulo JavaScript.
- `initializer`: función de inicialización exportada.
- `updater`: función de actualización de datos, cuando corresponde.
- `container`: identificador de contenedor cuando el módulo lo utiliza.
- `multiple` y `key`: permiten crear varias instancias de un mismo módulo.
- `special`: identifica integraciones especiales gestionadas por `moduleManager`.

Normalmente no es necesario modificar `registry` para reorganizar el dashboard. Para añadir un módulo nuevo sí hay que registrar su implementación y conectarlo al proceso de inicialización.

### 2. `config/frontend/modules/cards.json`

Define las tarjetas agrupadas en secciones. Cada sección contiene:

- `id`: identificador de la sección; debe coincidir con el `section` utilizado en `config.json`.
- `title.name`: título visible.
- `cards`: tarjetas de esa sección.

Cada tarjeta utiliza:

- `id`: identificador único dentro de la sección.
- `label`: etiqueta visible.
- `dataKey`: clave de telemetría que alimenta el valor.
- `unit`: texto de unidad o descripción.
- `decimals`: número de decimales.
- `style`: variante visual, por ejemplo `normal`, `highlight` o `cyan`.

Para mostrar otra variable, cambia `dataKey` por una clave existente en `telemetry_schema.json`.

### 3. `config/frontend/modules/missionBar.json`

Configura los datos de la barra superior de misión mediante `items`. Cada elemento define `id`, `label`, `source`, `default` y `type`.

- `source`: campo recibido en la telemetría.
- `default`: contenido mostrado antes de disponer de un valor válido.
- `type`: formato de representación, por ejemplo `text`, `number`, `status` o `rxTxState`.
- `decimals`: decimales para valores numéricos.

El objeto `states` traduce determinados valores técnicos a etiquetas legibles. Por ejemplo, `rxTxState` convierte los estados `0`, `1` y `2` en `SEARCHING`, `CONNECTED` y `LINK LOST`.

### 4. `config/frontend/modules/missionMonitor.json`

Configura el panel de monitorización de misión. Sus `items` utilizan `source`, `label`, `default` y `type`, igual que la barra de misión. Incluye formatos como `boolean`, `status`, `time` y `packetAge`.

El objeto `states` define las etiquetas que se muestran para los estados de conexión, piloto automático y estado de vuelo. El dato `packetAge` se calcula a partir de la marca temporal del último paquete.

### 5. `config/frontend/modules/projectData.json`

Contiene textos identificativos de la interfaz, no datos de telemetría:

- `page`: título de la página.
- `brand`: nombre, identificador y subtítulo del proyecto.
- `unitDesignation`: denominación y descripción de la unidad.
- `systemInformation`: bloque informativo, con número de sección y lista `items`.
- `footer`: elementos del pie de página.

Los bloques y elementos que incluyen `enabled` pueden mostrarse u ocultarse con `true` o `false`. Los campos `label` y `value` definen el texto visible.

### 6. `config/frontend/modules/systemDiagnostics.json`

Define grupos de diagnóstico. Cada grupo tiene `id`, `title`, `type` e `items`.

Cada elemento contiene:

- `id`: identificador del indicador.
- `label`: nombre visible del sistema.
- `dataKey`: campo de telemetría que determina su estado.

Los grupos actuales utilizan los tipos `status` e `indicator`. Para añadir un sistema, el campo correspondiente también debe existir en `telemetry_schema.json` y ser enviado por el vehículo.

### 7. `config/frontend/modules/systemEvents.json`

Define qué señales binarias supervisa el detector de eventos. Cada entrada de `systems` contiene:

- `key`: nombre del campo de telemetría.
- `label`: nombre que aparecerá en el Event Log.

El detector registra cambios entre activado y desactivado, además de cambios en `stage` y `status`. La primera muestra establece el estado inicial; no genera un evento de transición.

### 8. `config/frontend/modules/telemetryGraphs.json`

Configura las gráficas de telemetría.

- `enabled`: indicador de configuración del módulo.
- `sectionHeading.title`: título del bloque.
- `history.seconds`: ventana temporal del historial, en segundos.
- `history.maxPoints`: máximo de puntos conservados.
- `scale.padding`: margen proporcional aplicado al rango de la gráfica.
- `scale.defaultMin` y `scale.defaultMax`: rango inicial de referencia.
- `graphs`: definición de cada gráfica.

Cada gráfica define `id`, `title`, `historyLabel` y `canvasId`. Las series se declaran en `leftAxis` (array) y `rightAxis` (serie del eje derecho). En cada serie:

- `source`: campo de telemetría.
- `label`: nombre de la serie.
- `unit`: unidad mostrada.
- `decimals`: precisión numérica.
- `color`: variable CSS utilizada para el color.
- `style`: estilo de línea, por ejemplo `solid` o `dashed`.

`legend` define las etiquetas y clases CSS de la leyenda. Si se añade una gráfica, su `canvasId` debe ser único y coherente con la estructura que genera el módulo.

### 9. `config/frontend/themes.json`

Controla los temas disponibles:

- `SelectedTheme`: identificador del tema predeterminado.
- `themes`: lista de temas.
- `id`: identificador numérico.
- `name`: nombre mostrado en el selector.
- `path`: ruta del archivo CSS del tema.
- `scripts`: lista opcional de scripts JavaScript asociados al tema.

Para añadir un tema, incorpora su CSS en `static/modularStylesheet/themes/` y añade una entrada con un `id` único y su ruta. Si necesita un script adicional, decláralo en `scripts`.

La selección del usuario se guarda en `localStorage` bajo la clave `ActiveDashboardTheme`; esa selección tiene prioridad sobre `SelectedTheme`. Para volver a aplicar el tema predeterminado, borra esa clave del almacenamiento local del navegador.

### 10. `config/backend/telemetry_schema.json`

Define las claves que el backend acepta y sus valores iniciales. Es también la referencia de nombres que deben utilizar los emisores de telemetría y las configuraciones de los módulos. Este esquema no está limitado a las variables del vehículo del perfil incluido: puedes sustituirlo o ampliarlo con las señales que proporcione tu propia fuente de datos, siempre que respetes los tipos y el tratamiento implementados por el backend.

- Los campos numéricos se inicializan normalmente en `0`.
- `stage` y `status` son cadenas.
- `timestamp` se actualiza automáticamente al recibir telemetría; no es necesario enviarlo.
- Las claves que no estén declaradas se descartan.

Al incorporar una variable nueva, añádela aquí y envíala desde el vehículo. Después, utiliza exactamente el mismo nombre en `dataKey` o `source` en los módulos que deban representarla.

### 11. `config/backend/recorder_config.json`

La sección `fields` determina qué claves de telemetría se incluyen en cada muestra guardada. Usa `true` para incluir un campo y `false` para excluirlo. El registro añade también `recorded_at`, que contiene la fecha y hora de captura.

El archivo incluye además:

```json
"recording": {
    "enabled": true,
    "interval": 2
}
```

**Importante:** en la implementación actual, `fields` sí se aplica, pero `recording.enabled` y `recording.interval` todavía no se utilizan para controlar el inicio ni la frecuencia de grabación. Las muestras se guardan al ritmo al que llegan los paquetes de telemetría mientras el grabador está activo.

## API disponible

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Dashboard web |
| GET | `/telemetry` | Recibe telemetría mediante parámetros de consulta |
| GET | `/api/telemetry` | Devuelve la última telemetría recibida |
| GET | `/health` | Estado del servidor y conexión del vehículo |
| GET | `/api/recorder` | Estado del Flight Recorder |
| POST | `/api/recorder/start` | Inicia una grabación |
| POST | `/api/recorder/stop` | Detiene y cierra la grabación |
| GET | `/api/frontend-config` | Configuración principal del frontend |
| GET | `/api/cards-config` | Configuración de tarjetas |
| GET | `/api/missionBar-config` | Configuración de la barra de misión |
| GET | `/api/missionMonitor-config` | Configuración del monitor de misión |
| GET | `/api/projectData-config` | Configuración de información del proyecto |
| GET | `/api/systemDiagnostics-config` | Configuración de diagnósticos |
| GET | `/api/systemEvents-config` | Configuración del detector de eventos |
| GET | `/api/telemetryGraphs-config` | Configuración de gráficas |
| GET | `/api/themes-config` | Configuración de temas |

Las grabaciones se guardan en `telemetry-monitor/app/logs/` con nombres del tipo `flight_YYYYMMDD_HHMMSS.json`.

## Notas y limitaciones actuales

- La telemetría más reciente se mantiene en memoria; al reiniciar el servidor se vuelve al esquema inicial hasta recibir nuevos datos.
- No hay persistencia de telemetría continua ni base de datos. La persistencia disponible corresponde a las sesiones iniciadas con Flight Recorder.
- El receptor `/telemetry` utiliza HTTP GET y no implementa autenticación. Debe mantenerse en una red de confianza y no exponerse directamente a Internet.
- El estado de conexión del vehículo se considera desconectado tras aproximadamente 2 segundos sin paquetes.
- El intervalo de grabación indicado en `recorder_config.json` no está implementado todavía; la frecuencia depende del emisor.
- Una parada inesperada del proceso durante una grabación puede dejar un archivo JSON sin cerrar correctamente. Detén la grabación desde el panel antes de apagar el servidor.
