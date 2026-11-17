
/* ============================================================
   MISSION BAR MODULE

   RESPONSIBILITY:
   Configuration, HTML generation and mission data display.
   ============================================================ */

const CONFIG_URL = "/api/missionBar-config";

let config = null;
let container = null;
let latestData = null;


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


function createMissionBar() {

    if (!container) return;

    container.replaceChildren();

    if (config.enabled === false) {
        container.hidden = true;
        return;
    }

    container.hidden = false;

    const missionTitle = document.createElement("div");
    missionTitle.className =
        "mission-bar-title section-header module-header";

    missionTitle.textContent =
        config.title ?? "MISSION BAR";

    const missionBar = document.createElement("section");
    missionBar.className = "mission-bar mission-status-bar";

    const stage = document.createElement("div");
    stage.className = "mission-stage";

    const data = document.createElement("div");
    data.className = "mission-data";

    config.items.forEach(item => {

        if (item.enabled === false) return;

        const label = document.createElement("span");
        label.className = "micro-label";
        label.textContent = item.label ?? "";

        const value = document.createElement("strong");
        value.id = `mission-${item.id}`;
        value.textContent = item.default ?? "--";

        if (item.class === "mission-stage") {

            stage.append(label, value);

        } else {

            const block = document.createElement("div");

            block.append(label, value);

            if (item.type === "status") {
                value.classList.add("state-pill", "idle");
            }

            data.appendChild(block);
        }
    });

    missionBar.append(stage, data);

    container.append(missionTitle, missionBar);
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

        case "number": {

            const number = Number(rawValue);

            return Number.isFinite(number)
                ? number.toFixed(item.decimals ?? 1)
                : item.default ?? "--";
        }

        case "rxTxState": {

            const states = config.states?.rxTxState ?? {};

            return states[String(rawValue)]
                ?? states.unknown
                ?? "UNKNOWN";
        }

        case "status": {

            const status = String(rawValue).toLowerCase();

            const statuses = config.states?.flightStatus ?? {};

            return statuses[status]
                ?? String(rawValue).toUpperCase();
        }

        default:
            return String(rawValue);
    }
}


// ------------------------------------------------------------
// DATA UPDATE
// ------------------------------------------------------------

/**
 * Updates the mission bar with the latest telemetry data.
 *
 * Stores the received data and refreshes the interface
 * when the module configuration is available.
 *
 * @param {Object} data - Latest mission telemetry data.
 */
function updateMissionBar(data) {

    if (!config || !container || config.enabled === false) {
        return;
    }

    config.items.forEach(item => {

        if (item.enabled === false) return;

        const element = container.querySelector(
            `#mission-${CSS.escape(item.id)}`
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
// PUBLIC API
// ------------------------------------------------------------

export function updateMissionBarData(data) {

    if (!data) return;

    latestData = data;

    if (config) {
        updateMissionBar(data);
    }
}


/**
 * Initializes the mission bar module.
 *
 * Loads its configuration, generates the HTML interface
 * and applies the latest available telemetry data.
 *
 * @param {HTMLElement} targetContainer - Container for the mission bar.
 * @returns {Promise<boolean>} True if initialization succeeds.
 */
export async function initMissionBar(targetContainer) {

    try {

        if (!targetContainer) {
            console.warn(
                "[MISSION BAR] Container not found."
            );

            return false;
        }

        container = targetContainer;

        await loadConfiguration();

        createMissionBar();

        if (latestData) {
            updateMissionBar(latestData);
        }

        console.info(
            "[MISSION BAR] Configuration loaded."
        );

        return true;

    } catch (error) {

        console.error(
            "[MISSION BAR] Configuration error:",
            error
        );

        return false;
    }
}