
/* ============================================================
   MODULE MANAGER
   ============================================================ */

import { state, modules } from "./state.js";


/* ============================================================
   01. SYSTEM CONFIGURATION
   ============================================================ */

const CONFIG = Object.freeze({

    CONFIG_ENDPOINT: "/api/frontend-config"

});


/* ============================================================
   02. MODULE SPECIAL HOOKS
   ============================================================ */

const MODULE_HOOKS = {

    missionMonitor(api) {

        if (state.pendingMissionData) {
            api.updateMissionMonitorData(
                state.pendingMissionData
            );
        }

        api.updateMissionMonitorConnectionData(
            state.previousConnection === true
        );

        if (state.latestTelemetryTimestamp) {

            const age = Date.now() -
                state.latestTelemetryTimestamp * 1000;

            api.updateMissionMonitorPacketAge(
                Math.max(0, Math.round(age))
            );

        }

    },

    flightRecorder() {

        return {
            onEvent: state.logEvent
        };

    }

};


/* ============================================================
   03. LOAD CONFIGURATION
   ============================================================ */

async function loadModuleConfiguration() {

    try {

        const response = await fetch(
            CONFIG.CONFIG_ENDPOINT,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error(
                `Configuration HTTP ${response.status}`
            );

        }

        return await response.json();

    } catch (error) {

        console.error(
            "[MODULE MANAGER] Configuration error:",
            error
        );

        return {

            modules: {

                eventLog: false,
                flightRecorder: false,
                missionBar: false,
                missionMonitor: false,
                systemDiagnostics: false,
                telemetryGraphs: false,
                systemInformation: false,
                cardsModule: false

            }

        };

    }

}



/* ============================================================
   04. GENERIC MODULE INITIALIZATION
   ============================================================ */

async function initializeModule(definition, instances = []) {

    const {
        name,
        path,
        initializer
    } = definition;

    try {

        const module = await import(path);

        // BUILD MODULE INPUT

        let input;

        if (definition.multiple === true) {

            input = instances.map(item => ({
                id: item.id,
                section: item.section,
                element: item.element
            }));

        } else {

            input =
                instances[0]?.element ??
                (
                    definition.container
                        ? document.getElementById(definition.container)
                        : null
                );

        }


        const options = definition.getOptions
            ? definition.getOptions()
            : undefined;


        const initialized = await module[initializer](
            input,
            options
        );

        if (!initialized) {

            console.warn(
                `[${name}] Initialization returned no instance.`
            );

            return null;

        }

        // RESOLVE MODULE API

        const api = (
            typeof initialized === "object" &&
            initialized !== null
        )
            ? initialized
            : module;

        // REGISTER MODULE

        if (definition.key) {
            modules[definition.key] = api;
        }

        // MODULE-SPECIFIC SETUP

        if (definition.onReady) {

            definition.onReady(api, initialized);

        } else if (
            definition.updater &&
            state.pendingMissionData &&
            typeof api[definition.updater] === "function"
        ) {

            api[definition.updater](
                state.pendingMissionData
            );

        }

        state.logEvent?.(
            `${name} initialized.`,
            "system-event"
        );

        return api;

    } catch (error) {

        console.error(
            `[${name}] Initialization failed:`,
            error
        );

        return null;

    }

}



/* ============================================================
   05. INITIALIZE REGISTERED MODULES
   ============================================================ */

async function initializeRegisteredModules(
    configuration,
    dashboardItems = []
) {

    const enabled = configuration.modules || {};
    const registry = configuration.registry || {};

    const specialModules = new Set([
        "eventLog",
        "systemInformation"
    ]);

    await Promise.all(

        Object.entries(registry).map(
            async ([configKey, definition]) => {

                // SPECIAL MODULES ARE INITIALIZED SEPARATELY

                if (specialModules.has(configKey)) {
                    return null;
                }

                if (enabled[configKey] !== true) {

                    console.info(
                        `[${definition.name}] Disabled by configuration.`
                    );

                    return null;

                }


                const instances = dashboardItems.filter(
                    item => item.module === configKey
                );

                // MODULE HOOKS

                const hook = MODULE_HOOKS[definition.special];

                const moduleDefinition = {

                    ...definition,

                    key: definition.key || configKey,

                    getOptions:
                        definition.special === "flightRecorder"
                            ? MODULE_HOOKS.flightRecorder
                            : null,

                    onReady:
                        definition.special === "missionMonitor"
                            ? hook
                            : null

                };

                return initializeModule(
                    moduleDefinition,
                    instances
                );

            }
        )

    );

}



