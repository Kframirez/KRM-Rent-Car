const { Role, Permisos } = require('../models');

const tienePermiso = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.rol_id) {
        return res.status(401).json({ error: "No autorizado. Sesión inválida." });
      }

      const rolId = req.user.rol_id;

      if (rolId === 1) {
        return next();
      }
      const rol = await Role.findByPk(rolId, {
        include: [{
          model: Permisos,
          where: { nombre: permisoRequerido },
          through: { attributes: [] }
        }]
      });

      if (!rol || !rol.Permisos || rol.Permisos.length === 0) {
        console.warn(`⛔ Intento de acceso no autorizado: Usuario ${req.user.username} requiere '${permisoRequerido}'`);
        return res.status(403).json({ 
          error: `Acceso denegado. Tu rango no tiene privilegios para: ${permisoRequerido}` 
        });
      }

      next();
    } catch (error) {
      console.error("❌ Error en Middleware de Permisos:", error);
      res.status(500).json({ error: "Error interno al validar privilegios" });
    }
  };
};

const tieneAlgunPermiso = (permisosRequeridos = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.rol_id) {
        return res.status(401).json({ error: "No autorizado. SesiÃ³n invÃ¡lida." });
      }

      const rolId = req.user.rol_id;

      if (rolId === 1) {
        return next();
      }

      const rol = await Role.findByPk(rolId, {
        include: [{
          model: Permisos,
          where: { nombre: permisosRequeridos },
          through: { attributes: [] }
        }]
      });

      if (!rol || !rol.Permisos || rol.Permisos.length === 0) {
        console.warn(`â›” Intento de acceso no autorizado: Usuario ${req.user.username} requiere alguno de [${permisosRequeridos.join(', ')}]`);
        return res.status(403).json({
          error: `Acceso denegado. Tu rango no tiene ninguno de estos privilegios: ${permisosRequeridos.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error("âŒ Error en Middleware de Permisos:", error);
      res.status(500).json({ error: "Error interno al validar privilegios" });
    }
  };
};

module.exports = tienePermiso;
module.exports.tieneAlgunPermiso = tieneAlgunPermiso;
