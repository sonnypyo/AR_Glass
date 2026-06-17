(function () {
  "use strict";

  const allowedDirections = new Set(["FRONT", "BACK", "LEFT", "RIGHT", "UNKNOWN"]);
  const storageKey = "voice-direction-glass.latestCue.v1";
  const surface = document.querySelector(".cue-surface");
  const directionLabel = document.getElementById("directionLabel");
  const confidenceLabel = document.getElementById("confidenceLabel");
  const sourceLabel = document.getElementById("sourceLabel");
  const cueTime = document.getElementById("cueTime");
  const buttons = Array.from(document.querySelectorAll("[data-direction]"));

  function normalizeDirection(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return allowedDirections.has(normalized) ? normalized : "UNKNOWN";
  }

  function normalizeConfidence(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(1, parsed));
  }

  function sanitizeSource(value) {
    const fallback = "LOCAL";
    if (!value) return fallback;
    return String(value)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 18) || fallback;
  }

  function formatConfidence(confidence) {
    if (confidence === null) return "CONFIDENCE WAITING";
    if (confidence >= 0.75) return "CONFIDENCE HIGH";
    if (confidence >= 0.45) return "CONFIDENCE MEDIUM";
    return "CONFIDENCE LOW";
  }

  function formatTime(isoTimestamp) {
    const date = isoTimestamp ? new Date(isoTimestamp) : new Date();
    if (Number.isNaN(date.getTime())) return "NOW";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function saveCue(cue) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cue));
    } catch (_) {
      // Local storage is optional on glasses; rendering should keep working.
    }
  }

  function loadStoredCue() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function readInitialCue() {
    const params = new URLSearchParams(window.location.search);
    const paramDirection = params.get("direction");
    const paramConfidence = params.get("confidence");
    const paramSource = params.get("source");
    const stored = loadStoredCue();

    if (paramDirection || paramConfidence || paramSource) {
      return {
        direction: normalizeDirection(paramDirection),
        confidence: normalizeConfidence(paramConfidence),
        source: sanitizeSource(paramSource || "URL"),
        timestamp: new Date().toISOString()
      };
    }

    if (stored && typeof stored === "object") {
      return {
        direction: normalizeDirection(stored.direction),
        confidence: normalizeConfidence(stored.confidence),
        source: sanitizeSource(stored.source),
        timestamp: stored.timestamp || new Date().toISOString()
      };
    }

    return {
      direction: "UNKNOWN",
      confidence: null,
      source: "LOCAL",
      timestamp: new Date().toISOString()
    };
  }

  function renderCue(cue) {
    surface.dataset.direction = cue.direction;
    directionLabel.textContent = cue.direction;
    confidenceLabel.textContent = formatConfidence(cue.confidence);
    sourceLabel.textContent = sanitizeSource(cue.source);
    cueTime.textContent = formatTime(cue.timestamp);

    buttons.forEach((button) => {
      const isActive = button.dataset.direction === cue.direction;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    saveCue(cue);
  }

  function setDirection(direction, source) {
    renderCue({
      direction: normalizeDirection(direction),
      confidence: source === "URL" ? null : 0.65,
      source: sanitizeSource(source || "MANUAL"),
      timestamp: new Date().toISOString()
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setDirection(button.dataset.direction, "DPAD");
      button.focus();
    });
  });

  document.addEventListener("keydown", (event) => {
    const keyMap = {
      ArrowUp: "FRONT",
      ArrowDown: "BACK",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      " ": "UNKNOWN",
      Enter: "UNKNOWN"
    };
    const direction = keyMap[event.key];
    if (!direction) return;
    event.preventDefault();
    setDirection(direction, "KEYS");
  });

  renderCue(readInitialCue());
})();
