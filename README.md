# Stormworks Telemetry — Documentación y contexto del proyecto

## 1. Descripción del proyecto

El objetivo es desarrollar un sistema de telemetría para **Stormworks: Build and Rescue** que permita visualizar en tiempo real los datos de un vehículo (barco, avión, helicóptero, etc.) mediante una página web local.

El sistema utilizará:

- **Stormworks:** obtiene los datos de los sensores mediante un microcontrolador Lua.
- **HTTP:** transporta los datos desde el juego al servidor.
- **Python + Flask:** recibe y procesa los datos.
- **Docker:** ejecuta el servidor sin necesidad de instalar Python y sus dependencias directamente en el entorno.
- **HTML, CSS y JavaScript:** construyen el dashboard web.
- **SQLite (futuro):** permitirá almacenar históricos de telemetría.

El sistema funcionará localmente, sin necesidad de hosting, servicios externos o servidores en Internet.

## 2. Arquitectura

```text
┌──────────────────────────────┐
│          STORMWORKS          │
│                              │
│  Microcontrolador Lua        │
│  Sensores del vehículo       │
│                              │
└──────────────┬───────────────┘
               │
               │ HTTP GET
               │ Puerto 8080
               ▼
┌──────────────────────────────┐
│           DOCKER             │
│                              │
│       Python + Flask         │
│                              │
│  /telemetria  (recepción)    │
│  /data        (datos JSON)   │
│                              │
└──────────────┬───────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│        DASHBOARD WEB         │
│                              │
│  Velocidad                   │
│  RPM                         │
│  Combustible                 │
│  Altitud                     │
│  GPS                         │
│  Temperatura                 │
│  Estado de motores           │
│                              │
└──────────────────────────────┘
```

Dirección del dashboard:

`http://127.0.0.1:8080`

## 3. Datos que se quieren obtener

| Dato | Unidad | Origen |
|---|---|---|
| Velocidad | km/h | Sensor de velocidad |
| RPM | RPM | Sensor de motor |
| Combustible | % | Sensor de combustible |
| Altitud | metros | Altímetro |
| GPS X | Coordenadas | GPS |
| GPS Y | Coordenadas | GPS |
| Temperatura | °C | Sensor de temperatura |
| Estado del motor | Booleano | Señal de funcionamiento |

Los sensores deben conectarse a las entradas Composite del microcontrolador.

## 4. Estructura del proyecto

Crear la carpeta:

`StormworksTelemetry`

Estructura:

```text
StormworksTelemetry/
│
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
│
├── server.py
│
└── templates/
    └── index.html
```

## 5. Servidor Python — server.py

El servidor Flask tiene dos funciones principales:

- Recibir los datos de Stormworks mediante `/telemetria`.
- Proporcionar los datos al dashboard mediante `/data`.

Código:

```python
from flask import Flask, request, jsonify, render_template
import time

app = Flask(__name__)

telemetry = {
    "speed": 0,
    "rpm": 0,
    "fuel": 0,
    "altitude": 0,
    "gps_x": 0,
    "gps_y": 0,
    "temperature": 0,
    "engine": False,
    "last_update": 0
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/telemetria", methods=["GET"])
def receive_data():

    try:
        telemetry["speed"] = float(
            request.args.get("speed", 0)
        )

        telemetry["rpm"] = float(
            request.args.get("rpm", 0)
        )

        telemetry["fuel"] = float(
            request.args.get("fuel", 0)
        )

        telemetry["altitude"] = float(
            request.args.get("alt", 0)
        )

        telemetry["gps_x"] = float(
            request.args.get("x", 0)
        )

        telemetry["gps_y"] = float(
            request.args.get("y", 0)
        )

        telemetry["temperature"] = float(
            request.args.get("temp", 0)
        )

        telemetry["engine"] = (
            request.args.get("engine", "0") == "1"
        )

        telemetry["last_update"] = time.time()

        return "OK"

    except (TypeError, ValueError):
        return "Datos incorrectos", 400


@app.route("/data")
def get_data():

    result = telemetry.copy()

    result["connected"] = (
        time.time() - telemetry["last_update"] < 3
    )

    return jsonify(result)


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8080,
        debug=False,
        threaded=True
    )
```

### Endpoints

| Endpoint | Función |
|---|---|
| `/` | Página web |
| `/telemetria` | Recibe los datos |
| `/data` | Devuelve los datos en JSON |

El servidor almacena únicamente la última lectura recibida. Todavía no existe almacenamiento histórico.

## 6. Dashboard web — templates/index.html

