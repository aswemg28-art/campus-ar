import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/models');
fs.mkdirSync(OUT, { recursive: true });

function createGlb({ name, parts, animation }) {
  const chunks = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  const materials = [];
  const materialIndex = new Map();
  const addMaterial = (hex, metallic = 0, roughness = 0.55) => {
    const key = `${hex}:${metallic}:${roughness}`;
    if (materialIndex.has(key)) return materialIndex.get(key);
    const c = [hex >> 16 & 255, hex >> 8 & 255, hex & 255].map(x => x / 255);
    const i = materials.length;
    materials.push({ name: `material-${i}`, pbrMetallicRoughness: { baseColorFactor: [...c, 1], metallicFactor: metallic, roughnessFactor: roughness } });
    materialIndex.set(key, i); return i;
  };
  const addBuffer = (data, type, componentType, count, min, max, target) => {
    const raw = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const pad = (4 - (chunks.reduce((n, x) => n + x.length, 0) % 4)) % 4;
    if (pad) chunks.push(Buffer.alloc(pad));
    const offset = chunks.reduce((n, x) => n + x.length, 0);
    chunks.push(raw);
    const vi = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: raw.length, ...(target ? { target } : {}) });
    const ai = accessors.length;
    accessors.push({ bufferView: vi, componentType, count, type, ...(min ? { min } : {}), ...(max ? { max } : {}) });
    return ai;
  };
  const addPart = (part) => {
    const verts = part.positions;
    const normals = [];
    for (let i = 0; i < verts.length; i += 9) {
      const a = verts.slice(i, i+3), b = verts.slice(i+3, i+6), c = verts.slice(i+6, i+9);
      const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], v = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
      let n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
      const d = Math.hypot(...n) || 1; n = n.map(x => x/d); normals.push(...n, ...n, ...n);
    }
    const xs = [], ys = [], zs = [];
    for (let i=0;i<verts.length;i+=3){xs.push(verts[i]);ys.push(verts[i+1]);zs.push(verts[i+2]);}
    const min = [Math.min(...xs),Math.min(...ys),Math.min(...zs)], max=[Math.max(...xs),Math.max(...ys),Math.max(...zs)];
    const p = addBuffer(new Float32Array(verts), 'VEC3', 5126, verts.length/3, min, max, 34962);
    const n = addBuffer(new Float32Array(normals), 'VEC3', 5126, normals.length/3, null, null, 34962);
    const ix = Array.from({length:verts.length/3}, (_,i)=>i);
    const idx = addBuffer(new Uint16Array(ix), 'SCALAR', 5123, ix.length, null, null, 34963);
    const meshIndex=meshes.length;
    meshes.push({ name: part.name, primitives: [{ attributes:{POSITION:p,NORMAL:n}, indices:idx, material:addMaterial(part.color, part.metallic||0, part.roughness??0.55), mode:4 }] });
    const node={ name:part.name, mesh:meshIndex };
    if(part.translation) node.translation=part.translation;
    if(part.rotation) node.rotation=part.rotation;
    if(part.scale) node.scale=part.scale;
    const ni=nodes.length; nodes.push(node); return ni;
  };
  for (const part of parts) addPart(part);
  let sceneNodes = nodes.map((_,i)=>i);
  const anims = [];
  if (animation) {
    const parentIndex = nodes.length;
    const childIndex = animation.node;
    nodes.push({ name: animation.name, translation: animation.translation || [0,0,0], children: [childIndex] });
    nodes[childIndex].translation = animation.childTranslation || [0,0,0];
    sceneNodes = nodes.map((_,i)=>i).filter(i => i !== childIndex);
    const input = addBuffer(new Float32Array([0, 1.5, 3]), 'SCALAR', 5126, 3, [0], [3], null);
    const output = addBuffer(new Float32Array([0,0,0,1, 0,0.130526,0,0.991445, 0,0,0,1]), 'VEC4', 5126, 3, null, null, null);
    anims.push({ name: animation.clip || 'idle', samplers:[{input,output,interpolation:'LINEAR'}], channels:[{sampler:0,target:{node:parentIndex,path:'rotation'}}] });
  }
  const bin = Buffer.concat(chunks);
  const doc = { asset:{version:'2.0',generator:'Campus AR procedural original assets'}, scene:0, scenes:[{nodes:sceneNodes}], nodes, meshes, materials, accessors, bufferViews, buffers:[{byteLength:bin.length}], ...(anims.length?{animations:anims}:{}) };
  const json = Buffer.from(JSON.stringify(doc));
  const jsonPad=(4-json.length%4)%4, binPad=(4-bin.length%4)%4;
  const j=Buffer.concat([json,Buffer.alloc(jsonPad,0x20)]), b=Buffer.concat([bin,Buffer.alloc(binPad)]);
  const total=12+8+j.length+8+b.length;
  const header=Buffer.alloc(12); header.writeUInt32LE(0x46546c67,0); header.writeUInt32LE(2,4); header.writeUInt32LE(total,8);
  const jl=Buffer.alloc(8);jl.writeUInt32LE(j.length,0);jl.writeUInt32LE(0x4e4f534a,4);
  const bl=Buffer.alloc(8);bl.writeUInt32LE(b.length,0);bl.writeUInt32LE(0x004e4942,4);
  fs.writeFileSync(path.join(OUT, `${name}.glb`), Buffer.concat([header,jl,j,bl,b]));
}

