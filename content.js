(() => {
  window.__speedControl = { rate: 1.0, sources: [] };

  const origCreateBufferSource = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function () {
    const node = origCreateBufferSource.call(this);
    window.__speedControl.sources.push(new WeakRef(node));
    const origStart = node.start.bind(node);
    node.start = function (...args) {
      node.playbackRate.value = window.__speedControl.rate;
      return origStart(...args);
    };
    return node;
  };

  const applyRate = (rate) => {
    window.__speedControl.rate = rate;
    window.__speedControl.sources = window.__speedControl.sources.filter(ref => {
      const node = ref.deref();
      if (node && node.playbackRate) {
        try { node.playbackRate.value = rate; } catch (e) {}
        return true;
      }
      return false;
    });
    const applyDOM = (root) => {
      root.querySelectorAll('audio, video').forEach(m => m.playbackRate = rate);
      root.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) applyDOM(el.shadowRoot);
      });
    };
    applyDOM(document);
  };

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SPEED_CONTROL_SET') {
      applyRate(e.data.rate);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const host = document.createElement('div');
    host.id = '__speed-ctrl-host';
    host.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;width:0;height:0;pointer-events:none;';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'closed' });

    const saved = localStorage.getItem('__speedCtrlPos');
    const pos = saved ? JSON.parse(saved) : { x: 20, y: 20 };

    const ttPolicy = (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy)
      ? trustedTypes.createPolicy('speedCtrl', { createHTML: s => s })
      : { createHTML: s => s };
    shadow.innerHTML = ttPolicy.createHTML(`
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
      <style>
        :host { all: initial; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .ctrl {
          position: fixed;
          top: ${pos.y}px;
          left: ${pos.x}px;
          font-family: 'DM Sans', -apple-system, sans-serif;
          pointer-events: auto;
          user-select: none;
          -webkit-user-select: none;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 6px 14px 6px 10px;
          cursor: grab;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02);
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .badge:hover { border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .badge:active { cursor: grabbing; }

        .badge-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 0 0 6px rgba(59,130,246,0.3);
          flex-shrink: 0;
        }

        .badge-speed {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }
        .badge-unit {
          font-weight: 400;
          color: #94a3b8;
          font-size: 11px;
        }

        .badge-toggle {
          width: 18px; height: 18px;
          border: none; background: none;
          cursor: pointer; padding: 0;
          display: flex; align-items: center; justify-content: center;
          color: #cbd5e1;
          transition: color 0.15s;
          flex-shrink: 0;
          pointer-events: auto;
        }
        .badge-toggle:hover { color: #94a3b8; }
        .badge-toggle svg { width: 14px; height: 14px; }

        .badge-close {
          width: 18px; height: 18px;
          border: none; background: none;
          cursor: pointer; padding: 0;
          display: flex; align-items: center; justify-content: center;
          color: #e2e8f0;
          transition: color 0.15s;
          flex-shrink: 0;
          pointer-events: auto;
          margin-left: -2px;
        }
        .badge-close:hover { color: #f87171; }
        .badge-close svg { width: 12px; height: 12px; }

        .ctrl.hidden { display: none; }

        .panel {
          margin-top: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02);
          display: none;
          width: 260px;
          animation: panelIn 0.15s ease;
        }
        .panel.open { display: block; }

        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .display {
          text-align: center;
          padding: 8px 0 14px;
        }
        .speed-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 36px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
          letter-spacing: -1px;
        }
        .speed-unit-lg {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          color: #cbd5e1;
          margin-left: 1px;
          vertical-align: super;
        }

        .slider-area { padding: 4px 0 12px; }

        .slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: linear-gradient(145deg, #3b82f6, #2563eb);
          border: none;
          cursor: grab;
          box-shadow: 0 1px 4px rgba(37,99,235,0.3), 0 0 0 2.5px #fff, 0 0 0 3.5px #e2e8f0;
        }
        .slider::-webkit-slider-thumb:active { cursor: grabbing; }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
        }
        .slider-labels span {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #cbd5e1;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
          margin: 8px 0 10px;
        }

        .presets {
          display: flex;
          gap: 5px;
        }
        .preset-btn {
          flex: 1;
          padding: 7px 0;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          background: #f8fafc;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .preset-btn:hover {
          border-color: #cbd5e1;
          color: #334155;
          background: #f1f5f9;
        }
        .preset-btn.active {
          border-color: rgba(59,130,246,0.4);
          color: #2563eb;
          background: rgba(59,130,246,0.06);
        }
        .preset-btn:active { transform: scale(0.95); }
      </style>

      <div class="ctrl">
        <div class="badge" id="badge">
          <div class="badge-dot"></div>
          <span class="badge-speed"><span id="badgeVal">1.0</span><span class="badge-unit">×</span></span>
          <button class="badge-toggle" id="toggleBtn">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
          </button>
          <button class="badge-close" id="closeBtn">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
          </button>
        </div>
        <div class="panel" id="panel">
          <div class="display">
            <span class="speed-value" id="dispVal">1.0</span><span class="speed-unit-lg">×</span>
          </div>
          <div class="slider-area">
            <input type="range" class="slider" id="slider" min="0.25" max="5" step="0.05" value="1">
            <div class="slider-labels">
              <span>0.25</span><span>1.0</span><span>2.5</span><span>5.0</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="presets" id="presets">
            <button class="preset-btn active" data-speed="1">1×</button>
            <button class="preset-btn" data-speed="1.25">1.25×</button>
            <button class="preset-btn" data-speed="1.5">1.5×</button>
            <button class="preset-btn" data-speed="1.75">1.75×</button>
            <button class="preset-btn" data-speed="2">2×</button>
          </div>
        </div>
      </div>
    `);

    const ctrl = shadow.querySelector('.ctrl');
    const badge = shadow.querySelector('#badge');
    const toggleBtn = shadow.querySelector('#toggleBtn');
    const panel = shadow.querySelector('#panel');
    const badgeVal = shadow.querySelector('#badgeVal');
    const dispVal = shadow.querySelector('#dispVal');
    const slider = shadow.querySelector('#slider');
    const presetBtns = shadow.querySelectorAll('.preset-btn');

    const fmtSpeed = (s) => s % 1 === 0 ? s.toFixed(1) : parseFloat(s.toFixed(2)).toString();

    const updateUI = (speed) => {
      badgeVal.textContent = fmtSpeed(speed);
      dispVal.textContent = fmtSpeed(speed);
      slider.value = speed;
      presetBtns.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.speed) === speed));
    };

    const setSpeed = (speed) => {
      updateUI(speed);
      applyRate(speed);
    };

    // Close button
    const closeBtn = shadow.querySelector('#closeBtn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ctrl.classList.add('hidden');
      localStorage.setItem('__speedCtrlVisible', 'false');
    });

    // Restore visibility
    if (localStorage.getItem('__speedCtrlVisible') === 'false') {
      ctrl.classList.add('hidden');
    }

    // Toggle panel
    let panelOpen = false;
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panelOpen = !panelOpen;
      panel.classList.toggle('open', panelOpen);
    });

    // Slider
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      const snaps = [0.5, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
      const snapped = snaps.find(s => Math.abs(val - s) < 0.06);
      setSpeed(snapped !== undefined ? snapped : parseFloat(val.toFixed(2)));
    });

    // Presets
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => setSpeed(parseFloat(btn.dataset.speed)));
    });

    // Drag
    let dragging = false, dragOffset = { x: 0, y: 0 }, hasMoved = false;

    badge.addEventListener('mousedown', (e) => {
      if (e.target === toggleBtn || toggleBtn.contains(e.target)) return;
      dragging = true;
      hasMoved = false;
      const rect = ctrl.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      badge.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      hasMoved = true;
      const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x));
      const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.y));
      ctrl.style.left = x + 'px';
      ctrl.style.top = y + 'px';
      localStorage.setItem('__speedCtrlPos', JSON.stringify({ x, y }));
    });

    window.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        badge.style.cursor = 'grab';
      }
    });

    // Listen for messages from popup
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'SPEED_CONTROL_SET') {
        updateUI(e.data.rate);
      }
      if (e.data && e.data.type === 'SPEED_CONTROL_SHOW') {
        ctrl.classList.remove('hidden');
        localStorage.setItem('__speedCtrlVisible', 'true');
      }
    });
  });
})();
