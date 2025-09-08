import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Portafolio/', // <--- set to "/<repo-name>/" for GitHub Pages
  plugins: [react()],
});
