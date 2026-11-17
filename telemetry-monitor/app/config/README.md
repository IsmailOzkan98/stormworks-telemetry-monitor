# Configuration System

The `app/config/` directory contains the JSON configuration files used to define how the backend handles telemetry and how the frontend displays and organizes information.

The configuration system separates data handling from application logic, allowing many aspects of the dashboard to be customized without modifying the Python or JavaScript code.

```text
app/config/
├── backend/
│   ├── telemetry_schema.json
│   └── recorder_config.json
│
└── frontend/
    ├── config.json
    ├── themes.json
    └── modules/
        ├── cards.json
        ├── missionBar.json
        ├── missionMonitor.json
        ├── projectData.json
        ├── systemDiagnostics.json
        ├── systemEvents.json
        └── telemetryGraphs.json
```

---

## 1. Backend Configuration

Backend configuration defines which telemetry data the application recognizes and which information is stored during flight recordings.

### `telemetry_schema.json`

This file defines the telemetry data structure maintained by the backend.

It acts as the initial state and field reference for incoming vehicle data. Each property represents a telemetry field that the backend can receive and process.

For example:

```json
{
    "stage": "WAITING",
    "state": 0,
    "status": "IDLE",
    "alt": 0,
    "alt_target": 0,
    "rps": 0,
    "rps_target": 0,
    "roll": 0,
    "pitch": 0
}
```

When telemetry arrives, the backend checks whether each received field exists in this schema.

- Recognized numerical fields are converted to floating-point values.
- `stage` and `status` are handled as text.
- Unknown fields are ignored.
- The `timestamp` field is automatically updated whenever telemetry is received.

**Adding new telemetry fields:**

To support additional data, add the corresponding property to `telemetry_schema.json`, using an appropriate initial value.

The incoming vehicle data must use the same property name.

For example, adding `"temperature": 0` allows the backend to recognize and maintain incoming temperature values.

This is not a strict validation schema defining every possible type or range. It is the backend's initial telemetry structure and accepted field reference.

### `recorder_config.json`

This file controls which telemetry fields are included in flight recordings.

It is independent of the telemetry schema: the schema defines which data the backend recognizes, while the recorder configuration determines which of those fields are saved.

Example:

```json
{
    "fields": {
        "alt": true,
        "alt_target": true,
        "rps": true,
        "roll": false,
        "pitch": true
    }
}
```

Each field can be enabled or disabled:

- `true`: Include the field in recordings.
- `false`: Exclude the field from recordings.

You can add as many recognized telemetry fields as you want, enable all of them, disable individual fields, or simply omit fields you do not need.

Fields not explicitly enabled are automatically excluded.

Each recorded event also receives its own local timestamp (`recorded_at`).

**Note:** The current recorder implementation uses the `fields` configuration. The additional `recording.enabled` and `recording.interval` properties are currently not used by the recorder service.

---

## 2. Frontend Configuration

Frontend configuration controls which modules are loaded, where they appear and what information they display.

### `config.json` — Dashboard Configuration

This is the main frontend configuration file.

It contains three main sections:

#### Modules

Controls which application modules are enabled.

```json
"modules": {
    "eventLog": true,
    "flightRecorder": true,
    "missionBar": true,
    "systemDiagnostics": true,
    "systemInformation": true,
    "missionMonitor": true,
    "telemetryGraphs": true,
    "cardsModule": true
}
```

Setting a module to `false` disables its initialization.

#### Dashboard Layout

Controls the dashboard grid and module placement.

```json
"dashboard": {
    "columns": 3,
    "gap": 14,
    "items": [
        {
            "id": "telemetryGraphs",
            "module": "telemetryGraphs",
            "column": 2,
            "order": 1
        },
        {
            "id": "cardsNavigation",
            "module": "cardsModule",
            "section": "navigation",
            "column": 3,
            "order": 1
        }
    ]
}
```

