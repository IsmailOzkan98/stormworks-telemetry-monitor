
/*
 * HYDRA SYSTEM // RED GLITCH ENGINE
 * Unified visual effects + terminal boot sequence.
 *
 * - No modifica el HTML original.
 * - No altera la lógica de la aplicación.
 * - Inyecta sus propios estilos CSS.
 * - Compatible con paneles creados dinámicamente.
 * - Incluye controles públicos start/stop.
 */

(() => {
    "use strict";

    if (window.__HYDRA_ENGINE__) return;

    const CONFIG = {
        boot: {
            enabled: true,
            duration: 4200,
            fadeDuration: 600,
            title: "HYDRA SYSTEM",
            version: "BUILD 07.04.26"
        },

        effects: {
            enabled: true,
            glitchInterval: 1800,
            glitchChance: 0.65,
            glitchDuration: 260,
            screenFlashChance: 0.12,
            alertChance: 0.18,
            alertInterval: 12000
        },

        targets: [
            "header",
            ".recorder-panel",
            ".diagnostics-panel",
            ".monitor-panel",
            ".event-panel",
            ".telemetry-chart-panel"
        ]
    };

    const SPINNER = ["/", "-", "\\", "|"];

    const ALERTS = [
        "SIGNAL INTERFERENCE DETECTED",
        "UNSTABLE DATA TRANSMISSION",
        "AUXILIARY NODE RESPONSE DELAY",
        "SECURITY MONITORING ACTIVE",
        "NETWORK ANOMALY DETECTED",
        "HYDRA CORE SYNCHRONIZED",
        "TELEMETRY STREAM RECONNECTED"
    ];

    const state = {
        running: false,
        booting: false,
        progress: 0,
        bootInterval: null,
        spinnerInterval: null,
        glitchInterval: null,
        alertInterval: null,
        overlay: null,
        hud: null,
        scanlines: null,
        noise: null,
        flash: null,
        style: null,
        timers: new Set(),
        activeTargets: new Set()
    };

    const random = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;

    const chance = probability =>
        Math.random() < probability;

    const createElement = (tag, className, text = "") => {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    };

    function addTimer(callback, delay) {
        const timer = window.setTimeout(() => {
            state.timers.delete(timer);
            callback();
        }, delay);

        state.timers.add(timer);
        return timer;
    }

    /* =========================================
       CSS ENGINE
    ========================================= */

    function injectStyles() {
        if (document.getElementById("hydra-engine-styles")) return;

        const css = `
        .hydra-engine-layer {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 99990;
        }

        .fx-scanline-layer {
            background: repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 2px,
                rgba(0,0,0,.17) 3px,
                rgba(0,0,0,.17) 4px
            );
            opacity: .32;
        }

        .fx-noise-layer {
            opacity: .10;
            background-image:
                repeating-radial-gradient(
                    circle at 17% 32%,
                    rgba(255,255,255,.25) 0 1px,
                    transparent 1px 3px
                );
            background-size: 7px 7px;
            animation: hydra-noise .16s steps(2) infinite;
        }

        @keyframes hydra-noise {
            0% { transform: translate(0,0); }
            25% { transform: translate(2px,-1px); }
            50% { transform: translate(-1px,2px); }
            75% { transform: translate(1px,1px); }
            100% { transform: translate(-2px,-1px); }
        }

        .fx-glitch-active {
            animation: hydra-glitch .26s steps(2) !important;
            position: relative;
        }

        @keyframes hydra-glitch {
            0% {
                transform: translate(0);
                filter: none;
            }
            20% {
                transform: translate(-3px,1px);
                filter: drop-shadow(3px 0 rgba(255,0,0,.8));
            }
            40% {
                transform: translate(3px,-1px);
                filter: drop-shadow(-3px 0 rgba(0,255,255,.7));
            }
            60% {
                transform: translate(-2px,0);
                filter: contrast(1.7);
            }
            80% {
                transform: translate(2px,1px);
                filter: hue-rotate(35deg);
            }
            100% {
                transform: translate(0);
                filter: none;
            }
        }

        .hydra-screen-flash {
            position: fixed;
            inset: 0;
            z-index: 99995;
            pointer-events: none;
            background: rgba(255,0,0,.13);
            animation: hydra-flash .32s steps(2);
        }

        @keyframes hydra-flash {
            0%,100% { opacity: 0; }
            20%,50% { opacity: 1; }
        }

        .hydra-hud {
            position: fixed;
            inset: 0;
            z-index: 99991;
            pointer-events: none;
            font-family: "Share Tech Mono", monospace;
            color: #ff4545;
            font-size: 10px;
            letter-spacing: 2px;
            text-shadow: 0 0 7px rgba(255,0,0,.6);
        }

        .hydra-hud-corner {
            position: absolute;
            padding: 12px;
            opacity: .72;
        }

        .hydra-hud-top-left {
            top: 0;
            left: 0;
        }

        .hydra-hud-top-right {
            top: 0;
            right: 0;
            text-align: right;
        }

        .hydra-hud-bottom-left {
            bottom: 0;
            left: 0;
        }

        .hydra-hud-bottom-right {
            bottom: 0;
            right: 0;
            text-align: right;
        }

        .hydra-hud-alert {
            position: absolute;
            top: 14%;
            left: 50%;
            transform: translateX(-50%);
            padding: 9px 16px;
            border: 1px solid rgba(255,50,50,.65);
            background: rgba(30,0,0,.88);
            box-shadow: 0 0 18px rgba(255,0,0,.22);
            color: #ff7777;
            opacity: 0;
            transition: opacity .2s ease;
            text-align: center;
            max-width: 85vw;
        }

        .hydra-hud-alert.visible {
            opacity: 1;
        }

        .hydra-hud-line {
            height: 1px;
            background: rgba(255,0,0,.24);
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            opacity: .18;
        }

        .hydra-boot-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(5,0,0,.97);
            color: #ff4949;
            font-family: "Share Tech Mono", monospace;
            opacity: 1;
            transition: opacity .6s ease;
        }

        .hydra-boot-overlay.hydra-boot-exit {
            opacity: 0;
        }

        .hydra-boot-terminal {
            width: min(560px, 100%);
            padding: 25px;
            border: 1px solid rgba(255,45,45,.65);
            background: rgba(16,0,0,.96);
            box-shadow:
                0 0 30px rgba(255,0,0,.15),
                inset 0 0 30px rgba(255,0,0,.04);
        }

        .hydra-boot-header,
        .hydra-boot-progress-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
        }

        .hydra-boot-title {
            font-size: 19px;
            letter-spacing: 3px;
            font-weight: bold;
        }

        .hydra-boot-version {
            font-size: 10px;
            opacity: .6;
        }

        .hydra-boot-separator {
            height: 1px;
            background: rgba(255,60,60,.5);
            margin: 18px 0;
        }

        .hydra-boot-messages {
            display: grid;
            gap: 10px;
            min-height: 125px;
            font-size: 12px;
        }

        .hydra-boot-line {
            opacity: 0;
            animation: hydra-line-in .3s forwards;
        }

        @keyframes hydra-line-in {
            to { opacity: .85; }
        }

        .hydra-boot-progress-section {
            margin-top: 25px;
        }

        .hydra-boot-progress-header {
            font-size: 11px;
            margin-bottom: 10px;
        }

        .hydra-boot-progress-track {
            height: 7px;
            border: 1px solid rgba(255,50,50,.5);
            background: #160707;
            overflow: hidden;
        }

        .hydra-boot-progress-fill {
            height: 100%;
            width: 0;
            background: #ff2929;
            box-shadow: 0 0 12px #ff2929;
            transition: width .08s linear;
        }

        .hydra-boot-loading-bar {
            margin-top: 12px;
            font-size: 11px;
            letter-spacing: 2px;
            overflow-wrap: anywhere;
        }

        .hydra-boot-spinner {
            display: inline-block;
            margin-top: 15px;
            font-size: 13px;
        }

        .hydra-boot-status {
            margin-top: 10px;
            font-size: 11px;
            color: #ff7777;
        }

        .hydra-boot-footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,50,50,.25);
            font-size: 9px;
            letter-spacing: 2px;
            opacity: .55;
        }

        @media (max-width: 480px) {
            .hydra-boot-terminal {
                padding: 18px;
            }

            .hydra-boot-title {
                font-size: 15px;
            }

            .hydra-boot-messages {
                font-size: 10px;
            }

            .hydra-hud {
                font-size: 8px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .fx-noise-layer,
            .fx-glitch-active,
            .hydra-boot-line {
                animation: none !important;
            }

            .hydra-boot-overlay {
                transition: none;
            }
        }
        `;

        state.style = createElement("style", "");
        state.style.id = "hydra-engine-styles";
        state.style.textContent = css;
        document.head.appendChild(state.style);
    }

    /* =========================================
       VISUAL LAYERS
    ========================================= */

    function createLayers() {
        if (state.scanlines) return;

        state.scanlines = createElement(
            "div",
            "hydra-engine-layer fx-scanline-layer"
        );

        state.noise = createElement(
            "div",
            "hydra-engine-layer fx-noise-layer"
        );

        state.hud = createElement("div", "hydra-hud");

        const topLeft = createElement(
            "div",
            "hydra-hud-corner hydra-hud-top-left",
            "HYDRA // ACTIVE"
        );

        const topRight = createElement(
            "div",
            "hydra-hud-corner hydra-hud-top-right",
            "RED GLITCH SYSTEM"
        );

        const bottomLeft = createElement(
            "div",
            "hydra-hud-corner hydra-hud-bottom-left",
            "SIGNAL: MONITORING"
        );

        const bottomRight = createElement(
            "div",
            "hydra-hud-corner hydra-hud-bottom-right",
            "CORE // 07.04.26"
        );

        const line = createElement("div", "hydra-hud-line");

        const alert = createElement("div", "hydra-hud-alert");

        state.hud.append(
            topLeft,
            topRight,
            bottomLeft,
            bottomRight,
            line,
            alert
        );

        state.hudAlert = alert;

        document.body.append(
            state.scanlines,
            state.noise,
            state.hud
        );
    }

    /* =========================================
       TERMINAL BOOT
    ========================================= */

    function createTerminal() {
        const overlay = createElement(
            "div",
            "hydra-boot-overlay"
        );

        overlay.setAttribute("aria-hidden", "true");

        const terminal = createElement(
            "div",
            "hydra-boot-terminal"
        );

        const header = createElement(
            "div",
            "hydra-boot-header"
        );

        header.append(
            createElement(
                "span",
                "hydra-boot-title",
                CONFIG.boot.title
            ),
            createElement(
                "span",
                "hydra-boot-version",
                CONFIG.boot.version
            )
        );

        const separator = createElement(
            "div",
            "hydra-boot-separator"
        );

        const messages = createElement(
            "div",
            "hydra-boot-messages"
        );

        const lines = [
            "[SYSTEM] Initializing HYDRA interface...",
            "[CORE] Loading visual subsystems...",
            "[SECURITY] Establishing secure environment...",
            "[DISPLAY] Synchronizing terminal modules...",
            "[STATUS] Preparing dashboard..."
        ];

        lines.forEach((line, index) => {
            const message = createElement(
                "div",
                "hydra-boot-line",
                line
            );

            message.style.animationDelay = `${index * 180}ms`;
            messages.appendChild(message);
        });

        const section = createElement(
            "div",
            "hydra-boot-progress-section"
        );

        const progressHeader = createElement(
            "div",
            "hydra-boot-progress-header"
        );

        const percentage = createElement(
            "span",
            "hydra-boot-percentage",
            "0%"
        );

        progressHeader.append(
            createElement("span", "", "INITIALIZATION"),
            percentage
        );

        const track = createElement(
            "div",
            "hydra-boot-progress-track"
        );

        const fill = createElement(
            "div",
            "hydra-boot-progress-fill"
        );

        track.appendChild(fill);

        const loadingBar = createElement(
            "div",
            "hydra-boot-loading-bar",
            "(........................)"
        );

        const spinner = createElement(
            "div",
            "hydra-boot-spinner",
            "[/]"
        );

        const status = createElement(
            "div",
            "hydra-boot-status",
            "PLEASE WAIT..."
        );

        section.append(
            progressHeader,
            track,
            loadingBar,
            spinner,
            status
        );

        const footer = createElement(
            "div",
            "hydra-boot-footer",
            "HYDRA // RED GLITCH TERMINAL"
        );

        terminal.append(
            header,
            separator,
            messages,
            section,
            footer
        );

        overlay.appendChild(terminal);
        document.body.appendChild(overlay);

        state.overlay = overlay;

        return {
            fill,
            percentage,
            loadingBar,
            spinner,
            status
        };
    }

    function completeBoot(elements) {
        clearInterval(state.bootInterval);
        clearInterval(state.spinnerInterval);

        state.bootInterval = null;
        state.spinnerInterval = null;
        state.booting = false;
        state.progress = 100;

        elements.status.textContent = "HYDRA INTERFACE READY";
        elements.spinner.textContent = "[OK]";
        elements.percentage.textContent = "100%";
        elements.fill.style.width = "100%";

        addTimer(() => {
            if (!state.overlay) return;

            state.overlay.classList.add("hydra-boot-exit");

            addTimer(() => {
                state.overlay?.remove();
                state.overlay = null;
            }, CONFIG.boot.fadeDuration);

        }, 500);

        console.info("[HYDRA] Initialization complete.");
    }

    function updateBoot(elements) {
        state.progress = Math.min(
            100,
            state.progress + random(1, 3)
        );

        const progress = state.progress;

        elements.fill.style.width = `${progress}%`;
        elements.percentage.textContent = `${progress}%`;

        const loaded = Math.floor(progress / 100 * 24);

        elements.loadingBar.textContent =
            `(${ "#".repeat(loaded) }${ ".".repeat(24 - loaded) })`;

        if (progress >= 80) {
            elements.status.textContent =
                "FINALIZING INITIALIZATION...";
        } else if (progress >= 50) {
            elements.status.textContent =
                "SYNCHRONIZING MODULES...";
        } else if (progress >= 25) {
            elements.status.textContent =
                "LOADING SUBSYSTEMS...";
        }

        if (progress >= 100) {
            completeBoot(elements);
        }
    }

    function startBoot() {
        if (state.overlay || state.booting) return;

        state.booting = true;
        state.progress = 0;

        const elements = createTerminal();

        state.bootInterval = window.setInterval(
            () => updateBoot(elements),
            CONFIG.boot.duration / 100
        );

        let frame = 0;

        state.spinnerInterval = window.setInterval(() => {
            elements.spinner.textContent =
                `[${SPINNER[frame++ % SPINNER.length]}]`;
        }, 100);

        console.info("[HYDRA] Boot sequence started.");
    }

    function stopBoot() {
        clearInterval(state.bootInterval);
        clearInterval(state.spinnerInterval);

        state.bootInterval = null;
        state.spinnerInterval = null;
        state.booting = false;
        state.progress = 0;

        state.overlay?.remove();
        state.overlay = null;
    }

    /* =========================================
       GLITCH ENGINE
    ========================================= */

    function getTargets() {
        return CONFIG.targets.flatMap(selector =>
            Array.from(document.querySelectorAll(selector))
        );
    }

    function triggerGlitch() {
        if (document.hidden) return;

        const targets = getTargets();
        if (!targets.length) return;

        const element = targets[random(0, targets.length - 1)];

        if (state.activeTargets.has(element)) return;

        state.activeTargets.add(element);
        element.classList.add("fx-glitch-active");

        addTimer(() => {
            element.classList.remove("fx-glitch-active");
            state.activeTargets.delete(element);
        }, CONFIG.effects.glitchDuration);
    }

    function screenFlash() {
        if (document.hidden || !document.body) return;

        const flash = createElement(
            "div",
            "hydra-screen-flash"
        );

        document.body.appendChild(flash);

        addTimer(() => flash.remove(), 350);
    }

    /* =========================================
       ALERT SYSTEM
    ========================================= */

    function showAlert(message) {
        if (!state.hudAlert || document.hidden) return;

        state.hudAlert.textContent = `[ HYDRA ALERT ] ${message}`;
        state.hudAlert.classList.add("visible");

        addTimer(() => {
            state.hudAlert?.classList.remove("visible");
        }, 2400);
    }

    function randomAlert() {
        const message = ALERTS[
            random(0, ALERTS.length - 1)
        ];

        showAlert(message);
    }

    /* =========================================
       ENGINE LIFECYCLE
    ========================================= */

    function startEffects() {
        if (state.running) return;

        injectStyles();
        createLayers();

        state.running = true;

        state.glitchInterval = window.setInterval(() => {
            if (chance(CONFIG.effects.glitchChance)) {
                triggerGlitch();
            }

            if (chance(CONFIG.effects.screenFlashChance)) {
                screenFlash();
            }
        }, CONFIG.effects.glitchInterval);

        state.alertInterval = window.setInterval(() => {
            if (chance(CONFIG.effects.alertChance)) {
                randomAlert();
            }
        }, CONFIG.effects.alertInterval);

        console.info("[HYDRA] RED GLITCH engine online.");
    }

    function stopEffects() {
        clearInterval(state.glitchInterval);
        clearInterval(state.alertInterval);

        state.glitchInterval = null;
        state.alertInterval = null;
        state.running = false;

        state.scanlines?.remove();
        state.noise?.remove();
        state.hud?.remove();

        state.scanlines = null;
        state.noise = null;
        state.hud = null;
        state.hudAlert = null;

        state.activeTargets.forEach(element => {
            element.classList.remove("fx-glitch-active");
        });

        state.activeTargets.clear();

        document.querySelectorAll(".hydra-screen-flash")
            .forEach(element => element.remove());

        console.info("[HYDRA] Visual effects stopped.");
    }

    function startHydra() {
        injectStyles();
        startEffects();

        if (CONFIG.boot.enabled) {
            startBoot();
        }
    }

    function stopHydra() {
        stopBoot();
        stopEffects();

        state.timers.forEach(timer => clearTimeout(timer));
        state.timers.clear();

        console.info("[HYDRA] System stopped.");
    }

    /* =========================================
       PUBLIC API
    ========================================= */

    window.startHydra = startHydra;
    window.stopHydra = stopHydra;

    window.startHydraBoot = startBoot;
    window.stopHydraBoot = stopBoot;

    window.startRedGlitch = startEffects;
    window.stopRedGlitch = stopEffects;

    window.hydraAlert = showAlert;

    window.__HYDRA_ENGINE__ = {
        version: CONFIG.boot.version,
        start: startHydra,
        stop: stopHydra,
        alert: showAlert
    };

    /* =========================================
       AUTOMATIC INITIALIZATION
    ========================================= */

    function initialize() {
        if (!document.body || !document.head) return;
        startHydra();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
