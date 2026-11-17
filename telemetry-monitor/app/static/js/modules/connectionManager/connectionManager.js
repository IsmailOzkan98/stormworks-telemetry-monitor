/* ============================================================
   CONNECTION MANAGER

   RESPONSIBILITY:
   - Flask server health monitoring
   - Flight telemetry reception
   - Telemetry timestamp validation
   - Telemetry connection monitoring
   - Packet age monitoring

   ============================================================ */


/* ============================================================
   01. CONFIGURATION
   ============================================================ */

const CONFIG = Object.freeze({

    SERVER_HEALTH_ENDPOINT: "/health",

    TELEMETRY_ENDPOINT: "/api/telemetry",

    TELEMETRY_REFRESH_MS: 250,

    SERVER_CHECK_MS: 1000,

    CONNECTION_CHECK_MS: 100,

    OFFLINE_AFTER_MS: 2000

});


/* ============================================================
   02. CONNECTION STATE
   ============================================================ */

const state = {

    serverOnline: null,

    telemetryOnline: null,

    latestTelemetryTimestamp: 0,

    telemetryRequestInProgress: false,

    healthRequestInProgress: false,

    telemetryTimer: null,

    healthTimer: null,

    connectionTimer: null,

    started: false

};


/* ============================================================
   03. CALLBACKS
   ============================================================ */

let callbacks = {

    onTelemetry: null,

    onTelemetryConnectionChange: null,

    onPacketAge: null,

    onServerConnectionChange: null,

    onError: null

};


/* ============================================================
   04. SERVER CONNECTION MONITOR
   ============================================================ */


/* ------------------------------------------------------------
   04.1 UPDATE SERVER STATE
   ------------------------------------------------------------ */

function updateServerState(online) {

    if (state.serverOnline === online) return;

    const previous = state.serverOnline;

    state.serverOnline = online;


    // REPORT ONLY CONNECTION TRANSITIONS

    if (online) {

        console.info(
            "[SERVER] Flask connection established."
        );

    } else if (previous === true) {

        console.error(
            "[SERVER] Flask connection lost."
        );

    }


    if (callbacks.onServerConnectionChange) {

        callbacks.onServerConnectionChange(online);

    }

}


/* ------------------------------------------------------------
   04.2 CHECK FLASK HEALTH
   ------------------------------------------------------------ */

async function checkServerHealth() {

    if (state.healthRequestInProgress) return;

    state.healthRequestInProgress = true;

    try {

        const response = await fetch(
            CONFIG.SERVER_HEALTH_ENDPOINT,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data = await response.json();


        if (data.server !== "online") {

            throw new Error(
                "Invalid server health response."
            );

        }


        updateServerState(true);


    } catch (error) {

        updateServerState(false);

    } finally {

        state.healthRequestInProgress = false;

    }

}


/* ============================================================
   05. TELEMETRY SERVICE
   ============================================================ */


/* ------------------------------------------------------------
   05.1 FETCH TELEMETRY
   ------------------------------------------------------------ */

async function fetchTelemetry() {

    if (state.telemetryRequestInProgress) return;

    state.telemetryRequestInProgress = true;

    try {

        const response = await fetch(
            CONFIG.TELEMETRY_ENDPOINT,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data = await response.json();


        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Invalid telemetry response."
            );

        }


        const timestamp = Number(data.timestamp);


        // TIMESTAMP VALIDATION

        if (
            !Number.isFinite(timestamp) ||
            timestamp <= 0 ||
            timestamp > Date.now() / 1000
        ) {

            return;

        }


        // ACCEPT ONLY NEW TELEMETRY

        if (
            timestamp > state.latestTelemetryTimestamp
        ) {

            state.latestTelemetryTimestamp = timestamp;


            if (callbacks.onTelemetry) {

                callbacks.onTelemetry(data);

            }

        }


    } catch (error) {

        if (callbacks.onError) {

            callbacks.onError(error);

        }

    } finally {

        state.telemetryRequestInProgress = false;

    }

}


/* ============================================================
   06. TELEMETRY CONNECTION MONITOR
   ============================================================ */


/* ------------------------------------------------------------
   06.1 CHECK TELEMETRY CONNECTION
   ------------------------------------------------------------ */

function checkTelemetryConnection() {

    const timestamp = state.latestTelemetryTimestamp;


    // NO TELEMETRY RECEIVED

    if (!timestamp) {

        updateTelemetryState(false);

        if (callbacks.onPacketAge) {

            callbacks.onPacketAge(null);

        }

        return;

    }


    const age =
        Date.now() - timestamp * 1000;


    const online =
        age >= 0 &&
        age < CONFIG.OFFLINE_AFTER_MS;


    updateTelemetryState(online);


    if (callbacks.onPacketAge) {

        callbacks.onPacketAge(
            Math.max(0, Math.round(age))
        );

    }

}


/* ------------------------------------------------------------
   06.2 UPDATE TELEMETRY STATE
   ------------------------------------------------------------ */

function updateTelemetryState(online) {

    if (state.telemetryOnline === online) return;

    state.telemetryOnline = online;


    if (callbacks.onTelemetryConnectionChange) {

        callbacks.onTelemetryConnectionChange(online);

    }

}


/* ============================================================
   07. PUBLIC API
   ============================================================ */


/* ------------------------------------------------------------
   07.1 START CONNECTION MANAGER
   ------------------------------------------------------------ */

/**
 * Starts all connection and telemetry monitoring loops.
 */
function start() {

    if (state.started) return;

    state.started = true;


    // INITIAL CHECKS

    checkServerHealth();

    fetchTelemetry();

    checkTelemetryConnection();


    // TELEMETRY REQUEST LOOP

    state.telemetryTimer = setInterval(

        fetchTelemetry,

        CONFIG.TELEMETRY_REFRESH_MS

    );


    // SERVER HEALTH LOOP

    state.healthTimer = setInterval(

        checkServerHealth,

        CONFIG.SERVER_CHECK_MS

    );


    // TELEMETRY CONNECTION LOOP

    state.connectionTimer = setInterval(

        checkTelemetryConnection,

        CONFIG.CONNECTION_CHECK_MS

    );


    console.info(
        "[CONNECTION MANAGER] Started."
    );

}


/* ------------------------------------------------------------
   07.2 STOP CONNECTION MANAGER
   ------------------------------------------------------------ */

/**
 * Stops all connection and telemetry monitoring loops.
 */
function stop() {

    if (!state.started) return;

    clearInterval(state.telemetryTimer);

    clearInterval(state.healthTimer);

    clearInterval(state.connectionTimer);


    state.telemetryTimer = null;

    state.healthTimer = null;

    state.connectionTimer = null;

    state.started = false;


    console.info(
        "[CONNECTION MANAGER] Stopped."
    );

}


/* ------------------------------------------------------------
   07.3 INITIALIZE CONNECTION MANAGER
   ------------------------------------------------------------ */

/**
 * Initializes the connection manager and registers its callbacks.
 *
 * Starts server health monitoring, telemetry reception
 * and telemetry connection monitoring.
 *
 * @param {Object} options - Connection manager callbacks.
 * @returns {Object} Connection manager public API.
 */
function initConnectionManager(options = {}) {

    callbacks = {

        ...callbacks,

        ...options

    };


    start();


    return {

        start,

        stop,

        getState() {

            return {

                serverOnline: state.serverOnline,

                telemetryOnline: state.telemetryOnline,

                latestTelemetryTimestamp:
                    state.latestTelemetryTimestamp

            };

        }

    };

}


/* ============================================================
   MODULE EXPORTS
   ============================================================ */

export {

    initConnectionManager

};