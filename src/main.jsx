import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./app/AppRouter";
import { AuthProvider } from "./app/auth/AuthContext";
import { AlertsProvider } from "./app/alerts/AlertsContext";
import "leaflet/dist/leaflet.css";
import "./app/maps/leafletIconFix"; 
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AlertsProvider>
          <AppRouter />
        </AlertsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);