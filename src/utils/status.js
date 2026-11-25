export function createStatusUI() {
  const status = document.querySelector('#tracking-state');
  const text = document.querySelector('#status-text');
  const label = document.querySelector('#live-label');
  const card = document.querySelector('#permission-card');
  const errorTitle = document.querySelector('#error-title');
  const errorMessage = document.querySelector('#error-message');
  const loading = document.querySelector('#loading-overlay');
  const loadingText = document.querySelector('#loading-text');
  const startButton = document.querySelector('#start-camera');
  const capture = document.querySelector('#capture-photo');
  const hint = document.querySelector('#capture-hint');

  return {
    setStatus(message, kind = 'idle', accessoryReady = false) {
      text.textContent = message;
      status.dataset.state = kind;
      label.textContent = kind === 'found' ? 'FACE DETECTED' : kind === 'search' ? 'FIND YOUR LIGHT' : kind === 'error' ? 'STUDIO PAUSED' : 'STUDIO READY';
      capture.disabled = kind !== 'found' || !accessoryReady;
      hint.textContent = kind === 'found' ? (accessoryReady ? 'Siap? Abadikan momennya' : 'Menyiapkan aksesori…') : kind === 'error' ? 'Periksa izin kamera lalu coba lagi' : 'Posisikan wajah di dalam bingkai';
    },
    showLoading(message) { loading.hidden = false; loadingText.textContent = message; startButton.hidden = true; },
    hideLoading() { loading.hidden = true; },
    showError(title, message) { card.hidden = false; errorTitle.textContent = title; errorMessage.textContent = message; startButton.hidden = true; this.setStatus('Kamera tidak tersedia', 'error'); },
    clearError() { card.hidden = true; },
    showStart() { startButton.hidden = false; },
  };
}
