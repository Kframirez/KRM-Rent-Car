const { Usuario, Role, Permisos } = require('../models');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await Usuario.findOne({ 
            where: Sequelize.where(
                Sequelize.fn('BINARY', Sequelize.col('username')), 
                username
            ),
            include: [{
                model: Role,
                include: [{
                    model: Permisos,
                    through: { attributes: [] }
                }]
            }]
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }

        if (!user.estado) {
            return res.status(403).json({ message: "Su cuenta está desactivada" });
        }

        const listaPermisos = user.Role?.Permisos ? user.Role.Permisos.map(p => p.nombre) : [];

        const token = jwt.sign(
            { 
                id: user.usuario_id, 
                username: user.username, 
                rol_id: user.rol_id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user.usuario_id, 
                nombre: user.nombre, 
                apellido: user.apellido,
                username: user.username,
                imagen_url: user.imagen_url,
                rol_id: user.rol_id,
                permisos: listaPermisos 
            }
        });

    } catch (error) {
        console.error("Error en Login:", error);
        res.status(500).json({ message: "Error interno en el servidor", error: error.message });
    }
};
