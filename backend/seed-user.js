/**
 * seed-user.js
 * Crea un usuario de prueba en la base de datos.
 * Uso: node seed-user.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const { pool } = require("./db");

// ── Cambia estos datos a los que quieras ──────────────────────
const FULL_NAME = "Yael Admin";
const EMAIL     = "yael@sigmafam.com";
const PASSWORD  = "sigma123";
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🔐 Generando hash de contraseña...");
  const password_hash = await bcrypt.hash(PASSWORD, 10);

  console.log("💾 Insertando usuario en la base de datos...");
  try {
    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES (:full_name, :email, :password_hash)`,
      { full_name: FULL_NAME, email: EMAIL, password_hash }
    );
    console.log("✅ Usuario creado exitosamente:");
    console.log(`   Email:      ${EMAIL}`);
    console.log(`   Contraseña: ${PASSWORD}`);
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY") {
      console.log("⚠️  El correo ya existe en la base de datos.");
    } else {
      console.error("❌ Error:", e.message);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
