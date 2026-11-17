const CONFIG_URL = "/api/systemDiagnostics-config";

/**
 * Initializes the system diagnostics module.
 *
 * Loads the diagnostics configuration, generates the HTML interface
 * and returns an update function for incoming telemetry data.
 *
 * @param {HTMLElement} targetContainer - Container for the diagnostics interface.
 * @returns {Promise<Object|boolean>} An object containing the update function,
 * or false if initialization fails.
 */
export async function initSystemDiagnostics(targetContainer) {
    if (!targetContainer) {
        console.error("[SYSTEM DIAGNOSTICS] Container not found.");
        return false;
    }

    try {
        const response = await fetch(
            CONFIG_URL,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Could not load systemDiagnostics.json");
        }

        const config = await response.json();

        targetContainer.innerHTML = `
            <div class="module-header section-header">
                ${config.title.name}
            </div>

            <div class="diagnostics-panel">
                <div class="diagnostic-header">
                    <span>SUBSYSTEM</span>
                    <span>STATUS</span>
                </div>

                ${config.groups.map(group => `
                    ${group.id === "boosters"
                        ? `<div class="diagnostic-separator">
                               ${group.title}
                           </div>`
                        : ""
                    }

                    <div class="${group.id === "boosters"
                        ? "booster-grid"
                        : "diagnostic-grid"}">

                        ${group.items.map(item => `
                            ${group.type === "status"
                                ? `
                                    <div class="diagnostic-row">
                                        <span>${item.label}</span>
                                        <span class="diagnostic-status">
                                            <i class="indicator"
                                               data-diagnostic="${item.id}">
                                            </i>
                                            <b data-status="${item.id}">
                                                OFFLINE
                                            </b>
                                        </span>
                                    </div>
                                `
                                : `
                                    <div class="booster">
                                        <span>${item.label}</span>
                                        <i class="indicator"
                                           data-diagnostic="${item.id}">
                                        </i>
                                    </div>
                                `
                            }
                        `).join("")}

                    </div>
                `).join("")}
            </div>
        `;

        function updateSystemDiagnostics(data) {
            if (!data) return;

            config.groups.forEach(group => {
                group.items.forEach(item => {
                    const value = data[item.dataKey];

                    const active = (
                        value === 1 ||
                        value === "1" ||
                        value === true ||
                        value === "true"
                    );

                    const indicator = targetContainer.querySelector(
                        `[data-diagnostic="${item.id}"]`
                    );

                    if (!indicator) return;

                    indicator.classList.toggle("active", active);

                    if (group.type === "status") {
                        const status = targetContainer.querySelector(
                            `[data-status="${item.id}"]`
                        );

                        if (status) {
                            status.textContent = active
                                ? "ONLINE"
                                : "OFFLINE";
                        }
                    }
                });
            });
        }

        return {
            updateSystemDiagnostics
        };

    } catch (error) {
        console.error("[SYSTEM DIAGNOSTICS]", error);
        return false;
    }
}
