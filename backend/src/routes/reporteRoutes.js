const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController'); 
const verificarToken = require('../middlewares/authMiddleware');

router.get('/rendimiento-flota', verificarToken, reporteController.obtenerRendimientoFlota);
router.get('/clientes-elite', verificarToken, reporteController.obtenerClientesElite);
router.get('/penalidades', verificarToken, reporteController.obtenerMetricasPenalidades);
router.get('/analitica-feriados', verificarToken, reporteController.obtenerAnaliticaFeriados);
module.exports = router;