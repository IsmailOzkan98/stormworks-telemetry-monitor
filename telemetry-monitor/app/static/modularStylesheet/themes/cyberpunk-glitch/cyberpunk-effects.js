
"use strict";

/* =========================================================
   CYBERPUNK GLITCH — EFFECTS
   Panel Effects / Glitch / RGB / Neon / Interference
   ========================================================= */

export function createEffects(CONFIG, state) {

    const activeGlitches = new Set();
    const activeEffects = new Map();

    let observer = null;
    let reducedMotion = false;

    const STYLE_ID = CONFIG.selectors.style;


    /* =====================================================
       01. UTILITIES
    ===================================================== */

    const randomInt = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;


    function getTargets() {

        return [
            ...new Set(
                CONFIG.targets.flatMap(selector =>
                    Array.from(
                        document.querySelectorAll(selector)
                    )
                )
            )
        ];

    }


    function getAvailableTargets() {

        return getTargets().filter(element =>
            element.isConnected &&
            !activeGlitches.has(element)
        );

    }


    function selectTarget(target) {

        if (
            target instanceof Element &&
            target.isConnected
        ) {
            return target;
        }

        const available = getTargets();

        if (!available.length) return null;

        return available[
            randomInt(0, available.length - 1)
        ];

    }


    /* =====================================================
       02. DYNAMIC CSS
    ===================================================== */

    function injectStyles() {

        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");

        style.id = STYLE_ID;

        style.textContent = `

            /* NEON PANELS */

            header,
            .recorder-panel,
            .diagnostics-panel,
            .monitor-panel,
            .event-panel,
            .telemetry-chart-panel {

                position: relative;
                isolation: isolate;

                transition:
                    border-color .25s ease,
                    box-shadow .25s ease,
                    filter .25s ease;

            }

            .gr-neon-active {

                border-color: rgba(27,199,251,.8) !important;

                box-shadow:
                    0 0 5px rgba(27,199,251,.3),
                    0 0 15px rgba(27,199,251,.15),
                    0 0 30px rgba(224,40,125,.12),
                    inset 0 0 15px rgba(27,199,251,.035) !important;

            }


            /* NEON TEXT */

            .gr-neon-text {

                text-shadow:
                    0 0 3px #fff,
                    0 0 7px rgba(27,199,251,.9),
                    0 0 14px rgba(27,199,251,.7),
                    2px 0 rgba(224,40,125,.8),
                    -2px 0 rgba(27,199,251,.8) !important;

                animation: grTextGlow 3s ease-in-out infinite alternate;

            }

            @keyframes grTextGlow {

                from { filter: brightness(.9); }
                to { filter: brightness(1.3); }

            }


            /* GLITCH */

            .fx-glitch-active {

                animation: grPanelGlitch .32s steps(2,end) both !important;

                filter: brightness(1.35) saturate(1.7);

            }

            .fx-glitch-active::before {

                content: "";

                position: absolute;
                inset: 0;

                z-index: 20;

                pointer-events: none;

                background:
                    repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 5px,
                        rgba(27,199,251,.16) 6px,
                        transparent 8px
                    );

                mix-blend-mode: screen;

                animation: grGlitchOverlay .32s steps(3,end);

            }

            .fx-glitch-active::after {

                content: "";

                position: absolute;
                left: 0;
                right: 0;
                top: 30%;
                height: 12%;

                z-index: 21;

                pointer-events: none;

                background:
                    linear-gradient(
                        90deg,
                        transparent,
                        rgba(27,199,251,.35),
                        rgba(224,40,125,.5),
                        transparent
                    );

                animation: grGlitchSweep .32s steps(3,end);

            }

            @keyframes grPanelGlitch {

                0% {
                    transform: translateX(0);
                    clip-path: inset(0);
                }

                15% {
                    transform: translateX(-3px);
                    clip-path: inset(10% 0 70% 0);
                }

                35% {
                    transform: translateX(3px);
                    clip-path: inset(45% 0 30% 0);
                }

                55% {
                    transform: translateX(-2px);
                    clip-path: inset(75% 0 8% 0);
                }

                75% {
                    transform: translateX(2px);
                    clip-path: inset(20% 0 60% 0);
                }

                100% {
                    transform: translateX(0);
                    clip-path: inset(0);
                }

            }

            @keyframes grGlitchOverlay {

                0%,100% {
                    opacity: 0;
                    transform: translateX(0);
                }

                25% {
                    opacity: .9;
                    transform: translateX(-4px);
                }

                50% {
                    opacity: .4;
                    transform: translateX(4px);
                }

                75% {
                    opacity: .8;
                    transform: translateX(-2px);
                }

            }

            @keyframes grGlitchSweep {

                0% {
                    top: 0%;
                    opacity: 0;
                }

                30% {
                    top: 40%;
                    opacity: 1;
                }

                60% {
                    top: 75%;
                    opacity: .8;
                }

                100% {
                    top: 100%;
                    opacity: 0;
                }

            }


            /* NEON FLASH */

            .fx-neon-flash {
                animation: grNeonFlash .65s ease-out both !important;
            }

            @keyframes grNeonFlash {

                0%,100% {
                    filter: brightness(1);
                }

                25% {
                    filter: brightness(1.8);

                    box-shadow:
                        0 0 8px rgba(27,199,251,.8),
                        0 0 25px rgba(27,199,251,.5),
                        0 0 40px rgba(224,40,125,.35);
                }

                55% {
                    filter: brightness(1.3);

                    box-shadow:
                        0 0 12px rgba(224,40,125,.5),
                        0 0 25px rgba(139,53,255,.3);
                }

            }


            /* SIGNAL INTERFERENCE */

            .gr-signal-interference {
                animation: grSignalInterference .5s steps(2,end) both;
            }

            @keyframes grSignalInterference {

                0%,100% { opacity: 1; }

                20% {
                    opacity: .65;
                    filter: hue-rotate(90deg);
                }

                40% {
                    opacity: .95;
                    filter: contrast(1.5);
                }

                60% {
                    opacity: .55;
                    filter: brightness(1.7);
                }

                80% {
                    opacity: 1;
                    filter: hue-rotate(-60deg);
                }

            }


            /* CHROMATIC ABERRATION */

            .gr-chromatic-distortion {
                animation: grChromaticDistortion .25s steps(2,end);
            }

            @keyframes grChromaticDistortion {

                0%,100% {
                    filter: none;
                    transform: translateX(0);
                }

                25% {
                    filter: drop-shadow(3px 0 rgba(27,199,251,.4));
                    transform: translateX(-2px);
                }

                50% {
                    filter: drop-shadow(-3px 0 rgba(224,40,125,.4));
                    transform: translateX(2px);
                }

                75% {
                    filter: contrast(1.2);
                    transform: translateX(-1px);
                }

            }


            /* SCREEN FLICKER */

            .gr-screen-flicker {
                animation: grScreenFlicker .4s steps(2,end);
            }

            @keyframes grScreenFlicker {

                0%,100% { opacity: 1; }
                20% { opacity: .65; }
                40% { opacity: .95; }
                60% { opacity: .75; }
                80% { opacity: 1; }

            }


            /* DATA CORRUPTION */

            .gr-data-corruption {
                animation: grDataCorruption .35s steps(3,end);
            }

            @keyframes grDataCorruption {

                0%,100% {
                    transform: translateX(0);
                    filter: none;
                }

                25% {
                    transform: translateX(3px);
                    filter: hue-rotate(70deg) contrast(1.5);
                }

                50% {
                    transform: translateX(-3px);
                    filter: invert(.12);
                }

                75% {
                    transform: translateX(1px);
                    filter: saturate(2);
                }

            }


            /* ENERGY PULSE */

            .gr-energy-pulse {
                animation: grEnergyPulse .8s ease-in-out;
            }

            @keyframes grEnergyPulse {

                0%,100% {
                    box-shadow: none;
                }

                50% {
                    box-shadow:
                        0 0 10px rgba(27,199,251,.65),
                        0 0 30px rgba(139,53,255,.35),
                        inset 0 0 15px rgba(27,199,251,.12);
                }

            }


            /* ACCESSIBILITY */

            @media (prefers-reduced-motion: reduce) {

                .gr-neon-text,
                .fx-glitch-active,
                .fx-neon-flash,
                .gr-signal-interference,
                .gr-chromatic-distortion,
                .gr-screen-flicker,
                .gr-data-corruption,
                .gr-energy-pulse {
                    animation: none !important;
                }

            }

        `;

        document.head.appendChild(style);

    }


    /* =====================================================
       03. TARGET INITIALIZATION
    ===================================================== */

    function initializePanels() {

        getTargets().forEach(element => {

            element.classList.add("gr-neon-active");

        });

    }


    function initializeNeonText() {

        const selectors = [

            "header h1",
            ".section-header",
            ".monitor-title",
            ".diagnostic-header",
            ".event-header",
            ".telemetry-chart-header"

        ];

        selectors.forEach(selector => {

            document.querySelectorAll(selector).forEach(element => {

                element.classList.add("gr-neon-text");

            });

        });

    }


    function refresh() {

        initializePanels();

        initializeNeonText();

    }


    /* =====================================================
       04. EFFECT MANAGEMENT
    ===================================================== */

    function removeEffect(element, className) {

        if (!element) return;

        element.classList.remove(className);

        const timer = activeEffects.get(element);

        if (timer) {

            window.clearTimeout(timer);

            activeEffects.delete(element);

        }

        activeGlitches.delete(element);

    }


    function applyEffect(element, className, duration) {

        if (!element || !element.isConnected) return false;

        const previousTimer = activeEffects.get(element);

        if (previousTimer) {
            window.clearTimeout(previousTimer);
        }

        element.classList.remove(className);

        // Reinicia la animación CSS.
        void element.offsetWidth;

        element.classList.add(className);

        const timer = window.setTimeout(() => {

            element.classList.remove(className);

            activeEffects.delete(element);

            activeGlitches.delete(element);

        }, duration);

        activeEffects.set(element, timer);

        return true;

    }


    /* =====================================================
       05. GLITCH
    ===================================================== */

    function glitch(target) {

        if (
            !CONFIG.effects.glitch ||
            reducedMotion ||
            document.hidden
        ) return false;

        if (
            activeGlitches.size >=
            CONFIG.effects.maxActiveGlitches
        ) return false;

        const available = getAvailableTargets();

        const element = target || (
            available.length
                ? available[randomInt(0, available.length - 1)]
                : null
        );

        if (
            !element ||
            !element.isConnected ||
            activeGlitches.has(element)
        ) return false;

        activeGlitches.add(element);

        state.counters.glitches++;

        return applyEffect(
            element,
            "fx-glitch-active",
            CONFIG.effects.glitchDuration
        );

    }


    /* =====================================================
       06. FLASH
    ===================================================== */

    function flash(target) {

        if (
            !CONFIG.effects.panelFlash ||
            reducedMotion ||
            document.hidden
        ) return false;

        const element = selectTarget(target);

        if (!element) return false;

        state.counters.flashes++;

        return applyEffect(
            element,
            "fx-neon-flash",
            750
        );

    }


    /* =====================================================
       07. SIGNAL INTERFERENCE
    ===================================================== */

    function signal(target) {

        if (
            !CONFIG.effects.signalInterference ||
            reducedMotion ||
            document.hidden
        ) return false;

        const element = selectTarget(target);

        if (!element) return false;

        state.counters.signals++;

        return applyEffect(
            element,
            "gr-signal-interference",
            550
        );

    }


    /* =====================================================
       08. ADDITIONAL EFFECTS
    ===================================================== */

    function chromatic(target) {

        if (
            !CONFIG.effects.chromaticDistortion ||
            reducedMotion
        ) return false;

        return applyEffect(
            selectTarget(target),
            "gr-chromatic-distortion",
            300
        );

    }


    function flicker(target) {

        if (
            !CONFIG.effects.screenFlicker ||
            reducedMotion
        ) return false;

        return applyEffect(
            selectTarget(target),
            "gr-screen-flicker",
            450
        );

    }


    function corruption(target) {

        if (
            !CONFIG.effects.dataCorruption ||
            reducedMotion
        ) return false;

        return applyEffect(
            selectTarget(target),
            "gr-data-corruption",
            400
        );

    }


    function energyPulse(target) {

        if (
            !CONFIG.effects.energyPulse ||
            reducedMotion
        ) return false;

        return applyEffect(
            selectTarget(target),
            "gr-energy-pulse",
            850
        );

    }


    /* =====================================================
       09. DOM OBSERVER
    ===================================================== */

    function initializeObserver() {

        if (
            !CONFIG.performance.observeDOM ||
            !window.MutationObserver
        ) return;

        observer = new MutationObserver(() => {

            refresh();

        });

        observer.observe(document.body, {

            childList: true,
            subtree: true

        });

    }


    /* =====================================================
       10. ACCESSIBILITY
    ===================================================== */

    function setReducedMotion(value) {

        reducedMotion = value;

        if (value) {
            clear();
        }

    }


    /* =====================================================
       11. CLEAR
    ===================================================== */

    function clear() {

        activeEffects.forEach((timer, element) => {

            window.clearTimeout(timer);

            element.classList.remove(
                "fx-glitch-active",
                "fx-neon-flash",
                "gr-signal-interference",
                "gr-chromatic-distortion",
                "gr-screen-flicker",
                "gr-data-corruption",
                "gr-energy-pulse"
            );

        });

        activeEffects.clear();

        activeGlitches.clear();

    }


    /* =====================================================
       12. INITIALIZE
    ===================================================== */

    function initialize() {

        injectStyles();

        refresh();

        initializeObserver();

    }


    /* =====================================================
       13. DESTROY
    ===================================================== */

    function destroy() {

        clear();

        observer?.disconnect();

        observer = null;

        document.querySelectorAll(
            ".gr-neon-active, .gr-neon-text"
        ).forEach(element => {

            element.classList.remove(
                "gr-neon-active",
                "gr-neon-text"
            );

        });

        document.getElementById(STYLE_ID)?.remove();

    }


    /* =====================================================
       14. PUBLIC INTERFACE
    ===================================================== */

    return {

        initialize,
        refresh,
        destroy,
        clear,

        glitch,
        flash,
        signal,

        chromatic,
        flicker,
        corruption,
        energyPulse,

        setReducedMotion,

        get activeCount() {
            return activeGlitches.size;
        }

    };

}
