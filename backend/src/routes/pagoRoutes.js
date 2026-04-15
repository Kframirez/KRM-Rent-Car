const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const verificarToken = require('../middlewares/authMiddleware');
const tienePermiso = require('../middlewares/checkPermission');

router.get('/pendientes/:cliente_id', verificarToken, pagoController.obtenerDeudasCliente);
router.get('/auditoria/:alquiler_id', verificarToken, pagoController.obtenerAuditoriaFinanciera);
router.get('/estado-cuenta-cliente/:cliente_id', verificarToken, pagoController.obtenerEstadoCuentaCliente);
router.get('/metricas-ingresos', verificarToken, pagoController.obtenerMetricasIngresos);
router.get('/analitica/ingresos', 
  verificarToken, 
  tienePermiso('Consultar reportes'), 
  pagoController.obtenerMetricasIngresos
);
router.post('/procesar', verificarToken, tienePermiso('Registrar pagos'), pagoController.procesarPago);
router.post('/registrar', verificarToken, tienePermiso('Registrar pagos'), pagoController.procesarPago);
router.get
module.exports = router;