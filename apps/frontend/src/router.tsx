import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import KioskAPage from "./pages/KioskAPage";
import KioskBPage from "./pages/KioskBPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "/kiosk-a",
    element: <KioskAPage />,
  },
  {
    path: "/kiosk-b",
    element: <KioskBPage />,
  },
]);
