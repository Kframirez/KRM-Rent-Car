const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/disponibilidadController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', verificarToken, disponibilidadController.consultarDisponibilidad);

module.exports = router;