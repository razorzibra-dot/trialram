import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import { PortalProvider } from "@/contexts/PortalContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";

const RootLayout = () => {
  return (
    <ThemeProvider>
      <PortalProvider>
        <AuthProvider>
          <SuperAdminProvider>
            <div className="min-h-screen">
              <Outlet />
              <Toaster />
            </div>
          </SuperAdminProvider>
        </AuthProvider>
      </PortalProvider>
    </ThemeProvider>
  );
};

export default RootLayout;