/* ============================================================
   06. INITIALIZE EVENT SYSTEM
   ============================================================ */

async function initializeEventLog(enabled, dashboardItems = []) {

    if (!enabled) {

        console.info(
            "[EVENT LOG] Disabled by configuration."
        );

        return;

    }

    try {

        const item = dashboardItems.find(
            item => item.module === "eventLog"
        );

        const container = item?.element;

        if (!container) {

            throw new Error(
                "Dashboard container not found."
            );

        }

        const { initEventLog } = await import(
            "../modules/eventLog/eventLog.js"
        );

        const eventLogger = initEventLog(container);

        if (typeof eventLogger !== "function") {

            throw new Error(
                "Event logger initialization failed."
            );

        }

        state.logEvent = eventLogger;

        state.logEvent(
            "Flight monitoring initialized.",
            "system-event"
        );

        console.info(
            "[EVENT LOG] Initialized successfully."
        );

    } catch (error) {

        console.error(
            "[EVENT LOG] Initialization failed:",
            error
        );

    }

}


/* ============================================================
   07. INITIALIZE SYSTEM EVENT DETECTOR
   ============================================================ */

async function initializeSystemEventDetector(enabled) {

    if (!enabled) {

        console.info(
            "[SYSTEM EVENT DETECTOR] Disabled."
        );

        return;

    }

    try {

        const { initSystemEventDetector } = await import(
            "../modules/systemEventDetector/systemEventDetector.js"
        );

        modules.systemEventDetector =
            await initSystemEventDetector(state.logEvent);

        if (modules.systemEventDetector) {

            state.logEvent(
                "System Event Detector initialized.",
                "system-event"
            );

            console.info(
                "[SYSTEM EVENT DETECTOR] Initialized successfully."
            );

        }

    } catch (error) {

        modules.systemEventDetector = null;

        console.error(
            "[SYSTEM EVENT DETECTOR] Initialization failed:",
            error
        );

    }

}



/* ============================================================
   08. PROJECT DATA
   ============================================================ */

async function initializeProjectData(
    enabled,
    dashboardItems = []
) {

    try {

        const { initProjectData } = await import(
            "../modules/projectData/projectData.js"
        );

        const systemInformationContainer =
            dashboardItems.find(
                item => item.module === "systemInformation"
            )?.element ?? null;

        await initProjectData({

            systemInformationEnabled: enabled,

            systemInformationContainer

        });

    } catch (error) {

        console.error(
            "[PROJECT DATA] Initialization failed:",
            error
        );

    }

}



/* ============================================================
   09. APPLICATION MODULE ORCHESTRATION
   ============================================================ */


export async function initializeModules() {

    const configuration =
        await loadModuleConfiguration();

    let dashboardItems = [];

    // DASHBOARD ASSEMBLER

    if (configuration.dashboard) {

        try {

            const { initializeDashboardAssembler } = await import(
                "./dashboardAssembler.js"
            );

            dashboardItems = await initializeDashboardAssembler(
                configuration.dashboard
            );

            console.info(
                "[DASHBOARD ASSEMBLER] Initialized successfully."
            );

        } catch (error) {

            console.error(
                "[DASHBOARD ASSEMBLER] Initialization failed:",
                error
            );

            return;

        }

    }

    const config = configuration.modules || {};

    // EVENT SYSTEM MUST INITIALIZE FIRST

    await initializeEventLog(
        config.eventLog === true,
        dashboardItems
    );

    await initializeSystemEventDetector(
        config.systemEventDetector === true
    );


    await initializeProjectData(
        config.systemInformation === true,
        dashboardItems
    );


    await initializeRegisteredModules(
        configuration,
        dashboardItems
    );

}