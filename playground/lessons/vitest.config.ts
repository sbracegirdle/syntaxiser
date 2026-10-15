import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'jsdom', include: ['validation/*.test.tsx', '*.test.tsx', '*.test.ts', '*.test.jsx', '*.test.js'] } });
