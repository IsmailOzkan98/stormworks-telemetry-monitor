
"use strict";

/* =========================================================
   CYBERPUNK GLITCH — RENDERER
   Canvas / Retrowave Grid / Stars / Digital Rain
   ========================================================= */

export function createRenderer(CONFIG, state) {

    let canvas = null;
    let ctx = null;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let stars = [];
    let rain = [];

    let quality = 1;


    /* =====================================================
       01. UTILITIES
    ===================================================== */

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    const randomInt = (min, max) =>
        Math.floor(random(min, max + 1));

    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));


    /* =====================================================
       02. INITIALIZATION
    ===================================================== */

    function initialize() {

        if (canvas) return;

        canvas = document.createElement("canvas");

        canvas.id = CONFIG.canvas.id;

        canvas.setAttribute("aria-hidden", "true");

        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.display = "block";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = CONFIG.canvas.zIndex;
        canvas.style.opacity = CONFIG.canvas.opacity;
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        document.body.prepend(canvas);

        ctx = canvas.getContext("2d", {
            alpha: true,
            desynchronized: true
        });

        resize();

    }


    /* =====================================================
       03. RESOLUTION
    ===================================================== */

    function resize() {

        if (!canvas || !ctx) return;

        width = window.innerWidth;
        height = window.innerHeight;

        dpr = Math.min(
            window.devicePixelRatio || 1,
            CONFIG.canvas.pixelRatio
        );

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(
            dpr, 0, 0, dpr, 0, 0
        );

        createStars();
        createRain();

    }


    /* =====================================================
       04. QUALITY
    ===================================================== */

    function setQuality(value) {

        quality = clamp(value, 0.2, 1);

        createStars();
        createRain();

    }


    /* =====================================================
       05. STAR FIELD
    ===================================================== */

    function createStars() {

        stars = [];

        const count = Math.round(
            CONFIG.stars.count * quality
        );

        for (let i = 0; i < count; i++) {

            stars.push({

                x: random(0, width),
                y: random(0, height * 0.55),

                size: random(
                    0.3,
                    CONFIG.stars.maxSize
                ),

                speed: random(0.3, 1.5),

                alpha: random(
                    0.15,
                    CONFIG.stars.opacity
                ),

                phase: random(0, Math.PI * 2)

            });

        }

    }


    function drawStars(time) {

        if (!CONFIG.stars.enabled) return;

        stars.forEach(star => {

            const twinkle = Math.sin(
                time * 0.002 + star.phase
            );

            const alpha = clamp(
                star.alpha * (0.7 + twinkle * 0.3),
                0,
                1
            );

            ctx.beginPath();

            ctx.arc(
                star.x,
                star.y,
                star.size,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(220,225,255,${alpha})`;

            ctx.fill();

            star.y += star.speed * CONFIG.stars.speed;

            if (star.y > height * 0.65) {

                star.y = -5;
                star.x = random(0, width);

            }

        });

    }


    /* =====================================================
       06. DIGITAL RAIN
    ===================================================== */

    function createRain() {

        rain = [];

        if (!CONFIG.advancedAtmosphere.dataRain) return;

        const fontSize = 12;

        const count = Math.ceil(
            width / fontSize * quality
        );

        for (let i = 0; i < count; i++) {

            rain.push({

                x: i * fontSize / quality,

                y: random(-height, 0),

                speed: random(0.25, 1.2),

                alpha: random(0.08, CONFIG.advancedAtmosphere.rainOpacity)

            });

        }

    }


    function drawRain() {

        if (
            !CONFIG.advancedAtmosphere.enabled ||
            !CONFIG.advancedAtmosphere.dataRain
        ) return;

        ctx.save();

        ctx.font = "10px monospace";

        const characters = [
            "0", "1", "ア", "イ", "ウ",
            "エ", "オ", "<", ">", "/", "[", "]"
        ];

        rain.forEach(drop => {

            const character = characters[
                randomInt(0, characters.length - 1)
            ];

            ctx.fillStyle = Math.random() > 0.85
                ? `rgba(224,40,125,${drop.alpha})`
                : `rgba(27,199,251,${drop.alpha})`;

            ctx.fillText(
                character,
                drop.x,
                drop.y
            );

            drop.y += drop.speed;

            if (drop.y > height + 100) {

                drop.y = random(-300, -20);
                drop.speed = random(0.25, 1.2);

            }

        });

        ctx.restore();

    }


    /* =====================================================
       07. ATMOSPHERIC GLOW
    ===================================================== */

    function drawAtmosphere() {

        if (!CONFIG.atmosphere.ambientGlow) return;

        const gradient = ctx.createRadialGradient(
            width / 2,
            height * 0.48,
            0,
            width / 2,
            height * 0.48,
            width * 0.7
        );

        gradient.addColorStop(
            0,
            "rgba(139,53,255,.025)"
        );

        gradient.addColorStop(
            0.5,
            "rgba(27,199,251,.018)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(0, 0, width, height);

    }


    /* =====================================================
       08. 3D PROJECTION
    ===================================================== */

    function projectPoint(worldX, depth, time) {

        const config = CONFIG.waves;

        const horizonY = height * config.horizon;

        const perspective = Math.pow(
            depth,
            config.perspective
        );

        const screenY = horizonY +
            perspective * (height - horizonY) * 1.12;

        const scale = 0.12 + depth * 1.65;

        const wave1 = Math.sin(
            worldX * config.frequency +
            time * config.speed
        );

        const wave2 = Math.sin(
            depth * 16 -
            time * config.speed * 2
        );

        const wave3 = Math.cos(
            worldX * 0.08 +
            depth * 22 +
            time * config.pulseSpeed
        );

        const waveOffset = (

            wave1 * wave2 * config.amplitude +

            wave3 * config.secondaryAmplitude

        ) * depth;

        return {

            x: width / 2 + worldX * scale * 16,

            y: screenY + waveOffset

        };

    }


    /* =====================================================
       09. RETROWAVE GRID
    ===================================================== */

    function drawGrid(time) {

        if (!CONFIG.waves.enabled) return;

        const config = CONFIG.waves;

        const horizonY = height * config.horizon;

        const pulse = 0.8 + Math.sin(
            time * config.pulseSpeed
        ) * 0.2;

        ctx.save();

        ctx.globalCompositeOperation = "lighter";

        ctx.lineCap = "round";

        /* HORIZON GLOW */

        if (CONFIG.atmosphere.horizonGlow) {

            const gradient = ctx.createLinearGradient(
                0,
                horizonY - 100,
                0,
                horizonY + 100
            );

            gradient.addColorStop(
                0,
                "rgba(139,53,255,0)"
            );

            gradient.addColorStop(
                0.45,
                "rgba(224,40,125,.12)"
            );

            gradient.addColorStop(
                1,
                "rgba(27,199,251,.05)"
            );

            ctx.fillStyle = gradient;

            ctx.fillRect(
                0,
                horizonY - 100,
                width,
                200
            );

        }


        /* HORIZONTAL LINES */

        for (
            let row = 0;
            row < config.horizontalLines;
            row++
        ) {

            const depth = Math.pow(
                (row + 1) / config.horizontalLines,
                1.35
            );

            ctx.beginPath();

            for (let i = 0; i <= 90; i++) {

                const worldX = -24 + i / 90 * 48;

                const point = projectPoint(
                    worldX,
                    depth,
                    time
                );

                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }

            }

            const alpha = (
                0.15 + depth * 0.55
            ) * config.opacity * pulse;

            const pink = row % 4 === 0;

            ctx.strokeStyle = pink
                ? `rgba(224,40,125,${alpha})`
                : `rgba(27,199,251,${alpha})`;

            ctx.lineWidth = pink ? 1.3 : 0.7;

            ctx.shadowBlur = config.glow * depth;

            ctx.shadowColor = pink
                ? CONFIG.colors.pink
                : CONFIG.colors.cyan;

            ctx.stroke();

        }


        /* VERTICAL LINES */

        for (
            let col = 0;
            col < config.verticalLines;
            col++
        ) {

            const worldX = -24 +
                col / Math.max(1, config.verticalLines - 1) * 48;

            ctx.beginPath();

            for (let i = 0; i <= 85; i++) {

                const point = projectPoint(
                    worldX,
                    i / 85,
                    time
                );

                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }

            }

            const pink = col % 5 === 0;

            const alpha = clamp(
                0.5 - Math.abs(worldX) * 0.012,
                0.08,
                0.5
            );

            ctx.strokeStyle = pink
                ? `rgba(224,40,125,${alpha})`
                : `rgba(27,199,251,${alpha * 0.8})`;

            ctx.lineWidth = pink ? 1.2 : 0.7;

            ctx.shadowBlur = 7;

            ctx.shadowColor = pink
                ? CONFIG.colors.pink
                : CONFIG.colors.cyan;

            ctx.stroke();

        }


        /* CENTRAL ENERGY WAVE */

        ctx.beginPath();

        for (let i = 0; i <= 140; i++) {

            const x = i / 140 * width;

            const normalized = (
                x - width / 2
            ) / width;

            const wave =

                Math.sin(
                    normalized * 23 + time * 0.001
                ) * 12 +

                Math.sin(
                    normalized * 47 - time * 0.0015
                ) * 5;

            const y = horizonY + 15 + wave;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

        }

        ctx.strokeStyle =
            `rgba(224,40,125,${0.4 * pulse})`;

        ctx.lineWidth = 1.5;

        ctx.shadowBlur = 18;

        ctx.shadowColor = CONFIG.colors.pink;

        ctx.stroke();

        ctx.restore();

    }


    /* =====================================================
       10. MAIN RENDER
    ===================================================== */

    function render(time) {

        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, width, height);

        drawAtmosphere();

        drawStars(time);

        drawGrid(time);

        drawRain();

    }


    /* =====================================================
       11. DESTROY
    ===================================================== */

    function destroy() {

        canvas?.remove();

        canvas = null;
        ctx = null;

        stars = [];
        rain = [];

        width = 0;
        height = 0;

    }


    /* =====================================================
       12. PUBLIC INTERFACE
    ===================================================== */

    return {

        initialize,
        render,
        resize,
        destroy,
        setQuality,

        get starCount() {
            return stars.length;
        }

    };

}
