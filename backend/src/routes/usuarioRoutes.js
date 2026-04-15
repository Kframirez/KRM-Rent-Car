const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');
const { tieneAlgunPermiso } = require('../middlewares/checkPermission');
const upload = require('../middlewares/uploadMiddleware');

router.patch('/estado/:id', verificarToken, tienePermiso('Gestionar usuarios'), usuarioController.cambiarEstadoUsuario);
router.post('/crear', verificarToken, tienePermiso('Gestionar usuarios'), upload.single('imagen'), usuarioController.crearUsuario);
router.put('/:id', verificarToken, tienePermiso('Gestionar usuarios'), upload.single('imagen'), usuarioController.actualizarUsuario);
router.get('/', verificarToken, tienePermiso('Gestionar usuarios'), usuarioController.obtenerUsuarios);
router.get('/roles', verificarToken, tieneAlgunPermiso(['Gestionar usuarios', 'Gestionar roles', 'Gestionar permisos']), usuarioController.obtenerRoles);
router.get('/permisos/todos', verificarToken, tienePermiso('Gestionar permisos'), usuarioController.obtenerTodosLosPermisos);
router.get('/roles/:rol_id/permisos', verificarToken, tienePermiso('Gestionar permisos'), usuarioController.obtenerPermisosDelRol);
router.post('/roles/permisos/sync', verificarToken, tienePermiso('Gestionar permisos'), usuarioController.actualizarPermisosRol);

module.exports = router;