El dashboard tendrá una interfaz oscura, indicadores individuales y actualización automática cada 500 milisegundos.

Código:

```html
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1">

<title>Stormworks Telemetry</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 25px;
    background: #101722;
    color: white;
    font-family: Arial, sans-serif;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 25px;
}

h1 {
    font-size: 25px;
    color: #55baff;
}

.status {
    padding: 10px 15px;
    border-radius: 8px;
    background: #293445;
}

.grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(190px, 1fr));
    gap: 15px;
}

.card {
    background: #1b2736;
    padding: 22px;
    border-radius: 12px;
    border: 1px solid #304157;
}

.label {
    color: #9aafc5;
    font-size: 14px;
}

.value {
    font-size: 30px;
    font-weight: bold;
    margin-top: 15px;
    color: #55baff;
}

.unit {
    font-size: 14px;
    color: #aab9c9;
}

.engine {
    font-size: 25px;
    font-weight: bold;
    margin-top: 15px;
}

.on {
    color: #35d68a;
}

.off {
    color: #ff6262;
}

footer {
    color: #8395a9;
    margin-top: 25px;
    font-size: 13px;
}

</style>

</head>

<body>

<header>

    <h1>STORMWORKS TELEMETRY</h1>

    <div class="status" id="connection">
        DESCONECTADO
    </div>

</header>

<div class="grid">

    <div class="card">
        <div class="label">VELOCIDAD</div>
        <div class="value" id="speed">--</div>
        <div class="unit">km/h</div>
    </div>

    <div class="card">
        <div class="label">RPM MOTOR</div>
        <div class="value" id="rpm">--</div>
        <div class="unit">RPM</div>
    </div>

    <div class="card">
        <div class="label">COMBUSTIBLE</div>
        <div class="value" id="fuel">--</div>
        <div class="unit">%</div>
    </div>

    <div class="card">
        <div class="label">ALTITUD</div>
        <div class="value" id="altitude">--</div>
        <div class="unit">metros</div>
    </div>

    <div class="card">
        <div class="label">GPS X</div>
        <div class="value" id="gpsx">--</div>
    </div>

    <div class="card">
        <div class="label">GPS Y</div>
        <div class="value" id="gpsy">--</div>
    </div>

    <div class="card">
        <div class="label">TEMPERATURA MOTOR</div>
        <div class="value" id="temperature">--</div>
        <div class="unit">°C</div>
    </div>

    <div class="card">
        <div class="label">ESTADO DEL MOTOR</div>
        <div class="engine off" id="engine">
            APAGADO
        </div>
    </div>

</div>

<footer>
    Actualización automática cada 500 ms |
    Stormworks Local Telemetry
</footer>

<script>

async function updateTelemetry() {

    try {

        const response = await fetch("/data");

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const d = await response.json();

        document.getElementById("connection").textContent =
            d.connected ? "CONECTADO" : "DESCONECTADO";

        document.getElementById("speed").textContent =
            Number(d.speed).toFixed(1);

        document.getElementById("rpm").textContent =
            Math.round(Number(d.rpm));

        document.getElementById("fuel").textContent =
            (Number(d.fuel) * 100).toFixed(1);

        document.getElementById("altitude").textContent =
            Number(d.altitude).toFixed(1);

        document.getElementById("gpsx").textContent =
            Number(d.gps_x).toFixed(3);

        document.getElementById("gpsy").textContent =
            Number(d.gps_y).toFixed(3);

        document.getElementById("temperature").textContent =
            Number(d.temperature).toFixed(1);

        const engine =
            document.getElementById("engine");

        engine.textContent =
            d.engine ? "ENCENDIDO" : "APAGADO";

        engine.className =
            "engine " + (d.engine ? "on" : "off");

    } catch (error) {

        document.getElementById("connection").textContent =
            "ERROR DE CONEXIÓN";

    }

}

setInterval(updateTelemetry, 500);

updateTelemetry();

</script>

</body>
</html>
```

## 7. Microcontrolador Lua de Stormworks

### Distribución de entradas

| Entrada | Dato | Tipo |
|---|---|---|
| Number 1 | Velocidad en m/s | Number |
| Number 2 | RPS del motor | Number |
| Number 3 | Combustible 0-1 | Number |
| Number 4 | Altitud | Number |
| Number 5 | GPS X | Number |
| Number 6 | GPS Y | Number |
| Number 7 | Temperatura | Number |
| Bool 1 | Estado del motor | Boolean |

### Código Lua

