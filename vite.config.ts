import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    hmr: {
      port: 5000
    },
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/')[1]?.split(/[\\/]/).filter(Boolean) || [];
            const scope = parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1] || ''}` : parts[0];

            if (!scope) return 'vendor_misc';
            if (scope.startsWith('react')) return 'vendor_react';
            if (scope === 'antd' || scope.startsWith('@ant-design')) return 'vendor_antd';
            if (scope.startsWith('rc-')) return 'vendor_rc';
            if (scope.startsWith('@tanstack')) return 'vendor_query';
            if (scope === 'lucide-react') return 'vendor_icons';

            return `vendor_${scope.replace(/[@/]/g, '_')}`;
          }

          if (id.includes('/src/modules/features/product-sales/')) return 'chunk_product_sales';
          if (id.includes('/src/modules/features/customers/')) return 'chunk_customers';
          if (id.includes('/src/modules/features/deals/')) return 'chunk_deals';
          if (id.includes('/src/modules/features/service-contracts/')) return 'chunk_service_contracts';
          if (id.includes('/src/modules/features/complaints/')) return 'chunk_complaints';
          if (id.includes('/src/modules/features/tickets/')) return 'chunk_tickets';
          if (id.includes('/src/modules/features/user-management/')) return 'chunk_user_management';
          if (id.includes('/src/modules/features/super-admin/')) return 'chunk_super_admin';

          return undefined;
        },
      },
    },
  }
}));