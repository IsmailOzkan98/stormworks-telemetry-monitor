
"use strict";

/* =========================================================
   CYBERPUNK GLITCH ENGINE
   Version: 2.0.0
   Architecture: Modular / Canvas / Dynamic CSS
   ========================================================= */

import { createRenderer } from "./cyberpunk-renderer.js";
import { createEffects } from "./cyberpunk-effects.js";
import { createAtmosphere } from "./cyberpunk-atmosphere.js";


/* =========================================================
   01. IDENTIFICATION
========================================================= */

const VERSION = "2.0.0";
const ENGINE_NAME = "CyberpunkGlitchEngine";


/* =========================================================
   02. CONFIGURATION
========================================================= */

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

    canvas: {
        id: "gr-retrowave-canvas",
        zIndex: 0,
        opacity: 1,
        pixelRatio: 1.5
    },

    colors: {
        cyan: "#1bc7fb",
        pink: "#e0287d",
        purple: "#8b35ff",
        violet: "#b026ff",
        white: "#ffffff"
    },

    waves: {
        enabled: true,
        horizontalLines: 27,
        verticalLines: 49,
        speed: 0.00055,
        amplitude: 17,
        frequency: 0.19,
        secondaryAmplitude: 7,
        horizon: 0.39,
        perspective: 1.75,
        glow: 13,
        opacity: 0.75,
        pulseSpeed: 0.001
    },

    stars: {
        enabled: true,
        count: 100,
        speed: 0.018,
        maxSize: 1.8,
        opacity: 0.7
    },

    atmosphere: {
        enabled: true,
        scanlines: true,
        horizonGlow: true,
        ambientGlow: true,
        noise: true
    },

    advancedAtmosphere: {
        enabled: true,
        scanner: true,
        vignette: true,
        filmGrain: true,
        dataRain: true,
        floatingParticles: true,

        scannerSpeed: 14,
        rainOpacity: 0.22,
        particleCount: 45,
        particleSpeed: 0.12
    },

    effects: {
        glitch: true,
        glitchInterval: [3500, 8500],
        glitchDuration: 350,
        glitchIntensity: 1,

        panelFlash: true,
        panelFlashInterval: [5000, 11000],

        neonPulse: true,

        signalInterference: true,
        signalInterval: [9000, 16000],

        rgbSplit: true,
        chromaticDistortion: true,
        dataCorruption: true,
        screenFlicker: true,
        energyPulse: true,

        maxActiveGlitches: 2
    },

    performance: {
        maxFPS: 60,
        pauseWhenHidden: true,
        observeDOM: true,
        adaptiveQuality: true
    },

    selectors: {
        style: "gr-retrowave-styles"
    }

};


/* =========================================================
   03. STATE
========================================================= */

const state = {

    running: false,
    destroyed: false,
    initialized: false,

    animationFrame: null,
    lastFrame: 0,
    elapsed: 0,

    timers: new Set(),
    listeners: [],

    reducedMotion: false,

    quality: 1,

    renderer: null,
    effects: null,
    atmosphere: null,

    observer: null,

    counters: {
        frames: 0,
        glitches: 0,
        flashes: 0,
        signals: 0
    }

};


/* =========================================================
   04. UTILITIES
========================================================= */

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;


function log(...args) {

    if (CONFIG.debug) {
        console.log(`[${ENGINE_NAME}]`, ...args);
    }

}


function addTimer(callback, delay) {

    const timer = window.setTimeout(() => {

        state.timers.delete(timer);

        if (state.running && !state.destroyed) {
            callback();
        }

    }, delay);

    state.timers.add(timer);

    return timer;

}


function clearTimers() {

    state.timers.forEach(timer =>
        window.clearTimeout(timer)
    );

    state.timers.clear();

}


function listen(target, event, callback, options) {

    target.addEventListener(event, callback, options);

    state.listeners.push({
        target,
        event,
        callback,
        options
    });

}


function removeListeners() {

    state.listeners.forEach(item => {

        item.target.removeEventListener(
            item.event,
            item.callback,
            item.options
        );

    });

    state.listeners = [];

}


/* =========================================================
   05. ENVIRONMENT INITIALIZATION
========================================================= */

function initializeEnvironment() {

    state.renderer = createRenderer(CONFIG, state);

    state.atmosphere = createAtmosphere(CONFIG);

    state.effects = createEffects(CONFIG, state);


    state.atmosphere.initialize();

    state.renderer.initialize();

    state.effects.initialize();


    state.initialized = true;

    log("Environment initialized");

}


/* =========================================================
   06. ANIMATION LOOP
========================================================= */

function render(time) {

    if (!state.running || state.destroyed) return;

    const interval = 1000 / CONFIG.performance.maxFPS;

    if (time - state.lastFrame < interval) {

        state.animationFrame =
            requestAnimationFrame(render);

        return;

    }

    state.lastFrame = time;
    state.elapsed = time;

    state.renderer.render(time);

    state.counters.frames++;

    state.animationFrame =
        requestAnimationFrame(render);

}


/* =========================================================
   07. EFFECT SCHEDULER
========================================================= */

