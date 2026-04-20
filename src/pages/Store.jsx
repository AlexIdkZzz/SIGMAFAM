/**
 * Store.jsx — Módulo independiente de tienda de gadgets
 * Ruta: src/pages/Store.jsx
 *
 * Psicología del color aplicada:
 *  - Azul   (#1e40af / #2563eb) → confianza, tecnología, seguridad
 *  - Naranja (#ea580c)           → acción, urgencia, CTA de compra
 *  - Verde  (#16a34a)            → disponibilidad, confirmación, éxito
 *  - Rojo   (#dc2626)            → alerta, stock bajo / sin stock
 *  - Slate gris                  → fondos neutros, texto secundario
 */

import React, {
  useEffect, useState, useCallback, useMemo,
} from "react";
import { useAuth } from "../app/auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

/* ─────────────────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const CATEGORIES = ["Todos", "Periféricos", "Audio", "Almacenamiento", "Redes", "Seguridad", "Accesorios", "Video"];

/* ─────────────────────────────────────────────────────
   HOOK: manejo de productos con el backend
───────────────────────────────────────────────────── */
function useProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/store/products`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createProduct(form) {
    const res  = await fetch(`${API_BASE}/store/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al crear");
    await load();
  }

  async function updateProduct(id, form) {
    const res  = await fetch(`${API_BASE}/store/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al actualizar");
    await load();
  }

  async function deleteProduct(id) {
    const res  = await fetch(`${API_BASE}/store/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
    await load();
  }

  return { products, loading, error, reload: load, createProduct, updateProduct, deleteProduct };
}

/* ─────────────────────────────────────────────────────
   BADGES
───────────────────────────────────────────────────── */
function StockBadge({ stock }) {
  if (stock === 0)
    return <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Sin stock</span>;
  if (stock <= 5)
    return <span style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>¡Solo {stock}!</span>;
  return <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>En stock</span>;
}

function CatBadge({ cat }) {
  return <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.02em" }}>{cat}</span>;
}

