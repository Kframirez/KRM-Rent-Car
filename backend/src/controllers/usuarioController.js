const { Usuario, Role, Permisos } = require('../models/index');

exports.obtenerTodosLosPermisos = async (req, res) => {
  try {
    const lista = await Permisos.findAll({
      order: [['modulo', 'ASC'], ['nombre', 'ASC']]
    });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error al traer catálogo de permisos: " + error.message });
  }
};

exports.obtenerPermisosDelRol = async (req, res) => {
  try {
    const { rol_id } = req.params;
    const rol = await Role.findByPk(rol_id, {
      include: [{ 
        model: Permisos, 
        through: { attributes: [] } 
      }]
    });
    res.json(rol ? rol.Permisos : []);
  } catch (error) {
    res.status(500).json({ error: "Error al traer permisos del rol: " + error.message });
  }
};

exports.actualizarPermisosRol = async (req, res) => {
  try {
    const { rol_id, permisosIds } = req.body;
    const rol = await Role.findByPk(rol_id);
    
    if (!rol) return res.status(404).json({ error: "El rol no existe" });

    await rol.setPermisos(permisosIds); 
    
    res.json({ message: "Privilegios actualizados correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al sincronizar: " + error.message });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['usuario_id', 'nombre', 'apellido', 'username', 'estado', 'rol_id', 'imagen_url'],
      include: [{ model: Role, attributes: ['nombre'] }]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ where: { estado: true } });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { rol_id, nombre, apellido, username, password } = req.body;
    const datos = {
      rol_id,
      nombre,
      apellido,
      username,
      password,
      estado: true
    };

    if (req.file) {
      datos.imagen_url = `/uploads/usuarios/${req.file.filename}`;
    }

    await Usuario.create(datos);
    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, username, password, rol_id } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: "No existe el usuario" });

    const updateData = { nombre, apellido, username, rol_id };

    
    if (password && password.trim() !== "") {
      updateData.password = password;
    }

    if (req.file) {
      updateData.imagen_url = `/uploads/usuarios/${req.file.filename}`;
    }

    await usuario.update(updateData);
    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);

    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const nuevoEstado = !usuario.estado;
    await usuario.update({ estado: nuevoEstado });

    res.json({ 
      message: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} con éxito`,
      estado: nuevoEstado 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
