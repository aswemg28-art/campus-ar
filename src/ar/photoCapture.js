export function captureLocalPhoto({ video, renderer, scene, camera, onSuccess, onError }) {
  let photoRenderer;
  try {
    if (!video?.videoWidth || !video?.videoHeight) throw new Error('Frame kamera belum tersedia.');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Browser tidak dapat membuat foto.');
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.restore();
    photoRenderer = new renderer.constructor({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    photoRenderer.setPixelRatio(1);
    photoRenderer.setSize(canvas.width, canvas.height, false);
    photoRenderer.setClearColor(0x000000, 0);
    photoRenderer.render(scene, camera);
    context.drawImage(photoRenderer.domElement, 0, 0, canvas.width, canvas.height);
    photoRenderer.dispose();
    photoRenderer.domElement.remove();
    canvas.toBlob((blob) => {
      if (!blob) { onError(new Error('Foto tidak dapat dibuat.')); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).format(new Date()).replaceAll('-', '').replaceAll(':', '').replace(' ', '-');
      link.href = url;
      link.download = `campus-ar-${stamp}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      onSuccess();
    }, 'image/png');
  } catch (error) {
    photoRenderer?.dispose();
    photoRenderer?.domElement.remove();
    onError(error);
  }
}
