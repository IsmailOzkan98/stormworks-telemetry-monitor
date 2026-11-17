
/* =========================================================
   STAR CITIZEN — AMBER FLIGHT SYSTEM
   Immersive cockpit effects
   File: star-citizen.js

   - No HTML modifications
   - Self-contained IIFE
   - Injected CSS
   - Dynamic target detection
   - Reduced-motion support
========================================================= */

(() => {
    "use strict";

    /* -----------------------------------------------------
       CONFIGURATION
    ----------------------------------------------------- */

    const CONFIG = {
        targets: [
            "header",
            ".recorder-panel",
            ".diagnostics-panel",
            ".monitor-panel",
            ".event-panel",
            ".telemetry-chart-panel"
        ],

        glitchMin: 8500,
        glitchMax: 16000,

        bootDelay: 180,
        scanDuration: 1800,

        enableGlitches: true,
        enableHover: true,
        enableSweep: true
    };

    const MODULES = [
        { selector: "header", label: "FLIGHT CONTROL", code: "FC-01" },
        { selector: ".recorder-panel", label: "FLIGHT RECORDER", code: "FDR-02" },
        { selector: ".diagnostics-panel", label: "SYSTEM DIAGNOSTICS", code: "SYS-03" },
        { selector: ".monitor-panel", label: "SHIP SYSTEMS", code: "MFD-04" },
        { selector: ".event-panel", label: "COMMUNICATIONS", code: "COM-05" },
        { selector: ".telemetry-chart-panel", label: "FLIGHT TELEMETRY", code: "TEL-06" }
    ];

    const PREFIX = "sc-amber";

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const timers = new Set();
    const initialized = new WeakSet();

    let mutationObserver = null;
    let glitchTimer = null;
    let destroyed = false;

    /* -----------------------------------------------------
       CSS INJECTION
    ----------------------------------------------------- */

    const css = `
    /* AMBER FLIGHT SYSTEM */

    .sc-amber-target {
        position: relative !important;
        isolation: isolate;
    }

    .sc-amber-overlay {
        position: absolute;
        inset: 0;
        z-index: 20;
        overflow: hidden;
        pointer-events: none;
        border-radius: inherit;
        opacity: .72;
        color: #ffb347;
        transition: opacity .3s ease;
    }

    .sc-amber-overlay::before {
        content: "";
        position: absolute;
        inset: 0;
        opacity: .15;
        background:
            repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 3px,
                rgba(255, 179, 71, .12) 4px
            );
    }

    /* CORNER HUD MARKERS */

    .sc-amber-corner {
        position: absolute;
        width: 13px;
        height: 13px;
        border-color: rgba(255, 179, 71, .75);
        border-style: solid;
        opacity: .65;
        transition: opacity .25s ease, width .25s ease, height .25s ease;
    }

    .sc-amber-corner.tl {
        top: 5px;
        left: 5px;
        border-width: 1px 0 0 1px;
    }

    .sc-amber-corner.tr {
        top: 5px;
        right: 5px;
        border-width: 1px 1px 0 0;
    }

    .sc-amber-corner.bl {
        bottom: 5px;
        left: 5px;
        border-width: 0 0 1px 1px;
    }

    .sc-amber-corner.br {
        bottom: 5px;
        right: 5px;
        border-width: 0 1px 1px 0;
    }

    /* MODULE IDENTIFICATION */

    .sc-amber-id {
        position: absolute;
        top: 8px;
        right: 22px;
        z-index: 2;
        color: rgba(255, 190, 100, .62);
        font-family: var(--font-monospace, monospace);
        font-size: 8px;
        font-weight: 400;
        letter-spacing: .13em;
        line-height: 1;
        text-transform: uppercase;
        white-space: nowrap;
        text-shadow: 0 0 7px rgba(255, 153, 24, .35);
        opacity: .7;
    }

    .sc-amber-id::before {
        content: "";
        display: inline-block;
        width: 5px;
        height: 5px;
        margin-right: 6px;
        border-radius: 50%;
        vertical-align: 1px;
        background: #ffb347;
        box-shadow: 0 0 7px #e08400;
        animation: sc-amber-live 2s infinite;
    }

    /* SCANNING LINE */

    .sc-amber-sweep {
        position: absolute;
        top: -45%;
        left: 0;
        width: 100%;
        height: 30%;
        opacity: 0;
        background: linear-gradient(
            180deg,
            transparent,
            rgba(255, 179, 71, .045),
            rgba(255, 179, 71, .12),
            transparent
        );
        transform: translateY(-100%);
    }

    .sc-amber-target.sc-amber-boot .sc-amber-sweep {
        animation: sc-amber-scan 1.8s ease-out 1;
    }

    /* FINE GRID */

    .sc-amber-grid {
        position: absolute;
        inset: 0;
        opacity: .12;
        background-image:
            linear-gradient(rgba(255, 174, 65, .12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 174, 65, .12) 1px, transparent 1px);
        background-size: 24px 24px;
        mask-image: linear-gradient(
            135deg,
            black,
            transparent 85%
        );
    }

    /* SMALL CALIBRATION MARKS */

    .sc-amber-calibration {
        position: absolute;
        right: 12px;
        bottom: 12px;
        display: flex;
        align-items: center;
        gap: 3px;
        opacity: .35;
    }

    .sc-amber-calibration i {
        display: block;
        width: 3px;
        height: 7px;
        background: #ffb347;
        box-shadow: 0 0 4px rgba(255, 179, 71, .5);
    }

    .sc-amber-calibration i:nth-child(2),
    .sc-amber-calibration i:nth-child(5) {
        height: 11px;
    }

    /* HOVER RESPONSE */

    .sc-amber-target.sc-amber-focus .sc-amber-overlay {
        opacity: 1;
    }

    .sc-amber-target.sc-amber-focus .sc-amber-corner {
        width: 19px;
        height: 19px;
        opacity: 1;
    }

    .sc-amber-target.sc-amber-focus .sc-amber-id {
        color: #ffcf80;
        opacity: 1;
    }

    .sc-amber-target.sc-amber-focus {
        border-color: rgba(255, 179, 71, .65) !important;
        box-shadow:
            0 0 16px rgba(224, 132, 0, .13),
            inset 0 0 15px rgba(224, 132, 0, .045);
    }

    /* GLITCH EFFECT */

    .sc-amber-target.sc-amber-glitch {
        animation: sc-amber-glitch 280ms steps(2, end) 1;
    }

    .sc-amber-target.sc-amber-glitch .sc-amber-overlay {
        opacity: 1;
    }

    .sc-amber-target.sc-amber-glitch .sc-amber-grid {
        opacity: .45;
        transform: translateX(3px);
    }

    .sc-amber-target.sc-amber-glitch .sc-amber-id {
        color: #fff0c2;
        text-shadow:
            -2px 0 rgba(255, 90, 30, .8),
            2px 0 rgba(255, 210, 100, .8);
    }

    /* ALERT / ACTIVITY */

    .sc-amber-target.sc-amber-activity .sc-amber-id::before {
        animation: sc-amber-fast-blink .25s steps(2, end) 5;
    }

    /* HEADER SPECIAL TREATMENT */

    header.sc-amber-target .sc-amber-grid {
        opacity: .19;
        background-size: 32px 32px;
    }

    header.sc-amber-target .sc-amber-id {
        top: auto;
        bottom: 9px;
    }

    /* TELEMETRY SPECIAL TREATMENT */

    .telemetry-chart-panel.sc-amber-target .sc-amber-grid {
        opacity: .23;
        background-size: 18px 18px;
    }

    /* RECORDER SPECIAL TREATMENT */

    .recorder-panel.sc-amber-target .sc-amber-calibration {
        right: 16px;
        bottom: 10px;
    }

    /* EVENT LOG SPECIAL TREATMENT */

    .event-panel.sc-amber-target .sc-amber-id {
        color: rgba(255, 179, 71, .8);
    }

    /* ANIMATIONS */

    @keyframes sc-amber-live {
        0%, 100% {
            opacity: 1;
            box-shadow: 0 0 7px #e08400;
        }
        50% {
            opacity: .35;
            box-shadow: 0 0 2px #e08400;
        }
    }

    @keyframes sc-amber-scan {
        0% {
            opacity: 0;
            transform: translateY(-100%);
        }
        15% {
            opacity: .8;
        }
        85% {
            opacity: .45;
        }
        100% {
            opacity: 0;
            transform: translateY(480%);
        }
    }

    @keyframes sc-amber-glitch {
        0% {
            transform: translateX(0);
            filter: none;
        }
        20% {
            transform: translateX(-2px);
            filter: brightness(1.35);
        }
        40% {
            transform: translateX(2px);
            filter: contrast(1.2);
        }
        60% {
            transform: translateX(-1px);
            filter: brightness(.8);
        }
        100% {
            transform: translateX(0);
            filter: none;
        }
    }

    @keyframes sc-amber-fast-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: .15; }
    }

    /* REDUCED MOTION */

    @media (prefers-reduced-motion: reduce) {
        .sc-amber-overlay *,
        .sc-amber-overlay::before,
        .sc-amber-target {
            animation: none !important;
            transition: none !important;
        }
    }
    `;

    /* -----------------------------------------------------
       UTILITIES
    ----------------------------------------------------- */

    function addTimer(callback, delay) {
        const timer = window.setTimeout(() => {
            timers.delete(timer);
            if (!destroyed) callback();
        }, delay);

        timers.add(timer);
        return timer;
    }

    function randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function injectStyles() {
        if (document.getElementById("sc-amber-styles")) return;

        const style = document.createElement("style");
        style.id = "sc-amber-styles";
        style.textContent = css;

        document.head.appendChild(style);
    }

    function createElement(className, parent, tag = "span") {
        const element = document.createElement(tag);
        element.className = className;
        parent.appendChild(element);
        return element;
    }

    /* -----------------------------------------------------
       MODULE INITIALIZATION
    ----------------------------------------------------- */

    function initializeModule(element, module) {
        if (!element || initialized.has(element)) return;

        initialized.add(element);

        element.classList.add("sc-amber-target");

        const overlay = createElement(
            "sc-amber-overlay",
            element
        );

        createElement("sc-amber-grid", overlay);
        createElement("sc-amber-sweep", overlay);

        const id = createElement("sc-amber-id", overlay);
        id.textContent = `${module.code} / ${module.label}`;

        ["tl", "tr", "bl", "br"].forEach(position => {
            createElement(
                `sc-amber-corner ${position}`,
                overlay
            );
        });

        const calibration = createElement(
            "sc-amber-calibration",
            overlay
        );

        for (let i = 0; i < 6; i++) {
            createElement("", calibration, "i");
        }

        /* Boot animation, staggered by module */

        addTimer(() => {
            if (!element.isConnected) return;

            element.classList.add("sc-amber-boot");

            addTimer(() => {
                element.classList.remove("sc-amber-boot");
            }, CONFIG.scanDuration);
        }, randomBetween(100, 700));

        /* Hover interaction */

        if (CONFIG.enableHover) {
            element.addEventListener("pointerenter", () => {
                element.classList.add("sc-amber-focus");
            });

            element.addEventListener("pointerleave", () => {
                element.classList.remove("sc-amber-focus");
            });
        }

        /* Clean up if module is removed */

        if (element.isConnected) {
            observeVisibility(element);
        }
    }

    /* -----------------------------------------------------
       DYNAMIC TARGET DETECTION
    ----------------------------------------------------- */

    function initializeTargets() {
        MODULES.forEach(module => {
            document.querySelectorAll(module.selector).forEach(element => {
                initializeModule(element, module);
            });
        });
    }

    /* -----------------------------------------------------
       VISIBILITY OPTIMIZATION
    ----------------------------------------------------- */

    let intersectionObserver = null;

    function observeVisibility(element) {
        if (!("IntersectionObserver" in window)) return;

        if (!intersectionObserver) {
            intersectionObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    entry.target.classList.toggle(
                        "sc-amber-visible",
                        entry.isIntersecting
                    );
                });
            }, {
                threshold: 0.05
            });
        }

        intersectionObserver.observe(element);
    }

    /* -----------------------------------------------------
       RANDOM GLITCH SYSTEM
    ----------------------------------------------------- */

    function triggerGlitch() {
        if (
            destroyed ||
            !CONFIG.enableGlitches ||
            reducedMotion.matches ||
            document.hidden
        ) return;

        const elements = MODULES.flatMap(module =>
            Array.from(document.querySelectorAll(module.selector))
        ).filter(element =>
            element.isConnected &&
            element.classList.contains("sc-amber-visible")
        );

        if (!elements.length) return;

        const element = elements[
            randomBetween(0, elements.length - 1)
        ];

        element.classList.add("sc-amber-glitch");

        addTimer(() => {
            element.classList.remove("sc-amber-glitch");
        }, 350);
    }

    function scheduleGlitch() {
        if (glitchTimer) {
            clearTimeout(glitchTimer);
            timers.delete(glitchTimer);
        }

        if (
            destroyed ||
            !CONFIG.enableGlitches ||
            reducedMotion.matches
        ) return;

        glitchTimer = addTimer(() => {
            triggerGlitch();
            scheduleGlitch();
        }, randomBetween(CONFIG.glitchMin, CONFIG.glitchMax));
    }

    /* -----------------------------------------------------
       ACTIVITY SIMULATION
    ----------------------------------------------------- */

    function simulateActivity() {
        if (destroyed || document.hidden || reducedMotion.matches) return;

        const targets = [
            ".recorder-panel",
            ".diagnostics-panel",
            ".monitor-panel",
            ".event-panel",
            ".telemetry-chart-panel"
        ];

        const selector = targets[
            randomBetween(0, targets.length - 1)
        ];

        const element = document.querySelector(selector);

        if (!element || !element.isConnected) return;

        element.classList.add("sc-amber-activity");

        addTimer(() => {
            element.classList.remove("sc-amber-activity");
        }, 1400);
    }

    let activityTimer = null;

    function scheduleActivity() {
        if (activityTimer) {
            clearTimeout(activityTimer);
            timers.delete(activityTimer);
        }

        if (destroyed || reducedMotion.matches) return;

        activityTimer = addTimer(() => {
            simulateActivity();
            scheduleActivity();
        }, randomBetween(5000, 9500));
    }

    /* -----------------------------------------------------
       MUTATION OBSERVER
    ----------------------------------------------------- */

    function observeDOM() {
        if (mutationObserver) return;

        mutationObserver = new MutationObserver(() => {
            initializeTargets();
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /* -----------------------------------------------------
       VISIBILITY / PERFORMANCE
    ----------------------------------------------------- */

    function handleVisibility() {
        if (document.hidden) {
            if (glitchTimer) clearTimeout(glitchTimer);
            if (activityTimer) clearTimeout(activityTimer);

            timers.clear();
            glitchTimer = null;
            activityTimer = null;
        } else {
            scheduleGlitch();
            scheduleActivity();
        }
    }

    function handleMotionChange() {
        if (reducedMotion.matches) {
            document.querySelectorAll(".sc-amber-glitch").forEach(element => {
                element.classList.remove("sc-amber-glitch");
            });

            scheduleGlitch();
            scheduleActivity();
        } else {
            scheduleGlitch();
            scheduleActivity();
        }
    }

    /* -----------------------------------------------------
       PUBLIC API
    ----------------------------------------------------- */

    function destroy() {
        if (destroyed) return;

        destroyed = true;

        if (mutationObserver) mutationObserver.disconnect();
        if (intersectionObserver) intersectionObserver.disconnect();

        if (glitchTimer) clearTimeout(glitchTimer);
        if (activityTimer) clearTimeout(activityTimer);

        timers.forEach(timer => clearTimeout(timer));
        timers.clear();

        document.querySelectorAll(".sc-amber-target").forEach(element => {
            element.classList.remove(
                "sc-amber-target",
                "sc-amber-boot",
                "sc-amber-focus",
                "sc-amber-glitch",
                "sc-amber-activity",
                "sc-amber-visible"
            );

            element.querySelectorAll(":scope > .sc-amber-overlay").forEach(overlay => {
                overlay.remove();
            });
        });

        document.getElementById("sc-amber-styles")?.remove();

        delete window.STAR_CITIZEN;
    }

    function refresh() {
        initializeTargets();
    }

    /* -----------------------------------------------------
       START SYSTEM
    ----------------------------------------------------- */

    function start() {
        if (destroyed) return;

        injectStyles();
        initializeTargets();
        observeDOM();

        scheduleGlitch();
        scheduleActivity();

        document.addEventListener("visibilitychange", handleVisibility);
        reducedMotion.addEventListener?.("change", handleMotionChange);

        window.STAR_CITIZEN = {
            refresh,
            destroy,

            glitch(selector) {
                const element = document.querySelector(selector);

                if (!element) return false;

                element.classList.add("sc-amber-glitch");

                addTimer(() => {
                    element.classList.remove("sc-amber-glitch");
                }, 350);

                return true;
            },

            activity(selector) {
                const element = document.querySelector(selector);

                if (!element) return false;

                element.classList.add("sc-amber-activity");

                addTimer(() => {
                    element.classList.remove("sc-amber-activity");
                }, 1400);

                return true;
            }
        };

        console.info(
            "%c STAR CITIZEN // AMBER FLIGHT SYSTEM ONLINE ",
            "background:#1b1008;color:#ffb347;padding:5px 9px;border:1px solid #88551f;"
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

})();
