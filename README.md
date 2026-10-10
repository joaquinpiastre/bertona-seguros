# Bertona Seguros

Sitio institucional + sistema de gestión (Next.js, Tailwind, PostgreSQL).

- **Sitio público:** `/`. Datos editables en `src/config/empresa.ts`.
- **Panel de administración:** `/admin` (clientes, pólizas, cuotas, cobros en efectivo/transferencia, recibos PDF, caja, equipo).
- **Portal de socios:** `/portal` (pólizas, certificados, pagos y recibos, contactos de emergencia).
- **Ingreso:** `/ingresar`.

## Desarrollo
```
npm install
npm run dev
```
Sin `DATABASE_URL` usa una base local embebida (`.data/`) y crea el admin `admin@bertona.local` / `admin1234` (solo desarrollo).

## Producción
Variables: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (ver `.env.example`).
Los archivos (pólizas, certificados, comprobantes) se guardan en la base de datos; máximo 4 MB cada uno.
