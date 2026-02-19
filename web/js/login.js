const msg = document.getElementById("msg");
const btn = document.getElementById("btnLogin");

function show(type, text){
  msg.className = "msg " + type;
  msg.textContent = text;
  msg.style.display = "block";
}

btn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    show("warn", "Ingresa correo y contraseña.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Entrando...";

  try{
    const res = await fetch("/sigmafam/api/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      show("ok", "Listo ✅ entrando...");
      setTimeout(() => window.location.href = "dashboard.php", 450);
    } else {
      show("warn", data.error || "Credenciales inválidas.");
    }
  }catch(e){
    show("warn", "Error de red. Revisa Apache.");
  }finally{
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});
