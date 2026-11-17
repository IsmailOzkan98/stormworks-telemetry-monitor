/* ============================================================
   TELEMETRY GRAPHS MODULE

   RESPONSIBILITY:
   Telemetry history management, dynamic graph scaling,
   data readouts and Canvas chart rendering.
   ============================================================ */

const CONFIG_URL = "/api/telemetryGraphs-config";

let config = null;
let container = null;
let telemetryHistory = [];
let graphExtremes = {};
let latestData = null;

// 01. CONFIGURATION

async function loadConfiguration() {

    const response = await fetch(
        CONFIG_URL,
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    config = await response.json();

}


// 02. HTML GENERATION

function createTelemetryGraphs() {

    if (!container) return;

    container.replaceChildren();

    if (config.enabled === false) {
        container.hidden = true;
        return;
    }

    container.hidden = false;

    const heading = document.createElement("div");
    heading.className = "telemetry-title section-header";

    heading.textContent = config.sectionHeading.title;

    container.appendChild(heading);

    const stack = document.createElement("div");
    stack.className = "telemetry-stack";

    config.graphs.forEach(graph => {

        const panel = document.createElement("div");
        panel.className = "telemetry-chart-panel";

        const header = document.createElement("div");
        header.className = "telemetry-chart-header";

        const title = document.createElement("span");
        title.textContent = graph.title;

        const history = document.createElement("span");
        history.textContent = `${config.history.seconds} SEC HISTORY`;

        header.append(title, history);

        const readouts = document.createElement("div");
        readouts.className = "telemetry-readouts";

        const items = [
            ...graph.leftAxis,
            graph.rightAxis
        ];

        items.forEach(item => {

            const block = document.createElement("div");

            const label = document.createElement("span");
            label.textContent = item.label;

            const value = document.createElement("strong");
            value.id = `telemetry-${item.id}`;
            value.textContent = item.default ?? "--";

            const unit = document.createElement("small");
            unit.textContent = item.unit ?? "";

            block.append(label, value, unit);
            readouts.appendChild(block);

        });

        const legend = document.createElement("div");
        legend.className = "telemetry-legend";

        graph.legend.forEach(item => {

            const entry = document.createElement("span");
            entry.className = item.class;
            entry.textContent = `● ${item.label}`;

            legend.appendChild(entry);

        });

        const canvas = document.createElement("canvas");
        canvas.id = graph.canvasId;

        panel.append(
            header,
            readouts,
            legend,
            canvas
        );

        stack.appendChild(panel);

    });

    container.appendChild(stack);

    initializeGraphExtremes();

    if (latestData) {
        updateTelemetryGraphs(latestData);
    }

}


// 03. GRAPH SCALE MANAGEMENT

function initializeGraphExtremes() {

    graphExtremes = {};

    config.graphs.forEach(graph => {

        graph.leftAxis.forEach(item => {

            graphExtremes[item.id] = {
                min: Infinity,
                max: -Infinity
            };

        });

        graphExtremes[graph.rightAxis.id] = {
            min: Infinity,
            max: -Infinity
        };

    });

}


// 04. TELEMETRY HISTORY

function getNumericValue(data, key) {

    if (
        data[key] === null ||
        data[key] === undefined ||
        data[key] === ""
    ) {
        return null;
    }

    const value = Number(data[key]);

    return Number.isFinite(value) ? value : null;

}

function updateGraphExtremes(data) {

    config.graphs.forEach(graph => {

        const items = [
            ...graph.leftAxis,
            graph.rightAxis
        ];

        items.forEach(item => {

            const value = getNumericValue(
                data,
                item.source
            );

            if (value === null) return;

            const extreme = graphExtremes[item.id];

            extreme.min = Math.min(extreme.min, value);
            extreme.max = Math.max(extreme.max, value);

        });

    });

}

function recordTelemetry(data) {

    const timestamp = Number(data.timestamp);

    if (
        !Number.isFinite(timestamp) ||
        timestamp <= 0
    ) {
        return;
    }

    const lastPoint =
        telemetryHistory[telemetryHistory.length - 1];

    if (
        lastPoint &&
        timestamp <= lastPoint.timestamp
    ) {
        return;
    }

    const sample = { timestamp };

    config.graphs.forEach(graph => {

        const items = [
            ...graph.leftAxis,
            graph.rightAxis
        ];

        items.forEach(item => {

            sample[item.id] = getNumericValue(
                data,
                item.source
            );

        });

    });

    updateGraphExtremes(data);

    telemetryHistory.push(sample);

    const cutoff =
        timestamp - config.history.seconds;

    while (
        telemetryHistory.length > 0 &&
        telemetryHistory[0].timestamp < cutoff
    ) {
        telemetryHistory.shift();
    }

    while (
        telemetryHistory.length > config.history.maxPoints
    ) {
        telemetryHistory.shift();
    }

}


// 05. GRAPH RANGE CALCULATION

function createFixedRange(min, max) {

    if (
        !Number.isFinite(min) ||
        !Number.isFinite(max)
    ) {
        return {
            min: config.scale.defaultMin,
            max: config.scale.defaultMax
        };
    }

    if (min === max) {
        min -= 1;
        max += 1;
    }

    const padding =
        (max - min) * config.scale.padding;

    return {
        min: min - padding,
        max: max + padding
    };

}

function getGraphRanges(graph) {

    let leftMin = Infinity;
    let leftMax = -Infinity;

    graph.leftAxis.forEach(item => {

        const extreme = graphExtremes[item.id];

        leftMin = Math.min(leftMin, extreme.min);
        leftMax = Math.max(leftMax, extreme.max);

    });

    const rightExtreme =
        graphExtremes[graph.rightAxis.id];

    return {

        leftRange: createFixedRange(leftMin, leftMax),

        rightRange: createFixedRange(
            rightExtreme.min,
            rightExtreme.max
        )

    };

}


// 06. DATA READOUTS

function updateReadouts(data) {

    config.graphs.forEach(graph => {

        const items = [
            ...graph.leftAxis,
            graph.rightAxis
        ];

        items.forEach(item => {

            const element = container.querySelector(
                `#telemetry-${CSS.escape(item.id)}`
            );

            if (!element) return;

            const value = getNumericValue(
                data,
                item.source
            );

            element.textContent = value === null
                ? item.default ?? "--"
                : value.toFixed(item.decimals ?? 1);

        });

    });

}


// 07. CANVAS RENDERING

function drawTelemetryChart(graph) {

    const canvas = container.querySelector(
        `#${CSS.escape(graph.canvasId)}`
    );

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const left = 39;
    const right = width - 39;
    const top = 10;
    const bottom = height - 20;

    const plotWidth = right - left;
    const plotHeight = bottom - top;

    if (plotWidth <= 0 || plotHeight <= 0) return;

    const latest =
        telemetryHistory[telemetryHistory.length - 1];

    if (!latest) return;

    const historySeconds = config.history.seconds;

    const startTime =
        latest.timestamp - historySeconds;

    const ranges = getGraphRanges(graph);

    const leftRange = ranges.leftRange;
    const rightRange = ranges.rightRange;

    function getX(timestamp) {

        return left +
            ((timestamp - startTime) / historySeconds) *
            plotWidth;

    }

    function getY(value, range) {

        return bottom -
            ((value - range.min) /
            (range.max - range.min)) *
            plotHeight;

    }

    // GRID

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(184,166,117,0.16)";
    ctx.setLineDash([3, 4]);

    for (let i = 0; i <= 4; i++) {

        const y = top + (plotHeight / 4) * i;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

    }

    for (let i = 0; i <= 4; i++) {

        const x = left + (plotWidth / 4) * i;

        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();

    }

    ctx.setLineDash([]);

    // AXIS LABELS

    ctx.fillStyle = "#aaa38f";
    ctx.font = "9px IBM Plex Mono";

    ctx.textAlign = "right";

    ctx.fillText(
        leftRange.max.toFixed(1),
        left - 5,
        top + 3
    );

    ctx.fillText(
        leftRange.min.toFixed(1),
        left - 5,
        bottom
    );

    ctx.textAlign = "left";

    ctx.fillText(
        rightRange.max.toFixed(1),
        right + 5,
        top + 3
    );

    ctx.fillText(
        rightRange.min.toFixed(1),
        right + 5,
        bottom
    );

    ctx.textAlign = "center";

    ctx.fillText(`-${historySeconds}s`, left, height - 4);
    ctx.fillText(`-${historySeconds / 2}s`, left + plotWidth / 2, height - 4);
    ctx.fillText("NOW", right, height - 4);

    // TELEMETRY CURVES

    function drawCurve(item, range) {

        const styles =
            getComputedStyle(document.documentElement);

        const color = styles
            .getPropertyValue(item.color)
            .trim();

        ctx.beginPath();

        ctx.strokeStyle = color || "#aaa38f";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.setLineDash(
            item.style === "dashed" ? [5, 3] : []
        );

        let started = false;

        telemetryHistory.forEach(point => {

            const value = point[item.id];

            if (
                value === null ||
                point.timestamp < startTime
            ) {
                started = false;
                return;
            }

            const x = getX(point.timestamp);
            const y = getY(value, range);

            if (!started) {

                ctx.moveTo(x, y);
                started = true;

            } else {

                ctx.lineTo(x, y);

            }

        });

        ctx.stroke();
        ctx.setLineDash([]);

    }

    graph.leftAxis.forEach(item => {
        drawCurve(item, leftRange);
    });

    drawCurve(
        graph.rightAxis,
        rightRange
    );

}


// 08. GRAPH UPDATE

function updateTelemetryGraphs(data) {

    if (
        !config ||
        !container ||
        config.enabled === false
    ) {
        return;
    }

    updateReadouts(data);

    recordTelemetry(data);

    config.graphs.forEach(graph => {
        drawTelemetryChart(graph);
    });

}


// 09. PUBLIC API

/**
 * Updates the telemetry graphs with incoming telemetry data.
 *
 * Stores the latest data and refreshes graph readouts,
 * telemetry history and chart rendering.
 *
 * @param {Object} data - Latest telemetry data.
 */
export function updateTelemetryGraphsData(data) {

    if (!data) return;

    latestData = data;

    if (config) {
        updateTelemetryGraphs(data);
    }

}

/**
 * Redraws all telemetry charts after a container resize.
 */
export function drawTelemetryGraphsOnResize() {

    if (!config || !container) return;

    config.graphs.forEach(graph => {
        drawTelemetryChart(graph);
    });

}


// 10. MODULE INITIALIZATION

/**
 * Initializes the telemetry graphs module.
 *
 * Loads the graph configuration, generates the interface
 * and prepares the charts for telemetry updates.
 *
 * @param {HTMLElement} targetContainer - Container for the graphs.
 * @returns {Promise<boolean>} True if initialization succeeds.
 */
export async function initTelemetryGraphs(targetContainer) {

    try {

        if (!targetContainer) {
            console.error("[TELEMETRY GRAPHS] Container not found.");
            return false;
        }

        container = targetContainer;

        await loadConfiguration();

        createTelemetryGraphs();

        console.info("[TELEMETRY GRAPHS] Configuration loaded.");

        return true;

    } catch (error) {

        console.error(
            "[TELEMETRY GRAPHS] Initialization failed:",
            error
        );

        return false;

    }

}
