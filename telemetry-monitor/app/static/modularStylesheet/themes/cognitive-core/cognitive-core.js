/*
 * CHATGPT // COGNITIVE CORE ENGINE
 *
 * Ambient neural network
 * Boot sequence
 * Signal notifications
 * Controlled visual effects
 *
 * Does not change application logic or HTML components.
 */

(() => {
    "use strict";

    if (window.__CHATGPT_CORE__) return;

    const CONFIG = {
        boot: {
            enabled: true,
            duration: 2200,
            fadeDuration: 500
        },

        network: {
            enabled: true,
            particleCount: 48,
            connectionDistance: 145,
            speed: 0.22,
            opacity: 0.38
        },

        signal: {
            enabled: true,
            interval: 9000,
            glitchChance: 0.08,
            targets: [
                "header",
                ".recorder-panel",
                ".diagnostics-panel",
                ".monitor-panel",
                ".event-panel",
                ".telemetry-chart-panel"
            ]
        }
    };

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const state = {
        running: false,
        booting: false,
        canvas: null,
        context: null,
        particles: [],
        frame: null,
        signalTimer: null,
        bootTimer: null,
        overlay: null,
        toast: null,
        resizeObserver: null,
        style: null,
        lastFrame: 0
    };

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    const createElement = (tag, className, text = "") => {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    };

    /* =====================================
       ENGINE STYLES
    ===================================== */

    function injectStyles() {
        if (document.getElementById("chatgpt-core-styles")) return;

        const style = createElement("style", "");
        style.id = "chatgpt-core-styles";

        style.textContent = `
            .cg-neural-canvas {
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                pointer-events: none;
                opacity: .65;
            }

            .cg-boot {
                position: fixed;
                inset: 0;
                z-index: 100000;
                display: grid;
                place-items: center;
                padding: 20px;
                background:
                    radial-gradient(
                        ellipse at center,
                        #14252a 0%,
                        #080c12 70%
                    );
                color: #e7f0f5;
                font-family: "JetBrains Mono", monospace;
                opacity: 1;
                transition: opacity .5s ease;
            }

            .cg-boot.cg-exit {
                opacity: 0;
                pointer-events: none;
            }

            .cg-boot-card {
                width: min(480px, 100%);
                padding: 28px;
                border: 1px solid rgba(99,230,193,.25);
                border-radius: 16px;
                background: rgba(16,23,34,.92);
                box-shadow:
                    0 0 60px rgba(16,163,127,.1),
                    inset 0 1px 0 rgba(255,255,255,.05);
            }

            .cg-boot-brand {
                color: #63e6c1;
                font-size: 11px;
                letter-spacing: 3px;
                text-transform: uppercase;
            }

            .cg-boot-title {
                margin-top: 16px;
                font-family: Inter, sans-serif;
                font-size: clamp(23px, 5vw, 34px);
                font-weight: 700;
                letter-spacing: -1.5px;
            }

            .cg-boot-description {
                margin-top: 8px;
                color: #8295a7;
                font-size: 11px;
                line-height: 1.7;
            }

            .cg-boot-track {
                height: 3px;
                margin-top: 27px;
                overflow: hidden;
                background: #26343d;
                border-radius: 5px;
            }

            .cg-boot-fill {
                width: 0;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    #10a37f,
                    #63e6c1,
                    #8e9cff
                );
                box-shadow: 0 0 14px rgba(99,230,193,.6);
                transition: width .08s linear;
            }

            .cg-boot-status {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                margin-top: 12px;
                color: #8295a7;
                font-size: 10px;
                letter-spacing: 1px;
            }

            .cg-boot-percent {
                color: #63e6c1;
            }

            .cg-boot-orb {
                display: grid;
                place-items: center;
                width: 58px;
                height: 58px;
                margin-top: 25px;
                border: 1px solid rgba(99,230,193,.35);
                border-radius: 50%;
                background: radial-gradient(
                    circle,
                    rgba(16,163,127,.24),
                    rgba(16,163,127,.015) 70%
                );
                box-shadow:
                    0 0 25px rgba(16,163,127,.13),
                    inset 0 0 15px rgba(16,163,127,.1);
                color: #63e6c1;
                font-size: 22px;
            }

            .cg-toast {
                position: fixed;
                right: 22px;
                bottom: 22px;
                z-index: 99999;
                max-width: min(360px, calc(100vw - 44px));
                padding: 13px 17px;
                border: 1px solid rgba(99,230,193,.32);
                border-radius: 10px;
                background: rgba(16,23,34,.96);
                color: #c0fff0;
                font: 11px/1.6 "JetBrains Mono", monospace;
                box-shadow: 0 10px 35px rgba(0,0,0,.3);
                opacity: 0;
                transform: translateY(8px);
                transition:
                    opacity .25s ease,
                    transform .25s ease;
                pointer-events: none;
            }

            .cg-toast.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .cg-signal {
                animation: cg-signal .22s ease;
            }

            @keyframes cg-signal {
                0% {
                    filter: brightness(1);
                }
                35% {
                    filter: brightness(1.3) saturate(1.25);
                }
                65% {
                    filter: brightness(.9);
                }
                100% {
                    filter: brightness(1);
                }
            }

            @media (max-width: 480px) {
                .cg-boot-card {
                    padding: 21px;
                }

                .cg-toast {
                    right: 12px;
                    bottom: 12px;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .cg-boot,
                .cg-toast {
                    transition: none !important;
                }

                .cg-signal {
                    animation: none !important;
                }
            }
        `;

        document.head.appendChild(style);
        state.style = style;
    }

    /* =====================================
       NEURAL NETWORK CANVAS
    ===================================== */

    function createNetwork() {
        if (state.canvas || !CONFIG.network.enabled) return;

        const canvas = createElement(
            "canvas",
            "cg-neural-canvas"
        );

        canvas.setAttribute("aria-hidden", "true");

        document.body.prepend(canvas);

        const context = canvas.getContext("2d");

        if (!context) {
            canvas.remove();
            return;
        }

        state.canvas = canvas;
        state.context = context;

        resizeNetwork();
        createParticles();

        if ("ResizeObserver" in window) {
            state.resizeObserver = new ResizeObserver(
                resizeNetwork
            );

            state.resizeObserver.observe(document.body);
        } else {
            window.addEventListener("resize", resizeNetwork);
        }
    }

    function resizeNetwork() {
        if (!state.canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        state.canvas.width = Math.floor(
            window.innerWidth * dpr
        );

        state.canvas.height = Math.floor(
            window.innerHeight * dpr
        );

        state.canvas.style.width = "100%";
        state.canvas.style.height = "100%";

        state.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticles() {
        const count = Math.min(
            CONFIG.network.particleCount,
            Math.floor(
                window.innerWidth * window.innerHeight / 24000
            ) + 18
        );

        state.particles = Array.from(
            { length: count },
            () => ({
                x: random(0, window.innerWidth),
                y: random(0, window.innerHeight),
                vx: random(-.18, .18),
                vy: random(-.18, .18),
                radius: random(1, 2.1),
                phase: random(0, Math.PI * 2)
            })
        );
    }

    function drawNetwork(timestamp = 0) {
        if (!state.running || !state.context) return;

        const context = state.context;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const delta = Math.min(
            (timestamp - (state.lastFrame || timestamp)) / 16.67,
            2
        );

        state.lastFrame = timestamp;

        context.clearRect(0, 0, width, height);

        const particles = state.particles;
        const distance = CONFIG.network.connectionDistance;

        particles.forEach((particle, index) => {
            if (!reducedMotion.matches) {
                particle.x += particle.vx * CONFIG.network.speed * delta;
                particle.y += particle.vy * CONFIG.network.speed * delta;

                if (particle.x < -10) particle.x = width + 10;
                if (particle.x > width + 10) particle.x = -10;
                if (particle.y < -10) particle.y = height + 10;
                if (particle.y > height + 10) particle.y = -10;
            }

            const glow = .65 + Math.sin(
                timestamp * .0007 + particle.phase
            ) * .2;

            context.beginPath();
            context.arc(
                particle.x,
                particle.y,
                particle.radius,
                0,
                Math.PI * 2
            );

            context.fillStyle =
                `rgba(99, 230, 193, ${glow * CONFIG.network.opacity})`;

            context.fill();

            for (let j = index + 1; j < particles.length; j++) {
                const other = particles[j];

                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist >= distance) continue;

                const alpha =
                    (1 - dist / distance) *
                    CONFIG.network.opacity *
                    .32;

                context.beginPath();
                context.moveTo(particle.x, particle.y);
                context.lineTo(other.x, other.y);

                context.strokeStyle =
                    `rgba(99, 230, 193, ${alpha})`;

                context.lineWidth = .7;
                context.stroke();
            }
        });

        state.frame = requestAnimationFrame(drawNetwork);
    }

    function destroyNetwork() {
        if (state.frame) {
            cancelAnimationFrame(state.frame);
        }

        state.frame = null;

        state.resizeObserver?.disconnect();
        state.resizeObserver = null;

        window.removeEventListener("resize", resizeNetwork);

        state.canvas?.remove();
        state.canvas = null;
        state.context = null;
        state.particles = [];
    }

    /* =====================================
       BOOT SEQUENCE
    ===================================== */

    function startBoot() {
        if (
            state.booting ||
            state.overlay ||
            reducedMotion.matches
        ) return;

        state.booting = true;

        const overlay = createElement(
            "div",
            "cg-boot"
        );

        const card = createElement(
            "div",
            "cg-boot-card"
        );

        const brand = createElement(
            "div",
            "cg-boot-brand",
            "CHATGPT // COGNITIVE CORE"
        );

        const title = createElement(
            "div",
            "cg-boot-title",
            "Intelligence initialized."
        );

        const description = createElement(
            "div",
            "cg-boot-description",
            "Preparing neural environment. Synchronizing visual subsystems."
        );

        const track = createElement(
            "div",
            "cg-boot-track"
        );

        const fill = createElement(
            "div",
            "cg-boot-fill"
        );

        const status = createElement(
            "div",
            "cg-boot-status"
        );

        const statusText = createElement(
            "span",
            "",
            "INITIALIZING"
        );

        const percentage = createElement(
            "span",
            "cg-boot-percent",
            "0%"
        );

        const orb = createElement(
            "div",
            "cg-boot-orb",
            "✳"
        );

        track.appendChild(fill);
        status.append(statusText, percentage);

        card.append(
            brand,
            title,
            description,
            track,
            status,
            orb
        );

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        state.overlay = overlay;

        const startTime = performance.now();

        function update(now) {
            if (!state.overlay) return;

            const progress = Math.min(
                (now - startTime) / CONFIG.boot.duration,
                1
            );

            const percent = Math.round(progress * 100);

            fill.style.width = `${percent}%`;
            percentage.textContent = `${percent}%`;

            if (percent > 75) {
                statusText.textContent = "READY";
            } else if (percent > 40) {
                statusText.textContent = "SYNCHRONIZING";
            }

            if (progress < 1) {
                state.bootTimer = requestAnimationFrame(update);
            } else {
                statusText.textContent = "SYSTEM ONLINE";

                window.setTimeout(() => {
                    overlay.classList.add("cg-exit");

                    window.setTimeout(() => {
                        overlay.remove();
                        state.overlay = null;
                        state.booting = false;
                    }, CONFIG.boot.fadeDuration);
                }, 250);
            }
        }

        state.bootTimer = requestAnimationFrame(update);
    }

    function stopBoot() {
        if (state.bootTimer) {
            cancelAnimationFrame(state.bootTimer);
        }

        state.bootTimer = null;
        state.overlay?.remove();
        state.overlay = null;
        state.booting = false;
    }

    /* =====================================
       SIGNAL & NOTIFICATIONS
    ===================================== */

    function createToast() {
        if (state.toast) return;

        state.toast = createElement("div", "cg-toast");
        state.toast.setAttribute("role", "status");
        state.toast.setAttribute("aria-live", "polite");

        document.body.appendChild(state.toast);
    }

    function notify(message) {
        if (!state.running || !message) return;

        createToast();

        state.toast.textContent = `✳  ${String(message).slice(0, 180)}`;
        state.toast.classList.add("visible");

        window.clearTimeout(state.toastTimer);

        state.toastTimer = window.setTimeout(() => {
            state.toast?.classList.remove("visible");
        }, 3000);
    }

    function triggerSignal(selector) {
        if (!state.running) return;

        const targets = selector
            ? document.querySelectorAll(selector)
            : CONFIG.signal.targets.flatMap(
                target => Array.from(
                    document.querySelectorAll(target)
                )
            );

        if (!targets.length) return;

        const element = targets[
            Math.floor(Math.random() * targets.length)
        ];

        element.classList.remove("cg-signal");

        // Force a fresh animation.
        void element.offsetWidth;

        element.classList.add("cg-signal");

        window.setTimeout(() => {
            element.classList.remove("cg-signal");
        }, 300);
    }

    function startSignals() {
        if (
            !CONFIG.signal.enabled ||
            reducedMotion.matches
        ) return;

        if (state.signalTimer) {
            clearInterval(state.signalTimer);
        }

        state.signalTimer = window.setInterval(() => {
            if (
                document.hidden ||
                Math.random() > CONFIG.signal.glitchChance
            ) return;

            triggerSignal();
        }, CONFIG.signal.interval);
    }

    /* =====================================
       ENGINE LIFECYCLE
    ===================================== */

    function start() {
        if (state.running) return;

        injectStyles();

        state.running = true;

        createNetwork();
        createToast();

        if (CONFIG.network.enabled) {
            state.frame = requestAnimationFrame(drawNetwork);
        }

        startSignals();

        if (CONFIG.boot.enabled) {
            startBoot();
        }

        console.info("[COGNITIVE CORE] System online.");
    }

    function stop() {
        state.running = false;

        if (state.signalTimer) {
            clearInterval(state.signalTimer);
        }

        state.signalTimer = null;

        stopBoot();
        destroyNetwork();

        state.toast?.remove();
        state.toast = null;

        window.clearTimeout(state.toastTimer);

        console.info("[COGNITIVE CORE] System offline.");
    }

    /* =====================================
       PUBLIC API
    ===================================== */

    const API = {
        start,
        stop,
        boot: startBoot,
        stopBoot,
        notify,
        signal: triggerSignal,

        get running() {
            return state.running;
        },

        version: "1.0.0"
    };

    window.chatgptCore = API;

    window.startChatGPTCore = start;
    window.stopChatGPTCore = stop;

    /* =====================================
       ACCESSIBILITY & INITIALIZATION
    ===================================== */

    function handleMotionChange() {
        if (!state.running) return;

        if (reducedMotion.matches) {
            stopBoot();

            if (state.signalTimer) {
                clearInterval(state.signalTimer);
                state.signalTimer = null;
            }

            if (state.frame) {
                cancelAnimationFrame(state.frame);
                state.frame = null;
            }

            state.context?.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );
        } else {
            if (state.canvas && !state.frame) {
                state.lastFrame = 0;
                state.frame = requestAnimationFrame(drawNetwork);
            }

            startSignals();
        }
    }

    reducedMotion.addEventListener?.(
        "change",
        handleMotionChange
    );

    function initialize() {
        if (!document.body || !document.head) return;
        start();
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