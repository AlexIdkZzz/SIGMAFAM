import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const AlertsContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export function AlertsProvider({ children }) {
  const { token } = useAuth();

  const [alerts, setAlerts]         = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [alertDetail, setAlertDetail]       = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function authHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

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
  }, [token]);

  // Cargar al montar y cuando cambie el token
  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  // ── Simular alerta (crea en backend) ──────────────────────────────────────
  async function createWebAlert({ lat, lng }) {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear alerta");
      await refreshActive();
      if (data.alert_id) setSelectedId(data.alert_id);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  async function simulateIncomingAlert() {
    if (!token) return;
    try {
      const lat = 20.72 + (Math.random() - 0.5) * 0.03;
      const lng = -103.41 + (Math.random() - 0.5) * 0.03;
      await createWebAlert({ lat, lng });
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Cambiar estado en backend y refrescar ─────────────────────────────────
  async function _changeStatus(id, status) {
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
  }

  function markAttended(id) { return _changeStatus(id, "ATTENDED"); }
  function closeAlert(id)   { return _changeStatus(id, "CLOSED"); }

  const fetchAlertDetail = useCallback(async (id) => {
    if (!token || !id) return;
    setDetailLoading(true);
    setAlertDetail(null);
    try {
      const res  = await fetch(`${API_BASE}/alerts/${id}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAlertDetail(data.alert);
    } catch {
      // silent — el panel mostrará vacío
    } finally {
      setDetailLoading(false);
    }
  }, [token]);

  function selectAlert(id) {
    setSelectedId(id);
    fetchAlertDetail(id);
  }

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
      alertDetail,
      detailLoading,
      selectAlert,
      refreshActive,
      createWebAlert,
      simulateIncomingAlert,
      markAttended,
      closeAlert,
    }),
    [alerts, selected, selectedId, loading, error, alertDetail, detailLoading]
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts must be used inside <AlertsProvider />");
  return ctx;
}
