import { app } from "../../scripts/app.js";
import { getDefaults, updateCache, getSetting } from "./settings-cache.js";
const SIDEBAR_STYLES = ".christmas-sidebar {\n    padding: 12px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    color: #e0e0e0;\n    font-size: 13px;\n    min-width: 200px;\n    background: linear-gradient(180deg,\n            rgba(30, 60, 40, 0.4) 0%,\n            rgba(60, 30, 40, 0.3) 50%,\n            rgba(30, 40, 60, 0.4) 100%);\n    border-radius: 8px;\n}\n\n.christmas-sidebar-header {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    margin-bottom: 16px;\n    padding-bottom: 12px;\n    border-bottom: 1px solid rgba(255, 100, 100, 0.3);\n}\n\n.christmas-sidebar-header h2 {\n    margin: 0;\n    font-size: 18px;\n    font-weight: 600;\n    background: linear-gradient(135deg, #ff4444, #ff6b6b, #44ff44, #66ff66);\n    background-size: 200% 200%;\n    animation: christmas-shimmer 3s ease infinite;\n    -webkit-background-clip: text;\n    -webkit-text-fill-color: transparent;\n    background-clip: text;\n}\n\n@keyframes christmas-shimmer {\n\n    0%,\n    100% {\n        background-position: 0% 50%;\n    }\n\n    50% {\n        background-position: 100% 50%;\n    }\n}\n\n.christmas-sidebar-section {\n    margin-bottom: 16px;\n    background: linear-gradient(135deg,\n            rgba(139, 69, 69, 0.15) 0%,\n            rgba(34, 139, 34, 0.1) 100%);\n    border-radius: 8px;\n    padding: 12px;\n    border: 1px solid rgba(255, 100, 100, 0.15);\n    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\n    overflow: hidden;\n}\n\n.christmas-sidebar-section-title {\n    font-size: 14px;\n    font-weight: 600;\n    margin-bottom: 12px;\n    color: #fff;\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\n}\n\n.christmas-setting-row {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: space-between;\n    align-items: center;\n    padding: 8px 0;\n    gap: 8px;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n\n.christmas-setting-row:last-child {\n    border-bottom: none;\n}\n\n.christmas-setting-label {\n    font-size: 12px;\n    color: #ccc;\n    flex: 1 1 auto;\n    min-width: 80px;\n}\n\n.christmas-toggle {\n    position: relative;\n    width: 40px;\n    height: 22px;\n    min-width: 40px;\n    background: #333;\n    border-radius: 11px;\n    cursor: pointer;\n    transition: background 0.2s;\n    border: 1px solid #555;\n    flex-shrink: 0;\n}\n\n.christmas-toggle.active {\n    background: linear-gradient(135deg, #228B22, #32CD32);\n    border-color: #32CD32;\n    box-shadow: 0 0 8px rgba(50, 205, 50, 0.5);\n}\n\n.christmas-toggle:focus-visible {\n    outline: 2px solid #fff;\n    outline-offset: 2px;\n    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);\n}\n\n.christmas-toggle::after {\n    content: '';\n    position: absolute;\n    width: 18px;\n    height: 18px;\n    background: #fff;\n    border-radius: 50%;\n    top: 1px;\n    left: 1px;\n    transition: transform 0.2s;\n    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);\n}\n\n.christmas-toggle.active::after {\n    transform: translateX(18px);\n}\n\n.christmas-select {\n    background: rgba(42, 42, 42, 0.9);\n    color: #e0e0e0;\n    border: 1px solid rgba(139, 69, 69, 0.4);\n    border-radius: 6px;\n    padding: 6px 8px;\n    font-size: 11px;\n    cursor: pointer;\n    min-width: 100px;\n    max-width: 100%;\n    flex: 1 1 100px;\n}\n\n.christmas-select:hover {\n    border-color: rgba(50, 205, 50, 0.5);\n}\n\n.christmas-select:focus {\n    outline: none;\n    border-color: #32CD32;\n    box-shadow: 0 0 4px rgba(50, 205, 50, 0.3);\n}\n\n.christmas-slider-row {\n    display: flex;\n    flex-direction: column;\n    width: 100%;\n    gap: 4px;\n}\n\n.christmas-slider-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    width: 100%;\n}\n\n.christmas-slider-container {\n    display: flex;\n    align-items: center;\n    width: 100%;\n}\n\n.christmas-slider {\n    flex: 1;\n    height: 4px;\n    background: linear-gradient(90deg, #8B4545, #228B22);\n    border-radius: 2px;\n    -webkit-appearance: none;\n    appearance: none;\n    cursor: pointer;\n}\n\n.christmas-slider::-webkit-slider-thumb {\n    -webkit-appearance: none;\n    width: 14px;\n    height: 14px;\n    background: linear-gradient(135deg, #ff4444, #cc0000);\n    border-radius: 50%;\n    cursor: pointer;\n    box-shadow: 0 0 6px rgba(255, 68, 68, 0.5);\n}\n\n.christmas-slider::-moz-range-thumb {\n    width: 14px;\n    height: 14px;\n    background: linear-gradient(135deg, #ff4444, #cc0000);\n    border-radius: 50%;\n    cursor: pointer;\n    border: none;\n    box-shadow: 0 0 6px rgba(255, 68, 68, 0.5);\n}\n\n.christmas-slider-value {\n    font-size: 11px;\n    color: #66ff66;\n    font-weight: 500;\n}\n\n.christmas-footer {\n    margin-top: 16px;\n    padding-top: 12px;\n    border-top: 1px solid rgba(255, 100, 100, 0.2);\n    text-align: center;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n    align-items: center;\n}\n\n.christmas-footer a {\n    color: #ff6b6b;\n    text-decoration: none;\n    font-size: 11px;\n    transition: color 0.2s;\n}\n\n.christmas-footer a:hover {\n    color: #66ff66;\n    text-decoration: underline;\n}\n\n.christmas-reset-btn {\n    background: transparent;\n    border: 1px solid rgba(255, 100, 100, 0.3);\n    color: #aaa;\n    border-radius: 4px;\n    cursor: pointer;\n    padding: 4px 12px;\n    font-size: 11px;\n    transition: all 0.2s;\n}\n\n.christmas-reset-btn:hover {\n    color: #fff;\n    border-color: #ff6b6b;\n    background: rgba(255, 100, 100, 0.1);\n}\n\n.christmas-upload-btn {\n    background: #444;\n    border: 1px solid #666;\n    color: #fff;\n    border-radius: 4px;\n    cursor: pointer;\n    padding: 2px 6px;\n    font-size: 14px;\n}\n\n.christmas-upload-btn:hover {\n    background: #555;\n    border-color: #888;\n}\n/* Accessibility Focus States */\n.christmas-reset-btn:focus-visible,\n.christmas-upload-btn:focus-visible,\n.christmas-footer a:focus-visible {\n    outline: 2px solid #32CD32;\n    outline-offset: 2px;\n    box-shadow: 0 0 4px rgba(50, 205, 50, 0.5);\n}\n\n.christmas-slider:focus-visible {\n    outline: 2px solid #32CD32;\n    outline-offset: 2px;\n    box-shadow: 0 0 4px rgba(50, 205, 50, 0.5);\n}\n";
function el(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) continue;
    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (key === "dataset" && typeof value === "object") {
      Object.assign(element.dataset, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.toLowerCase().substring(2);
      element.addEventListener(eventName, value);
    } else {
      element[key] = value;
    }
  }
  children.flat().forEach((child) => {
    if (child === null || child === void 0) return;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
}
const SETTINGS_CONFIG = {
  background: {
    title: "🌌 Background",
    settings: [
      {
        id: "ChristmasTheme.Background.Enabled",
        label: "🌟 Background Effect",
        type: "toggle"
      },
      {
        id: "ChristmasTheme.Background.ColorTheme",
        label: "🎨 Color Theme",
        type: "select",
        options: [
          { value: "classic", text: "🌌 Classic Night" },
          { value: "christmas", text: "🎄 Christmas Forest" },
          { value: "candycane", text: "🍬 Candy Cane Red" },
          { value: "frostnight", text: "❄️ Frost Night" },
          { value: "gingerbread", text: "🍪 Gingerbread" },
          { value: "darknight", text: "🌑 Dark Night" }
        ]
      },
      {
        id: "ChristmasTheme.Background.Stars",
        label: "⭐ Background Stars",
        type: "toggle"
      },
      {
        id: "ChristmasTheme.Background.ShootingStars",
        label: "☄️ Shooting Stars",
        type: "toggle"
      },
      {
        id: "ChristmasTheme.Background.PartyMode",
        label: "🪩 Party Mode",
        type: "toggle"
      },
      {
        id: "ChristmasTheme.Background.Fireworks",
        label: "🎆 Fireworks",
        type: "toggle"
      },
      {
        id: "ChristmasTheme.Background.Countdown",
        label: "🎊 New Year Countdown",
        type: "toggle"
      },
      {
        id: "ChristmasTheme.Background.MouseEffect",
        label: "✨ Mouse Trail",
        type: "select",
        options: [
          { value: "none", text: "⭘ Off" },
          { value: "sparkler", text: "✨ Sparkler" },
          { value: "snowflake", text: "❄️ Snowflake" },
          { value: "confetti", text: "🎊 Confetti" },
          { value: "stardust", text: "⭐ Stardust" },
          { value: "comet", text: "☄️ Comet" },
          { value: "aurora", text: "🌌 Aurora" },
          { value: "ribbon", text: "🎀 Ribbon" },
          { value: "crystal", text: "💎 Crystal" },
          { value: "petals", text: "🌸 Petals" },
          { value: "gifts", text: "🎁 Gifts" },
          { value: "candy", text: "🍬 Candy" },
          { value: "orb", text: "🔮 Magic Orb" },
          { value: "magic", text: "✨ Magic Wand" },
          { value: "nova", text: "🌟 Nova" },
          { value: "bubbles", text: "💧 Bubbles" },
          { value: "embers", text: "🔥 Embers" },
          { value: "lightning", text: "⚡ Lightning" },
          { value: "leaves", text: "🍂 Leaves" },
          { value: "wishes", text: "💫 Wishes" },
          { value: "notes", text: "🎵 Notes" },
          { value: "hearts", text: "💖 Hearts" }
        ]
      }
    ]
  },
  lights: {
    title: "🎄 Christmas Lights",
    settings: [
      {
        id: "ChristmasTheme.ChristmasEffects.LightSwitch",
        label: "🎄 Christmas Lights",
        type: "toggle",
        trueValue: 1,
        falseValue: 0
      },
      {
        id: "ChristmasTheme.ChristmasEffects.ColorScheme",
        label: "🎨 Color Scheme",
        type: "select",
        options: [
          { value: "traditional", text: "🎄 Traditional" },
          { value: "warm", text: "🔆 Warm White" },
          { value: "cool", text: "❄️ Cool White" },
          { value: "multicolor", text: "🌈 Multicolor" },
          { value: "pastel", text: "🎀 Pastel" },
          { value: "newyear", text: "🎉 New Year's Eve" }
        ]
      },
      {
        id: "ChristmasTheme.ChristmasEffects.Twinkle",
        label: "✨ Light Effect",
        type: "select",
        options: [
          { value: "steady", text: "Steady" },
          { value: "gentle", text: "Gentle Twinkle" },
          { value: "sparkle", text: "Sparkle" },
          { value: "candycane", text: "🍬 Candy Cane" },
          { value: "frost", text: "❄️ Frost Trail" },
          { value: "aurora", text: "🌌 Aurora Flow" }
        ]
      },
      {
        id: "ChristmasTheme.ChristmasEffects.BulbShape",
        label: "💡 Bulb Shape",
        type: "select",
        options: [
          { value: "classic", text: "🔴 Classic Round" },
          { value: "icicle", text: "❄️ Icicle Point" }
        ]
      },
      {
        id: "ChristmasTheme.ChristmasEffects.Direction",
        label: "🔄 Flow Direction",
        type: "select",
        tooltip: "If not animating properly, refresh the page",
        options: [
          { value: -1, text: "Forward ➡️" },
          { value: 1, text: "Reverse ⬅️" }
        ]
      },
      {
        id: "ChristmasTheme.ChristmasEffects.Thickness",
        label: "💫 Light Size",
        type: "slider",
        min: 1,
        max: 10,
        step: 0.5
      },
      {
        id: "ChristmasTheme.ChristmasEffects.GlowIntensity",
        label: "✨ Glow Intensity",
        type: "slider",
        min: 0,
        max: 30,
        step: 1
      },
      {
        id: "ChristmasTheme.Link Style",
        label: "🔗 Link Style",
        type: "select",
        options: [
          { value: "spline", text: "Spline" },
          { value: "straight", text: "Straight" },
          { value: "linear", text: "Linear" },
          { value: "hidden", text: "Hidden" }
        ]
      }
    ]
  },
  snow: {
    title: "❄️ Snow Effect",
    settings: [
      {
        id: "ChristmasTheme.Snowflake.Enabled",
        label: "❄️ Snow Effect",
        type: "toggle",
        trueValue: 1,
        falseValue: 0
      },
      {
        id: "ChristmasTheme.Snowflake.ColorScheme",
        label: "🎨 Snowflake Color",
        type: "select",
        options: [
          { value: "white", text: "❄️ Classic White" },
          { value: "blue", text: "💠 Ice Blue" },
          { value: "rainbow", text: "🌈 Rainbow" },
          { value: "white", text: "❄️ Classic White" },
          { value: "blue", text: "💠 Ice Blue" },
          { value: "rainbow", text: "🌈 Rainbow" },
          { value: "match", text: "🎨 Match Lights" },
          { value: "newyear", text: "🎉 New Year's Eve" }
        ]
      },
      {
        id: "ChristmasTheme.Snowflake.Type",
        label: "💠 Snowflake Shape",
        type: "select",
        options: [
          { value: "random", text: "🎲 Random Mix" },
          { value: "classic", text: "❄️ Classic" },
          { value: "simple", text: "❅ Simple" },
          { value: "bold", text: "❆ Bold" },
          { value: "custom", text: "📁 Custom Image" },
          { value: "mix_custom", text: "🎲 Mix Custom + Standard" }
        ]
      },
      {
        id: "ChristmasTheme.Snowflake.Glow",
        label: "✨ Snowflake Glow",
        type: "slider",
        min: 0,
        max: 20,
        step: 1
      }
    ]
  },
  performance: {
    title: "⚡ Performance",
    settings: [
      {
        id: "ChristmasTheme.PauseDuringRender",
        label: "⏸️ Pause During Render",
        type: "toggle"
      }
    ]
  }
};
async function optimizeImage(dataUrl, maxSize = 128) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL("image/webp", 0.85);
      if (!result.startsWith("data:image/webp")) {
        result = canvas.toDataURL("image/png");
      }
      resolve(result);
    };
    img.onerror = () => {
      console.error("Failed to load image for optimization - invalid image data");
      resolve(null);
    };
    img.src = dataUrl;
  });
}
function handleFileUpload(callback) {
  const input = el("input", { type: "file", accept: "image/*" });
  input.onchange = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Invalid file type! Please select an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large! Please select an image under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      var _a2;
      const res = (_a2 = evt.target) == null ? void 0 : _a2.result;
      if (res) {
        optimizeImage(res).then((optimized) => {
          if (optimized) {
            console.log(`🎨 Image optimized: ${Math.round(res.length / 1024)}KB → ${Math.round(optimized.length / 1024)}KB`);
            callback(optimized);
          } else {
            alert("Failed to process image. The file may be corrupted or invalid.");
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
function createToggle(settingConfig) {
  const trueValue = settingConfig.trueValue ?? true;
  const falseValue = settingConfig.falseValue ?? false;
  const currentValue = getSetting(settingConfig.id);
  const isActive = currentValue === trueValue || currentValue === true || currentValue === 1;
  const handleToggle = (t) => {
    var _a, _b, _c;
    const wasActive = t.classList.contains("active");
    const newValue = wasActive ? falseValue : trueValue;
    t.classList.toggle("active");
    t.ariaChecked = String(!wasActive);
    updateCache(settingConfig.id, newValue);
    (_b = (_a = app.ui) == null ? void 0 : _a.settings) == null ? void 0 : _b.setSettingValue(settingConfig.id, newValue);
    (_c = app.canvas) == null ? void 0 : _c.setDirty(true, true);
  };
  return el("div", {
    className: `christmas-toggle ${isActive ? "active" : ""}`,
    role: "switch",
    ariaChecked: String(isActive),
    ariaLabel: settingConfig.label,
    title: settingConfig.tooltip || "",
    tabIndex: 0,
    onClick: (e) => {
      handleToggle(e.currentTarget);
    },
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle(e.currentTarget);
      }
    }
  });
}
function createSelect(settingConfig) {
  const currentValue = getSetting(settingConfig.id);
  const options = (settingConfig.options || []).map(
    (opt) => el("option", {
      value: String(opt.value),
      selected: String(opt.value) === String(currentValue)
    }, [opt.text])
  );
  const select = el("select", {
    className: "christmas-select",
    ariaLabel: settingConfig.label,
    title: settingConfig.tooltip || "",
    onChange: (e) => {
      var _a, _b, _c;
      const sel = e.target;
      let value = sel.value;
      if (!isNaN(Number(value)) && value !== "") {
        value = Number(value);
      }
      updateCache(settingConfig.id, value);
      (_b = (_a = app.ui) == null ? void 0 : _a.settings) == null ? void 0 : _b.setSettingValue(settingConfig.id, value);
      (_c = app.canvas) == null ? void 0 : _c.setDirty(true, true);
      if (value === "custom" || value === "mix_custom") {
        const uploadBtn = sel.nextElementSibling;
        if (uploadBtn) {
          uploadBtn.style.display = "block";
          const imageKey = settingConfig.id.replace(/(Type|ColorTheme)$/, "CustomImage");
          if (!getSetting(imageKey)) {
            uploadBtn.click();
          }
        }
      } else {
        const uploadBtn = sel.nextElementSibling;
        if (uploadBtn) uploadBtn.style.display = "none";
      }
    }
  }, options);
  if (settingConfig.id === "ChristmasTheme.Snowflake.Type") {
    const uploadBtn = el("button", {
      textContent: "📁",
      className: "christmas-upload-btn",
      title: "Upload Custom Snowflake",
      ariaLabel: "Upload Custom Snowflake",
      style: { display: currentValue === "custom" || currentValue === "mix_custom" ? "block" : "none" },
      onClick: () => handleFileUpload((b64) => {
        var _a, _b, _c;
        const imageKey = settingConfig.id.replace(/(Type|ColorTheme)$/, "CustomImage");
        updateCache(imageKey, b64);
        (_b = (_a = app.ui) == null ? void 0 : _a.settings) == null ? void 0 : _b.setSettingValue(imageKey, b64);
        (_c = app.canvas) == null ? void 0 : _c.setDirty(true, true);
      })
    });
    return el("div", { style: { display: "flex", gap: "4px", alignItems: "center", width: "100%" } }, [
      select,
      uploadBtn
    ]);
  }
  return select;
}
function createSettingRow(settingConfig) {
  if (settingConfig.type === "slider") {
    const currentVal = getSetting(settingConfig.id) || settingConfig.min || 0;
    const valueLabel = el("span", { className: "christmas-slider-value" }, [String(currentVal)]);
    const slider = el("input", {
      type: "range",
      className: "christmas-slider",
      ariaLabel: settingConfig.label,
      title: settingConfig.tooltip || "",
      min: String(settingConfig.min || 0),
      max: String(settingConfig.max || 100),
      step: String(settingConfig.step || 1),
      value: String(currentVal),
      onInput: (e) => {
        var _a, _b, _c;
        const val = parseFloat(e.target.value);
        valueLabel.textContent = String(val);
        updateCache(settingConfig.id, val);
        (_b = (_a = app.ui) == null ? void 0 : _a.settings) == null ? void 0 : _b.setSettingValue(settingConfig.id, val);
        (_c = app.canvas) == null ? void 0 : _c.setDirty(true, true);
      }
    });
    return el("div", { className: "christmas-setting-row" }, [
      el("div", { className: "christmas-slider-row" }, [
        el("div", { className: "christmas-slider-header" }, [
          el("span", { className: "christmas-setting-label", title: settingConfig.tooltip || "" }, [settingConfig.label]),
          valueLabel
        ]),
        el("div", { className: "christmas-slider-container" }, [slider])
      ])
    ]);
  }
  let control;
  switch (settingConfig.type) {
    case "toggle":
      control = createToggle(settingConfig);
      break;
    case "select":
      control = createSelect(settingConfig);
      break;
    default:
      control = el("span", {}, ["Unknown type"]);
  }
  return el("div", { className: "christmas-setting-row" }, [
    el("span", { className: "christmas-setting-label" }, [settingConfig.label]),
    control
  ]);
}
function createSection(sectionKey, sectionConfig) {
  const title = el("div", { className: "christmas-sidebar-section-title" }, [sectionConfig.title]);
  const settings = sectionConfig.settings.map((s) => createSettingRow(s));
  return el("div", { className: "christmas-sidebar-section" }, [
    title,
    ...settings
  ]);
}
function renderSidebar(elRoot) {
  elRoot.innerHTML = "";
  const styleEl = document.createElement("style");
  styleEl.textContent = SIDEBAR_STYLES;
  const sections = Object.entries(SETTINGS_CONFIG).map(
    ([key, config]) => createSection(key, config)
  );
  const footer = el("div", { className: "christmas-footer" }, [
    el("button", {
      className: "christmas-reset-btn",
      ariaLabel: "Reset all settings to default",
      title: "Reset all settings to default",
      onClick: () => {
        var _a;
        if (confirm("Are you sure you want to reset all Christmas Theme settings to defaults?")) {
          const defaults = getDefaults();
          Object.entries(defaults).forEach(([key, value]) => {
            var _a2, _b;
            updateCache(key, value);
            (_b = (_a2 = app.ui) == null ? void 0 : _a2.settings) == null ? void 0 : _b.setSettingValue(key, value);
          });
          (_a = app.canvas) == null ? void 0 : _a.setDirty(true, true);
          renderSidebar(elRoot);
        }
      }
    }, ["↺ Reset Defaults"]),
    el("a", {
      href: "https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme",
      target: "_blank",
      rel: "noopener noreferrer",
      ariaLabel: "Visit GitHub repository (opens in a new tab)"
    }, ["🎁 GitHub"])
  ]);
  const container = el("div", { className: "christmas-sidebar" }, [
    styleEl,
    // Styles inside container
    el("div", { className: "christmas-sidebar-header" }, [
      el("h2", {}, ["🎄 Christmas Theme"])
    ]),
    ...sections,
    footer
  ]);
  elRoot.appendChild(container);
}
app.registerExtension({
  name: "Christmas.Theme.Sidebar",
  async setup() {
    setTimeout(() => {
      if (app.extensionManager && app.extensionManager.registerSidebarTab) {
        app.extensionManager.registerSidebarTab({
          id: "christmas-theme",
          icon: "pi pi-gift",
          title: "Christmas",
          tooltip: "Christmas Theme Settings",
          type: "custom",
          render: renderSidebar
        });
        console.log("🎄 Christmas Theme sidebar tab registered");
      } else {
        console.warn("⚠️ Extension manager not available for sidebar registration");
      }
    }, 100);
  }
});
export {
  optimizeImage
};
//# sourceMappingURL=christmas-sidebar.js.map
