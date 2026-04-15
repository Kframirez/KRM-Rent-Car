const { Op } = require('sequelize');
const { Vehiculo, Gama, PrecioVehiculo, AlquilerDetalle, Alquiler } = require('../models/index');

exports.consultarDisponibilidad = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const hayRango = Boolean(desde && hasta);

    if ((desde && !hasta) || (!desde && hasta)) {
      return res.status(400).json({
        message: 'Debe indicar fecha desde y fecha hasta para consultar disponibilidad'
      });
    }

    if (hayRango && desde > hasta) {
      return res.status(400).json({
        message: 'La fecha desde no puede ser mayor que la fecha hasta'
      });
    }

    const vehiculos = await Vehiculo.findAll({
      include: [
        {
          model: Gama,
          attributes: ['nombre'],
          required: false
        },
        {
          model: PrecioVehiculo,
          as: 'ListaPrecios',
          attributes: ['tipo_dia_id', 'precio'],
          required: false
        }
      ]
    });

    const hoy = new Date().toISOString().split('T')[0];

    const filtroFecha = hayRango
      ? {
          fecha_inicio: { [Op.lte]: hasta },
          fecha_fin: { [Op.gte]: desde }
        }
      : {
          fecha_inicio: { [Op.lte]: hoy },
          fecha_fin: { [Op.gte]: hoy }
        };

    const detallesActivos = await AlquilerDetalle.findAll({
      where: { estado: 'ACTIVO' },
      attributes: ['vehiculo_id'],
      include: [{
        model: Alquiler,
        attributes: [],
        required: true,
        where: {
          estado: 'ACTIVO',
          ...filtroFecha
        }
      }]
    });

    const ocupadosIds = [...new Set(detallesActivos.map((d) => d.vehiculo_id))];

    const resultado = vehiculos
      .filter((vehiculo) => {
        const estaEnRenta = ocupadosIds.includes(vehiculo.vehiculo_id);

        // Si la unidad fue desactivada manualmente, no debe contarse.
        // La excepcion es cuando sigue asociada a un alquiler activo.
        return Boolean(vehiculo.estado) || estaEnRenta;
      })
      .map((vehiculo) => {
        const estaEnRenta = ocupadosIds.includes(vehiculo.vehiculo_id);
        const lista = vehiculo.ListaPrecios || [];
        const precioNormalRow = lista.find((p) => p.tipo_dia_id === 1);

        return {
          id: vehiculo.vehiculo_id,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          placa: vehiculo.placa,
          gama: vehiculo.Gama ? vehiculo.Gama.nombre : 'ESTANDAR',
          estado: estaEnRenta ? 'EN RENTA' : 'DISPONIBLE',
          tarifa: precioNormalRow ? parseFloat(precioNormalRow.precio) : 0.00
        };
      });

    res.json(hayRango ? resultado.filter((v) => v.estado === 'DISPONIBLE') : resultado);
  } catch (error) {
    res.status(500).json({
      message: 'Error al sincronizar inventario y tarifas',
      error: error.message
    });
  }
};
