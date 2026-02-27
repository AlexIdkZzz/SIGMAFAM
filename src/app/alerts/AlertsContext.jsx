import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * Alert shape:
 * {
 *  id: number,
 *  user: string,
 *  source: "IOT" | "WEB",
 *  status: "RECEIVED" | "ACTIVE" | "ATTENDED" | "CLOSED",
 *  createdAt: string (ISO),
 *  lastLocation: { lat: number, lng: number, at: string (ISO) },
 *  battery?: number
 * }
 */

const AlertsContext = createContext(null);

function nowISO() {
  return new Date().toISOString();
}

const seed = [
  {
    id: 101,
    user: "María",
    source: "IOT",
    status: "ACTIVE",
    createdAt: nowISO(),
    lastLocation: { lat: 20.7131, lng: -103.4123, at: nowISO() },
    battery: 78,
  },
  {
    id: 102,
    user: "Diego",
    source: "WEB",
    status: "RECEIVED",
    createdAt: nowISO(),
    lastLocation: { lat: 20.6736, lng: -103.4053, at: nowISO() },
  },
  {
    id: 103,
    user: "Ana",
    source: "IOT",
    status: "ATTENDED",
    createdAt: nowISO(),
    lastLocation: { lat: 20.7002, lng: -103.3901, at: nowISO() },
    battery: 52,
  },
];

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(seed);
  const [selectedId, setSelectedId] = useState(seed[0]?.id ?? null);

  const selected = useMemo(
    () => alerts.find((a) => a.id === selectedId) ?? null,
    [alerts, selectedId]
  );

  function selectAlert(id) {
    setSelectedId(id);
  }

  function simulateIncomingAlert() {
    const id = Math.floor(100 + Math.random() * 900);
    const a = {
      id,
      user: "Nuevo miembro",
      source: "IOT",
      status: "ACTIVE",
      createdAt: nowISO(),
      lastLocation: {
        lat: 20.72 + (Math.random() - 0.5) * 0.03,
        lng: -103.41 + (Math.random() - 0.5) * 0.03,
        at: nowISO(),
      },
      battery: 20 + Math.floor(Math.random() * 80),
    };
    setAlerts((prev) => [a, ...prev]);
    setSelectedId(id);
  }

  function updateStatus(id, status) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  function markAttended(id) {
    updateStatus(id, "ATTENDED");
  }

  function closeAlert(id) {
    updateStatus(id, "CLOSED");
  }

  const value = useMemo(
    () => ({
      alerts,
      selected,
      selectedId,
      selectAlert,
      simulateIncomingAlert,
      markAttended,
      closeAlert,
    }),
    [alerts, selected, selectedId]
  );

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) {
    throw new Error("useAlerts must be used inside <AlertsProvider />");
  }
  return ctx;
}