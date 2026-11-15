# Conectar PostgreSQL a StoreManager POS (Windows)

El proyecto **ya existe** en Supabase y la migración inicial **ya fue aplicada**.
No necesitas recrear las tablas ni pegar SQL en el panel.

## 1. Obtener la rama de desarrollo

En PowerShell desde la carpeta local del repositorio:

```powershell
git fetch origin
git switch feature/backend-supabase
Copy-Item server\.env.example server\.env
```

Si aún no clonaste el repositorio:

```powershell
gh repo clone pegasos99/Sistema-de-punto-de-Venta
cd Sistema-de-punto-de-Venta
git fetch origin
git switch feature/backend-supabase
Copy-Item server\.env.example server\.env
```

Edita **server/.env**, no el archivo de ejemplo, con VS Code, Bloc de notas u otro
editor. `.env` no se sube al repositorio (está ignorado por `.gitignore`).

## 2. Valores necesarios

Supabase: https://supabase.com/dashboard/project/ejmahzmyzmdfjadiqkdp

- `SUPABASE_URL`: ya viene fijado al proyecto de desarrollo en `.env.example`.
- `SUPABASE_PUBLISHABLE_KEY`: **Project Settings > API Keys**; copiar la clave
  publicable activa que comienza con `sb_publishable_`.
- `DATABASE_URL`: **Connect > Session pooler > URI**. Copiar la cadena completa.
  Sustituir el marcador de contraseña por la contraseña de **la base de datos**
  (no de la cuenta Supabase). El host y usuario deben conservarse tal como
  aparecen en tu panel, no copiarlos de ejemplos genéricos.
  Una contraseña con `@`, `#`, `%`, `/` o `:` debe codificarse en formato
  percent-encoding dentro de la URL; por ejemplo `@` es `%40`.

El backend toma las tres variables de `server/.env`.
**Nunca** usar `DATABASE_URL` en el frontend, en `VITE_*` ni en GitHub.
No enviar el contenido del `.env` en el chat. `.env.example` es público e inocuo.

## 3. Comprobar la conexión y ejecutar

Desde la raíz:

```powershell
cd server
npm install
npm run check:connection
npm run build
npm test
npm run dev
```

`npm run check:connection` hace una lectura de PostgreSQL y verifica las tablas
principales. No crea, modifica ni elimina datos y **no imprime credenciales**.
Si aparece `[OK]`, la conectividad de base de datos está preparada.

Prueba desde el navegador `http://127.0.0.1:3001/health`; devuelve
`{"status":"ok"}` cuando el proceso arranca. **Esto por sí solo no prueba
la conexión DB**, por eso existe el comando previo.

El backend aún no está conectado al frontend: éste sigue usando JSON-server.
Para probar endpoints protegidos faltará crear usuarios de prueba en Supabase
Auth y vincularlos a un negocio mediante `business_memberships`.

## 4. Solución de problemas

- Si no existe `server/.env`, vuelve a copiar el archivo de ejemplo.
- Si `DATABASE_URL` falla, comprueba el botón **Connect** del proyecto, la
  contraseña de base de datos y el modo **Session pooler**.
- Si el puerto 5432 está restringido en tu red, revisa con Supabase las
  alternativas de conexión y no cambies puertos al azar.
- Si PowerShell indica que no existe `npm`, instala Node.js LTS (22 o superior).

La migración registrada en Supabase es `20261115154816_initial_pos`.
No vuelvas a aplicar manualmente la misma migración.
