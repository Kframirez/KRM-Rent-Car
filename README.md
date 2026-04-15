# KRM Rent Car

Sistema web para la gestion de alquiler de vehiculos.

La idea de este proyecto es cubrir el flujo completo de una rent car: clientes, vehiculos, alquileres, pagos, devoluciones, reportes y seguridad de usuarios. Esta version esta dividida en dos partes:

- `frontend`: interfaz en React + Vite
- `backend`: API en Node.js + Express + MySQL

## Que incluye

- Inicio de sesion con JWT
- Gestion de clientes
- Gestion de vehiculos
- Registro de alquileres, pagos y devoluciones
- Reportes y consultas
- Seguridad por usuarios, roles y permisos

## Tecnologias usadas

- React
- Vite
- Tailwind CSS
- Node.js
- Express
- MySQL
- Sequelize

## Antes de empezar

Necesitas tener instalado:

- Node.js
- MySQL
- Git

## Como correr el proyecto

### 1. Clona el repositorio

```bash
git clone https://github.com/TU-USUARIO/TU-REPO.git
cd krm-rent-car
```

### 2. Configura el backend

En la carpeta `backend`, crea tu archivo `.env` tomando como referencia `backend/.env.example`.

Ejemplo:

```env
PORT=3000
DB_NAME=krm_rent_car
DB_USER=root
DB_PASS=tu_clave
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=tu_secreto_seguro
DB_SYNC=false
CORS_ORIGIN=http://localhost:5173
SEED_ADMIN_PASSWORD=
```

Instala dependencias y levanta el servidor:

```bash
cd backend
npm install
npm run dev
```

### 3. Configura la base de datos

Dentro de `backend/database` tienes los archivos base:

- `schema.sql`: crea la estructura de la base de datos
- `seed-core.sql`: carga datos base del sistema

Orden recomendado:

```text
1. Crear la base de datos krm_rent_car
2. Ejecutar schema.sql
3. Ejecutar seed-core.sql
4. Crear tu usuario administrador con una clave segura
```

Si quieres regenerar esos archivos desde tu base local:

```bash
cd backend
npm run db:export
```

### 4. Levanta el frontend

```bash
cd frontend
npm install
npm run dev
```

Por defecto, el frontend corre en:

```text
http://localhost:5173
```

## Seguridad del repo

Para evitar problemas al subir esto a GitHub, el proyecto ya ignora:

- `node_modules`
- `frontend/dist`
- `backend/.env`
- `backend/uploads`
- certificados, llaves y archivos temporales

Eso significa que puedes publicar el repo sin arrastrar dependencias instaladas ni secretos locales.

## Que si va al repo

- Codigo fuente del frontend y backend
- Archivos SQL base
- `package.json` y `package-lock.json`
- `.env.example`
- Configuraciones del proyecto

## Que no deberias subir nunca

- Tu `.env` real
- Contraseñas reales
- Tokens
- Respaldos de base de datos con informacion privada
- Archivos generados automaticamente

## Estado del proyecto

Este proyecto esta pensado como base funcional para una aplicacion de rent car. Todavia se puede mejorar en varias cosas, pero ya tiene una estructura bastante buena para seguir creciendo, organizarlo mejor y publicarlo de forma limpia.

## Autor

Desarrollado por Kevin Ramirez.
