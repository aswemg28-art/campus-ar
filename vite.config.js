import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/campus-ar/' : './',
  build: { target: 'es2022', assetsInlineLimit: 4096 },
  server: { host: '0.0.0.0' },
  optimizeDeps: { exclude: ['mind-ar'] },
  plugins: [{
    name: 'mindar-three-color-space-compat',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('mindar-face-three.prod.js')) return null;
      // MindAR 1.2.5 uses the removed Three.js encoding API; retain its renderer color output.
      return code
        .replace('sRGBEncoding as y', 'SRGBColorSpace as y')
        .replace('this.renderer.outputEncoding = y', 'this.renderer.outputColorSpace = y');
    },
  }],
});
