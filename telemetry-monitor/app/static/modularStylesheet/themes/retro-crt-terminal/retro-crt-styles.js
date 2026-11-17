
export const CRT_STYLES = `
/* =========================================
   RETRO CRT TERMINAL — PHOSPHOR DISPLAY
========================================= */

.retro-crt-screen {
    position: fixed;
    inset: 0;
    z-index: 9997;
    pointer-events: none;
    overflow: hidden;
    isolation: isolate;
    opacity: 1;
    background: transparent;
    contain: strict;
}

.retro-crt-screen *,
.retro-crt-screen *::before,
.retro-crt-screen *::after {
    box-sizing: border-box;
}

/* PHOSPHOR */

.retro-crt-phosphor {
    text-shadow:
        0 0 1px rgba(100,255,100,.65),
        0 0 3px rgba(57,255,20,.25),
        0 0 8px rgba(57,255,20,.12);
}

/* SCANLINES */

.retro-crt-scanlines {
    position: absolute;
    inset: -4px 0;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 1px,
        rgba(0,0,0,.23) 2px,
        rgba(0,0,0,.23) 3px
    );
    background-size: 100% 4px;
    animation: crt-scan-drift 12s linear infinite;
    mix-blend-mode: multiply;
}

@keyframes crt-scan-drift {
    from { background-position: 0 0; }
    to   { background-position: 0 80px; }
}

/* SECONDARY SCANLINES */

.retro-crt-scanlines-secondary {
    position: absolute;
    inset: 0;
    opacity: .22;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        rgba(0,0,0,.12) 1px,
        transparent 2px,
        transparent 7px
    );
    animation: crt-secondary-drift 7s linear infinite;
}

@keyframes crt-secondary-drift {
    from { background-position-y: 0; }
    to { background-position-y: -70px; }
}

/* ROLLING BAR */

.retro-crt-rolling {
    position: absolute;
    left: 0;
    width: 100%;
    height: 17%;
    top: -25%;
    opacity: .24;
    background: linear-gradient(
        to bottom,
        transparent,
        rgba(57,255,20,.025) 15%,
        rgba(57,255,20,.10) 48%,
        rgba(180,255,180,.13) 50%,
        rgba(57,255,20,.045) 55%,
        transparent
    );
    animation: crt-rolling 13s linear infinite;
}

@keyframes crt-rolling {
    0% { top: -25%; }
    100% { top: 110%; }
}

/* PHOSPHOR BLOOM */

.retro-crt-bloom {
    position: absolute;
    inset: 0;
    background: radial-gradient(
        ellipse at center,
        rgba(57,255,20,.055),
        rgba(57,255,20,.018) 45%,
        transparent 78%
    );
    mix-blend-mode: screen;
    animation: crt-bloom 5s ease-in-out infinite alternate;
}

@keyframes crt-bloom {
    from { opacity: .55; }
    to { opacity: 1; }
}

/* GLASS REFLECTION */

.retro-crt-reflection {
    position: absolute;
    inset: 0;
    opacity: .13;
    background:
        linear-gradient(
            115deg,
            transparent 0%,
            rgba(255,255,255,.025) 34%,
            rgba(255,255,255,.065) 37%,
            transparent 44%
        );
    mix-blend-mode: screen;
}

/* RGB PHOSPHOR MASK */

.retro-crt-mask {
    position: absolute;
    inset: 0;
    opacity: .32;
    background: repeating-linear-gradient(
        90deg,
        rgba(255,0,0,.025) 0px,
        rgba(255,0,0,.025) 1px,
        rgba(0,255,0,.025) 1px,
        rgba(0,255,0,.025) 2px,
        rgba(0,0,255,.025) 2px,
        rgba(0,0,255,.025) 3px
    );
}

/* VIGNETTE / CURVED GLASS ILLUSION */

.retro-crt-vignette {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(
            ellipse 90% 85% at 50% 48%,
            transparent 55%,
            rgba(0,0,0,.13) 78%,
            rgba(0,0,0,.43) 115%
        );
    box-shadow:
        inset 0 0 80px rgba(0,0,0,.20),
        inset 0 0 170px rgba(0,0,0,.16);
}

/* ANALOG NOISE */

.retro-crt-noise {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: .12;
    mix-blend-mode: screen;
}

/* FLICKER */

.retro-crt-flicker {
    animation: crt-flicker 7s steps(1,end) infinite;
}

@keyframes crt-flicker {
    0%, 100% { opacity: 1; }
    13% { opacity: .995; }
    14% { opacity: .975; }
    15% { opacity: 1; }
    38% { opacity: .99; }
    39% { opacity: .97; }
    40% { opacity: 1; }
    72% { opacity: .985; }
    73% { opacity: 1; }
}

/* SIGNAL INTERFERENCE */

.retro-crt-interference {
    position: absolute;
    left: 0;
    right: 0;
    height: 16%;
    top: -25%;
    opacity: 0;
    background: linear-gradient(
        to bottom,
        transparent,
        rgba(57,255,20,.035),
        rgba(57,255,20,.16),
        rgba(220,255,220,.10),
        rgba(57,255,20,.045),
        transparent
    );
    pointer-events: none;
}

.retro-crt-interference.active {
    animation: crt-interference .42s steps(5,end);
}

@keyframes crt-interference {
    0% {
        top: -25%;
        opacity: 0;
        transform: translateX(0);
    }
    20% {
        opacity: .85;
        transform: translateX(-3px);
    }
    45% {
        opacity: .45;
        transform: translateX(4px);
    }
    70% {
        opacity: .9;
        transform: translateX(-2px);
    }
    100% {
        top: 110%;
        opacity: 0;
        transform: translateX(0);
    }
}

/* HORIZONTAL SIGNAL TEAR */

.retro-crt-tear {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(190,255,190,.35);
    opacity: 0;
    box-shadow: 0 0 8px rgba(57,255,20,.35);
}

.retro-crt-tear.active {
    animation: crt-tear .18s steps(2,end);
}

@keyframes crt-tear {
    0% {
        opacity: 0;
        transform: translateX(0);
    }
    30% {
        opacity: .8;
        transform: translateX(5px);
    }
    65% {
        opacity: .5;
        transform: translateX(-4px);
    }
    100% {
        opacity: 0;
        transform: translateX(0);
    }
}

/* STATIC BURST */

.retro-crt-static {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: rgba(190,255,190,.07);
    mix-blend-mode: screen;
    pointer-events: none;
}

.retro-crt-static.active {
    animation: crt-static .12s steps(2,end);
}

@keyframes crt-static {
    0% { opacity: 0; }
    30% { opacity: .75; }
    60% { opacity: .15; }
    100% { opacity: 0; }
}

/* REDUCED MOTION */

@media (prefers-reduced-motion: reduce) {
    .retro-crt-screen *,
    .retro-crt-screen *::before,
    .retro-crt-screen *::after {
        animation: none !important;
    }
}
`;
