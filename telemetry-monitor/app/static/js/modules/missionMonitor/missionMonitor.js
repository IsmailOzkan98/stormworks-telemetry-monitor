
/* ============================================================
   MISSION MONITOR MODULE

   RESPONSIBILITY:
   Configuration, HTML generation and operational
   telemetry monitoring.
   ============================================================ */

const CONFIG_URL = "/api/missionMonitor-config";

let config = null;
let container = null;
let latestData = null;
let latestConnection = false;
let latestPacketAge = null;


// ------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------

async function loadConfiguration() {

    const response = await fetch(CONFIG_URL, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    config = await response.json();
}


// ------------------------------------------------------------
// HTML GENERATION
// ------------------------------------------------------------

function createMissionMonitor() {

    if (!container) return;

    container.replaceChildren();

    if (config.enabled === false) {
        container.hidden = true;
        return;
    }

    container.hidden = false;

    const section = document.createElement("section");

    const heading = document.createElement("div");
    heading.className = "section-heading module-header section-header";

    heading.append(
        document.createTextNode(
            ` ${config.title ?? "MISSION MONITOR"}`
        )
    );

    const panel = document.createElement("div");
    panel.className = "monitor-panel";

    const title = document.createElement("div");
    title.className = "monitor-title";

    const operationalTitle = document.createElement("span");
    operationalTitle.textContent =
        config.operationalTitle ?? "OPERATIONAL STATUS";

    const unit = document.createElement("span");
    unit.textContent = config.unit ?? "YR-02";

    title.append(operationalTitle, unit);

    panel.appendChild(title);

    config.items.forEach(item => {

        if (item.enabled === false) return;

        const block = document.createElement("div");
        block.className = "monitor-item";

        const label = document.createElement("span");
        label.textContent = item.label ?? "";

        const value = document.createElement("strong");
        value.id = `monitor-${item.id}`;
        value.textContent = item.default ?? "--";

        block.append(label, value);

        panel.appendChild(block);

    });

    section.append(heading, panel);

    container.appendChild(section);

    updateMissionMonitorConnection(latestConnection);
    updateMissionMonitorAge(latestPacketAge);

}


// ------------------------------------------------------------
// VALUE FORMATTING
// ------------------------------------------------------------

function formatValue(item, data) {

    const rawValue = data[item.source];

    if (
        rawValue === null ||
        rawValue === undefined ||
        rawValue === ""
    ) {
        return item.default ?? "--";
    }

    switch (item.type) {

        case "status": {

            const status = String(rawValue).toLowerCase();

            const statuses =
                config.states?.flightStatus ?? {};

            return statuses[status]
                ?? String(rawValue).toUpperCase();
        }

        case "boolean": {

            const active =
                rawValue === "1" ||
                rawValue === 1 ||
                rawValue === true ||
                rawValue === "true";

            const states =
                config.states?.autopilot ?? {};

            return active
                ? states.active ?? "ACTIVE"
                : states.inactive ?? "OFFLINE";
        }

        case "time": {

            const timestamp = Number(rawValue);

            return Number.isFinite(timestamp)
                ? new Date(timestamp * 1000).toLocaleTimeString()
                : item.default ?? "--";
        }

        default:
            return String(rawValue);
    }
}


// ------------------------------------------------------------
// DATA UPDATE
// ------------------------------------------------------------

function updateMissionMonitor(data) {

    if (!config || !container || config.enabled === false) {
        return;
    }

    config.items.forEach(item => {

        if (item.enabled === false) return;

        const element = container.querySelector(
            `#monitor-${CSS.escape(item.id)}`
        );

        if (!element) return;

        element.textContent = formatValue(item, data);

        if (item.type === "status") {

            const status = String(
                data[item.source] ?? "idle"
            ).toLowerCase();

            const validStatuses =
                config.states?.flightStatus ?? {};

            element.className = "state-pill";

            element.classList.add(
                Object.hasOwn(validStatuses, status)
                    ? status
                    : "idle"
            );
        }

    });

}


// ------------------------------------------------------------
// CONNECTION UPDATE
// ------------------------------------------------------------

function updateMissionMonitorConnection(online) {

    latestConnection = online;

    if (!config || !container || config.enabled === false) {
        return;
    }

    const item = config.items.find(
        item => item.type === "connection"
    );

    if (!item || item.enabled === false) return;

    const element = container.querySelector(
        `#monitor-${CSS.escape(item.id)}`
    );

    if (!element) return;

    const states = config.states?.connection ?? {};

    element.textContent = online
        ? states.online ?? "ONLINE"
        : states.offline ?? "OFFLINE";

    element.className = "state-pill";

    element.classList.add(
        online ? "online" : "offline"
    );

}


// ------------------------------------------------------------
// PACKET AGE UPDATE
// ------------------------------------------------------------

function updateMissionMonitorAge(age) {

    latestPacketAge = age;

    if (!config || !container || config.enabled === false) {
        return;
    }

    const item = config.items.find(
        item => item.type === "packetAge"
    );

    if (!item || item.enabled === false) return;

    const element = container.querySelector(
        `#monitor-${CSS.escape(item.id)}`
    );

    if (!element) return;

    element.textContent =
        age === null || !Number.isFinite(age)
            ? item.default ?? "--"
            : `${Math.max(0, Math.round(age))} ms`;

}


// ------------------------------------------------------------
// PUBLIC API
// ------------------------------------------------------------

/**
 * Updates the mission monitor with the latest telemetry data.
 *
 * Stores the received data and refreshes the interface
 * when the module configuration is available.
 *
 * @param {Object} data - Latest mission telemetry data.
 */
export function updateMissionMonitorData(data) {

    if (!data) return;

    latestData = data;

    if (config) {
        updateMissionMonitor(data);
    }
}


/**
 * Updates the displayed connection status.
 *
 * @param {boolean} online - Whether the telemetry connection is online.
 */
export function updateMissionMonitorConnectionData(online) {

    updateMissionMonitorConnection(online);

}


/**
 * Updates the displayed telemetry packet age.
 *
 * @param {number|null} age - Packet age in milliseconds.
 */
export function updateMissionMonitorPacketAge(age) {

    updateMissionMonitorAge(age);

}


// ------------------------------------------------------------
// MODULE INITIALIZATION
// ------------------------------------------------------------

/**
 * Initializes the mission monitor module.
 *
 * Loads the configuration, generates the interface
 * and applies the latest available telemetry data,
 * connection status and packet age.
 *
 * @param {HTMLElement} targetContainer - Container for the monitor.
 * @returns {Promise<boolean>} True if the module is enabled and initialized.
 */
export async function initMissionMonitor(targetContainer) {

    try {

        if (!targetContainer) {

            console.warn(
                "[MISSION MONITOR] Container not found."
            );

            return false;
        }

        container = targetContainer;

        await loadConfiguration();

        createMissionMonitor();

        if (latestData) {
            updateMissionMonitor(latestData);
        }

        console.info(
            "[MISSION MONITOR] Configuration loaded."
        );

        return config.enabled !== false;

    } catch (error) {

        console.error(
            "[MISSION MONITOR] Configuration error:",
            error
        );

        return false;
    }
}