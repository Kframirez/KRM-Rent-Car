const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');

router.get('/clientes', verificarToken, devolucionController.listarClientesConAlquilerActivo);
router.get('/vehiculos/:cliente_id', verificarToken, devolucionController.obtenerVehiculosActivosPorCliente);
router.post('/confirmar', verificarToken, tienePermiso('Procesar devoluciones'), devolucionController.confirmarRecepcion);
router.get('/verificar', verificarToken, devolucionController.verificarPorPlaca);

module.exports = router;