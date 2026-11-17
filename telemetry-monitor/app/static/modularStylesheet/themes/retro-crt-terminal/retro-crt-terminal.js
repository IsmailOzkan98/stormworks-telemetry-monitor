
/*
 * RETRO CRT TERMINAL ENGINE
 *
 * Version: 5.0.0
 * Vintage analog CRT simulation
 * Green phosphor / analog television signal
 *
 * Files:
 *   retro-crt-terminal.js
 *   retro-crt-styles.js
 *   retro-crt-noise.js
 *
 * Load:
 *   <script type="module" src="./retro-crt-terminal.js"></script>
 */

import { CRT_STYLES } from "./retro-crt-styles.js";
import { createCRTNoise } from "./retro-crt-noise.js";

(() => {
    "use strict";

    if (window.__RETRO_CRT_CORE__) return;

    /* =====================================
       CONFIGURATION
    ===================================== */

    const CONFIG = {
        enabled: true,
        debug: false,

        targets: [
            "header",
            ".recorder-panel",
            ".diagnostics-panel",
            ".monitor-panel",
            ".event-panel",
            ".telemetry-chart-panel"
        ],

        screen: {
            opacity: 1,
            zIndex: 9997,
            scanlines: true,
            secondaryScanlines: true,
            rollingBar: true,
            bloom: true,
            reflection: true,
            mask: true,
            vignette: true,
            interference: true,
            noise: true,
            tears: true,
            staticBurst: true
        },

        phosphor: {
            enabled: true,
            color: "57,255,20",
            glow: 0.2
        },

        noise: {
            particles: 420,
            opacity: 0.12,
            updateInterval: 65
        },

        flicker: {
            enabled: true,
            speed: 7,
            intensity: 0.025
        },

        rolling: {
            enabled: true,
            speed: 13
        },

        interference: {
            enabled: true,
            interval: [7000, 16000],
            duration: 450,
            chance: 0.58
        },

        tearing: {
            enabled: true,
            interval: [3500, 9000],
            chance: 0.45
        },

        staticBurst: {
            enabled: true,
            interval: [8000, 18000],
            chance: 0.30
        },

        performance: {
            maxFPS: 30,
            pauseWhenHidden: true,
            respectReducedMotion: true
        }
    };

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    /* =====================================
       STATE
    ===================================== */

    const state = {
        initialized: false,
        running: false,
        destroyed: false,

        screen: null,
        style: null,

        noiseCanvas: null,
        noise: null,

        interference: null,
        tear: null,
        staticLayer: null,

        targets: new Set(),

        frame: null,
        lastRender: 0,
        lastNoise: 0,

        width: 0,
        height: 0,

        timers: new Set(),
        listeners: [],
        observer: null,

        stats: {
            frames: 0,
            noiseFrames: 0,
            interferences: 0,
            tears: 0,
            staticBursts: 0
        }
    };

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    const randomInt = (min, max) =>
        Math.floor(random(min, max));

    const motionReduced = () =>
        CONFIG.performance.respectReducedMotion &&
        reducedMotion.matches;

    const log = (...args) => {
        if (CONFIG.debug) {
            console.log("[RETRO CRT]", ...args);
        }
    };

    /* =====================================
       EVENT MANAGEMENT
    ===================================== */

    function listen(target, event, callback, options) {
        target.addEventListener(event, callback, options);

        state.listeners.push({
            target,
            event,
            callback,
            options
        });
    }

    function later(callback, delay) {
        const timer = setTimeout(() => {
            state.timers.delete(timer);
            callback();
        }, delay);

        state.timers.add(timer);
        return timer;
    }

    function clearTimers() {
        state.timers.forEach(clearTimeout);
        state.timers.clear();
    }

    /* =====================================
       STYLE INJECTION
    ===================================== */

    function injectStyles() {
        if (document.getElementById("retro-crt-engine-styles")) {
            state.style = document.getElementById(
                "retro-crt-engine-styles"
            );
            return;
        }

        const style = document.createElement("style");

        style.id = "retro-crt-engine-styles";
        style.textContent = CRT_STYLES;

        document.head.appendChild(style);

        state.style = style;
    }

    /* =====================================
       SCREEN CONSTRUCTION
    ===================================== */

    function addLayer(className) {
        const layer = document.createElement("div");

        layer.className = className;
        layer.setAttribute("aria-hidden", "true");

        state.screen.appendChild(layer);

        return layer;
    }

    function createScreen() {
        if (state.screen) return;

        const screen = document.createElement("div");

        screen.className = "retro-crt-screen";
        screen.setAttribute("aria-hidden", "true");

        screen.style.zIndex = CONFIG.screen.zIndex;
        screen.style.opacity = CONFIG.screen.opacity;

        state.screen = screen;

        if (CONFIG.screen.scanlines) {
            addLayer("retro-crt-scanlines");
        }

        if (CONFIG.screen.secondaryScanlines) {
            addLayer("retro-crt-scanlines-secondary");
        }

        if (CONFIG.screen.rollingBar) {
            addLayer("retro-crt-rolling");
        }

        if (CONFIG.screen.bloom) {
            addLayer("retro-crt-bloom");
        }

        if (CONFIG.screen.mask) {
            addLayer("retro-crt-mask");
        }

        if (CONFIG.screen.reflection) {
            addLayer("retro-crt-reflection");
        }

        if (CONFIG.screen.vignette) {
            addLayer("retro-crt-vignette");
        }

        state.interference = addLayer(
            "retro-crt-interference"
        );

        state.tear = addLayer(
            "retro-crt-tear"
        );

        state.staticLayer = addLayer(
            "retro-crt-static"
        );

        if (CONFIG.screen.noise) {
            const canvas = document.createElement("canvas");

            canvas.className = "retro-crt-noise";
            canvas.setAttribute("aria-hidden", "true");

            screen.appendChild(canvas);

            state.noiseCanvas = canvas;

            state.noise = createCRTNoise(canvas, {
                particles: CONFIG.noise.particles
            });
        }

        document.body.appendChild(screen);

        resize();

        if (CONFIG.flicker.enabled && !motionReduced()) {
            screen.classList.add("retro-crt-flicker");
        }
    }

    /* =====================================
       RESIZE
    ===================================== */

    function resize() {
        state.width = window.innerWidth;
        state.height = window.innerHeight;

        state.noise?.resize(
            state.width,
            state.height
        );
    }

    /* =====================================
       PHOSPHOR TARGETS
    ===================================== */

    function refreshTargets() {
        if (!CONFIG.phosphor.enabled) return;

        const found = new Set();

        CONFIG.targets.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                found.add(element);
            });
        });

        state.targets.forEach(element => {
            if (!found.has(element)) {
                element.classList.remove(
                    "retro-crt-phosphor"
                );

                state.targets.delete(element);
            }
        });

        found.forEach(element => {
            if (!state.targets.has(element)) {
                element.classList.add(
                    "retro-crt-phosphor"
                );

                state.targets.add(element);
            }
        });

        log("Phosphor targets:", state.targets.size);
    }

    /* =====================================
       ANALOG NOISE
    ===================================== */

    function drawNoise() {
        if (!state.noise) return;

        state.noise.draw();

        state.stats.noiseFrames++;
    }

    /* =====================================
       ANALOG INTERFERENCE
    ===================================== */

    function interference() {
        if (
            !state.running ||
            motionReduced() ||
            !state.interference
        ) return API;

        const element = state.interference;

        element.classList.remove("active");

        void element.offsetWidth;

        element.classList.add("active");

        state.stats.interferences++;

        later(() => {
            element.classList.remove("active");
        }, CONFIG.interference.duration + 100);

        log("Signal interference");

        return API;
    }

    /* =====================================
       HORIZONTAL SYNC TEARING
    ===================================== */

    function tear() {
        if (
            !state.running ||
            motionReduced() ||
            !state.tear
        ) return API;

        const element = state.tear;

        element.style.top = random(5, 95) + "%";
        element.style.height = random(1, 4) + "px";

        element.classList.remove("active");

        void element.offsetWidth;

        element.classList.add("active");

        state.stats.tears++;

        later(() => {
            element.classList.remove("active");
        }, 250);

        log("Horizontal sync tear");

        return API;
    }

    /* =====================================
       STATIC BURST
    ===================================== */

    function staticBurst() {
        if (
            !state.running ||
            motionReduced() ||
            !state.staticLayer
        ) return API;

        const element = state.staticLayer;

        element.classList.remove("active");

        void element.offsetWidth;

        element.classList.add("active");

        state.stats.staticBursts++;

        later(() => {
            element.classList.remove("active");
        }, 200);

        log("Static burst");

        return API;
    }

    /* =====================================
       RANDOM EFFECT SCHEDULER
    ===================================== */

    function scheduleEffect(callback, config) {
        if (
            !state.running ||
            motionReduced() ||
            !config.enabled
        ) return;

        const delay = randomInt(
            config.interval[0],
            config.interval[1]
        );

        later(() => {
            if (!state.running) return;

            if (Math.random() < config.chance) {
                callback();
            }

            scheduleEffect(callback, config);

        }, delay);
    }

    function scheduleEffects() {
        clearTimers();

        if (!state.running || motionReduced()) return;

        scheduleEffect(
            interference,
            CONFIG.interference
        );

        scheduleEffect(
            tear,
            CONFIG.tearing
        );

        scheduleEffect(
            staticBurst,
            CONFIG.staticBurst
        );
    }

    /* =====================================
       RENDER LOOP
    ===================================== */

    function render(timestamp) {
        if (!state.running) return;

        state.frame = requestAnimationFrame(render);

        if (motionReduced()) return;

        const interval = 1000 / CONFIG.performance.maxFPS;

        if (timestamp - state.lastRender < interval) {
            return;
        }

        state.lastRender = timestamp;

        state.stats.frames++;

        if (
            CONFIG.screen.noise &&
            timestamp - state.lastNoise >=
                CONFIG.noise.updateInterval
        ) {
            state.lastNoise = timestamp;

            drawNoise();
        }
    }

    /* =====================================
       EVENTS
    ===================================== */

    function setupEvents() {
        listen(window, "resize", resize, {
            passive: true
        });

        listen(document, "visibilitychange", () => {
            if (!CONFIG.performance.pauseWhenHidden) {
                return;
            }

            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });

        listen(reducedMotion, "change", () => {
            if (motionReduced()) {
                state.screen?.classList.remove(
                    "retro-crt-flicker"
                );

                clearTimers();

                state.interference?.classList.remove("active");
                state.tear?.classList.remove("active");
                state.staticLayer?.classList.remove("active");

            } else if (state.running) {
                state.screen?.classList.toggle(
                    "retro-crt-flicker",
                    CONFIG.flicker.enabled
                );

                scheduleEffects();
            }
        });

        if ("MutationObserver" in window) {
            state.observer = new MutationObserver(() => {
                refreshTargets();
            });

            state.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    /* =====================================
       LIFECYCLE
    ===================================== */

    function start() {
        if (state.running || state.destroyed) {
            return API;
        }

        if (document.hidden &&
            CONFIG.performance.pauseWhenHidden) {
            return API;
        }

        state.running = true;

        injectStyles();
        createScreen();
        refreshTargets();

        if (!motionReduced()) {
            state.screen?.classList.toggle(
                "retro-crt-flicker",
                CONFIG.flicker.enabled
            );

            scheduleEffects();
        }

        if (!state.frame) {
            state.lastRender = 0;
            state.lastNoise = 0;

            state.frame = requestAnimationFrame(render);
        }

        log("RETRO CRT TERMINAL ONLINE");

        return API;
    }

    function stop() {
        state.running = false;

        if (state.frame) {
            cancelAnimationFrame(state.frame);
            state.frame = null;
        }

        clearTimers();

        state.screen?.classList.remove(
            "retro-crt-flicker"
        );

        state.interference?.classList.remove("active");
        state.tear?.classList.remove("active");
        state.staticLayer?.classList.remove("active");

        log("CRT PAUSED");

        return API;
    }

    function restart() {
        stop();

        return start();
    }

    function initialize() {
        if (state.initialized || state.destroyed) {
            return API;
        }

        state.initialized = true;

        injectStyles();
        setupEvents();

        if (CONFIG.enabled) {
            start();
        }

        log("RETRO CRT ENGINE v5.0.0 INITIALIZED");

        return API;
    }

    function destroy() {
        stop();

        state.observer?.disconnect();
        state.observer = null;

        state.listeners.forEach(({
            target,
            event,
            callback,
            options
        }) => {
            target.removeEventListener(
                event,
                callback,
                options
            );
        });

        state.listeners = [];

        state.targets.forEach(element => {
            element.classList.remove(
                "retro-crt-phosphor"
            );
        });

        state.targets.clear();

        state.noise?.destroy();

        state.screen?.remove();

        state.style?.remove();

        state.screen = null;
        state.style = null;
        state.noise = null;
        state.noiseCanvas = null;

        state.interference = null;
        state.tear = null;
        state.staticLayer = null;

        state.initialized = false;
        state.destroyed = true;

        delete window.__RETRO_CRT_CORE__;
        delete window.RetroCRT;

        log("CRT ENGINE DESTROYED");

        return API;
    }

    /* =====================================
       PUBLIC API
    ===================================== */

    const API = {
        version: "5.0.0",

        initialize,
        start,
        stop,
        restart,
        destroy,

        refresh: refreshTargets,

        interference,
        tear,
        staticBurst,

        get running() {
            return state.running;
        },

        get stats() {
            return { ...state.stats };
        },

        get config() {
            return CONFIG;
        }
    };

    window.__RETRO_CRT_CORE__ = API;
    window.RetroCRT = API;

    /* =====================================
       AUTO BOOT
    ===================================== */

    function boot() {
        if (CONFIG.enabled) {
            initialize();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            boot,
            { once: true }
        );
    } else {
        boot();
    }

})();
