import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';

export async function loadAccessory(filter, parent) {
  const loader = new GLTFLoader();
  const assetUrl = `${import.meta.env.BASE_URL}${filter.model}`;
  const gltf = await loader.loadAsync(assetUrl);
  const root = gltf.scene;
  root.position.set(...filter.position);
  root.rotation.set(...filter.rotation);
  root.scale.set(...filter.scale);
  root.traverse((node) => {
    if (node.isMesh) {
      node.frustumCulled = false;
      if (node.material) {
        node.material.side = 2;
        node.material.needsUpdate = true;
      }
    }
  });
  parent.add(root);
  let mixer = null;
  if (filter.animated && gltf.animations.length) {
    mixer = new AnimationMixer(root);
    const clip = gltf.animations.find(item => item.name.toLowerCase() === (filter.animationName || '').toLowerCase()) || gltf.animations[0];
    mixer.clipAction(clip).play();
  }
  return {
    root,
    mixer,
    update(delta) { mixer?.update(delta); },
    dispose() {
      parent.remove(root);
      mixer?.stopAllAction();
      root.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry.dispose();
        if (Array.isArray(node.material)) node.material.forEach(material => material.dispose());
        else node.material?.dispose();
      });
    },
  };
}
