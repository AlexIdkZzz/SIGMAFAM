import { useEffect, useState } from "react";
import { useAdminFetch, Avatar, Badge, SectionCard, alertBadgeClass, formatDate } from "./adminShared";

function StatCard({ label, value, sub, danger }) {
  return (
    <div className="bg-slate-100 rounded-lg px-4 py-3.5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-medium ${danger ? "text-red-500" : ""}`}>{value ?? "—"}</p>
      <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

export default function AdminOverview() {
  const { apiFetch } = useAdminFetch();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    apiFetch("/admin/overview")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Cargando...</div>;
  if (error)   return <div className="text-sm text-red-500 py-10 text-center">{error}</div>;

  const t = data.totals;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Usuarios totales"   value={t.users}        sub="Registrados en el sistema" />
        <StatCard label="Grupos familiares"  value={t.groups}       sub="Grupos activos" />
        <StatCard label="Dispositivos"       value={t.devices}      sub="Vinculados" />
        <StatCard label="Alertas activas" value={t.activeAlerts} sub={`${t.alerts} en total`} danger={t.activeAlerts > 0} />
      </div>

      <SectionCard title="Actividad reciente">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-[13px]">
          <thead>
            <tr>
              {["Usuario", "Grupo", "Origen", "Estado", "Fecha"].map((h) => (
                <th key={h} className="text-left text-[11px] text-slate-400 font-medium px-5 py-2.5 bg-slate-50 border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recent.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-2">
                    <Avatar name={a.user_name} />
                    {a.user_name}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{a.group_name ?? "Sin grupo"}</td>
                <td className="px-5 py-2.5 text-xs">{a.source}</td>
                <td className="px-5 py-2.5">
                  <Badge className={alertBadgeClass(a.status)}>{a.status}</Badge>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-400">{formatDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </SectionCard>
    </>
  );
}