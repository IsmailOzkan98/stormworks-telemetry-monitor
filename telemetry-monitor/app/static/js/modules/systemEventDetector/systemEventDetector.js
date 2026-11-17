
/* ============================================================
   SYSTEM EVENT DETECTOR

   RESPONSIBILITY:
   Detect flight system state changes and report them
   to the Event Log.
   ============================================================ */

const CONFIG_URL = "/api/systemEvents-config";

let SYSTEMS = [];

// Previous states
let previousSnapshot = {};

let previousStage = null;

let previousStatus = null;


/* ------------------------------------------------------------
   LOAD SYSTEM CONFIGURATION
   ------------------------------------------------------------ */

async function loadSystems() {

    const response = await fetch(CONFIG_URL, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const config = await response.json();

    if (!Array.isArray(config.systems)) {
        throw new Error("Invalid systems configuration.");
    }

    SYSTEMS = config.systems;

}


/* ------------------------------------------------------------
   BOOLEAN STATE VALIDATION
   ------------------------------------------------------------ */

function getSystemState(value) {

    if (
        value === 1 ||
        value === "1" ||
        value === true ||
        value === "true"
    ) {
        return true;
    }

    if (
        value === 0 ||
        value === "0" ||
        value === false ||
        value === "false"
    ) {
        return false;
    }

    return null;

}


/* ------------------------------------------------------------
   INITIALIZE DETECTOR
   ------------------------------------------------------------ */

/**
 * Initializes the system event detector.
 *
 * Loads the system configuration and returns a telemetry
 * processor that detects state changes and reports them
 * through the Event Log callback.
 *
 * @param {Function} logEvent - Callback used to report detected events.
 * @returns {Promise<Object|null>} Detector interface containing
 * the telemetry processor and current state accessor.
 */
export async function initSystemEventDetector(logEvent) {

    if (typeof logEvent !== "function") {

        console.error(
            "[SYSTEM EVENT DETECTOR] Invalid Event Log callback."
        );

        return null;

    }

    await loadSystems();


    /* --------------------------------------------------------
       PROCESS TELEMETRY
       -------------------------------------------------------- */

    function processTelemetry(data) {

        if (!data || typeof data !== "object") return;


        // SYSTEM ACTIVATION / DEACTIVATION

        SYSTEMS.forEach(system => {

            const { key, label } = system;

            const current = getSystemState(data[key]);

            if (current === null) return;

            const previous = previousSnapshot[key];

            if (
                previous !== undefined &&
                previous !== current
            ) {

                logEvent(
                    `${label}: ${current ? "ACTIVATED" : "DEACTIVATED"}.`,
                    current ? "activation" : "deactivation"
                );

            }

            previousSnapshot[key] = current;

        });


        // FLIGHT STAGE CHANGES

        if (
            typeof data.stage === "string" &&
            data.stage.length > 0
        ) {

            const stage = data.stage;

            if (
                previousStage !== null &&
                previousStage !== stage
            ) {

                logEvent(
                    `Flight stage changed: ${stage}.`,
                    "phase-event"
                );

            }

            previousStage = stage;

        }


        // FLIGHT STATUS CHANGES

        if (
            typeof data.status === "string" &&
            data.status.length > 0
        ) {

            const status = data.status.toUpperCase();

            if (
                previousStatus !== null &&
                previousStatus !== status
            ) {

                logEvent(
                    `Flight status changed: ${status}.`,
                    "phase-event"
                );

            }

            previousStatus = status;

        }

    }


    return {

        processTelemetry,

        getState() {

            return {

                previousSnapshot: {
                    ...previousSnapshot
                },

                previousStage,

                previousStatus

            };

        }

    };

}
