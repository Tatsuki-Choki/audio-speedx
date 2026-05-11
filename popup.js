const display = document.getElementById('speedDisplay');
const slider = document.getElementById('speedSlider');
const presets = document.querySelectorAll('.preset-btn');
const resetBtn = document.getElementById('resetBtn');

const changeSpeed = (speed) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (s) => {
        window.postMessage({ type: 'SPEED_CONTROL_SET', rate: s }, '*');
      },
      args: [speed]
    });
  });
};

const updateUI = (speed) => {
  display.textContent = speed % 1 === 0 ? speed.toFixed(1) : parseFloat(speed.toFixed(2)).toString();
  slider.value = speed;
  presets.forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
  });
};

const applySpeed = (speed) => {
  updateUI(speed);
  changeSpeed(speed);
};

slider.addEventListener('input', () => {
  const val = parseFloat(slider.value);
  const snaps = [0.5, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
  const snapped = snaps.find(s => Math.abs(val - s) < 0.06);
  applySpeed(snapped !== undefined ? snapped : parseFloat(val.toFixed(2)));
});

presets.forEach(btn => {
  btn.addEventListener('click', () => applySpeed(parseFloat(btn.dataset.speed)));
});

resetBtn.addEventListener('click', () => applySpeed(1.0));

document.getElementById('showFloating').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        window.postMessage({ type: 'SPEED_CONTROL_SHOW' }, '*');
      }
    });
  });
});
