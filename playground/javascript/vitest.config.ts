import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'jsdom', include: ['.catalog/*vitest*.test.jsx', '.catalog/*testing-library*.test.jsx', '.catalog/*testing-library*.test.tsx'], globals: false } });
