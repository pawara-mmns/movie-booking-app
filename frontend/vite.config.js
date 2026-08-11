import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Read the existing VITE_* Supabase values without exposing backend-only keys.
  envDir: '../backend',
  plugins: [react()],
})
