import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ 正确配置仓库路径
export default defineConfig({
  base: '/hqq-birthday-site/',
  plugins: [react()],
})


