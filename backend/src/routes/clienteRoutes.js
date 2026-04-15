const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');
const upload = require('../middlewares/uploadMiddleware');

router.get('/',verificarToken,clienteController.listarClientes);
router.post('/',verificarToken,tienePermiso('Registrar clientes'),upload.single('imagen'),clienteController.crearCliente);
router.put('/:id',verificarToken,tienePermiso('Editar clientes'),upload.single('imagen'),clienteController.actualizarCliente);

module.exports = router;