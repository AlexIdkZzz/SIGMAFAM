import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./app/AppRouter";
import { AuthProvider } from "./app/auth/AuthContext";
import { AlertsProvider } from "./app/alerts/AlertsContext";
import { ThemeProvider } from "./app/theme/ThemeContext";
import "leaflet/dist/leaflet.css";
import "./app/maps/leafletIconFix"; 
import "./index.css";

// 👇 1. IMPORTAMOS LA FUNCIÓN PARA REGISTRAR EL SERVICE WORKER
import { registerSW } from 'virtual:pwa-register';

// 👇 2. LLAMAMOS A LA FUNCIÓN
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("Nueva actualización disponible");
  },
  onOfflineReady() {
    console.log("App lista para funcionar sin conexión");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AlertsProvider>
            <AppRouter />
          </AlertsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);