
export function createCRTNoise(canvas, options = {}) {
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) return null;

    const config = {
        particles: 420,
        opacity: 0.22,
        horizontalLines: 5,
        ...options
    };

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize(w, h) {
        width = w;
        height = h;

        dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // PHOSPHOR PARTICLES
        for (let i = 0; i < config.particles; i++) {
            const alpha = random(0.025, 0.19);

            ctx.fillStyle = `rgba(160,255,160,${alpha})`;

            ctx.fillRect(
                random(0, width),
                random(0, height),
                random(.4, 1.5),
                random(.4, 1.5)
            );
        }

        // HORIZONTAL SIGNAL NOISE
        for (let i = 0; i < config.horizontalLines; i++) {
            if (Math.random() > .42) continue;

            const y = random(0, height);
            const x = random(0, width * .75);
            const lineWidth = random(width * .05, width * .5);

            ctx.fillStyle = `rgba(160,255,160,${random(.025,.10)})`;

            ctx.fillRect(
                x,
                y,
                lineWidth,
                random(.5, 1.5)
            );
        }

        // RANDOM SIGNAL SPECKS
        if (Math.random() > .70) {
            const y = random(0, height);

            ctx.fillStyle = "rgba(210,255,210,.12)";
            ctx.fillRect(
                0,
                y,
                width,
                random(.5, 1.5)
            );
        }
    }

    return {
        resize,
        draw,
        destroy() {
            ctx.clearRect(0, 0, width, height);
        }
    };
}
