import './ui/controls.js';
import * as THREE from 'three';
import filtersDocument from './data/filters.json';
import { loadAccessory } from './ar/modelLoader.js';
import { captureLocalPhoto } from './ar/photoCapture.js';
import { createStatusUI } from './utils/status.js';

const ui = createStatusUI();
const container = document.querySelector('#ar-container');
const filterList = document.querySelector('#filter-list');
const toast = document.querySelector('#toast');
let ar = null;
let anchors = new Map();
let activeAccessory = null;
let filterLoadToken = 0;
let activeFilterId = localStorage.getItem('campus-ar-filter') || filtersDocument.filters[0].id;
let hasFace = false;
let toastTimer;
const clock = new THREE.Clock();

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}
function renderFilters() {
  filterList.replaceChildren(...filtersDocument.filters.map((filter, index) => {
    const button = document.createElement('button');
    button.className = 'filter-card';
    button.type = 'button';
    button.dataset.filter = filter.id;
    button.setAttribute('aria-pressed', String(filter.id === activeFilterId));
    button.innerHTML = `<span class="filter-visual ${filter.id}" aria-hidden="true"><i></i><b></b><em></em></span><span class="filter-card-copy"><span class="filter-tag">${index === 0 ? 'THE CLASSIC' : 'A LITTLE EXTRA'}</span><strong>${filter.name}</strong><small>${filter.description}</small></span><span class="filter-check" aria-hidden="true">✓</span>`;
    button.addEventListener('click', () => selectFilter(filter.id));
    return button;
  }));
}
function updateFilterState() {
  filterList.querySelectorAll('.filter-card').forEach(button => {
    const selected = button.dataset.filter === activeFilterId;
    button.setAttribute('aria-pressed', String(selected));
  });
  const index = filtersDocument.filters.findIndex(filter => filter.id === activeFilterId) + 1;
  document.querySelector('.stage-count').innerHTML = `0${index} <i>/</i> 0${filtersDocument.filters.length}`;
}
async function selectFilter(id) {
  const filter = filtersDocument.filters.find(item => item.id === id);
  if (!filter) return;
  activeFilterId = id;
  localStorage.setItem('campus-ar-filter', id);
  updateFilterState();
  if (!ar) { notify(`${filter.name} dipilih. Mulai studio untuk mencoba.`); return; }
  const token = ++filterLoadToken;
  activeAccessory?.dispose();
  activeAccessory = null;
  if (hasFace) ui.setStatus('Wajah terdeteksi', 'found', false);
  try {
    const anchor = anchors.get(id);
    const loaded = await loadAccessory(filter, anchor.group);
    if (token !== filterLoadToken) { loaded.dispose(); return; }
    activeAccessory = loaded;
    if (hasFace) ui.setStatus('Wajah terdeteksi', 'found', true);
    notify(`${filter.name} siap dipakai`);
  } catch (error) {
    if (token !== filterLoadToken) return;
    console.error('Accessory load failed', error);
    notify(`Model ${filter.name} gagal dimuat. Coba muat ulang.`);
  }
}
function classifyCameraError(error) {
  if (!navigator.mediaDevices?.getUserMedia) return ['Kamera tidak didukung', 'Buka tautan HTTPS di browser terbaru. Kamera memerlukan koneksi aman.'];
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') return ['Izin kamera ditolak', 'Aktifkan izin kamera untuk situs ini melalui pengaturan browser, lalu pilih “Coba lagi”.'];
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return ['Kamera tidak ditemukan', 'Pastikan perangkat memiliki kamera yang dapat digunakan, lalu coba lagi.'];
  if (error?.name === 'NotReadableError' || error?.name === 'AbortError') return ['Kamera sedang digunakan', 'Tutup aplikasi lain yang memakai kamera, lalu pilih “Coba lagi”.'];
  return ['Kamera belum dapat dibuka', 'Pastikan izin kamera aktif dan halaman dibuka melalui HTTPS, lalu coba lagi.'];
}
async function startExperience() {
  if (ar) return;
  ui.clearError();
  ui.showLoading('Meminta izin kamera…');
  ui.setStatus('Meminta izin kamera', 'search');
  try {
    const { MindARThree } = await import('mind-ar/dist/mindar-face-three.prod.js');
    const mindar = new MindARThree({ container, uiLoading: 'no', uiScanning: 'no', uiError: 'no', filterMinCF: 0.0001, filterBeta: 0.001 });
    const { renderer, scene, camera } = mindar;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.zIndex = '1';
    scene.add(new THREE.HemisphereLight(0xfff7e8, 0x25463b, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(0.2, 1, 1.5);
    scene.add(keyLight);
    anchors = new Map(filtersDocument.filters.map(filter => [filter.id, mindar.addAnchor(filter.anchor)]));
    ar = mindar;
    await mindar.start();
    ui.setStatus('Mencari wajah…', 'search');
    container.classList.add('camera-active');
    await selectFilter(activeFilterId);
    mindar.renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      activeAccessory?.update(delta);
      const found = Boolean(mindar.getLatestEstimate());
      if (found !== hasFace) {
        hasFace = found;
        ui.setStatus(found ? 'Wajah terdeteksi' : 'Mencari wajah…', found ? 'found' : 'search', Boolean(activeAccessory));
      }
      renderer.render(scene, camera);
    });
    ui.hideLoading();
  } catch (error) {
    console.error('AR start failed', error);
    if (ar) {
      try { ar.stop(); } catch { /* startup may not have created a camera stream */ }
      ar.renderer.setAnimationLoop(null);
      ar.renderer.domElement.remove();
      ar.cssRenderer?.domElement.remove();
      ar = null;
    }
    container.classList.remove('camera-active');
    ui.hideLoading();
    const [title, message] = classifyCameraError(error);
    ui.showError(title, message);
  }
}
function capturePhoto() {
  if (!ar || !hasFace) return;
  captureLocalPhoto({
    video: ar.video,
    renderer: ar.renderer,
    scene: ar.scene,
    camera: ar.camera,
    onSuccess: () => notify('Foto tersimpan di perangkatmu'),
    onError: (error) => { console.error('Photo capture failed', error); notify('Foto gagal dibuat. Coba lagi.'); },
  });
}
renderFilters();
updateFilterState();
document.querySelector('#start-camera').addEventListener('click', startExperience);
document.querySelector('#retry-camera').addEventListener('click', startExperience);
document.querySelector('#capture-photo').addEventListener('click', capturePhoto);
document.querySelector('#save-info').addEventListener('click', () => notify('Foto PNG diunduh langsung ke perangkat. Tidak ada unggahan.'));
window.addEventListener('beforeunload', () => {
  activeAccessory?.dispose();
  if (ar) { ar.renderer.setAnimationLoop(null); ar.stop(); }
});

