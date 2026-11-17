
"use strict";

/* =========================================================
   CYBERPUNK GLITCH — ATMOSPHERE
   Ambient Lighting / Scanner / Grain / Vignette
   ========================================================= */

export function createAtmosphere(CONFIG) {

    const elements = [];

    const STYLE_ID = "gr-atmosphere-styles";

    let initialized = false;


    /* =====================================================
       01. UTILITIES
    ===================================================== */

    function createLayer(className) {

        const element = document.createElement("div");

        element.className = className;

        element.setAttribute("aria-hidden", "true");

        document.body.appendChild(element);

        elements.push(element);

        return element;

    }


    /* =====================================================
       02. DYNAMIC STYLES
    ===================================================== */

    function injectStyles() {

        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");

        style.id = STYLE_ID;

        style.textContent = `

            /* ENGINE BODY STATE */

            body.gr-engine-active::after {

                content: "";

                position: fixed;

                inset: 0;

                z-index: 1;

                pointer-events: none;

                background:

                    radial-gradient(
                        ellipse at 50% 100%,
                        rgba(139,53,255,.12),
                        transparent 55%
                    ),

                    radial-gradient(
                        ellipse at 10% 50%,
                        rgba(27,199,251,.045),
                        transparent 45%
                    ),

                    radial-gradient(
                        ellipse at 90% 45%,
                        rgba(224,40,125,.055),
                        transparent 45%
                    );

                animation: grAmbientBreathing 9s ease-in-out infinite alternate;

            }


            @keyframes grAmbientBreathing {

                0% {
                    opacity: .55;
                    filter: hue-rotate(0deg);
                }

                100% {
                    opacity: 1;
                    filter: hue-rotate(15deg);
                }

            }


            /* SCANLINES */

            .gr-scanlines {

                position: fixed;

                inset: 0;

                z-index: 12;

                pointer-events: none;

                opacity: .18;

                background:
                    repeating-linear-gradient(
                        to bottom,
                        transparent 0px,
                        transparent 3px,
                        rgba(255,255,255,.055) 4px
                    );

                animation: grScanMove 12s linear infinite;

            }

            @keyframes grScanMove {

                from { background-position-y: 0; }
                to { background-position-y: 120px; }

            }


            /* HORIZON */

            .gr-horizon {

                position: fixed;

                left: -10%;
                right: -10%;

                top: 39%;

                height: 2px;

                z-index: 0;

                pointer-events: none;

                background:
                    linear-gradient(
                        90deg,
                        transparent,
                        rgba(27,199,251,.15),
                        rgba(224,40,125,.8),
                        rgba(139,53,255,.8),
                        rgba(27,199,251,.15),
                        transparent
                    );

                box-shadow:
                    0 0 12px rgba(224,40,125,.7),
                    0 0 35px rgba(139,53,255,.35);

                animation: grHorizonPulse 4s ease-in-out infinite alternate;

            }

            @keyframes grHorizonPulse {

                from {
                    opacity: .45;
                    filter: brightness(.8);
                }

                to {
                    opacity: 1;
                    filter: brightness(1.6);
                }

            }


            /* VIGNETTE */

            .gr-vignette {

                position: fixed;

                inset: 0;

                z-index: 2;

                pointer-events: none;

                background:
                    radial-gradient(
                        ellipse at center,
                        transparent 35%,
                        rgba(0,0,0,.25) 72%,
                        rgba(0,0,0,.75) 115%
                    );

            }


            /* FILM GRAIN */

            .gr-film-grain {

                position: fixed;

                inset: 0;

                z-index: 11;

                pointer-events: none;

                opacity: .12;

                background-image:
                    repeating-radial-gradient(
                        circle at 0 0,
                        rgba(255,255,255,.12) 0,
                        transparent 1px,
                        transparent 3px
                    );

                background-size: 5px 5px;

                animation: grGrainShift .2s steps(2) infinite;

            }

            @keyframes grGrainShift {

                0% { transform: translate(0,0); }
                25% { transform: translate(1px,-1px); }
                50% { transform: translate(-1px,1px); }
                75% { transform: translate(1px,1px); }
                100% { transform: translate(0,0); }

            }


            /* SCANNER */

            .gr-scanner {

                position: fixed;

                inset: 0;

                z-index: 3;

                pointer-events: none;

                overflow: hidden;

            }

            .gr-scanner::before {

                content: "";

                position: absolute;

                left: 0;
                right: 0;
                top: -20%;

                height: 180px;

                background:
                    linear-gradient(
                        to bottom,
                        transparent,
                        rgba(27,199,251,.015) 25%,
                        rgba(27,199,251,.09) 50%,
                        rgba(224,40,125,.07) 70%,
                        transparent
                    );

                filter: blur(5px);

                animation:
                    grScannerTravel
                    var(--gr-scanner-speed, 14s)
                    linear
                    infinite;

            }

            @keyframes grScannerTravel {

                from { transform: translateY(0); }
                to { transform: translateY(120vh); }

            }


            /* FLOATING ATMOSPHERE */

            .gr-particle-glow {

                position: fixed;

                inset: 0;

                z-index: 1;

                pointer-events: none;

                background:

                    radial-gradient(
                        circle at 20% 30%,
                        rgba(27,199,251,.055),
                        transparent 18%
                    ),

                    radial-gradient(
                        circle at 80% 65%,
                        rgba(224,40,125,.055),
                        transparent 22%
                    ),

                    radial-gradient(
                        circle at 50% 85%,
                        rgba(139,53,255,.07),
                        transparent 25%
                    );

                animation:
                    grParticleAtmosphere 16s ease-in-out infinite alternate;

            }

            @keyframes grParticleAtmosphere {

                0% {
                    transform: translate3d(-1%,0,0) scale(1);
                    filter: hue-rotate(0deg);
                }

                100% {
                    transform: translate3d(1%,-2%,0) scale(1.06);
                    filter: hue-rotate(20deg);
                }

            }


            /* ACCESSIBILITY */

            @media (prefers-reduced-motion: reduce) {

                .gr-scanlines,
                .gr-horizon,
                .gr-film-grain,
                .gr-scanner::before,
                .gr-particle-glow,
                body.gr-engine-active::after {

                    animation: none !important;

                }

            }

        `;

        document.head.appendChild(style);

    }


    /* =====================================================
       03. LAYER INITIALIZATION
    ===================================================== */

    function initialize() {

        if (initialized) return;

        injectStyles();

        document.body.classList.add("gr-engine-active");

        if (CONFIG.atmosphere.scanlines) {
            createLayer("gr-scanlines");
        }

        if (CONFIG.atmosphere.horizonGlow) {
            createLayer("gr-horizon");
        }

        if (
            CONFIG.advancedAtmosphere.enabled &&
            CONFIG.advancedAtmosphere.vignette
        ) {
            createLayer("gr-vignette");
        }

        if (
            CONFIG.advancedAtmosphere.enabled &&
            CONFIG.advancedAtmosphere.filmGrain &&
            CONFIG.atmosphere.noise
        ) {
            createLayer("gr-film-grain");
        }

        if (
            CONFIG.advancedAtmosphere.enabled &&
            CONFIG.advancedAtmosphere.scanner
        ) {

            const scanner = createLayer("gr-scanner");

            scanner.style.setProperty(
                "--gr-scanner-speed",
                `${CONFIG.advancedAtmosphere.scannerSpeed}s`
            );

        }

        if (
            CONFIG.advancedAtmosphere.enabled &&
            CONFIG.advancedAtmosphere.floatingParticles
        ) {
            createLayer("gr-particle-glow");
        }

        initialized = true;

    }


    /* =====================================================
       04. DESTROY
    ===================================================== */

    function destroy() {

        elements.forEach(element => element.remove());

        elements.length = 0;

        document.body.classList.remove("gr-engine-active");

        document.getElementById(STYLE_ID)?.remove();

        initialized = false;

    }


    /* =====================================================
       05. PUBLIC INTERFACE
    ===================================================== */

    return {

        initialize,
        destroy

    };

}
