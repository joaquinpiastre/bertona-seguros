# Bertona Seguros

Monorepo con dos partes que se despliegan solas al hacer push a `main`:

| Parte | Carpeta | Dónde corre | Qué hace |
|---|---|---|---|
| **Frontend** | `/` (Next.js + Tailwind) | Vercel | Sitio público, panel de administración (`/admin`), portal de socios (`/portal`), login (`/ingresar`). No tiene base de datos: le habla a la API. |
| **Backend** | `/backend` (Hono + PostgreSQL) | Railway | API privada: autenticación, lógica de clientes/pólizas/cuotas/cobros, archivos, recibos PDF y base de datos. |

El frontend (servidor de Vercel) llama al backend con `x-internal-key` + token de sesión; el navegador nunca habla con la API.

## Variables de entorno
**Vercel:** `API_URL` (URL pública del backend), `INTERNAL_API_KEY`.
**Railway (backend):** `DATABASE_URL`, `AUTH_SECRET`, `INTERNAL_API_KEY` (la misma que Vercel), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (primer administrador).

## Desarrollo local
```
# terminal 1 (backend, base local embebida en backend/.data)
cd backend && npm install && INTERNAL_API_KEY=devkey npm run dev
# terminal 2 (frontend)
npm install && API_URL=http://localhost:4000 INTERNAL_API_KEY=devkey npm run dev
```
Sin `DATABASE_URL` el backend crea el admin `admin@bertona.local` / `admin1234` (solo desarrollo).

Datos de la empresa editables: `src/config/empresa.ts` (y `backend/src/empresa.ts` para los recibos).
