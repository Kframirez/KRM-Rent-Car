const { Cliente, Alquiler, Penalidades, AlquilerDetalle, PagoDetalle } = require('../models');
const { Op } = require('sequelize');

exports.listarClientes = async (req, res) => {
  try {
    const { soloActivos } = req.query;
    const filtro = soloActivos === 'true' ? { estado: true } : {};

    const clientes = await Cliente.findAll({
      where: filtro,
      order: [['nombre', 'ASC']]
    });
    
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

exports.crearCliente = async (req, res) => {
  try {
    const datos = { ...req.body };
        if (req.file) {
      datos.imagen_url = `/uploads/clientes/${req.file.filename}`;
    }

    const nuevo = await Cliente.create(datos);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ message: "Error al registrar", error: error.message });
  }
};

exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = { ...req.body };
    if (req.file) {
      datos.imagen_url = `/uploads/clientes/${req.file.filename}`;
    }
    if (datos.estado !== undefined) {
      datos.estado = (datos.estado === 'true' || datos.estado === true || datos.estado === 1 || datos.estado === '1');
    }
    if (datos.estado === false) {
      const alquilerPendiente = await Alquiler.findOne({
        where: {
          cliente_id: id,
          estado: { [Op.in]: ['ACTIVO', 'PENDIENTE'] }
        }
      });

      if (alquilerPendiente) {
        return res.status(400).json({ 
          message: "No se puede desactivar: El cliente tiene un contrato activo o reserva pendiente." 
        });
      }

      const deudaPendiente = await Penalidades.findOne({
        include: [{
          model: Alquiler,
          where: { cliente_id: id },
          attributes: []
        }],
        where: { estado: 'PENDIENTE' }
      });

      if (deudaPendiente) {
        return res.status(400).json({ 
          message: "No se puede desactivar: El cliente posee cargos por penalidad pendientes de pago." 
        });
      }

      const alquileresConBalance = await Alquiler.findAll({
        where: {
          cliente_id: id,
          estado: { [Op.in]: ['ACTIVO', 'FINALIZADO'] }
        },
        include: [{
          model: AlquilerDetalle,
          as: 'AlquilerDetalles',
          attributes: ['detalle_alquiler_id', 'subtotal']
        }]
      });

      if (alquileresConBalance.length > 0) {
        const detalleIds = alquileresConBalance.flatMap((alq) =>
          (alq.AlquilerDetalles || []).map((det) => det.detalle_alquiler_id)
        );

        const pagosAlquiler = detalleIds.length > 0
          ? await PagoDetalle.findAll({
              where: {
                tipo_cargo: 'ALQUILER',
                referencia_id: { [Op.in]: detalleIds },
                estado: 'ACTIVO'
              },
              attributes: ['referencia_id', 'monto']
            })
          : [];

        const pagosPorDetalle = pagosAlquiler.reduce((acc, pago) => {
          const referenciaId = parseInt(pago.referencia_id, 10);
          acc[referenciaId] = (acc[referenciaId] || 0) + parseFloat(pago.monto || 0);
          return acc;
        }, {});

        const tieneBalancePendiente = alquileresConBalance.some((alq) =>
          (alq.AlquilerDetalles || []).some((det) => {
            const subtotal = parseFloat(det.subtotal || 0);
            const pagado = pagosPorDetalle[det.detalle_alquiler_id] || 0;
            return (subtotal - pagado) > 0;
          })
        );

        if (tieneBalancePendiente) {
          return res.status(400).json({
            message: "No se puede desactivar: El cliente posee pagos pendientes de renta."
          });
        }
      }
    }
    await Cliente.update(datos, { where: { cliente_id: id } });
    
    const actualizado = await Cliente.findByPk(id);
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar", error: error.message });
  }
};
