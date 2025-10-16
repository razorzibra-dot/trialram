import { RouterProvider } from "react-router-dom";
import "./index.css";
import "./styles/enterprise.css";
import "antd/dist/reset.css";
import { router } from "./routes";
import { PortalProvider } from "./contexts/PortalContext";
import { AntdConfigProvider } from "./components/providers/AntdConfigProvider";

const App = () => {
  return (
    <AntdConfigProvider>
      <PortalProvider>
        <RouterProvider router={router} />
      </PortalProvider>
    </AntdConfigProvider>
  );
};

export default App;