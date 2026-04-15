# Base de datos

Esta carpeta deja la base lista dentro del proyecto.

## Archivos

- `schema.sql`: estructura completa exportada desde la base local `krm_rent_car`.
- `seed-core.sql`: datos minimos para arrancar catalogos y seguridad base sin publicar credenciales reales.

## Orden recomendado

1. Crear la base `krm_rent_car`.
2. Ejecutar `schema.sql`.
3. Ejecutar `seed-core.sql`.
4. Crear manualmente tu usuario administrador con una clave propia.
5. Configurar el archivo `.env`.
6. Levantar el backend con `npm run dev`.

## Crear usuario administrador

Ejemplo SQL:

```sql
INSERT INTO `usuarios` (`usuario_id`, `rol_id`, `nombre`, `apellido`, `username`, `password`, `imagen_url`, `estado`) VALUES
(1, 1, 'Admin', 'Principal', 'admin', 'TU_PASSWORD_SEGURA', NULL, 1);
```

Si prefieres que el seed genere el admin automaticamente en tu maquina local, define `SEED_ADMIN_PASSWORD` en `backend/.env` y ejecuta:

```bash
npm run db:export
```

## Exportar nuevamente

Si haces cambios en tu MySQL local y quieres refrescar los archivos SQL:

```bash
npm run db:export
```
