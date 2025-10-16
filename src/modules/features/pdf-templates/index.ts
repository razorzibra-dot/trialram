/**
 * PDF Templates Module
 * Handles PDF template management
 */
import { FeatureModule } from '@/modules/core/types';
import { pdfTemplatesRoutes } from './routes';

export const pdfTemplatesModule: FeatureModule = {
  name: 'pdf-templates',
  routes: pdfTemplatesRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('PDF Templates module initialized');
  },
  async cleanup() {
    console.log('PDF Templates module cleanup');
  },
};

// Export views for direct imports if needed
export { default as PDFTemplatesPage } from './views/PDFTemplatesPage';