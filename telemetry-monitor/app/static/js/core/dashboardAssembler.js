
/* ============================================================
   DASHBOARD ASSEMBLER

   RESPONSIBILITY:
   Dynamically builds the HTML dashboard layout
   using the structure defined in a JSON configuration.
   ============================================================ */


    /**
     * Initializes the dashboard layout from a JSON configuration.
     *
     * Validates the dashboard settings, prepares module containers
     * and dynamically generates the configured HTML column structure.
     *
     * @param {Object} config - Dashboard layout configuration.
     * @returns {Array<Object>} Prepared dashboard module items.
     */
    export function initializeDashboardAssembler(config) {

        const dashboard = document.getElementById("dashboardGrid");

        if (!dashboard) {
            throw new Error("[DASHBOARD] Root container not found.");
        }

        if (!config || !Array.isArray(config.items)) {
            throw new Error("[DASHBOARD] Invalid configuration.");
        }

        if (dashboard.children.length > 0) {
            throw new Error("[DASHBOARD] Dashboard already initialized.");
        }

        const columns = Number(config.columns);
        const gap = Number(config.gap ?? 14);

        if (!Number.isInteger(columns) || columns < 1) {
            throw new Error("[DASHBOARD] Invalid column count.");
        }

        if (!Number.isFinite(gap) || gap < 0) {
            throw new Error("[DASHBOARD] Invalid gap.");
        }

        const ids = new Set();

        // VALIDATE AND PREPARE ITEMS

        const items = config.items.map(item => {

            if (
                !item.id ||
                !item.module ||
                !Number.isInteger(item.column) ||
                item.column < 1 ||
                item.column > columns ||
                !Number.isInteger(item.order) ||
                item.order < 1
            ) {
                throw new Error(
                    `[DASHBOARD] Invalid item: ${item.id}`
                );
            }

            if (ids.has(item.id)) {
                throw new Error(
                    `[DASHBOARD] Duplicate item: ${item.id}`
                );
            }

            ids.add(item.id);

            return {
                ...item,
                element: document.createElement("div")
            };

        });

        // CONFIGURE DASHBOARD

        dashboard.style.setProperty(
            "--dashboard-columns",
            columns
        );

        dashboard.style.setProperty(
            "--dashboard-gap",
            `${gap}px`
        );

        // BUILD DASHBOARD COLUMNS

        for (let columnIndex = 1; columnIndex <= columns; columnIndex++) {

            const column = document.createElement("section");

            column.className = "column";
            column.dataset.column = columnIndex;


            const columnItems = items
                .filter(item => item.column === columnIndex)
                .sort((a, b) => a.order - b.order);

            // CREATE AND MOUNT MODULE CONTAINERS

            columnItems.forEach(item => {

                item.element.id = item.id;
                item.element.dataset.module = item.module;

                column.appendChild(item.element);

            });


            dashboard.appendChild(column);

        }

        console.info(
            `[DASHBOARD] Generated ${items.length} containers across ${columns} columns.`
        );

        return items;

    }