import fs from 'node:fs';
import path from 'node:path';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const root = process.cwd();
const filters = JSON.parse(fs.readFileSync(path.join(root, 'src/data/filters.json'), 'utf8'));
const expected = ['three@0.175.0', 'mind-ar@1.2.5', 'vite@6.4.6'];
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
for (const item of expected) {
  const [name, version] = item.split('@');
  const installed = pkg.packages[`node_modules/${name}`]?.version;
  if (installed !== version) throw new Error(`${name}: expected ${version}, found ${installed}`);
}
for (const filter of filters.filters) {
  const model = path.join(root, 'public', filter.model);
  if (!fs.existsSync(model)) throw new Error(`Missing GLB: ${model}`);
  const buffer = fs.readFileSync(model);
  if (buffer.toString('ascii',0,4) !== 'glTF' || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) throw new Error(`Invalid GLB header: ${filter.model}`);
  const length=buffer.readUInt32LE(12), json=JSON.parse(buffer.toString('utf8',20,20+length));
  if (!json.meshes?.length) throw new Error(`${filter.model} has no meshes`);
  if (filter.animated && !json.animations?.some(animation => animation.name === filter.animationName)) throw new Error(`${filter.model} is missing animation ${filter.animationName}`);
  if (!Number.isInteger(filter.anchor) || filter.anchor < 0 || filter.anchor > 485) throw new Error(`Invalid MindAR anchor index: ${filter.anchor}`);
  for (const key of ['position','rotation','scale']) if (!Array.isArray(filter[key]) || filter[key].length !== 3) throw new Error(`Invalid ${key} for ${filter.id}`);
  const bytes = new Uint8Array(buffer);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  if (!gltf.scene.children.length) throw new Error(`${filter.model} could not be parsed by Three.js GLTFLoader`);
  if (filter.animated && !gltf.animations.some(animation => animation.name === filter.animationName)) throw new Error(`${filter.model} animation failed GLTFLoader parsing`);
  console.log(`OK ${filter.id}: anchor ${filter.anchor}, ${buffer.length} bytes${filter.animated ? ', animation '+filter.animationName : ''}`);
}
console.log('Three.js 0.175.0, MindAR 1.2.5, and Vite 6.4.6 versions verified.');