```lua
-- STORMWORKS HTTP TELEMETRY

local timer = 0

function onTick()

    timer = timer + 1

    -- Lectura de sensores

    local speed = input.getNumber(1)
    local rps = input.getNumber(2)
    local fuel = input.getNumber(3)

    local altitude = input.getNumber(4)

    local gpsX = input.getNumber(5)
    local gpsY = input.getNumber(6)

    local temperature = input.getNumber(7)

    local engine = input.getBool(1)

    -- Conversiones

    local speedKmh = speed * 3.6

    local rpm = rps * 60

    -- Enviar cada 30 ticks

    if timer >= 30 then

        timer = 0

        local url =
            "/telemetria" ..
            "?speed=" .. string.format("%.2f", speedKmh) ..
            "&rpm=" .. string.format("%.0f", rpm) ..
            "&fuel=" .. string.format("%.3f", fuel) ..
            "&alt=" .. string.format("%.2f", altitude) ..
            "&x=" .. string.format("%.3f", gpsX) ..
            "&y=" .. string.format("%.3f", gpsY) ..
            "&temp=" .. string.format("%.2f", temperature) ..
            "&engine=" .. (engine and "1" or "0")

        async.httpGet(8080, url)

    end

end

function httpReply(port, request_body, response_body)

    -- Respuesta del servidor.

end
```

### Consideraciones sobre Lua

- El envío se realiza cada 30 ticks.
- Se utiliza `async.httpGet(8080, url)`.
- La velocidad se convierte de m/s a km/h multiplicando por 3,6.
- Las RPS se convierten en RPM multiplicando por 60.
- El combustible se considera normalizado entre 0 y 1.
- El estado del motor se representa mediante un booleano.

**Importante:** comprobar las unidades y escalas de los sensores. También verificar que la versión instalada de Stormworks permite realizar peticiones HTTP al servidor local con esta API.

## 8. Dockerfile

Crear un archivo llamado `Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

COPY templates ./templates

EXPOSE 8080

CMD ["python", "server.py"]
```

## 9. requirements.txt

```text
flask
```

## 10. Docker Compose

Crear `docker-compose.yml`:

```yaml
services:

  telemetry:

    build: .

    container_name: stormworks-telemetry

    ports:
      - "8080:8080"

    restart: unless-stopped
```

El puerto 8080 del PC estará conectado al puerto 8080 del contenedor.

## 11. Instalación y ejecución

### Requisitos

- Windows.
- Docker Desktop.
- Stormworks.
- Navegador web.

### Arrancar el sistema

Abrir una terminal en la carpeta del proyecto.

Ejecutar:

```bash
docker compose up -d --build
```

Comprobar el contenedor:

```bash
docker ps
```

Consultar los registros:

```bash
docker compose logs -f
```

Detener:

```bash
docker compose down
```

Reconstruir después de modificar los archivos:

```bash
docker compose up -d --build
```

### Abrir dashboard

Acceder desde el navegador:

`http://127.0.0.1:8080`

## 12. Prueba manual

Antes de conectar Stormworks, comprobar que Flask funciona.

Abrir:

```text
http://127.0.0.1:8080/telemetria?speed=80&rpm=2500&fuel=0.75&alt=120&x=1000&y=2000&temp=85&engine=1
```

Respuesta esperada:

```text
OK
```

Después abrir:

`http://127.0.0.1:8080`

Los valores esperados serán:

| Dato | Valor |
|---|---:|
| Velocidad | 80 km/h |
| RPM | 2500 |
| Combustible | 75 % |
| Altitud | 120 m |
| GPS X | 1000 |
| GPS Y | 2000 |
| Temperatura | 85 °C |
| Motor | ENCENDIDO |

También se puede consultar el JSON:

`http://127.0.0.1:8080/data`

## 13. Problemas habituales

| Problema | Posible solución |
|---|---|
| Dashboard no abre | Comprobar que Docker está iniciado. |
| Puerto ocupado | Cambiar el puerto publicado o liberar el 8080. |
| Flask no responde | Comprobar que utiliza `host="0.0.0.0"`. |
| Stormworks no envía datos | Comprobar API HTTP, puerto y configuración del juego. |
| Estado DESCONECTADO | Revisar si llegan paquetes en los últimos 3 segundos. |
| RPM incorrectas | Revisar si el sensor entrega RPS o RPM. |
| Velocidad incorrecta | Revisar si el sensor entrega m/s o km/h. |
| Combustible incorrecto | Revisar la escala de salida. |
| GPS incorrecto | Revisar las unidades y el orden de las coordenadas. |

## 14. Mejoras futuras

