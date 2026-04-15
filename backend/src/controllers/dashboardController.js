const { Op } = require('sequelize');
const {
  Cliente,
  Vehiculo,
  Alquiler,
  AlquilerDetalle,
  Pago,
  PagoDetalle,
  Penalidades,
  Recepcion,
  RecepcionDetalle,
  Usuario
} = require('../models/index');
const sequelize = require('../config/db');

const hoyISO = () => new Date().toISOString().split('T')[0];

const toNumber = (value) => parseFloat(value || 0);

const formatUserName = (usuario) => {
  if (!usuario) return 'Sistema';
  const nombre = usuario.nombre || '';
  const apellido = usuario.apellido || '';
  return `${nombre} ${apellido}`.trim() || usuario.username || 'Usuario';
};

exports.obtenerMetricasHome = async (req, res) => {
  try {
    const hoy = hoyISO();
    const hace6Dias = new Date();
    hace6Dias.setDate(hace6Dias.getDate() - 6);
    const inicioSemana = hace6Dias.toISOString().split('T')[0];

    const [
      clientesActivos,
      vehiculosTotal,
      vehiculosDisponibles,
      ingresosTotal,
      ingresosHoy,
      alquileresActivos,
      contratosVencenHoy,
      contratosAtrasados,
      devolucionesHoy,
      penalidadesPendientesCount,
      penalidadesPendientes,
      recientesRentas,
      recientesPagos,
      recientesDevoluciones,
      graficoIngresosRaw,
      pagosDetalleActivos,
      detallesAlquiler,
      usuarios
    ] = await Promise.all([
      Cliente.count({ where: { estado: true } }),
      Vehiculo.count(),
      Vehiculo.count({ where: { estado: true } }),
      Pago.sum('total_recibo', { where: { estado: 'REGISTRADO' } }),
      Pago.sum('total_recibo', { where: { estado: 'REGISTRADO', fecha_pago: hoy } }),
      Alquiler.count({ where: { estado: 'ACTIVO' } }),
      Alquiler.findAll({
        where: { estado: 'ACTIVO', fecha_fin: hoy },
        include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }],
        order: [['alquiler_id', 'DESC']],
        limit: 5
      }),
      Alquiler.findAll({
        where: { estado: 'ACTIVO', fecha_fin: { [Op.lt]: hoy } },
        include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }],
        order: [['fecha_fin', 'ASC']],
        limit: 5
      }),
      Recepcion.count({
        where: { estado: 'REGISTRADA', fecha_devolucion: hoy }
      }),
      Penalidades.count({ where: { estado: 'PENDIENTE' } }),
      Penalidades.findAll({
        where: { estado: 'PENDIENTE' },
        include: [{
          model: Alquiler,
          attributes: ['alquiler_id', 'cliente_id'],
          include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }]
        }],
        order: [['penalidad_id', 'DESC']],
        limit: 5
      }),
      Alquiler.findAll({
        limit: 4,
        order: [['alquiler_id', 'DESC']],
        include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }]
      }),
      Pago.findAll({
        where: { estado: 'REGISTRADO' },
        limit: 4,
        order: [['pago_id', 'DESC']],
        include: [{ model: Alquiler, include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }] }]
      }),
      Recepcion.findAll({
        where: { estado: 'REGISTRADA' },
        limit: 4,
        order: [['devolucion_id', 'DESC']],
        include: [
          {
            model: Alquiler,
            include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }]
          },
          {
            model: RecepcionDetalle,
            as: 'DetallesRecepcion',
            required: false,
            include: [{ model: Vehiculo, attributes: ['marca', 'modelo', 'placa'] }]
          }
        ]
      }),
      Pago.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('fecha_pago')), 'fecha'],
          [sequelize.fn('SUM', sequelize.col('total_recibo')), 'total']
        ],
        where: {
          estado: 'REGISTRADO',
          fecha_pago: { [Op.between]: [inicioSemana, hoy] }
        },
        group: [sequelize.fn('DATE', sequelize.col('fecha_pago'))],
        order: [[sequelize.fn('DATE', sequelize.col('fecha_pago')), 'ASC']]
      }),
      PagoDetalle.findAll({ where: { estado: 'ACTIVO' } }),
      Alquiler.findAll({
        where: { estado: { [Op.in]: ['ACTIVO', 'FINALIZADO'] } },
        include: [
          { model: Cliente, attributes: ['cliente_id', 'nombre', 'apellido'] },
          {
            model: AlquilerDetalle,
            as: 'AlquilerDetalles',
            include: [{ model: Vehiculo, attributes: ['marca', 'modelo', 'placa'] }]
          },
          {
            model: Penalidades,
            as: 'Penalidades',
            required: false
          }
        ]
      }),
      Usuario.findAll({
        attributes: ['usuario_id', 'nombre', 'apellido', 'username']
      })
    ]);

    const usuariosMap = new Map(
      usuarios.map((u) => [u.usuario_id, formatUserName(u)])
    );

    const detallePagadoMap = new Map();
    pagosDetalleActivos.forEach((detalle) => {
      const key = `${detalle.tipo_cargo}-${detalle.referencia_id}`;
      detallePagadoMap.set(key, (detallePagadoMap.get(key) || 0) + toNumber(detalle.monto));
    });

    const vehiculosEnRentaIds = new Set();
    let cargosPendientes = 0;
    const clientesConDeudaIds = new Set();
    const ingresosVehiculoMap = new Map();

    detallesAlquiler.forEach((alquiler) => {
      const clienteId = alquiler.Cliente?.cliente_id;

      (alquiler.AlquilerDetalles || []).forEach((detalle) => {
        if (detalle.estado === 'ACTIVO') {
          vehiculosEnRentaIds.add(detalle.vehiculo_id);
        }

        const saldoRenta = toNumber(detalle.subtotal) - toNumber(detallePagadoMap.get(`ALQUILER-${detalle.detalle_alquiler_id}`));
        if (saldoRenta > 0) {
          cargosPendientes++;
          if (clienteId) clientesConDeudaIds.add(clienteId);
        }

        const vehiculo = detalle.Vehiculo;
        if (vehiculo) {
          const actual = ingresosVehiculoMap.get(detalle.vehiculo_id) || {
            vehiculo_id: detalle.vehiculo_id,
            nombre: `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim() || `Unidad ${detalle.vehiculo_id}`,
            placa: vehiculo.placa || 'N/D',
            total: 0,
            rentas: 0
          };

          actual.total += toNumber(detalle.subtotal);
          actual.rentas += 1;
          ingresosVehiculoMap.set(detalle.vehiculo_id, actual);
        }
      });

      (alquiler.Penalidades || []).forEach((penalidad) => {
        const saldoPenalidad = toNumber(penalidad.monto) - toNumber(detallePagadoMap.get(`PENALIDAD-${penalidad.penalidad_id}`));
        if (saldoPenalidad > 0) {
          cargosPendientes++;
          if (clienteId) clientesConDeudaIds.add(clienteId);
        }
      });
    });

    const vehiculosNoDisponibles = Math.max(vehiculosTotal - vehiculosDisponibles, 0);
    const vehiculosEnRenta = vehiculosEnRentaIds.size;
    const vehiculosBloqueados = Math.max(vehiculosNoDisponibles - vehiculosEnRenta, 0);
    const devolucionesPendientesHoy = devolucionesHoy;

    const actividad = [
      ...recientesRentas.map((item) => ({
        id: `alq-${item.alquiler_id}`,
        tipo: 'RENTA',
        titulo: 'Nueva renta',
        referencia: `KR-${item.alquiler_id}`,
        detalle: `${item.Cliente?.nombre || ''} ${item.Cliente?.apellido || ''}`.trim() || 'Cliente',
        usuario: usuariosMap.get(item.usuario_id) || 'Agente operativo',
        fecha: item.fecha_alquiler || item.fecha_inicio || hoy,
        estado: item.estado,
        tono: 'gold'
      })),
      ...recientesPagos.map((item) => ({
        id: `pag-${item.pago_id}`,
        tipo: 'PAGO',
        titulo: 'Pago registrado',
        referencia: `PAG-${item.pago_id}`,
        detalle: item.Alquiler?.Cliente ? `${item.Alquiler.Cliente.nombre} ${item.Alquiler.Cliente.apellido}` : 'Movimiento de caja',
        usuario: usuariosMap.get(item.usuario_id) || 'Caja',
        fecha: item.fecha_pago || hoy,
        estado: item.estado,
        tono: 'green',
        monto: toNumber(item.total_recibo)
      })),
      ...recientesDevoluciones.map((item) => {
        const primerVehiculo = item.DetallesRecepcion?.[0]?.Vehiculo;
        return {
          id: `dev-${item.devolucion_id}`,
          tipo: 'DEVOLUCION',
          titulo: 'Devolución completada',
          referencia: `DEV-${item.devolucion_id}`,
          detalle: primerVehiculo ? `${primerVehiculo.marca} ${primerVehiculo.modelo}` : 'Unidad retornada',
          usuario: usuariosMap.get(item.usuario_id) || 'Recepción',
          fecha: item.fecha_devolucion || hoy,
          estado: item.estado,
          tono: 'slate'
        };
      })
    ]
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
      .slice(0, 8);

    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hace6Dias);
      fecha.setDate(hace6Dias.getDate() + i);
      const iso = fecha.toISOString().split('T')[0];
      diasSemana.push({
        fecha: iso,
        label: fecha.toLocaleDateString('es-DO', { weekday: 'short' }).replace('.', ''),
        total: 0
      });
    }

    graficoIngresosRaw.forEach((item) => {
      const fecha = item.getDataValue('fecha');
      const match = diasSemana.find((dia) => dia.fecha === fecha);
      if (match) {
        match.total = toNumber(item.getDataValue('total'));
      }
    });

    const ingresosPorVehiculo = Array.from(ingresosVehiculoMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    const alertas = [
      {
        id: 'vencen-hoy',
        titulo: 'Contratos por vencer hoy',
        valor: contratosVencenHoy.length,
        tono: contratosVencenHoy.length > 0 ? 'warning' : 'ok',
        detalle: contratosVencenHoy.slice(0, 3).map((item) => ({
          referencia: `KR-${item.alquiler_id}`,
          descripcion: `${item.Cliente?.nombre || ''} ${item.Cliente?.apellido || ''}`.trim()
        }))
      },
      {
        id: 'atrasados',
        titulo: 'Devoluciones atrasadas',
        valor: contratosAtrasados.length,
        tono: contratosAtrasados.length > 0 ? 'danger' : 'ok',
        detalle: contratosAtrasados.slice(0, 3).map((item) => ({
          referencia: `KR-${item.alquiler_id}`,
          descripcion: `${item.Cliente?.nombre || ''} ${item.Cliente?.apellido || ''}`.trim()
        }))
      },
      {
        id: 'penalidades',
        titulo: 'Unidades con penalidad',
        valor: penalidadesPendientesCount,
        tono: penalidadesPendientesCount > 0 ? 'danger' : 'ok',
        detalle: penalidadesPendientes.slice(0, 3).map((item) => ({
          referencia: item.Alquiler ? `KR-${item.Alquiler.alquiler_id}` : 'Pendiente',
          descripcion: item.descripcion
        }))
      },
      {
        id: 'bloqueados',
        titulo: 'Vehículos no disponibles',
        valor: vehiculosNoDisponibles,
        tono: vehiculosNoDisponibles > 0 ? 'warning' : 'ok',
        detalle: [{
          referencia: 'Flota',
          descripcion: `${vehiculosEnRenta} en renta y ${vehiculosBloqueados} desactivados`
        }]
      },
      {
        id: 'deuda',
        titulo: 'Clientes con balance pendiente',
        valor: clientesConDeudaIds.size,
        tono: clientesConDeudaIds.size > 0 ? 'warning' : 'ok',
        detalle: [{
          referencia: 'Cobranza',
          descripcion: `${cargosPendientes} cargos pendientes de liquidación`
        }]
      }
    ];

    res.json({
      principal: {
        clientes: clientesActivos,
        vehiculos: vehiculosTotal,
        disponibles: vehiculosDisponibles,
        ingresos: toNumber(ingresosTotal),
        ingresosHoy: toNumber(ingresosHoy)
      },
      operativo: {
        alquileresActivos,
        vehiculosEnRenta,
        devolucionesPendientesHoy,
        pagosPendientes: cargosPendientes,
        penalidadesPendientes: penalidadesPendientesCount,
        clientesConDeuda: clientesConDeudaIds.size
      },
      flota: {
        disponibles: vehiculosDisponibles,
        enRenta: vehiculosEnRenta,
        desactivados: vehiculosBloqueados
      },
      ingresosPorVehiculo,
      actividad,
      alertas,
      graficoIngresos: diasSemana
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
