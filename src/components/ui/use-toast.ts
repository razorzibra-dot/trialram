/**
 * UI Component Toast Re-export
 * 
 * For backward compatibility, this module re-exports the toast utilities
 * from the hooks directory. Both old and new systems are supported.
 * 
 * DEPRECATED: Components should import directly from @/hooks or @/services
 */

import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
