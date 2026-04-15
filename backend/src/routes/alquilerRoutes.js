const express = require('express');
const router = express.Router();
const alquilerController = require('../controllers/alquilerController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');

router.get('/', verificarToken, alquilerController.listarAlquileres);
router.get('/activos', verificarToken, alquilerController.obtenerAlquileresActivos);
router.get('/historial', verificarToken, alquilerController.consultarHistorialBusqueda);

router.post('/', verificarToken, tienePermiso('Registrar alquileres'), alquilerController.crearAlquiler);
router.put('/devolucion', verificarToken, tienePermiso('Procesar devoluciones'), alquilerController.procesarDevolucion);
router.post('/cancelar', verificarToken, tienePermiso('Cancelar alquileres'), alquilerController.cancelarAlquiler);
module.exports = router;
