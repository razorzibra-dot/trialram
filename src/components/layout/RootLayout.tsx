import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { PortalProvider } from "@/contexts/PortalContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReferenceDataProvider } from "@/contexts/ReferenceDataContext";
import ImpersonationBanner from "@/components/common/ImpersonationBanner";

/**
 * RootLayout Component
 * 
 * Updated to use Ant Design notifications instead of legacy toast system.
 * Ant Design's message and notification APIs are global and don't require
 * explicit component rendering - they work automatically with AntdConfigProvider.
 * 
 * Includes ImpersonationProvider and ImpersonationBanner for super admin
 * impersonation mode support across the entire application.
 * 
 * NOTE: The legacy Toaster component has been removed.
 * Use notificationService or useNotification hook for displaying messages.
 */

const RootLayout = () => {
  return (
    <ThemeProvider>
      <PortalProvider>
        <AuthProvider>
          <ReferenceDataProvider>
            <SuperAdminProvider>
              <ImpersonationProvider>
                <div className="min-h-screen flex flex-col">
                  <ImpersonationBanner />
                  <div className="flex-1">
                    <Outlet />
                  </div>
                </div>
              </ImpersonationProvider>
            </SuperAdminProvider>
          </ReferenceDataProvider>
        </AuthProvider>
      </PortalProvider>
    </ThemeProvider>
  );
};

export default RootLayout;