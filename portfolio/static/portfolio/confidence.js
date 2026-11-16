(() => {
  'use strict';
  const demo = document.querySelector('[data-gate]');
  const distance = document.getElementById('gate-distance');
  const value = document.getElementById('gate-number');
  const result = document.getElementById('gate-result');
  function updateGate() {
    const score = Math.min(1, Math.max(0, 1 - distance.valueAsNumber / 2));
    value.value = distance.valueAsNumber.toFixed(2);
    const percentage = Math.round(score * 1000) / 10;
    result.value = percentage + '% confidence · ' + (score >= .7 ? 'Use the FAQ' : 'Return the fallback');
  }
  distance.addEventListener('input', updateGate);
  updateGate();
  demo.hidden = false;
})();
