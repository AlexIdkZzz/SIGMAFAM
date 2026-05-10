/**
 * HeatmapLayer — Mapa de calor estilo Uber usando canvas puro + Leaflet.
 * Algoritmo de 2 pasadas:
 *   1) Dibuja blobs blancos con blur en un canvas temporal
 *   2) Coloriza pixel a pixel con la paleta verde→amarillo→naranja→rojo
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

// ── Paleta de color (256 valores RGB) ────────────────────────────────────────
function buildPalette() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0.00, "rgba(0,255,120,0)");      // transparent → bajo
  grd.addColorStop(0.20, "#00e676");                 // verde vivo
  grd.addColorStop(0.45, "#ffee58");                 // amarillo
  grd.addColorStop(0.65, "#ff9800");                 // naranja
  grd.addColorStop(0.85, "#f44336");                 // rojo
  grd.addColorStop(1.00, "#b71c1c");                 // rojo oscuro — máximo
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

const PALETTE = buildPalette();

// ── Dibuja un blob difuminado (pass 1) ───────────────────────────────────────
function drawBlob(ctx, x, y, radius, alpha) {
  const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grd.addColorStop(0,   `rgba(255,255,255,${Math.min(1, alpha)})`);
  grd.addColorStop(0.4, `rgba(255,255,255,${Math.min(1, alpha * 0.6)})`);
  grd.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// ── Coloriza el canvas (pass 2) ───────────────────────────────────────────────
function colorize(ctx, width, height) {
  const img  = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  for (let i = 3; i < data.length; i += 4) {
    const v  = data[i];           // intensidad acumulada (canal alpha del blob)
    if (v === 0) continue;
    const pi = Math.floor(v) * 4; // índice en la paleta
    data[i - 3] = PALETTE[pi];
    data[i - 2] = PALETTE[pi + 1];
    data[i - 1] = PALETTE[pi + 2];
    data[i]     = Math.min(255, v * 2.2);
  }
  ctx.putImageData(img, 0, 0);
}

// ── Componente React ──────────────────────────────────────────────────────────
export default function HeatmapLayer({
  points = [],      // [{ lat, lng, intensity }]
  radius  = 55,     // px del blob
  maxInt  = null,   // intensidad máxima (auto si null)
  opacity = 0.82,
}) {
  const map       = useMap();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!points.length) return;

    // Calcular intensidad máxima
    const maxIntensity = maxInt ?? Math.max(...points.map((p) => p.intensity ?? 1), 1);

    // Crear canvas y agregarlo al pane "overlayPane"
    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
      opacity: ${opacity};
      z-index: 400;
      mix-blend-mode: normal;
    `;
    map.getPanes().overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    // ── Función de render ────────────────────────────────────────────────────
    function render() {
      const size   = map.getSize();
      const origin = map.containerPointToLayerPoint([0, 0]);

      canvas.width  = size.x;
      canvas.height = size.y;
      canvas.style.transform = `translate(${origin.x}px,${origin.y}px)`;

      // Canvas temporal para los blobs blancos
      const tmp    = document.createElement("canvas");
      tmp.width    = size.x;
      tmp.height   = size.y;
      const tmpCtx = tmp.getContext("2d");

      // Pass 1 — blobs de intensidad
      points.forEach(({ lat, lng, intensity = 1 }) => {
        const pt    = map.latLngToContainerPoint([lat, lng]);
        const alpha = Math.min(1, (intensity / maxIntensity) * 0.95) + 0.05;
        drawBlob(tmpCtx, pt.x, pt.y, radius, alpha);
      });

      // Pass 2 — colorizar
      colorize(tmpCtx, size.x, size.y);

      // Volcar al canvas principal
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size.x, size.y);
      ctx.drawImage(tmp, 0, 0);
    }

    map.on("moveend zoomend viewreset resize", render);
    render();

    // Cleanup
    return () => {
      map.off("moveend zoomend viewreset resize", render);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map, points, radius, maxInt, opacity]);

  return null;
}
