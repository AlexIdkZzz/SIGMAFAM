import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import AppLayout from "./layout/AppLayout";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Verify from "../pages/Verify";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Dashboard from "../pages/Dashboard";
import Alerts from "../pages/Alerts";
import MapLive from "../pages/MapLive";
import History from "../pages/History";
import Stats from "../pages/Stats";
import Family from "../pages/Family";
import Contacts from "../pages/Contacts";
import Device from "../pages/Device";
import Audit from "../pages/Audit";
import AdminPanel from "../pages/AdminPanel";
import Store from "../pages/Store";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas públicas */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/verify"          element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Panel Admin — layout propio */}
      <Route
        path="/admin"
        element={
          <RequireAuth allowRoles={["ADMIN"]}>
            <AdminPanel />
          </RequireAuth>
        }
      />

      {/* Rutas protegidas — layout normal */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="alerts"    element={<Alerts />} />
        <Route path="map"       element={<MapLive />} />
        <Route path="history"   element={<History />} />
        <Route path="store"     element={<Store />} />

        <Route path="stats"
          element={<RequireAuth allowRoles={["ADMIN","JEFE_FAMILIA"]}><Stats /></RequireAuth>}
        />
        <Route path="family"
          element={<RequireAuth allowRoles={["ADMIN","JEFE_FAMILIA","MIEMBRO"]}><Family /></RequireAuth>}
        />
        <Route path="contacts"
          element={<RequireAuth allowRoles={["ADMIN","JEFE_FAMILIA","MIEMBRO"]}><Contacts /></RequireAuth>}
        />
        <Route path="device" element={<Device />} />
        <Route path="audit"
          element={<RequireAuth allowRoles={["ADMIN"]}><Audit /></RequireAuth>}
        />

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}