function scheduleEffect(type, interval) {

    if (!state.running || state.destroyed) return;

    addTimer(() => {

        if (!document.hidden) {

            switch (type) {

                case "glitch":
                    state.effects.glitch();
                    break;

                case "flash":
                    state.effects.flash();
                    break;

                case "signal":
                    state.effects.signal();
                    break;

            }

        }

        scheduleEffect(type, interval);

    }, randomInt(interval[0], interval[1]));

}


function scheduleEffects() {

    scheduleEffect(
        "glitch",
        CONFIG.effects.glitchInterval
    );

    scheduleEffect(
        "flash",
        CONFIG.effects.panelFlashInterval
    );

    scheduleEffect(
        "signal",
        CONFIG.effects.signalInterval
    );

}


/* =========================================================
   08. ACCESSIBILITY
========================================================= */

function initializeAccessibility() {

    const media = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const update = () => {

        state.reducedMotion = media.matches;

        state.quality = media.matches ? 0.35 : 1;

        if (state.renderer) {
            state.renderer.setQuality(state.quality);
        }

        if (state.effects) {
            state.effects.setReducedMotion(media.matches);
        }

    };

    update();

    listen(media, "change", update);

}


/* =========================================================
   09. VISIBILITY MANAGEMENT
========================================================= */

function handleVisibility() {

    if (!CONFIG.performance.pauseWhenHidden) return;

    if (document.hidden) {

        if (state.animationFrame) {

            cancelAnimationFrame(state.animationFrame);

            state.animationFrame = null;

        }

        clearTimers();

    } else if (state.running) {

        state.lastFrame = 0;

        state.animationFrame =
            requestAnimationFrame(render);

        scheduleEffects();

    }

}


/* =========================================================
   10. EVENT MANAGEMENT
========================================================= */

function initializeEvents() {

    listen(
        window,
        "resize",
        () => state.renderer?.resize(),
        { passive: true }
    );

    listen(
        document,
        "visibilitychange",
        handleVisibility
    );

}


/* =========================================================
   11. START
========================================================= */

function start() {

    if (state.destroyed) {

        log("Engine destroyed. Reinitialize first.");

        return false;

    }

    if (state.running) return true;

    if (!state.initialized) {

        initializeEnvironment();

        initializeAccessibility();

        initializeEvents();

    }

    state.running = true;

    if (!document.hidden) {

        state.lastFrame = 0;

        state.animationFrame =
            requestAnimationFrame(render);

        scheduleEffects();

    }

    log(`Engine started — v${VERSION}`);

    return true;

}


/* =========================================================
   12. STOP
========================================================= */

function stop() {

    if (!state.running) return;

    state.running = false;

    if (state.animationFrame) {

        cancelAnimationFrame(state.animationFrame);

        state.animationFrame = null;

    }

    clearTimers();

    state.effects?.clear();

    log("Engine stopped");

}


/* =========================================================
   13. RESTART
========================================================= */

function restart() {

    if (state.destroyed) {
        return initialize();
    }

    stop();

    return start();

}


/* =========================================================
   14. DESTROY
========================================================= */

function destroy() {

    if (state.destroyed) return;

    stop();

    removeListeners();

    state.renderer?.destroy();

    state.effects?.destroy();

    state.atmosphere?.destroy();

    state.renderer = null;
    state.effects = null;
    state.atmosphere = null;

    state.initialized = false;
    state.destroyed = true;

    state.animationFrame = null;

    log("Engine destroyed");

}


/* =========================================================
   15. REINITIALIZATION
========================================================= */

function initialize() {

    if (state.running) return true;

    if (state.initialized && !state.destroyed) {
        return start();
    }

    state.destroyed = false;

    state.initialized = false;

    state.counters = {
        frames: 0,
        glitches: 0,
        flashes: 0,
        signals: 0
    };

    return start();

}


/* =========================================================
   16. PUBLIC API
========================================================= */

const API = {

    initialize,
    start,
    stop,
    restart,
    destroy,

    glitch: target => state.effects?.glitch(target) ?? false,

    flash: target => state.effects?.flash(target) ?? false,

    signal: target => state.effects?.signal(target) ?? false,

    refresh: () => {

        state.effects?.refresh();

        state.renderer?.resize();

    },

    get running() {
        return state.running;
    },

    get version() {
        return VERSION;
    },

    get stats() {

        return {
            ...state.counters,
            activeGlitches: state.effects?.activeCount ?? 0,
            stars: state.renderer?.starCount ?? 0,
            quality: state.quality
        };

    },

    config: CONFIG

};


/* =========================================================
   17. GLOBAL REGISTRATION
========================================================= */

window[ENGINE_NAME] = API;

window.glitchRetrowaveEngine = API;

window.startRetrowave = start;

window.stopRetrowave = stop;

window.destroyRetrowave = destroy;


/* =========================================================
   18. AUTOMATIC INITIALIZATION
========================================================= */

if (CONFIG.enabled) {

    const boot = () => {

        if (!state.initialized && !state.destroyed) {
            start();
        }

    };

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            { once: true }
        );

    } else {

        boot();

    }

}
