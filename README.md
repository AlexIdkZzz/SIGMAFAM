# 🚨 SIGMAFAM
### Sistema Integral de Seguridad Familiar

SIGMAFAM es una plataforma web + dispositivo IoT diseñada para monitoreo y gestión de alertas en tiempo real dentro de un núcleo familiar.  

Permite recibir, visualizar y administrar alertas generadas desde un dispositivo portátil conectado a red móvil, mostrando ubicación, estado y métricas operativas en un panel centralizado.

---

## 🧠 Descripción General

El sistema está compuesto por:

- 🌐 **Web App (SPA tipo SaaS)**
- 📡 **Dispositivo IoT (ESP32 + GSM)**
- 🗺 Visualización en tiempo real de alertas
- 👥 Gestión de usuarios y roles
- 📊 Panel administrativo y métricas

---

## 🏗 Arquitectura

Frontend:
- React + Vite
- TailwindCSS
- React Router
- React Context (State Management)
- Leaflet + React-Leaflet (Mapas)

Backend (en desarrollo):
- Node.js / Express o FastAPI
- Base de datos relacional
- API REST
- Autenticación JWT

IoT (en desarrollo):
- ESP32
- SIM808L (GSM/GPRS)
- Comunicación HTTP hacia API

---

## 👤 Roles del Sistema

- **ADMIN** → Control total del sistema
- **JEFE_FAMILIA** → Gestión de miembros y contactos
- **MIEMBRO** → Dispositivo vinculado y generación de alertas

---

## 📌 Módulos Implementados

- Dashboard dinámico
- Gestión de alertas
- Drawer con detalle de alerta
- Mini mapa en tiempo real
- Mapa full con marcador activo
- Simulación de alertas
- Estados: RECEIVED / ACTIVE / ATTENDED / CLOSED

---

## 🗺 Mapa en Vivo

Se utiliza OpenStreetMap mediante Leaflet.

Características:
- Marcador dinámico según alerta seleccionada
- Mini mapa en panel lateral
- Preparado para actualización en tiempo real

---

## 🚀 ¿Cuando sale la versión oficial?

Espero que dentro de poco, estoy poniendo mucho esfuerzo, ganas y en general, me apasiona este proyecto.