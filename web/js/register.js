const msg = document.getElementById("msg");
const btn = document.getElementById("btnRegister");

function show(type, text){
  msg.className = "msg " + type;
  msg.textContent = text;
  msg.style.display = "block";
}

btn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    show("warn", "Completa todos los campos.");
    return;
  }
  if (password.length < 6) {
    show("warn", "La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creando cuenta...";

  try {
    const res = await fetch("/sigmafam/api/auth/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      show("ok", "Cuenta creada ✅ entrando al dashboard...");
      setTimeout(() => window.location.href = "dashboard.php", 650);
    } else if (res.status === 409) {
      show("warn", "Ese correo ya existe. Intenta con otro.");
    } else {
      show("warn", data.error || "No se pudo registrar.");
    }
  } catch (e) {
    show("warn", "Error de red. Revisa Apache/MySQL.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrarme";
  }
});
