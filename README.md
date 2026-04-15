# KRM Rent Car

Sistema web para la gestion de alquiler de vehiculos.

Este proyecto busca cubrir el flujo completo de una empresa rent car: clientes, vehiculos, alquileres, pagos, devoluciones, reportes y seguridad de usuarios. Esta dividido en dos partes principales:

- `frontend`: interfaz desarrollada con React + Vite
- `backend`: API desarrollada con Node.js + Express + MySQL

## Funcionalidades principales

- Inicio de sesion con JWT
- Gestion de clientes
- Gestion de vehiculos
- Registro de alquileres, pagos y devoluciones
- Consultas y reportes
- Seguridad por usuarios, roles y permisos

## Tecnologias usadas

- React
- Vite
- Tailwind CSS
- Node.js
- Express
- MySQL
- Sequelize

## Requisitos

Antes de empezar, necesitas tener instalado:

- Node.js
- MySQL
- Git

## Como ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/krm-rent-car.git
cd krm-rent-car
```

### 2. Configurar el backend

Dentro de `backend`, crea un archivo `.env` tomando como referencia `backend/.env.example`.

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

Luego instala dependencias y levanta el servidor:

```bash
cd backend
npm install
npm run dev
```

### 3. Configurar la base de datos

Dentro de `backend/database` estan los archivos base:

- `schema.sql`: crea la estructura de la base de datos
- `seed-core.sql`: carga datos base del sistema

Orden recomendado:

1. Crear la base de datos `krm_rent_car`
2. Ejecutar `schema.sql`
3. Ejecutar `seed-core.sql`
4. Crear tu usuario administrador con una clave segura

Si necesitas regenerar esos archivos desde tu base local:

```bash
cd backend
npm run db:export
```

### 4. Levantar el frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre por defecto en:

```text
http://localhost:5173
```

## Seguridad del repositorio

Para evitar problemas al publicar el proyecto en GitHub, el repositorio ignora automaticamente:

- `node_modules`
- `frontend/dist`
- `backend/.env`
- `backend/uploads`
- certificados, llaves y archivos temporales

## Que si se sube al repo

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

Este proyecto sirve como base funcional para una aplicacion de rent car. Todavia tiene espacio para mejoras, pero ya cuenta con una estructura bastante buena para seguir creciendo, organizarse mejor y publicarse de forma limpia.

## Autor

Desarrollado por Kevin Ramirez.
