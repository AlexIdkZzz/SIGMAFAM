import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const AlertsContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export function AlertsProvider({ children }) {
  const { token } = useAuth();

  const [alerts, setAlerts]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Memoized so callbacks that depend on it stay stable
  const authHeaders = useCallback(() => {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, [token]);

  // ── Cargar alertas activas desde el backend ────────────────────────────────
  const refreshActive = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/alerts/active`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar alertas");
      setAlerts(data.alerts);
      // Seleccionar la primera alerta automáticamente si no hay ninguna seleccionada
      setSelectedId((prev) => prev ?? data.alerts[0]?.id ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  // Cargar al montar y cuando cambie el token
  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  // ── Simular alerta (crea en backend) ──────────────────────────────────────
  const simulateIncomingAlert = useCallback(async () => {
    if (!token) return;
    try {
      const lat = 20.72 + (Math.random() - 0.5) * 0.03;
      const lng = -103.41 + (Math.random() - 0.5) * 0.03;
      const res = await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ lat, lng }),
      });
      if (!res.ok) throw new Error("Error al simular alerta");
      await refreshActive();
    } catch (e) {
      setError(e.message);
    }
  }, [token, authHeaders, refreshActive]);

  // ── Cambiar estado en backend y refrescar ─────────────────────────────────
  const _changeStatus = useCallback(async (id, status) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      // Actualizar localmente sin esperar un refetch completo
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (e) {
      setError(e.message);
    }
  }, [token, authHeaders]);

  const markAttended = useCallback((id) => _changeStatus(id, "ATTENDED"), [_changeStatus]);
  const closeAlert   = useCallback((id) => _changeStatus(id, "CLOSED"),   [_changeStatus]);
  const selectAlert  = useCallback((id) => setSelectedId(id), []);

  const selected = useMemo(
    () => alerts.find((a) => a.id === selectedId) ?? null,
    [alerts, selectedId]
  );

  const value = useMemo(
    () => ({
      alerts,
      selected,
      selectedId,
      loading,
      error,
      selectAlert,
      refreshActive,
      simulateIncomingAlert,
      markAttended,
      closeAlert,
    }),
    [alerts, selected, selectedId, loading, error, selectAle