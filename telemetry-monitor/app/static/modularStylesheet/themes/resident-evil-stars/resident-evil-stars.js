
/* ==========================================================
   RESIDENT EVIL — S.T.A.R.S. CONTROL SYSTEM
   RPD / BIOLOGICAL MONITORING INTERFACE
   ========================================================== */

(() => {
  "use strict";

  if (document.getElementById("stars-control-panel")) return;

  const characters = {
    jill: {
      fullname: "Jill Valentine",
      date: "October 1st 1998",
      quote: '"You want S.T.A.R.S.? I\'ll give you S.T.A.R.S."',
      state: "Virus!",
      initials: "JV"
    },
    leon: {
      fullname: "Leon S. Kennedy",
      date: "September 29th 1998",
      quote: '"Claire, wait! Man, why doesn\'t anyone ever listen to me?"',
      state: "Fine",
      initials: "LK"
    },
    claire: {
      fullname: "Claire Redfield",
      date: "September 29th 1998",
      quote: '"I\'m looking for my brother, Chris."',
      state: "Danger",
      initials: "CR"
    }
  };

  const states = {
    Fine: {
      color: "#2F863A",
      description: "CONDITION STABLE",
      pulse: 72
    },
    Caution: {
      color: "#F0AD29",
      description: "CAUTION DETECTED",
      pulse: 105
    },
    Danger: {
      color: "#D90D1E",
      description: "CRITICAL CONDITION",
      pulse: 145
    },
    Poison: {
      color: "#870DD9",
      description: "TOXIC CONTAMINATION",
      pulse: 118
    },
    "Virus!": {
      color: "#F602FD",
      description: "VIRAL INFECTION",
      pulse: 160
    }
  };

  const communications = [
    "RPD: Awaiting personnel status report...",
    "SYSTEM: Biological scan initiated.",
    "RPD: Communication channel established.",
    "WARNING: Unknown signal detected.",
    "SYSTEM: Monitoring active.",
    "RPD: Maintain radio contact.",
    "SYSTEM: Personnel database synchronized."
  ];

  let currentCharacter = "jill";
  let communicationIndex = 0;
  let communicationTimer = null;
  let interferenceTimer = null;
  let radarTimer = null;

  const style = document.createElement("style");

  style.id = "stars-control-style";

  style.textContent = `

    /* ==================================================
       PANEL
    ================================================== */

    #stars-control-panel {
      --stars-color: #2F863A;

      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 99999;

      width: min(350px, calc(100vw - 32px));
      max-height: min(85vh, 720px);
      overflow-y: auto;

      padding: 16px;

      color: #e5e9e7;

      background:
        linear-gradient(
          145deg,
          rgba(58,64,69,.98),
          rgba(27,31,56,.98)
        );

      border: 2px solid #636B79;
      outline: 1px solid #2C3035;

      box-shadow:
        inset 0 1px rgba(255,255,255,.12),
        0 7px 0 rgba(0,0,0,.4),
        0 12px 30px rgba(0,0,0,.55);

      font-family: 'Share Tech Mono', monospace;
      box-sizing: border-box;

      isolation: isolate;
    }

    #stars-control-panel *,
    #stars-control-panel *::before,
    #stars-control-panel *::after {
      box-sizing: border-box;
    }

    /* CRT SCANLINES */

    #stars-control-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;

      background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 3px,
        rgba(0,0,0,.09) 4px
      );

      opacity: .35;
    }

    #stars-control-panel > * {
      position: relative;
      z-index: 2;
    }

    /* ==================================================
       HEADER
    ================================================== */

    #stars-control-panel .stars-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;

      padding-bottom: 10px;
      margin-bottom: 12px;

      border-bottom: 2px solid #636B79;

      color: #AEDCE1;
      font-size: 12px;
      letter-spacing: 1.5px;
    }

    #stars-control-panel .stars-heading-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    #stars-control-panel .stars-live-dot {
      width: 7px;
      height: 7px;
      flex: 0 0 7px;

      border-radius: 50%;
      background: #48b66a;

      box-shadow: 0 0 8px #48b66a;

      animation: stars-blink 1.5s infinite;
    }

    /* CLOSE BUTTON — INDEPENDENT */

    #stars-control-panel .stars-close {
      position: relative;
      z-index: 20;

      appearance: none;
      -webkit-appearance: none;

      display: grid;
      place-items: center;

      width: 30px;
      height: 30px;
      min-width: 30px;
      padding: 0;
      margin: 0;

      color: #aab6c1;
      background: #171e2b;

      border: 1px solid #69768a;
      border-radius: 2px;

      box-shadow: none;
      outline: none;

      font-family: 'Share Tech Mono', monospace;
      font-size: 20px;
      line-height: 1;
      font-weight: normal;
      text-shadow: none;

      cursor: pointer;
      pointer-events: auto;
    }

    #stars-control-panel .stars-close::before,
    #stars-control-panel .stars-close::after {
      content: none !important;
      display: none !important;
    }

    #stars-control-panel .stars-close:hover {
      color: white;
      background: #8c2530;
      border-color: #e65b65;
      box-shadow: 0 0 12px rgba(217,75,85,.35);
      transform: none;
    }

    #stars-control-panel .stars-close:active {
      transform: none;
      box-shadow: none;
    }

    /* ==================================================
       CHARACTER
    ================================================== */

    #stars-control-panel .stars-character {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 13px;
    }

    #stars-control-panel .stars-avatar {
      width: 55px;
      height: 55px;
      flex: 0 0 55px;

      display: grid;
      place-items: center;

      color: #AEDCE1;
      background: #111;

      border: 3px solid #636B79;
      outline: 2px solid #2C3035;

      font-family: 'VT323', monospace;
      font-size: 25px;

      text-shadow: 0 0 8px currentColor;
    }

    #stars-control-panel .stars-name {
      color: #f7f7f0;

      font-family: 'Rajdhani', sans-serif;
      font-size: 21px;
      font-weight: 700;

      text-transform: uppercase;
      letter-spacing: 1px;
    }

    #stars-control-panel .stars-date {
      margin-top: 3px;
      color: #9da9b8;
      font-size: 10px;
    }

    #stars-control-panel .stars-quote {
      min-height: 38px;
      padding: 9px;
      margin-bottom: 12px;

      color: #AEDCE1;
      background: rgba(0,0,0,.35);

      border-left: 3px solid #636B79;

      font-size: 11px;
      line-height: 1.5;
    }

    /* ==================================================
       SELECTORS
    ================================================== */

    #stars-control-panel .stars-label {
      display: block;
      margin: 10px 0 5px;

      color: #aab6c1;
      font-size: 10px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    #stars-control-panel select {
      display: block;
      width: 100%;
      min-height: 36px;
      padding: 7px 10px;

      color: #e5e9e7;
      background: #171b26;

      border: 2px solid #636B79;
      border-radius: 0;

      font: 13px 'Share Tech Mono', monospace;
      cursor: pointer;
    }

    #stars-control-panel select:focus {
      outline: 1px solid #AEDCE1;
      border-color: #AEDCE1;
    }

    /* ==================================================
       CONDITION
    ================================================== */

    #stars-control-panel .stars-state {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      margin-top: 12px;
      padding: 9px;

      background: #111;
      border: 2px solid #636B79;

      box-shadow: inset 0 0 8px rgba(0,0,0,.7);
    }

    #stars-control-panel .stars-state-name {
      color: var(--stars-color);

      font-family: 'VT323', monospace;
      font-size: 25px;

      text-shadow: 0 0 8px var(--stars-color);
    }

    #stars-control-panel .stars-state-description {
      color: #aab6c1;
      font-size: 9px;
      text-align: right;
    }

    /* ==================================================
       BIOMETRIC MONITOR
    ================================================== */

    #stars-control-panel .stars-monitor {
      position: relative;
      margin-top: 12px;
      padding: 8px;

      background: #080d0d;
      border: 2px solid #2C3035;
      outline: 1px solid #636B79;

      overflow: hidden;
    }

    #stars-control-panel .stars-monitor-label {
      margin-bottom: 5px;

      color: #718b7b;
      font-size: 9px;
      letter-spacing: 2px;
    }

    #stars-control-panel .stars-heartbeat {
      display: block;
      width: 100%;
      height: 42px;
      overflow: visible;
    }

    #stars-control-panel .stars-heartbeat path {
      fill: none;
      stroke: var(--stars-color);
      stroke-width: 2.5;

      stroke-linejoin: bevel;
      stroke-linecap: square;

      stroke-dasharray: 500;
      stroke-dashoffset: 500;

      filter: drop-shadow(0 0 4px var(--stars-color));

      animation: stars-heartbeat 2s linear infinite;
    }

    /* ==================================================
       RPD RADAR
    ================================================== */

    #stars-control-panel .stars-radar-section {
      display: flex;
      align-items: center;
      gap: 12px;

      margin-top: 12px;
      padding: 9px;

      background: rgba(0,0,0,.35);
      border: 1px solid #414e5e;
    }

    #stars-control-panel .stars-radar {
      position: relative;

      width: 54px;
      height: 54px;
      flex: 0 0 54px;

      overflow: hidden;
      border: 1px solid #48b66a;
      border-radius: 50%;

      background:
        linear-gradient(90deg,
          transparent 49%,
          rgba(72,182,106,.35) 50%,
          transparent 51%
        ),
        linear-gradient(0deg,
          transparent 49%,
          rgba(72,182,106,.35) 50%,
          transparent 51%
        ),
        radial-gradient(
          circle,
          rgba(72,182,106,.18),
          rgba(0,0,0,.8)
        );
    }

    #stars-control-panel .stars-radar::before {
      content: "";
      position: absolute;
      inset: 0;

      border-radius: 50%;

      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        rgba(72,182,106,.45) 45deg,
        transparent 75deg
      );

      animation: stars-radar-spin 4s linear infinite;
    }

    #stars-control-panel .stars-radar::after {
      content: "";
      position: absolute;

      width: 5px;
      height: 5px;

      left: 65%;
      top: 30%;

      border-radius: 50%;
      background: #d94b55;

      box-shadow: 0 0 7px #d94b55;
    }

    #stars-control-panel .stars-radar-info {
      min-width: 0;
      color: #9eacbb;
      font-size: 9px;
      line-height: 1.8;
    }

    #stars-control-panel .stars-radar-info strong {
      color: #48b66a;
      font-weight: normal;
    }

    /* ==================================================
       COMMUNICATIONS
    ================================================== */

    #stars-control-panel .stars-comms {
      margin-top: 12px;
      padding: 9px;

      background: #101720;
      border: 1px solid #465467;
    }

    #stars-control-panel .stars-comms-header {
      display: flex;
      justify-content: space-between;
      gap: 5px;

      margin-bottom: 7px;
      padding-bottom: 6px;

      border-bottom: 1px solid #344354;

      color: #AEDCE1;
      font-size: 9px;
      letter-spacing: 1px;
    }

    #stars-control-panel .stars-comms-message {
      min-height: 30px;

      color: #aebfca;
      font-size: 10px;
      line-height: 1.5;

      overflow-wrap: anywhere;
    }

    #stars-control-panel .stars-comms-time {
      margin-top: 5px;
      color: #64798c;
      font-size: 9px;
    }

    /* ==================================================
       FOOTER
    ================================================== */

    #stars-control-panel .stars-footer {
      display: flex;
      justify-content: space-between;
      gap: 5px;

      margin-top: 10px;

      color: #758292;
      font-size: 9px;
      letter-spacing: 1px;
    }

    /* ==================================================
       INTERFERENCE
    ================================================== */

    #stars-control-panel.stars-interference {
      animation: stars-glitch .18s steps(2) 1;
    }

    @keyframes stars-glitch {
      0% {
        transform: translateX(0);
        filter: none;
      }

      25% {
        transform: translateX(-2px);
        filter: brightness(1.4);
      }

      50% {
        transform: translateX(2px);
        filter: hue-rotate(25deg);
      }

      100% {
        transform: translateX(0);
        filter: none;
      }
    }

    @keyframes stars-heartbeat {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes stars-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: .35; }
    }

    @keyframes stars-radar-spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ==================================================
       RESPONSIVE
    ================================================== */

    @media (max-width: 600px) {
      #stars-control-panel {
        right: 10px;
        bottom: 10px;
        width: min(310px, calc(100vw - 20px));
        max-height: 80vh;
      }
    }

    /* ==================================================
       ACCESSIBILITY
    ================================================== */

    @media (prefers-reduced-motion: reduce) {
      #stars-control-panel *,
      #stars-control-panel *::before,
      #stars-control-panel *::after {
        animation: none !important;
      }

      #stars-control-panel .stars-heartbeat path {
        stroke-dashoffset: 0;
      }
    }
  `;

  document.head.appendChild(style);

  /* ======================================================
     CREATE PANEL
  ====================================================== */

  const panel = document.createElement("section");

  panel.id = "stars-control-panel";

  panel.setAttribute(
    "aria-label",
    "S.T.A.R.S. character control"
  );

  panel.innerHTML = `

    <div class="stars-heading">

      <div class="stars-heading-left">
        <span class="stars-live-dot"></span>
        <span>S.T.A.R.S. // PERSONNEL FILE</span>
      </div>

      <button
        class="stars-close"
        type="button"
        aria-label="Close panel"
        title="Close panel"
      >×</button>

    </div>

    <div class="stars-character">

      <div class="stars-avatar" id="stars-avatar">JV</div>

      <div>
        <div class="stars-name" id="stars-fullname">
          Jill Valentine
        </div>

        <div class="stars-date" id="stars-date">
          October 1st 1998
        </div>
      </div>

    </div>

    <div class="stars-quote" id="stars-quote"></div>

    <label class="stars-label" for="stars-character-select">
      Select character
    </label>

    <select id="stars-character-select">
      <option value="jill">Jill Valentine</option>
      <option value="leon">Leon S. Kennedy</option>
      <option value="claire">Claire Redfield</option>
    </select>

    <label class="stars-label" for="stars-state-select">
      Condition state
    </label>

    <select id="stars-state-select">
      <option>Fine</option>
      <option>Caution</option>
      <option>Danger</option>
      <option>Poison</option>
      <option>Virus!</option>
    </select>

    <div class="stars-state">

      <div class="stars-state-name" id="stars-state-name">
        Virus!
      </div>

      <div class="stars-state-description" id="stars-state-description">
        VIRAL INFECTION
      </div>

    </div>

    <div class="stars-monitor">

      <div class="stars-monitor-label">
        BIOLOGICAL MONITOR // LIVE
      </div>

      <svg
        class="stars-heartbeat"
        viewBox="0 0 300 45"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          id="stars-heartbeat-path"
          d="M0 23 H65 L78 21 H91 L101 23 H112 L121 19
             L132 3 L143 40 L153 15 L163 23 H185
             L195 21 H205 L215 23 H300"
        />
      </svg>

    </div>

    <div class="stars-radar-section">

      <div class="stars-radar"></div>

      <div class="stars-radar-info">
        <div>RPD SURVEILLANCE</div>
        <div>NETWORK: <strong>ONLINE</strong></div>
        <div>THREAT SCAN: <strong>ACTIVE</strong></div>
      </div>

    </div>

    <div class="stars-comms">

      <div class="stars-comms-header">
        <span>RPD COMMUNICATIONS</span>
        <span>CH-01</span>
      </div>

      <div
        class="stars-comms-message"
        id="stars-comms-message"
        aria-live="polite"
      >
        Establishing communication...
      </div>

      <div class="stars-comms-time" id="stars-comms-time">
        CHANNEL INITIALIZING
      </div>

    </div>

    <div class="stars-footer">
      <span>RACCOON CITY // 1998</span>
      <span id="stars-pulse">72 BPM</span>
    </div>

  `;

  document.body.appendChild(panel);

  /* ======================================================
     REFERENCES
  ====================================================== */

  const $ = (id) => panel.querySelector("#" + id);

  const characterSelect = $("stars-character-select");
  const stateSelect = $("stars-state-select");

  const savedStates = {};

  Object.entries(characters).forEach(([key, character]) => {
    savedStates[key] = character.state;
  });

  /* ======================================================
     CONDITION SYSTEM
  ====================================================== */

  function updateCondition(state) {

    const condition = states[state];

    if (!condition) return;

    const color = condition.color;

    panel.style.setProperty("--stars-color", color);

    $("stars-state-name").textContent = state;

    $("stars-state-description").textContent =
      condition.description;

    $("stars-pulse").textContent =
      condition.pulse + " BPM";

    // Sincronización con indicadores de la aplicación.

    document.querySelectorAll(".indicator.active").forEach((indicator) => {

      indicator.style.boxShadow =
        `0 0 10px ${color}, inset 0 0 4px ${color}`;

    });

    document.querySelectorAll(".booster.pulse").forEach((booster) => {

      booster.style.setProperty(
        "--stars-alert-color",
        color
      );

    });

  }

  /* ======================================================
     CHARACTER SYSTEM
  ====================================================== */

  function updateCharacter(key) {

    const character = characters[key];

    if (!character) return;

    currentCharacter = key;

    $("stars-avatar").textContent = character.initials;

    $("stars-fullname").textContent = character.fullname;

    $("stars-date").textContent = character.date;

    $("stars-quote").textContent = character.quote;

    const characterState = savedStates[key];

    stateSelect.value = characterState;

    updateCondition(characterState);

    // Pequeña interferencia de cambio de canal.

    triggerInterference();

  }

  /* ======================================================
     COMMUNICATION SYSTEM
  ====================================================== */

  function updateCommunications() {

    if (!panel.isConnected) return;

    const message = communications[communicationIndex];

    $("stars-comms-message").textContent = message;

    const now = new Date();

    $("stars-comms-time").textContent =
      "CHANNEL 01 // " +
      now.toLocaleTimeString("en-GB");

    communicationIndex =
      (communicationIndex + 1) % communications.length;

  }

  /* ======================================================
     INTERFERENCE
  ====================================================== */

  function triggerInterference() {

    if (!panel.isConnected) return;

    panel.classList.remove("stars-interference");

    // Reiniciar animación.

    void panel.offsetWidth;

    panel.classList.add("stars-interference");

    setTimeout(() => {

      panel.classList.remove("stars-interference");

    }, 250);

  }

  /* ======================================================
     CLEANUP
  ====================================================== */

  function destroyPanel() {

    clearInterval(communicationTimer);
    clearTimeout(interferenceTimer);
    clearInterval(radarTimer);

    panel.remove();
    style.remove();

    // Permitir una futura reinicialización.

    delete window.STARS_CONTROL;

  }

  /* ======================================================
     EVENTS
  ====================================================== */

  characterSelect.addEventListener("change", (event) => {

    updateCharacter(event.target.value);

  });

  stateSelect.addEventListener("change", (event) => {

    const selectedState = event.target.value;

    savedStates[currentCharacter] = selectedState;

    updateCondition(selectedState);

    triggerInterference();

  });

  // Delegación de evento para evitar problemas
  // con elementos interiores del botón de cierre.

  panel.addEventListener("click", (event) => {

    const closeButton = event.target.closest(".stars-close");

    if (!closeButton || !panel.contains(closeButton)) return;

    destroyPanel();

  });

  /* ======================================================
     INITIALIZATION
  ====================================================== */

  updateCharacter(currentCharacter);

  updateCommunications();

  communicationTimer = setInterval(
    updateCommunications,
    7000
  );

  // Interferencia ocasional.

  interferenceTimer = setInterval(() => {

    if (Math.random() > 0.65) {
      triggerInterference();
    }

  }, 12000);

  // API opcional para cerrar el panel desde la consola.

  window.STARS_CONTROL = {
    close: destroyPanel,
    setCharacter: updateCharacter,
    setCondition: (state) => {

      savedStates[currentCharacter] = state;

      stateSelect.value = state;

      updateCondition(state);

    }
  };

})();
