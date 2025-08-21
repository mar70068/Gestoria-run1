# Gestorly — Demo MVP (Next.js para Vercel)

Demo mínima para probar login con token de Supabase, CRUD de clientes, subida de documentos a Supabase Storage vía URL firmada del BFF y creación de threads.

## 🚀 Deploy en Vercel (pasos rápidos)
1. Descarga este proyecto y súbelo a un repositorio (GitHub/GitLab/Bitbucket).
2. En Vercel: **New Project → Import** tu repo.
3. En **Environment Variables**, añade:
   - `NEXT_PUBLIC_BFF_URL` → URL pública de tu BFF (por ejemplo `https://bff.gestorly.com`).
4. Deploy.

> Necesitas tener el **BFF** corriendo y accesible públicamente con los endpoints definidos (`/api/v1/...`).

## ▶️ Local
```bash
npm install
cp .env.example .env.local   # y edita NEXT_PUBLIC_BFF_URL
npm run dev
```
Abre `http://localhost:3000`.

## 🔐 Uso
- Pega un **JWT de Supabase** (session.access_token) en el bloque de Login.
- Carga/crea clientes.
- Selecciona un cliente y sube un documento (usa la signed URL del BFF).
- Crea un thread y envía un mensaje.

## 📦 Estructura
- `pages/index.tsx` — UI de la demo
- `pages/_app.tsx` — CSS global
- `styles/globals.css` — utilidades CSS mínimas
- `next.config.mjs` — config Next
- `package.json` — scripts

---
Hecho con 💙 para mover rápido el MVP.
