
/* ============================================================
   APPLICATION STATE
   ============================================================ */


/* ============================================================
   01. MODULE REFERENCES
   ============================================================ */

export const modules = {

    missionBar: null,
    missionMonitor: null,
    systemDiagnostics: null,
    telemetryGraphs: null,
    connectionManager: null,
    systemEventDetector: null,
    cards: null

};


/* ============================================================
   02. APPLICATION STATE
   ============================================================ */

export const state = {

    previousConnection: null,

    latestTelemetryTimestamp: 0,

    pendingMissionData: null,

    logEvent(message, type = "normal") {

        console.log(`[${type.toUpperCase()}]`, message);

    }

};


/* ============================================================
   03. COMMON UTILITIES
   ============================================================ */

/**
 * Updates an HTML element's text content by its ID.
 *
 * @param {string} id - Target element ID.
 * @param {*} value - Value to display.
 */
export function setValue(id, value) {

    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = value;

}