El proyecto puede evolucionar hacia un sistema más completo.

### SQLite

Guardar históricos de telemetría:

- Historial de velocidad.
- Historial de RPM.
- Consumo de combustible.
- Temperatura a lo largo del viaje.
- Historial de coordenadas.
- Sesiones de navegación.

### Mapa GPS

Mostrar la posición del vehículo en un mapa.

Utilizar las coordenadas X/Y de Stormworks y convertirlas a la representación que requiera el mapa.

### Gráficas

Añadir gráficas en tiempo real:

- Velocidad.
- RPM.
- Combustible.
- Temperatura.

### Alarmas

Implementar avisos cuando:

- La temperatura supere un límite.
- El combustible sea bajo.
- El motor se apague inesperadamente.
- Se pierda la conexión con Stormworks.

### Varios motores

Permitir monitorizar cada motor de forma individual.

### Varios vehículos

Añadir identificadores únicos para poder recibir telemetría de diferentes vehículos.

### Dashboard avanzado

Mejorar la interfaz con:

- Diseño responsive.
- Indicadores circulares.
- Barras de combustible.
- Gráficas históricas.
- Mapa GPS.
- Estado de conexión.
- Alarmas visuales.

## 15. Limitaciones de la primera versión

La versión inicial tiene estas limitaciones:

- Solo monitoriza un vehículo.
- No almacena históricos.
- No utiliza autenticación.
- No tiene mapa GPS.
- No dispone de gráficas históricas.
- No tiene monitorización individual de varios motores.
- El estado del motor es un único booleano.
- La conectividad HTTP local de Stormworks debe comprobarse en la versión instalada.

El sistema debe mantenerse local y no exponerse a Internet.

---

# 16. Contexto e instrucciones para futuras IA

## Rol

Actúa como asistente técnico especializado en programación, Docker, Python, Flask, JavaScript y microcontroladores Lua de Stormworks.

Tu trabajo consiste en ayudar a desarrollar, depurar y ampliar el proyecto Stormworks Telemetry.

## Contexto permanente del proyecto

El proyecto es un sistema de telemetría local para Stormworks.

Tecnologías elegidas:

- Stormworks Lua.
- HTTP GET.
- Python.
- Flask.
- Docker.
- Docker Compose.
- HTML.
- CSS.
- JavaScript.
- SQLite como posible ampliación.

El servidor utiliza inicialmente el puerto 8080.

El dashboard se abre en:

`http://127.0.0.1:8080`

Los endpoints principales son:

- `/telemetria`: recepción de datos.
- `/data`: consulta de datos JSON.

## Datos que deben mantenerse

- Velocidad.
- RPM.
- Combustible.
- Altitud.
- GPS X.
- GPS Y.
- Temperatura.
- Estado del motor.

## Reglas para desarrollar el proyecto

1. Mantener Docker Compose como sistema principal de ejecución.
2. Mantener Python + Flask como backend, salvo que exista una razón importante para cambiarlo.
3. Mantener el dashboard web.
4. Proporcionar siempre código completo cuando se modifiquen archivos.
5. Indicar exactamente qué archivo hay que modificar.
6. No inventar las unidades de los sensores de Stormworks.
7. Comprobar la compatibilidad real de las funciones Lua.
8. Diferenciar código probado de código propuesto.
9. Priorizar que funcione primero la conexión entre Stormworks, Flask y el dashboard.
10. Añadir nuevas funcionalidades progresivamente.
11. No introducir tecnologías innecesarias.
12. Mantener el sistema local y no exponerlo a Internet sin autorización.
13. Al resolver errores, analizar los registros de Docker y el comportamiento del juego.
14. Evitar romper funcionalidades que ya estén funcionando.

## Prioridades de desarrollo

Orden recomendado:

1. Conseguir comunicación HTTP entre Stormworks y Flask.
2. Mostrar correctamente los datos en el dashboard.
3. Mejorar el diseño del dashboard.
4. Añadir gráficas en tiempo real.
5. Añadir almacenamiento SQLite.
6. Añadir mapa GPS.
7. Añadir alarmas.
8. Añadir soporte para múltiples motores.
9. Añadir soporte para múltiples vehículos.

## Objetivo final

Desarrollar un sistema de telemetría completo para Stormworks, ejecutado mediante Docker, que permita monitorizar vehículos en tiempo real desde una interfaz web local, guardar históricos, visualizar recorridos GPS y controlar el estado de los motores.

La prioridad es mantener una arquitectura sencilla, modular, fiable y fácil de mantener.
