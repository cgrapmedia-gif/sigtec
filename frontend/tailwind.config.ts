import type { Config } from 'tailwindcss';

// Identidade SIGTEC — validada nos protótipos v1/v2
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        papel: '#F4F2ED',
        preto: '#16130F',
        grafite: '#241F1A',
        vermelho: '#B5121B',
        dourado: '#B8860B',
        douradoClaro: '#E8D9A0',
        verde: '#2E7D4F',
        ambar: '#C77800',
        azul: '#2C5F8A',
        cinza: '#8A8378',
        linha: '#E2DDD2',
      },
      fontFamily: {
        sans: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      boxShadow: { cartao: '0 2px 10px rgba(22,19,15,.08)' },
    },
  },
  plugins: [],
};
export default config;
