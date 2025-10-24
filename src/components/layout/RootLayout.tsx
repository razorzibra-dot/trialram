import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import { PortalProvider } from "@/contexts/PortalContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

/**
 * RootLayout Component
 * 
 * Updated to use Ant Design notifications instead of legacy toast system.
 * Ant Design's message and notification APIs are global and don't require
 * explicit component rendering - they work automatically with AntdConfigProvider.
 * 
 * NOTE: The legacy Toaster component has been removed.
 * Use notificationService or useNotification hook for displaying messages.
 */

const RootLayout = () => {
  return (
    <ThemeProvider>
      <PortalProvider>
        <AuthProvider>
          <SuperAdminProvider>
            <div className="min-h-screen">
              <Outlet />
            </div>
          </SuperAdminProvider>
        </AuthProvider>
      </PortalProvider>
    </ThemeProvider>
  );
};

export default RootLayout;