/* ─────────────────────────────────────────────────────
   TARJETA DE PRODUCTO
───────────────────────────────────────────────────── */
function ProductCard({ product, onAdd, isAdmin, onEditClick, onDeleteClick }) {
  const [qty, setQty]     = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === 0;

  function handleAdd() {
    if (outOfStock) return;
    onAdd(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div
      style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s, transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.13)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Imagen */}
      <div style={{ position: "relative", height: 190, overflow: "hidden", background: "#f8fafc" }}>
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80"}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80"; }}
        />
        <div style={{ position: "absolute", top: 10, left: 10 }}><CatBadge cat={product.category} /></div>
        {isAdmin && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
            <button onClick={() => onEditClick(product)} style={{ background: "rgba(255,255,255,0.93)", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 9px", fontSize: 13, cursor: "pointer" }}>✏️</button>
            <button onClick={() => onDeleteClick(product)} style={{ background: "rgba(255,255,255,0.93)", border: "1px solid #fecaca", borderRadius: 8, padding: "4px 9px", fontSize: 13, cursor: "pointer" }}>🗑</button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{product.name}</h3>
          <StockBadge stock={product.stock} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.55, flex: 1 }}>
          {product.description?.length > 105 ? product.description.slice(0, 105) + "…" : product.description}
        </p>
        {/* Precio — azul: confianza */}
        <div style={{ fontSize: 23, fontWeight: 900, color: "#1e40af", letterSpacing: "-0.5px" }}>
          {fmt(product.price)}
        </div>
        {/* Controles */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", background: "#f8fafc" }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={outOfStock} style={{ width: 30, height: 32, background: "transparent", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#475569" }}>−</button>
            <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={outOfStock} style={{ width: 30, height: 32, background: "transparent", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#475569" }}>+</button>
          </div>
          {/* CTA naranja: urgencia y acción */}
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            style={{ flex: 1, height: 32, background: added ? "#16a34a" : outOfStock ? "#e2e8f0" : "#ea580c", color: outOfStock ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: outOfStock ? "not-allowed" : "pointer", transition: "background 0.2s" }}
          >
            {added ? "✓ Agregado" : outOfStock ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   DRAWER DEL CARRITO
───────────────────────────────────────────────────── */
function CartDrawer({ open, items, onClose, onChangeQty, onRemove, onCheckout }) {
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.2s" }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 400, background: "#fff", borderLeft: "1px solid #e2e8f0", zIndex: 41, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafbfc" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>🛒 Carrito</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{items.length} tipo{items.length !== 1 ? "s" : ""} de producto</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>✕ Cerrar</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "52px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛒</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Carrito vacío</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Agrega productos para comenzar</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, padding: 12, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <img src={item.image_url} alt={item.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=80"; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{fmt(item.price)} c/u</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                        <button onClick={() => onChangeQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                        <span style={{ width: 28, textAlign: "center", fontSize: 12, fontWeight: 700 }}>{item.qty}</span>
                        <button onClick={() => onChangeQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Subtotal por producto */}
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#1e40af" }}>{fmt(item.price * item.qty)}</span>
                        <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer totales */}
        {items.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", background: "#fafbfc" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen del pedido</div>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 4, gap: 8 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.name.slice(0, 24)}{item.name.length > 24 ? "…" : ""} ×{item.qty}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: "#e2e8f0", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                <span>Total</span>
                <span style={{ color: "#1e40af" }}>{fmt(subtotal)}</span>
              </div>
            </div>
            {/* CTA naranja — psicología: color de acción inmediata */}
            <button
              onClick={onCheckout}
              style={{ width: "100%", padding: "13px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: "0.02em", transition: "background 0.2s" }}
              onMouseEnter={e => e.target.style.background = "#c2410c"}
              onMouseLeave={e => e.target.style.background = "#ea580c"}
            >
              Generar pedido JSON →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   MODAL PREVIEW JSON DEL PEDIDO
───────────────────────────────────────────────────── */
function OrderJSONModal({ open, order, onClose }) {
  if (!open || !order) return null;
  const jsonStr = JSON.stringify(order, null, 2);

  function download() {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `pedido-${order.order_id}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 740, maxHeight: "90vh", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>📄 Vista previa del pedido</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>ID: {order.order_id} · {fmtDate(order.generated_at)}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={download} style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Descargar .json</button>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc", display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            { label: "Productos distintos", value: order.items.length, bg: "#eff6ff", color: "#1e40af" },
            { label: "Piezas totales",      value: order.items.reduce((s, i) => s + i.quantity, 0), bg: "#fff7ed", color: "#c2410c" },
            { label: "Total del pedido",    value: fmt(order.total), bg: "#f0fdf4", color: "#15803d" },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ fontSize: 10, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* JSON */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <pre style={{ margin: 0, fontSize: 12, fontFamily: "'Fira Code', 'Cascadia Code', monospace", background: "#0f172a", color: "#e2e8f0", borderRadius: 12, padding: 20, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {jsonStr}
          </pre>
        </div>

        <div style={{ padding: "10px 24px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8", background: "#fafbfc" }}>
          El JSON contiene el detalle completo del pedido incluyendo subtotales por producto. Descárgalo para conservarlo.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FORMULARIO DE PRODUCTO (modal — admin)
───────────────────────────────────────────────────── */
const EMPTY = { name: "", description: "", price: "", stock: "", category: "Periféricos", image_url: "", is_active: true };

function ProductFormModal({ open, initial, onSave, onClose }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial, price: String(initial.price), stock: String(initial.stock) } : EMPTY);
      setErr("");
    }
  }, [open, initial]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stock) { setErr("Nombre, precio y stock son obligatorios."); return; }
    setSaving(true); setErr("");
    try { await onSave({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10) }); onClose(); }
    catch (ex) { setErr(ex.message); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  const inp = (label, key, type = "text", extra = {}) => (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <input type={type} value={form[key]} onChange={set(key)}
        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafbfc" }}
        {...extra} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", border: "1px solid #e2e8f0" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{initial ? "Editar producto" : "Nuevo producto"}</div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}

          {inp("Nombre del producto *", "name", "text", { placeholder: "Ej: Teclado Mecánico Pro" })}

          <div style={{ marginBottom: 13 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Descripción</label>
            <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Descripción detallada del producto…"
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", background: "#fafbfc" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {inp("Precio (MXN) *", "price", "number", { min: "0.01", step: "0.01", placeholder: "0.00" })}
            {inp("Stock *", "stock", "number", { min: "0", step: "1", placeholder: "0" })}
          </div>

          <div style={{ marginBottom: 13 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Categoría</label>
            <select value={form.category} onChange={set("category")}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", background: "#fafbfc" }}>
              {CATEGORIES.filter(c => c !== "Todos").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {inp("URL de imagen", "image_url", "url", { placeholder: "https://images.unsplash.com/..." })}

          {form.image_url && (
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Vista previa</div>
              <img src={form.image_url} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, border: "1px solid #e2e8f0" }}
                onError={e => { e.target.style.display = "none"; }} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <input type="checkbox" id="is_active_chk" checked={form.is_active} onChange={set("is_active")} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="is_active_chk" style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>Producto activo (visible en la tienda)</label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "11px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear producto"}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: "11px 20px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MODAL CONFIRMAR ELIMINACIÓN
───────────────────────────────────────────────────── */
function ConfirmDeleteModal({ product, onConfirm, onClose }) {
  if (!product) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 420, width: "100%", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Eliminar producto</div>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px" }}>
          ¿Seguro que quieres eliminar <b style={{ color: "#0f172a" }}>{product.name}</b>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onConfirm(product.id)} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PANEL ADMIN (sección inferior de la tienda)
───────────────────────────────────────────────────── */
function StoreAdminPanel({ products, onCreate, onEdit, onDelete, loading }) {
  const [formOpen, setFormOpen]           = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  function openCreate() { setEditTarget(null); setFormOpen(true); }
  function openEdit(p)  { setEditTarget(p); setFormOpen(true); }

  async function handleSave(form) {
    if (editTarget) await onEdit(editTarget.id, form);
    else            await onCreate(form);
  }

  const stats = [
    { label: "Total",      value: products.length,                              bg: "#eff6ff", color: "#1e40af" },
    { label: "Activos",    value: products.filter(p => p.is_active).length,    bg: "#f0fdf4", color: "#16a34a" },
    { label: "Stock bajo", value: products.filter(p => p.stock > 0 && p.stock <= 5).length, bg: "#fff7ed", color: "#ea580c" },
    { label: "Sin stock",  value: products.filter(p => p.stock === 0).length,  bg: "#fef2f2", color: "#dc2626" },
  ];

  return (
    <div style={{ marginTop: 32 }}>
      {/* Banner admin */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", borderRadius: 16, padding: "22px 28px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(239,68,68,0.85)", borderRadius: 20, padding: "3px 10px", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: "0.07em" }}>⚙ PANEL ADMIN</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Gestión de catálogo</div>
          <div style={{ fontSize: 13, color: "#93c5fd", marginTop: 2 }}>Administra los productos de la tienda</div>
        </div>
        <button onClick={openCreate}
          style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontSize: 14, fontWeight: 800, cursor: "pointer", position: "relative" }}
          onMouseEnter={e => e.currentTarget.style.background = "#c2410c"}
          onMouseLeave={e => e.currentTarget.style.background = "#ea580c"}>
          + Agregar producto
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Inventario completo ({products.length})</div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando…</div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Sin productos. ¡Agrega el primero!</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Imagen", "Nombre / Descripción", "Categoría", "Precio", "Stock", "Estado", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 14px" }}>
                      <img src={p.image_url || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=80"} alt={p.name}
                        style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 9, border: "1px solid #e2e8f0" }}
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=80"; }} />
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210 }}>{p.description?.slice(0, 55)}{p.description?.length > 55 ? "…" : ""}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}><CatBadge cat={p.category} /></td>
                    <td style={{ padding: "10px 14px", fontWeight: 800, color: "#1e40af" }}>{fmt(p.price)}</td>
                    <td style={{ padding: "10px 14px" }}><StockBadge stock={p.stock} /></td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 700, ...(p.is_active ? { background: "#f0fdf4", color: "#16a34a" } : { background: "#f8fafc", color: "#94a3b8" }) }}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ padding: "5px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Editar</button>
                        <button onClick={() => setDeleteTarget(p)} style={{ padding: "5px 12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormModal open={formOpen} initial={editTarget} onSave={handleSave} onClose={() => setFormOpen(false)} />
      <ConfirmDeleteModal product={deleteTarget} onConfirm={async id => { await onDelete(id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   COMPONENTE RAÍZ: Store
───────────────────────────────────────────────────── */
export default function Store() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "ADMIN";

  const { products, loading, error, reload, createProduct, updateProduct, deleteProduct } = useProducts();

  // Carrito
  const [cart, setCart]         = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Filtros
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy,   setSortBy]   = useState("default");

  // Modales / tab
  const [orderModal,    setOrderModal]    = useState(false);
  const [currentOrder,  setCurrentOrder]  = useState(null);
  const [tab,           setTab]           = useState("store");

  /* Carrito */
  function addToCart(product, qty) {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(product.stock, i.qty + qty) } : i);
      return [...prev, { ...product, qty }];
    });
  }
  function changeQty(id, qty) {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    const p = products.find(p => p.id === id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(p?.stock ?? 99, qty) } : i));
  }
  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  /* Checkout */
  function checkout() {
    const order = {
      order_id:      `ORD-${Date.now()}`,
      generated_at:  new Date().toISOString(),
      customer: {
        id:        user?.id ?? null,
        full_name: user?.fullName ?? "Invitado",
        email:     user?.email ?? null,
        role:      user?.role ?? null,
      },
      items: cart.map(i => ({
        product_id:   i.id,
        name:         i.name,
        category:     i.category,
        image_url:    i.image_url,
        unit_price:   parseFloat(i.price.toFixed(2)),
        quantity:     i.qty,
        subtotal:     parseFloat((i.price * i.qty).toFixed(2)),
      })),
      subtotals: cart.map(i => ({
        product: i.name,
        qty:     i.qty,
        unit_price: parseFloat(i.price.toFixed(2)),
        subtotal:   parseFloat((i.price * i.qty).toFixed(2)),
      })),
      total:       parseFloat(cartTotal.toFixed(2)),
      total_items: cartCount,
      currency:    "MXN",
      status:      "GENERADO",
      source:      "WEB",
    };
    setCurrentOrder(order);
    setCartOpen(false);
    setOrderModal(true);
    // Limpiar carrito al generar el pedido
    setCart([]);
  }

  /* Filtros */
  const visible = useMemo(() => {
    let arr = products.filter(p => p.is_active);
    if (category !== "Todos") arr = arr.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (sortBy === "price_asc")  arr = [...arr].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") arr = [...arr].sort((a, b) => b.price - a.price);
    if (sortBy === "name")       arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "stock")      arr = [...arr].sort((a, b) => b.stock - a.stock);
    return arr;
  }, [products, category, search, sortBy]);

  /* ─── RENDER ─── */
  return (
    <div style={{ minHeight: "100%", background: "#f8fafc" }}>

      {/* ═══ HERO BANNER — Azul: confianza, tecnología ═══ */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 65%, #2563eb 100%)", padding: "26px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -40, right: 120, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c", display: "inline-block" }} />
              <span style={{ color: "#93c5fd", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tienda tecnológica</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
              Gadgets &amp; Accesorios de Cómputo
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "#93c5fd" }}>
              {products.filter(p => p.is_active).length} productos disponibles · Envío incluido en todos los pedidos
            </p>
          </div>

          {/* Botón carrito — naranja (urgencia, acción) */}
          <button
            onClick={() => setCartOpen(true)}
            style={{ position: "relative", background: "#ea580c", color: "#fff", border: "none", borderRadius: 14, padding: "11px 22px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "#c2410c"}
            onMouseLeave={e => e.currentTarget.style.background = "#ea580c"}
          >
            🛒 Carrito
            {cartCount > 0 && (
              <span style={{ background: "#fff", color: "#ea580c", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{cartCount}</span>
            )}
            {cartCount > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginLeft: 2 }}>{fmt(cartTotal)}</span>
            )}
          </button>
        </div>

        {/* Tabs tienda / admin — solo ADMIN */}
        {isAdmin && (
          <div style={{ display: "flex", gap: 4, marginTop: 20, position: "relative" }}>
            {[["store", "🛍  Tienda"], ["admin", "⚙  Administración"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding: "7px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: tab === key ? "rgba(255,255,255,0.16)" : "transparent", color: tab === key ? "#fff" : "rgba(255,255,255,0.55)", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ CONTENIDO ═══ */}
      <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ─── TAB TIENDA ─── */}
        {tab === "store" && (
          <>
            {/* Barra de filtros */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 15, pointerEvents: "none" }}>🔍</span>
                <input type="text" placeholder="Buscar productos…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", background: category === c ? "#1e40af" : "#fff", color: category === c ? "#fff" : "#475569", borderColor: category === c ? "#1e40af" : "#e2e8f0", transition: "all 0.15s" }}>
                    {c}
                  </button>
                ))}
              </div>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, background: "#fff", outline: "none", cursor: "pointer" }}>
                <option value="default">Orden predeterminado</option>
                <option value="price_asc">Precio: menor → mayor</option>
                <option value="price_desc">Precio: mayor → menor</option>
                <option value="name">Nombre A–Z</option>
                <option value="stock">Mayor stock primero</option>
              </select>
            </div>

            {/* Info resultados */}
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>
              Mostrando <b style={{ color: "#0f172a" }}>{visible.length}</b> producto{visible.length !== 1 ? "s" : ""}
              {category !== "Todos" ? ` en "${category}"` : ""}
              {search ? ` · búsqueda: "${search}"` : ""}
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 12, marginBottom: 18, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                ⚠ {error}
                <button onClick={reload} style={{ background: "none", border: "none", color: "#dc2626", textDecoration: "underline", cursor: "pointer", fontSize: 13, marginLeft: 4 }}>Reintentar</button>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Cargando productos…</div>
              </div>
            ) : visible.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#475569" }}>Sin resultados</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Intenta con otras palabras o elige otra categoría</div>
                <button onClick={() => { setSearch(""); setCategory("Todos"); }} style={{ marginTop: 14, padding: "8px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(265px, 1fr))", gap: 20 }}>
                {visible.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={addToCart}
                    isAdmin={isAdmin}
                    onEditClick={() => setTab("admin")}
                    onDeleteClick={() => setTab("admin")}
                  />
                ))}
              </div>
            )}

            {/* CTA carrito flotante cuando hay items */}
            {cartCount > 0 && (
              <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 35, animation: "none" }}>
                <button onClick={() => setCartOpen(true)}
                  style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: 50, padding: "14px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(234,88,12,0.45)", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                  🛒 Ver carrito ({cartCount}) · {fmt(cartTotal)}
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── TAB ADMIN ─── */}
        {tab === "admin" && isAdmin && (
          <StoreAdminPanel
            products={products}
            onCreate={createProduct}
            onEdit={updateProduct}
            onDelete={deleteProduct}
            loading={loading}
          />
        )}
      </div>

      {/* ═══ DRAWERS & MODALES ═══ */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeFromCart}
        onCheckout={checkout}
      />

      <OrderJSONModal
        open={orderModal}
        order={currentOrder}
        onClose={() => setOrderModal(false)}
      />
    </div>
  );
}