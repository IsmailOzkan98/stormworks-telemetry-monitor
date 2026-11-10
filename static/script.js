
const OFFLINE_AFTER_MS = 2000;
const REFRESH_RATE_MS = 250;
const DIRECTION_PULSE_MS = 1500;

let latestTelemetryTimestamp = 0;
let previousConnection = null;
let previousSnapshot = {};
let previousStage = null;
let previousStatus = null;

const directionTimers = {};

const directions = ["north", "east", "south", "west"];

const systems = [
    ["main", "main", "MAIN PROPULSION"],
    ["alt_hold", "altHold", "ALTITUDE HOLD"],
    ["roll_stab", "rollStab", "ROLL STABILIZER"],
    ["accel", "accel", "THROTTLE CONTROL"],
    ["north", "north", "NORTH BOOSTER"],
    ["east", "east", "EAST BOOSTER"],
    ["south", "south", "SOUTH BOOSTER"],
    ["west", "west", "WEST BOOSTER"]
];

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


function logEvent(message, type = "normal") {
    const log = document.getElementById("eventLog");

    if (!log) return;

    const entry = document.createElement("div");
    entry.className = `event-entry ${type}`;

    const time = document.createElement("span");
    time.className = "event-time";
    time.textContent = new Date().toLocaleTimeString();

    const content = document.createElement("span");
    content.textContent = message;

    entry.append(time, content);
    log.prepend(entry);

    // Máximo 30 eventos
    while (log.children.length > 30) {
        log.lastElementChild.remove();
    }
}


function setConnection(online, detail) {
    const light = document.getElementById("onlineLight");

    if (light) {
        light.classList.toggle("online", online);
    }

    setValue("onlineText", online ? "ONLINE" : "OFFLINE");
    setValue("connectionDetail", detail);
    setValue("monitorConnection", online ? "ONLINE" : "OFFLINE");

    if (
        previousConnection !== null &&
        previousConnection !== online
    ) {
        logEvent(
        online
            ? "Telemetry connection restored."
            : "Telemetry connection lost.",
        online ? "navigation-event" : "error"
    );
    }

    previousConnection = online;
}

/* DIRECTIONAL BOOSTER EFFECT */

function pulseDirection(id, active) {
    const indicator = document.getElementById(id);

    if (!indicator) return;

    const booster = indicator.closest(".booster");

    if (!booster) return;

    if (active) {
        booster.classList.add("pulse");

        clearTimeout(directionTimers[id]);

        directionTimers[id] = setTimeout(() => {
            booster.classList.remove("pulse");
            delete directionTimers[id];
        }, DIRECTION_PULSE_MS);
    }
}

/* DIAGNOSTICS */

function updateDiagnostics(data) {
    systems.forEach(([key, indicatorId, label]) => {

        const active = isActive(data, key);

        if (directions.includes(key)) {
            pulseDirection(indicatorId, active);
        } else {
            setIndicator(indicatorId, active);
        }

        const statusElement =
            document.getElementById(indicatorId + "Status");

        if (statusElement) {
            statusElement.textContent =
                active ? "ACTIVE" : "OFFLINE";

            statusElement.classList.toggle(
                "active-text",
                active
            );
        }

        const previous = previousSnapshot[key];

        if (previous !== undefined && previous !== active) {
            logEvent(
                `${label}: ${active ? "ACTIVATED" : "DEACTIVATED"}.`,
                active ? "activation" : "deactivation"
            );
        }

        previousSnapshot[key] = active;
    });
}

/* INTERFACE */

function updateInterface(data) {

    // FLIGHT SEQUENCE

    const stage = data.stage || "UNKNOWN";
    const status = (data.status || "IDLE").toUpperCase();

    setValue("stage", stage);
    setValue("state", data.state ?? "--");
    setValue("timer", data.timer ?? "--");

    const statusElement = document.getElementById("flightStatus");

    if (statusElement) {
        statusElement.textContent = status;

        statusElement.className =
            "state-pill " +
            (status === "RUNNING" ? "running" :
             status === "COMPLETED" ? "completed" : "idle");
    }

    setValue("monitorFlight", status);

    if (previousStage !== null && previousStage !== stage) {
        logEvent(
            `Flight stage changed: ${stage}`,
            "phase-event"
        );
    }

    if (previousStatus !== null && previousStatus !== status) {
        logEvent(
            `Flight status changed: ${status}`,
            "phase-event"
        );
    }

    previousStage = stage;
    previousStatus = status;

    // FLIGHT TELEMETRY

    setValue("altitude", number(data, "alt"));
    setValue("altTarget", number(data, "alt_target"));
    setValue("altError", number(data, "alt_error"));

    setValue("verticalSpeed", number(data, "vs"));
    setValue("vsTarget", number(data, "vs_target"));
    setValue("vsError", number(data, "vs_error"));

    // ENGINE

    setValue("rpm", number(data, "rps"));
    setValue("rpmTarget", number(data, "rps_target"));

    // AIRCRAFT ATTITUDE

    setValue("roll", number(data, "roll", 2));
    setValue("pitch", number(data, "pitch", 2));
    setValue("yaw", number(data, "yaw", 2));

    // NAVIGATION

    setValue("gpsX", number(data, "my_x", 2));
    setValue("gpsY", number(data, "my_y", 2));

    setValue("targetX", number(data, "target_x", 2));
    setValue("targetY", number(data, "target_y", 2));

    setValue("distance", number(data, "ap_distance", 1));

    // AUTOPILOT

    const autopilot = isActive(data, "ap");

    setValue(
        "autopilot",
        autopilot ? "ACTIVE" : "OFFLINE"
    );

    setValue(
        "monitorAutopilot",
        autopilot ? "ACTIVE" : "OFFLINE"
    );

    // CONTROL SYSTEMS

    setValue("spoiler", number(data, "spoiler", 2));

    // DIAGNOSTICS

    updateDiagnostics(data);

    // LAST UPDATE

    setValue(
        "lastUpdate",
        new Date(latestTelemetryTimestamp * 1000)
            .toLocaleTimeString()
    );
}

/* CONNECTION STATUS */

function updateConnectionStatus() {

    if (!latestTelemetryTimestamp) {
        setConnection(false, "Esperando telemetría...");
        setValue("telemetryAge", "--");
        return;
    }

    const age =
        Date.now() - latestTelemetryTimestamp * 1000;

    const online =
        age >= 0 && age < OFFLINE_AFTER_MS;

    setConnection(
        online,
        online ? "Telemetría recibida" : "Telemetría detenida"
    );

    setValue(
        "telemetryAge",
        Math.max(0, Math.round(age)) + " ms"
    );
}

/* TELEMETRY REQUEST */

let requestInProgress = false;

async function updateTelemetry() {

    if (requestInProgress) return;

    requestInProgress = true;

    try {
        const response = await fetch("/api/telemetry", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        const timestamp = Number(data.timestamp);

        if (
            Number.isFinite(timestamp) &&
            timestamp > 0 &&
            timestamp <= Date.now() / 1000
        ) {
            if (timestamp > latestTelemetryTimestamp) {
                latestTelemetryTimestamp = timestamp;
                updateInterface(data);
            }
        }

        updateConnectionStatus();

    } catch (error) {
        setConnection(false, "Servidor no disponible");

    } finally {
        requestInProgress = false;
    }
}

/* INITIALIZATION */

logEvent("Flight monitoring initialized.", "system-event");

updateTelemetry();

setInterval(updateTelemetry, REFRESH_RATE_MS);

setInterval(updateConnectionStatus, 100);
