/**
 * PDF Templates Module - Module Container Pattern
 * Handles PDF template management with standardized service management
 */
import { FeatureModule } from '@/modules/core/types';
import { pdfTemplatesRoutes } from './routes';
import { getServiceContainer } from '@/modules/core/serviceContainer';
import { pdfTemplateService } from '@/services/pdfTemplateService';

export const pdfTemplatesModule: FeatureModule = {
  name: 'pdf-templates',
  path: '/pdf-templates',
  routes: pdfTemplatesRoutes,
  services: ['pdfTemplateService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      const container = getServiceContainer();
      container.registerService('pdfTemplateService', pdfTemplateService);
      console.log('[PDF Templates Module] Initialized with services: pdfTemplateService');
    } catch (error) {
      console.error('[PDF Templates Module] Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      const container = getServiceContainer();
      container.unregisterService('pdfTemplateService');
      console.log('[PDF Templates Module] Cleanup complete');
    } catch (error) {
      console.error('[PDF Templates Module] Cleanup failed:', error);
    }
  },
};

// Export views for direct imports if needed
export { default as PDFTemplatesPage } from './views/PDFTemplatesPage';