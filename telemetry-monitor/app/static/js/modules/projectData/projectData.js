
/* ============================================================
   PROJECT DATA MODULE
   ============================================================ */

const CONFIG_URL = "/api/projectData-config";


/* ============================================================
   01. UTILITIES
   ============================================================ */

function setText(element, value) {

    if (!element || value === undefined || value === null) {
        return;
    }

    element.textContent = value;

}


function setVisibility(element, enabled) {

    if (!element) return;

    element.hidden = enabled === false;

    element.style.display =
        enabled === false ? "none" : "";

}


/* ============================================================
   02. PAGE CONFIGURATION
   ============================================================ */

function updatePage(config) {

    if (config.page?.enabled === false) return;

    document.title = config.page?.title ?? document.title;

}


/* ============================================================
   03. BRAND CONFIGURATION
   ============================================================ */

function updateBrand(config) {

    const brand = document.querySelector(".brand");

    if (!brand) return;

    const data = config.brand ?? {};

    setVisibility(brand, data.enabled !== false);

    if (data.enabled === false) return;

    setText(
        brand.querySelector(".eyebrow"),
        data.eyebrow
    );

    const heading = brand.querySelector("h1");

    if (heading) {

        const identifier = heading.querySelector("span");

        // Preserve the existing span and its styling.
        if (heading.firstChild?.nodeType === Node.TEXT_NODE) {
            heading.firstChild.textContent = (data.name ?? "") + " ";
        } else {
            heading.insertBefore(
                document.createTextNode(data.name + " "),
                identifier
            );
        }

        setText(identifier, data.identifier);

    }

    setText(
        brand.querySelector(".subtitle"),
        data.subtitle
    );

}


/* ============================================================
   04. UNIT DESIGNATION
   ============================================================ */

function updateUnitDesignation(config) {

    const element = document.querySelector(".unit-designation");

    if (!element) return;

    const data = config.unitDesignation ?? {};

    setVisibility(element, data.enabled !== false);

    if (data.enabled === false) return;

    const children = element.children;

    setText(children[0], data.label);
    setText(children[1], data.name);
    setText(children[2], data.description);

}


/* ============================================================
   05. SYSTEM INFORMATION
   ============================================================ */

function updateSystemInformation(
    config,
    moduleEnabled = true,
    module = null
) {

    if (!module) {
        console.warn(
            "[PROJECT DATA] System information container not provided."
        );
        return;
    }

    const data = config.systemInformation ?? {};

    const enabled =
        moduleEnabled !== false &&
        data.enabled !== false;

    setVisibility(module, enabled);

    if (!enabled) return;

    // CREATE SECTION HEADING

    const heading = document.createElement("div");
    heading.className = "module-header section-header";

    heading.append(
        document.createTextNode(
            " " + (data.title ?? "SYSTEM INFORMATION")
        )
    );

    // CREATE INFORMATION CONTAINER

    const container = document.createElement("div");
    container.className = "system-info";

    // GENERATE ITEMS FROM CONFIGURATION

    const items = Array.isArray(data.items)
        ? data.items
        : [];

    items.forEach(item => {

        if (!item || item.enabled === false) return;

        const block = document.createElement("div");

        const label = document.createElement("span");
        label.textContent = item.label ?? "";

        const value = document.createElement("strong");
        value.textContent = item.value ?? "";

        block.append(label, value);

        container.appendChild(block);

    });

    // MOUNT MODULE CONTENT

    module.append(heading, container);

}


/* ============================================================
   06. FOOTER
   ============================================================ */

function updateFooter(config) {
    const footer = document.querySelector(".footer");

    if (!footer || !config) return;

    // Control general de visibilidad
    if (config.enabled === false) {
        footer.style.display = "none";
        return;
    }

    footer.style.display = "";

    // Limpiar contenido predeterminado
    footer.replaceChildren();

    // Generar elementos desde JSON
    if (!Array.isArray(config.items)) return;

    config.items.forEach(item => {
        if (!item || item.enabled === false) return;

        const span = document.createElement("span");
        span.textContent = item.value ?? "";

        footer.appendChild(span);
    });
}


/* ============================================================
   07. INITIALIZATION
   ============================================================ */

/**
 * Initializes the project data module.
 *
 * Loads the project configuration and updates the page,
 * brand, unit designation, system information and footer.
 *
 * @param {Object} [options={}] - Module initialization options.
 * @param {boolean} [options.systemInformationEnabled=true]
 *        Whether system information is enabled.
 * @param {HTMLElement|null} [options.systemInformationContainer=null]
 *        Container for the system information section.
 * @returns {Promise<void>}
 */
export async function initProjectData(options = {}) {

    const {
        systemInformationEnabled = true,
        systemInformationContainer = null
    } = options;

    try {

        const response = await fetch(CONFIG_URL, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const config = await response.json();

        updatePage(config);
        updateBrand(config);
        updateUnitDesignation(config);

        updateSystemInformation(
            config,
            systemInformationEnabled,
            systemInformationContainer
        );

        updateFooter(config.footer);

        console.info(
            "[PROJECT DATA] Configuration loaded."
        );

    } catch (error) {

        console.error(
            "[PROJECT DATA] Configuration error:",
            error
        );

    }

}