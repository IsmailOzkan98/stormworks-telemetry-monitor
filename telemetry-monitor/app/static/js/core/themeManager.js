/* ============================================================
   THEME MANAGER
   Dashboard theme loading and selection.
   ============================================================ */

"use strict";

const CONFIG = {
    API: "/api/themes-config",
    STORAGE_KEY: "ActiveDashboardTheme",
    TRIGGER_ID: "theme-selector-trigger"
};

const ThemeManager = (() => {

    let config;

    async function getConfig() {
        if (!config) {
            const response = await fetch(CONFIG.API, {
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            config = await response.json();

            if (!Array.isArray(config.themes) || !config.themes.length) {
                throw new Error("Invalid themes configuration.");
            }
        }

        return config;
    }

    function getSelectedTheme(config) {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);

        return config.themes.find(t => String(t.id) === stored)
            || config.themes.find(t => t.id === config.SelectedTheme)
            || config.themes[0];
    }

    async function loadStylesheet(path) {
        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.href = path;

        await new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });

        document.querySelector("#active-theme")?.remove();
        link.id = "active-theme";
    }

    
    async function loadScript(path) {
        const existing = document.querySelector(
            `script[data-theme-module="${CSS.escape(path)}"]`
        );

        if (existing) {
            if (existing.dataset.loaded === "true") return;

            // Prevents the same module from loading multiple times concurrently.
            if (existing._loadPromise) {
                return existing._loadPromise;
            }
        }

        const script = existing || document.createElement("script");

        script.type = "module";
        script.src = path;
        script.dataset.themeModule = path;

        script._loadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
                script.dataset.loaded = "true";
                resolve();
            };

            script.onerror = () => {
                script.remove();
                reject(new Error(`Failed to load module: ${path}`));
            };

            if (!existing) {
                document.head.appendChild(script);
            }
        });

        return script._loadPromise;
    }


    /**
     * Initializes the selected dashboard theme.
     *
     * Loads its stylesheet and associated JavaScript modules.
     *
     * @returns {Promise<Object|null>} Loaded theme configuration.
     */
    async function initialize() {
        try {
            const config = await getConfig();
            const theme = getSelectedTheme(config);

            await loadStylesheet(theme.path);

            for (const script of theme.scripts || []) {
                await loadScript(script);
            }

            return theme;

        } catch (error) {
            console.error("[THEME]", error);
            return null;
        }
    }

    return { initialize, getConfig, getSelectedTheme };

})();



const ThemeSelector = (() => {

    function createElement(tag, text = "") {
        const element = document.createElement(tag);
        element.textContent = text;
        return element;
    }

    function createModal() {
        let modal = document.querySelector("#theme-selector-modal");

        if (modal) return modal;

        modal = document.createElement("dialog");
        modal.id = "theme-selector-modal";
        modal.style.background = "var(--color-background)";

        const closeButton = createElement("button", "×");
        closeButton.type = "button";
        closeButton.onclick = () => modal.close();

        const title = createElement("h1", "THEME SELECTOR");

        const description = createElement(
            "p",
            "Select your dashboard theme."
        );

        description.style.color = "var(--muted)";

        const list = createElement("div");
        list.id = "ts-theme-list";

        Object.assign(list.style, {
            display: "flex",
            flexDirection: "column",
            gap: "8px"
        });

        modal.append(closeButton, title, description, list);

        modal.addEventListener("click", event => {
            if (event.target === modal) modal.close();
        });

        document.body.appendChild(modal);

        return modal;
    }

    async function renderThemes() {
        const list = document.querySelector("#ts-theme-list");
        list.replaceChildren();

        try {
            const config = await ThemeManager.getConfig();
            const active = ThemeManager.getSelectedTheme(config);

            config.themes.forEach(theme => {
                const button = createElement(
                    "button",
                    theme.name + (theme.id === active.id ? " ✓ ACTIVE" : "")
                );

                button.type = "button";
                button.onclick = () => selectTheme(theme);

                list.appendChild(button);
            });

        } catch (error) {
            list.appendChild(
                createElement("p", "Unable to load themes.")
            );

            console.error("[THEME]", error);
        }
    }

    function selectTheme(theme) {
        if (!confirm(`Apply "${theme.name}"?\n\nThe dashboard will reload.`)) {
            return;
        }

        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, String(theme.id));
            location.reload();
        } catch (error) {
            console.error("[THEME]", error);
            alert("Unable to save the selected theme.");
        }
    }

    /**
     * Opens the theme selector dialog and renders available themes.
     *
     * @returns {Promise<void>}
     */
    async function open() {
        const modal = createModal();

        if (!modal.open) modal.showModal();

        await renderThemes();
    }

    function initialize() {
        document.getElementById(CONFIG.TRIGGER_ID)
            ?.addEventListener("click", open);
    }

    return { initialize, open, close: () => {
        document.querySelector("#theme-selector-modal")?.close();
    } };

})();


/* ============================================================
   INITIALIZATION
   ============================================================ */

ThemeSelector.initialize();
ThemeManager.initialize();