Available properties:

| Property | Description |
|---|---|
| `columns` | Number of dashboard columns. |
| `gap` | Spacing between columns. |
| `id` | Unique identifier for the dashboard instance. |
| `module` | Module to initialize. |
| `section` | Optional section used by modules supporting multiple instances. |
| `column` | Target column. |
| `order` | Position within that column. |

For example, the configuration above places the telemetry graphs in the second column and the navigation cards in the third.

The `cardsModule` supports multiple instances, allowing different card sections to be placed independently.

#### Registry

The registry defines how each module is loaded.

| Property | Description |
|---|---|
| `name` | Module display name. |
| `path` | JavaScript module path. |
| `initializer` | Initialization function. |
| `updater` | Data update function, when applicable. |
| `container` | Associated HTML container, when applicable. |
| `special` | Identifies modules requiring special initialization handling. |
| `multiple` | Allows multiple instances of a module. |
| `key` | Registry key used for multiple instances. |

The registry is primarily intended for registering application modules, rather than configuring their visual content.

---

## 3. Individual Module Configurations

The files inside `frontend/modules/` define the actual content and behavior of individual dashboard components.

### `cards.json` — Information Cards

Defines the cards displayed by the Cards Module.

Cards are organized into sections, each with its own title and collection of data cards.

Example:

```json
{
    "id": "navigation",
    "title": {
        "name": "NAVIGATION"
    },
    "cards": [
        {
            "id": "gpsX",
            "label": "POSITION X",
            "dataKey": "my_x",
            "unit": "CURRENT POSITION",
            "decimals": 2,
            "style": "normal"
        }
    ]
}
```

Each card supports:

- `id`: Unique card identifier.
- `label`: Displayed card name.
- `dataKey`: Telemetry field used as its data source.
- `unit`: Unit or descriptive text.
- `decimals`: Number of decimal places.
- `style`: Visual style.

The section title can also be customized.

For example, you can create a new `navigation`, `engineControl` or custom section containing any recognized telemetry fields.

The `dataKey` must match a field provided by the backend.

### `missionBar.json` — General Information Bar

Defines the information displayed in the main mission information bar.

Each item specifies its label, telemetry source, default value and display type.

Example:

```json
{
    "id": "stage",
    "label": "CURRENT FLIGHT OPERATION",
    "source": "stage",
    "default": "WAITING DATA",
    "type": "text",
    "class": "mission-stage"
}
```

Available properties include:

- `id`: Item identifier.
- `label`: Display label.
- `source`: Telemetry field.
- `default`: Value displayed when data is unavailable.
- `type`: Determines how the value is interpreted and displayed.
- `decimals`: Numeric precision, when applicable.
- `class`: Optional CSS class.

The `states` section allows internal values to be translated into readable labels.

For example, RX/TX states can be displayed as `SEARCHING`, `CONNECTED` or `LINK LOST` instead of numerical values.

You can also customize the section title and enable or disable the entire component.

### `missionMonitor.json` — Mission Monitor

Defines the operational status panel.

It supports different display types, including:

- `boolean`: Boolean status.
- `status`: Flight status.
- `time`: Timestamp.
- `packetAge`: Calculated age of the latest received packet.

Each item can define its own label, source and default value.

Unlike ordinary telemetry fields, `packetAge` is calculated internally rather than reading a direct telemetry property.

The file also controls the section number, title, unit designation and state labels.

### `projectData.json` — Project Information

Controls the dashboard's project identity and static information.

It is divided into several independent sections:

| Section | Purpose |
|---|---|
| `page` | Browser document title. |
| `brand` | Main project branding and identification. |
| `unitDesignation` | Vehicle or unit identification. |
| `systemInformation` | General system information. |
| `footer` | Footer information. |

Example:

```json
"brand": {
    "enabled": true,
    "eyebrow": "OAI AEROSPACE SYSTEMS",
    "name": "MIZUSHIMA",
    "identifier": "YR-02",
    "subtitle": "FLIGHT MONITOR"
}
```

