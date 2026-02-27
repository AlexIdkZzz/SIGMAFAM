import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import AppLayout from "./layout/AppLayout";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Alerts from "../pages/Alerts";
import MapLive from "../pages/MapLive";
import History from "../pages/History";
import Stats from "../pages/Stats";
import Family from "../pages/Family";
import Contacts from "../pages/Contacts";
import Device from "../pages/Device";
import Audit from "../pages/Audit";
import Settings from "../pages/Settings";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
        <Route path="alerts" element={<Alerts />} />
        <Route path="map" element={<MapLive />} />
        <Route path="history" element={<History />} />

        <Route
          path="stats"
          element={
            <RequireAuth allowRoles={["ADMIN", "JEFE_FAMILIA"]}>
              <Stats />
            </RequireAuth>
          }
        />
        <Route
          path="family"
          element={
            <RequireAuth allowRoles={["ADMIN", "JEFE_FAMILIA"]}>
              <Family />
            </RequireAuth>
          }
        />
        <Route
          path="contacts"
          element={
            <RequireAuth allowRoles={["ADMIN", "JEFE_FAMILIA"]}>
              <Contacts />
            </RequireAuth>
          }
        />

        <Route path="device" element={<Device />} />

        <Route
          path="audit"
          element={
            <RequireAuth allowRoles={["ADMIN"]}>
              <Audit />
            </RequireAuth>
          }
        />

        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}