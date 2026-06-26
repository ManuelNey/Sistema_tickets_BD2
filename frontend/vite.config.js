import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En GitHub Actions CI=true; localmente no está seteada
  base: process.env.CI ? '/Sistema_tickets_BD2/' : '/',
})
