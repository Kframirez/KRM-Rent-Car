const express = require('express');
const router = express.Router();
const gamaController = require('../controllers/gamaController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');

router.get('/', verificarToken, gamaController.listarGamas);
router.post('/', verificarToken, gamaController.crearGama);
router.put('/:id', verificarToken, gamaController.actualizarGama);
router.get('/', verificarToken, gamaController.listarGamas);
router.post('/', verificarToken, tienePermiso('Registrar vehiculos'), gamaController.crearGama);
router.put('/:id', verificarToken, tienePermiso('Editar vehiculos'), gamaController.actualizarGama);

module.exports = router;
