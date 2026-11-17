
/* ============================================================
   OAI ELECTRONICS
   FLIGHT TELEMETRY MONITOR
   MAIN APPLICATION ENTRY POINT
   ============================================================ */

import { state, modules } from "./core/state.js";

import {
    initializeModules
} from "./core/moduleManager.js";

import {
    initializeTelemetry
} from "./core/telemetryManager.js";


/* ============================================================
   01. SYSTEM EVENT HANDLERS
   ============================================================ */

/**
 * Initialize global system event listeners.
 *
 * Updates telemetry graphs whenever the browser window
 * dimensions change.
 */
function initializeResizeHandler() {

    window.addEventListener("resize", () => {

        if (modules.telemetryGraphs) {

            modules.telemetryGraphs
                .drawTelemetryGraphsOnResize();

        }

    });

}


/* ============================================================
   02. APPLICATION STARTUP
   ============================================================ */

/**
 * Initialize the main application.
 *
 * Loads application modules, initializes telemetry
 * services and registers global event handlers.
 *
 * @async
 * @returns {Promise<void>}
 */
async function initializeApplication() {

    console.info(
        "[SYSTEM] Initializing OAI MIZUSHIMA YR-02..."
    );

    await initializeModules();

    await initializeTelemetry();

    initializeResizeHandler();

    console.info(
        "[SYSTEM] Flight Telemetry Monitor initialized."
    );

}


/* ============================================================
   03. START APPLICATION
   ============================================================ */

initializeApplication().catch(error => {

    console.error(
        "[SYSTEM] Application initialization failed:",
        error
    );

});