function box(name, size, center, color, options={}) {
  const [sx,sy,sz]=size.map(x=>x/2), [cx,cy,cz]=center;
  const faces=[[[ -sx,-sy,sz],[sx,-sy,sz],[sx,sy,sz],[-sx,sy,sz]],[[sx,-sy,-sz],[-sx,-sy,-sz],[-sx,sy,-sz],[sx,sy,-sz]],[[-sx,sy,sz],[sx,sy,sz],[sx,sy,-sz],[-sx,sy,-sz]],[[-sx,-sy,-sz],[sx,-sy,-sz],[sx,-sy,sz],[-sx,-sy,sz]],[[sx,-sy,sz],[sx,-sy,-sz],[sx,sy,-sz],[sx,sy,sz]],[[-sx,-sy,-sz],[-sx,-sy,sz],[-sx,sy,sz],[-sx,sy,-sz]]];
  const positions=[]; for(const f of faces) for(const i of [0,1,2,0,2,3]) positions.push(f[i][0]+cx,f[i][1]+cy,f[i][2]+cz);
  return {name,positions,color,...options};
}
function sphere(name, center, radius, color, segments=12, rings=8) {
  const positions=[]; const point=(u,v)=>[center[0]+radius*Math.cos(v)*Math.cos(u),center[1]+radius*Math.sin(v),center[2]+radius*Math.cos(v)*Math.sin(u)];
  for(let y=0;y<rings;y++) for(let x=0;x<segments;x++){const u=x*2*Math.PI/segments,v0=-Math.PI/2+y*Math.PI/rings,v1=-Math.PI/2+(y+1)*Math.PI/rings;const a=point(u,v0),b=point(u+2*Math.PI/segments,v0),c=point(u+2*Math.PI/segments,v1),d=point(u,v1);for(const p of [a,b,c,a,c,d])positions.push(...p);}
  return {name,positions,color};
}
function cylinder(name, a, b, radius, color, sides=8) {
  const va=b.map((x,i)=>x-a[i]), len=Math.hypot(...va), dir=va.map(x=>x/len), axis=Math.abs(dir[1])<0.9?[0,1,0]:[1,0,0];
  const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  let u=cross(dir,axis);u=u.map(x=>x/Math.hypot(...u));const v=cross(dir,u);const positions=[];
  for(let i=0;i<sides;i++){const t=i*2*Math.PI/sides,q=(i+1)*2*Math.PI/sides;const r0=u.map((x,j)=>x*Math.cos(t)+v[j]*Math.sin(t)),r1=u.map((x,j)=>x*Math.cos(q)+v[j]*Math.sin(q));const p0=a.map((x,j)=>x+radius*r0[j]),p1=a.map((x,j)=>x+radius*r1[j]),p2=b.map((x,j)=>x+radius*r1[j]),p3=b.map((x,j)=>x+radius*r0[j]);for(const p of [p0,p1,p2,p0,p2,p3])positions.push(...p);}
  return {name,positions,color};
}
function torus(name,cx,cy,R,r,color,segments=32,sides=6){const positions=[];for(let i=0;i<segments;i++){const t=i*2*Math.PI/segments,q=(i+1)*2*Math.PI/segments;for(let j=0;j<sides;j++){const u=j*2*Math.PI/sides,v=(j+1)*2*Math.PI/sides;const p=(a,b)=>[cx+(R+r*Math.cos(b))*Math.cos(a),cy+(R+r*Math.cos(b))*Math.sin(a),r*Math.sin(b)];const a=p(t,u),b=p(q,u),c=p(q,v),d=p(t,v);for(const x of [a,b,c,a,c,d])positions.push(...x);}}return{name,positions,color,metallic:0.35};}

const ink=0x163d34, gold=0xc5a66a, cream=0xf0dfb6, black=0x18332e;
const togaParts=[
  { ...box('Soft square crown', [0.53,0.055,0.53],[0,0.075,0],ink), metallic:0.05 },
  { ...box('Velvet crown band',[0.29,0.16,0.29],[0,0,0],ink) },
  sphere('Center button',[0,0.11,0],0.028,gold,10,6),
  { ...box('Ceremonial tassel cord',[0.012,0.22,0.012],[0.205,-0.045,0],gold) },
  cylinder('Tassel fringe',[0.205,-0.19,0],[0.205,-0.10,0],0.022,gold,9),
  sphere('Tassel tip',[0.205,-0.20,0],0.022,cream,10,8),
];
createGlb({name:'toga',parts:togaParts,animation:{name:'Tassel idle',node:4,translation:[0,0.07,0],childTranslation:[0,-0.07,0],clip:'idle'}});
const glasses=[torus('Left rounded frame',-0.145,0,0.118,0.014,gold),torus('Right rounded frame',0.145,0,0.118,0.014,gold),cylinder('Bridge',[-0.029,0.008,0],[0.029,0.008,0],0.012,gold),cylinder('Left temple',[-0.26,0,0],[-0.39,-0.015,-0.20],0.012,ink),cylinder('Right temple',[0.26,0,0],[0.39,-0.015,-0.20],0.012,ink)];
createGlb({name:'glasses',parts:glasses});
console.log('Generated original GLB assets:', fs.readdirSync(OUT).map(f=>`${f} ${fs.statSync(path.join(OUT,f)).size} bytes`).join(', '));
