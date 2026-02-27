import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children, allowRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowRoles && !allowRoles.includes(user.role)) {
    return (
      <div className="p-6">
        <div className="max-w-lg bg-white border border-slate-200 rounded-2xl p-4">
          <h2 className="text-lg font-extrabold text-slate-900">Acceso denegado</h2>
          <p className="text-sm text-slate-600 mt-1">
            No tienes permisos para ver esta sección.
          </p>
        </div>
      </div>
    );
  }

  return children;
}