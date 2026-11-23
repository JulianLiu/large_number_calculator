import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Project Pages: https://<user>.github.io/large_number_calculator/
  base: '/large_number_calculator/',
  plugins: [react(), tailwindcss()],
})
