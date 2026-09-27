import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages sirve la web en https://cnfnavarro.github.io/Repostea/
  base: command === 'build' ? '/Repostea/' : '/',
}))
