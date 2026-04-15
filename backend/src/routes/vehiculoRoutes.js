const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', verificarToken, vehiculoController.listarVehiculos);
router.get('/ranking-flota', verificarToken, vehiculoController.obtenerRankingFlota);
router.post('/',verificarToken,tienePermiso('Registrar vehiculos'),upload.single('imagen'),vehiculoController.guardarVehiculo);
router.put('/:id',verificarToken,tienePermiso('Editar vehiculos'),upload.single('imagen'),vehiculoController.guardarVehiculo);
router.patch('/estado/:id',verificarToken,tienePermiso('Editar vehiculos'),vehiculoController.actualizarEstadoVehiculo);

module.exports = router;
