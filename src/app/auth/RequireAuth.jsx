import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Protege rutas autenticadas.
 * - Sin allowRoles: solo requiere estar logueado.
 * - Con allowRoles: además valida que user.role esté en la lista.
 *   Si el usuario no tiene role asignado, se le permite pasar
 *   para no bloquear mientras el backend no implemente roles completos.
 */
export default function RequireAuth({ children, allowRoles }) {
  const { user, loading } = useAuth();

  // Espera a que AuthContext hidrate la sesión antes de redirigir
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <svg className="animate-spin w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      </div>
    );
  }

  // No autenticado → login
  if (!user) return <Navigate to="/login" replace />;

  // Autenticado pero sin rol o sin edad → onboarding pendiente
  if (!user.role || !user.age) return <Navigate to="/onboarding" replace />;

  // Si se requiere rol y el usuario tiene rol asignado, validar
  if (allowRoles && user.role && !allowRoles.includes(user.role)) {
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