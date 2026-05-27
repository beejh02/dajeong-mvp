import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import BlankPage from "./pages/BlankPage";
import KioskAMenu from "./pages/KioskAMenu";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/admin",
    element: <BlankPage />,
  },
  {
    path: "/kiosk-a",
    element: <KioskAMenu />,
  },
  {
    path: "/kiosk-b",
    element: <BlankPage />,
  },
]);
