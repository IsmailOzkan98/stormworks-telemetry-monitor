
const OFFLINE_AFTER_MS = 2000;
const REFRESH_RATE_MS = 250;

let latestTelemetryTimestamp = 0;
let lastUpdateClock = "--";

function number(data, key, decimals = 1) {
    const value = Number(data[key]);

    return Number.isFinite(value)
        ? value.toFixed(decimals)
        : "--";
}

function isActive(data, key) {
    return data[key] === "1" ||
           data[key] === 1 ||
           data[key] === true ||
           data[key] === "true";
}

function setValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setIndicator(id, active) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.toggle("active", active);
    }
}

function setConnection(online, detail) {
    document.getElementById("onlineLight")
        .classList.toggle("online", online);

    setValue("onlineText", online ? "ONLINE" : "OFFLINE");
    setValue("connectionDetail", detail);
}

function updateInterface(data) {

    setValue("stage", data.stage || "UNKNOWN");
    setValue("state", data.state ?? "--");
    setValue("timer", data.timer ?? "--");

    const status = (data.status || "IDLE").toUpperCase();
    const statusElement = document.getElementById("flightStatus");

    statusElement.textContent = status;

    statusElement.className = "state-pill " +
        (status === "RUNNING" ? "running" :
         status === "COMPLETED" ? "completed" : "idle");

    // Datos de vuelo
    setValue("altitude", number(data, "alt"));
    setValue("altTarget", number(data, "alt_target"));
    setValue("altError", number(data, "alt_error"));

    setValue("verticalSpeed", number(data, "vs"));
    setValue("vsTarget", number(data, "vs_target"));
    setValue("vsError", number(data, "vs_error"));

    // Motor y actitud
    setValue("rpm", number(data, "rps"));
    setValue("rpmTarget", number(data, "rps_target"));

    setValue("roll", number(data, "roll", 4));
    setValue("pitch", number(data, "pitch", 4));
    setValue("yaw", number(data, "yaw", 4));

    // Navegación
    setValue("gpsX", number(data, "my_x", 2));
    setValue("gpsY", number(data, "my_y", 2));

    setValue("targetX", number(data, "target_x", 2));
    setValue("targetY", number(data, "target_y", 2));

    setValue("distance", number(data, "ap_distance", 1));

    setValue(
        "autopilot",
        isActive(data, "ap") ? "ACTIVO" : "INACTIVO"
    );

    setValue("spoiler", number(data, "spoiler", 2));

    // Sistemas y propulsores
    setIndicator("main", isActive(data, "main"));
    setIndicator("altHold", isActive(data, "alt_hold"));
    setIndicator("rollStab", isActive(data, "roll_stab"));
    setIndicator("accel", isActive(data, "accel"));

    setIndicator("north", isActive(data, "north"));
    setIndicator("east", isActive(data, "east"));
    setIndicator("south", isActive(data, "south"));
    setIndicator("west", isActive(data, "west"));

    lastUpdateClock = new Date(
        latestTelemetryTimestamp * 1000
    ).toLocaleTimeString();

    setValue("lastUpdate", lastUpdateClock);
}

function updateConnectionStatus() {

    if (!latestTelemetryTimestamp) {
        setConnection(false, "Esperando telemetría...");
        setValue("telemetryAge", "--");
        return;
    }

    const age = Date.now() - latestTelemetryTimestamp * 1000;

    const online = age >= 0 && age < OFFLINE_AFTER_MS;

    setConnection(
        online,
        online ? "Telemetría recibida" : "Telemetría detenida"
    );

    setValue("telemetryAge", Math.max(0, Math.round(age)) + " ms");
}

async function updateTelemetry() {

    try {
        const response = await fetch("/api/telemetry", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        const timestamp = Number(data.timestamp);

        if (Number.isFinite(timestamp) &&
            timestamp > 0 &&
            timestamp <= Date.now() / 1000) {

            // Actualizar solo cuando llega un paquete nuevo
            if (timestamp > latestTelemetryTimestamp) {
                latestTelemetryTimestamp = timestamp;
                updateInterface(data);
            }
        }

        updateConnectionStatus();

    } catch (error) {
        setConnection(false, "Servidor no disponible");
    }
}

// Primera actualización
updateTelemetry();

// Consultar servidor cada 250 ms
setInterval(updateTelemetry, REFRESH_RATE_MS);

// Actualizar ONLINE/OFFLINE y antigüedad independientemente
setInterval(updateConnectionStatus, 100);