Unlike telemetry-driven components, this configuration mainly contains static text.

It allows the dashboard to be adapted to another project by changing its name, identification, descriptions and displayed information without modifying the application code.

Individual sections and information items can also be enabled or disabled.

### `systemDiagnostics.json` — System Diagnostics

Defines diagnostic groups and their monitored elements.

Groups can have different display types.

For example:

```json
{
    "id": "subsystems",
    "title": "SUBSYSTEM",
    "type": "status",
    "items": [
        {
            "id": "main",
            "label": "MAIN PROPULSION",
            "dataKey": "main"
        }
    ]
}
```

The configuration supports:

- Multiple diagnostic groups.
- Custom group titles.
- Individual item labels.
- Different display types, such as `status` and `indicator`.
- Telemetry field associations through `dataKey`.

This makes it possible to organize diagnostics into logical groups, such as propulsion systems, navigation systems or directional boosters.

### `systemEvents.json` — System Event Detection

Defines which telemetry fields are monitored for state changes.

Example:

```json
{
    "systems": [
        {
            "key": "main",
            "label": "MAIN PROPULSION"
        },
        {
            "key": "alt_hold",
            "label": "ALTITUDE HOLD"
        }
    ]
}
```

When a monitored field changes state, the detector generates an event with the corresponding label.

You can add or remove monitored systems without modifying the detector itself, provided the telemetry fields exist.

The detector also handles flight `stage` and `status` changes independently of this list.

### `telemetryGraphs.json` — Telemetry Graphs

Defines which telemetry values are plotted and how the graphs are presented.

The configuration contains three main sections:

**History**

Controls the time window and maximum number of stored points.

```json
"history": {
    "seconds": 60,
    "maxPoints": 1200
}
```

**Scale**

Defines default graph scaling and padding.

**Graphs**

Each graph has its own configuration, including:

- `id`: Graph identifier.
- `title`: Display title.
- `canvasId`: HTML canvas identifier.
- `leftAxis`: Data series displayed on the left axis.
- `rightAxis`: Optional data series displayed on the right axis.
- `legend`: Legend entries.

Each data series can define:

- `source`: Telemetry field.
- `label`: Display name.
- `unit`: Measurement unit.
- `decimals`: Numeric precision.
- `color`: CSS variable used for the line color.
- `style`: Line style, such as `solid` or `dashed`.

For example, the existing Altitude Profile graph displays actual altitude, target altitude and altitude error.

The same structure is used for the Vertical Speed Profile.

New graphs and data series can be configured using the existing graph structure, provided the required canvas and supported configuration are available.

---

## 4. Important Configuration Guidelines

When modifying or extending the configuration files, keep the following rules in mind:

1. **Telemetry references:** `source` and `dataKey` values must correspond to fields recognized by the backend.
2. **Unique identifiers:** IDs should be unique within their respective configuration and module context.
3. **Supported properties:** Each module only understands the configuration properties implemented by its JavaScript code. Adding arbitrary JSON properties does not automatically create new functionality.
4. **Module registration:** Adding a new application module requires its JavaScript implementation and registry entry. JSON configuration alone cannot create a new module.
5. **Dashboard placement:** A module must be enabled and have a corresponding dashboard item to be included in the configured layout, subject to its initialization mechanism.
6. **Configuration paths:** Keep filenames and endpoint references consistent when adding or moving configuration files.

### Summary

The configuration system is designed to make the dashboard adaptable without requiring changes to its core logic.

Backend JSON files define the telemetry structure and recording selection, while frontend JSON files control module registration, dashboard layout, displayed information, diagnostics, event detection and graph configuration.

This separation makes it easier to reuse the application, adapt it to different vehicles or projects, and extend its monitoring capabilities while keeping the underlying application code independent from its configuration.