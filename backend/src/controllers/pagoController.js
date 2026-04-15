const { Pago, PagoDetalle, Alquiler, AlquilerDetalle, Penalidades, Vehiculo, Cliente } = require('../models/index');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.obtenerDeudasCliente = async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const alquileres = await Alquiler.findAll({
            where: { cliente_id, estado: { [Op.in]: ['ACTIVO', 'FINALIZADO'] } },
            include: [
                {
                    model: AlquilerDetalle,
                    as: 'AlquilerDetalles',
                    include: [{ model: Vehiculo, attributes: ['marca', 'modelo', 'placa'] }]
                },
                { 
                    model: Penalidades, 
                    as: 'Penalidades', 
                    where: { estado: 'PENDIENTE' }, 
                    required: false 
                }
            ]
        });

        const pagosExistentes = await PagoDetalle.findAll({ where: { estado: 'ACTIVO' } });

        const respuesta = {
            alquileres: alquileres.flatMap(alq =>
                alq.AlquilerDetalles.map(det => {
                    const pagado = pagosExistentes
                        .filter(p => p.tipo_cargo === 'ALQUILER' && parseInt(p.referencia_id) === det.detalle_alquiler_id)
                        .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

                    const saldo = parseFloat(det.subtotal) - pagado;

                    return {
                        alquiler_id: alq.alquiler_id,
                        detalle_alquiler_id: det.detalle_alquiler_id,
                        fecha_reserva: alq.fecha_alquiler,
                        vehiculo: `${det.Vehiculo.marca} ${det.Vehiculo.modelo}`,
                        placa: det.Vehiculo.placa,
                        monto_total: saldo,
                    };
                })
            ).filter(item => item.monto_total > 0),

            penalidades: alquileres.flatMap(alq =>
                (alq.Penalidades || []).map(p => {
                    const pagadoMulta = pagosExistentes
                        .filter(pd => pd.tipo_cargo === 'PENALIDAD' && parseInt(pd.referencia_id) === p.penalidad_id)
                        .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
                    
                    return {
                        penalidad_id: p.penalidad_id,
                        alquiler_id: alq.alquiler_id,
                        tipo: p.tipo,
                        descripcion: p.descripcion,
                        monto: parseFloat(p.monto) - pagadoMulta
                    };
                })
            ).filter(p => p.monto > 0)
        };
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.procesarPago = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { alquiler_id, cargos, metodo, total } = req.body;
        const nuevoPago = await Pago.create({
            alquiler_id,
            usuario_id: req.user.id || 1,
            fecha_pago: new Date(),
            metodo_pago: metodo.toUpperCase(),
            total_recibo: Number(total),
            estado: 'REGISTRADO'
        }, { transaction: t });

        for (const item of cargos) {
            await PagoDetalle.create({
                pago_id: nuevoPago.pago_id,
                tipo_cargo: item.tipo,
                referencia_id: item.id,
                monto: Number(item.monto),
                estado: 'ACTIVO'
            }, { transaction: t });

            if (item.tipo === 'PENALIDAD') {
                const multa = await Penalidades.findByPk(item.id);
                const pagosPrevios = await PagoDetalle.sum('monto', { 
                    where: { tipo_cargo: 'PENALIDAD', referencia_id: item.id, estado: 'ACTIVO' },
                    transaction: t
                });
                if (pagosPrevios >= multa.monto) {
                    await Penalidades.update({ estado: 'PAGADA' }, { where: { penalidad_id: item.id }, transaction: t });
                }
            }
        }
        await t.commit();
        res.json({ message: 'Éxito', pago_id: nuevoPago.pago_id });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerEstadoCuentaCliente = async (req, res) => {
    try {
        const { cliente_id } = req.params;
        
        const cliente = await Cliente.findByPk(cliente_id, {
            include: [{
                model: Alquiler,
                include: [
                    { model: AlquilerDetalle, as: 'AlquilerDetalles', include: [Vehiculo] },
                    { model: Penalidades, as: 'Penalidades' },
                    { 
                        model: Pago, 
                        include: [{ 
                            model: PagoDetalle, 
                            as: 'DesglosePago'
                        }] 
                    }
                ]
            }],
            order: [[Alquiler, 'fecha_alquiler', 'DESC']]
        });

        if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

        const contratos = (cliente.Alquilers || []).map(alq => {
            const movimientos = [];
            let saldo_acumulado = 0;

            const rentaOriginal = parseFloat(alq.monto_total) || 0;
            saldo_acumulado += rentaOriginal;
            movimientos.push({
                fecha: alq.fecha_alquiler,
                concepto: `CARGO: Renta de Vehículo`,
                tipo: 'RENTA',
                cargo: rentaOriginal,
                abono: 0,
                saldo: saldo_acumulado
            });
            (alq.Penalidades || []).forEach(p => {
                const montoP = parseFloat(p.monto) || 0;
                saldo_acumulado += montoP;
                movimientos.push({
                    fecha: p.fecha_registro || alq.fecha_alquiler,
                    concepto: `CARGO: Multa (${p.tipo})`,
                    tipo: 'PENALIDAD',
                    cargo: montoP,
                    abono: 0,
                    saldo: saldo_acumulado
                });
            });

            (alq.Pagos || []).sort((a,b) => new Date(a.fecha_pago) - new Date(b.fecha_pago)).forEach(pago => {
                (pago.DesglosePago || []).forEach(det => {
                    const montoDetalle = parseFloat(det.monto) || 0;
                    saldo_acumulado -= montoDetalle;
                    movimientos.push({
                        fecha: pago.fecha_pago,
                        concepto: `ABONO A ${det.tipo_cargo}: Recibo PAG-${pago.pago_id}`,
                        tipo: det.tipo_cargo,
                        cargo: 0,
                        abono: montoDetalle,
                        saldo: saldo_acumulado
                    });
                });
            });

            return {
                alquiler_id: alq.alquiler_id,
                fecha: alq.fecha_alquiler,
                vehiculos: (alq.AlquilerDetalles || []).map(d => d.Vehiculo ? `${d.Vehiculo.marca} ${d.Vehiculo.modelo}` : 'Unidad'),
                historial: movimientos,
                saldo_final: saldo_acumulado,
                estado: saldo_acumulado <= 0 ? "SALDADO" : alq.estado
            };
        });

        res.json({
            cliente: { nombre: `${cliente.nombre} ${cliente.apellido}`, cedula: cliente.cedula },
            resumenGlobal: {
                totalFacturado: contratos.reduce((acc, c) => acc + c.historial.reduce((a, b) => a + b.cargo, 0), 0),
                totalPagado: contratos.reduce((acc, c) => acc + c.historial.reduce((a, b) => a + b.abono, 0), 0),
                balancePendiente: contratos.reduce((acc, c) => acc + c.saldo_final, 0)
            },
            contratos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerMetricasIngresos = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const dateFilter = { estado: 'REGISTRADO' };
        
        if (inicio && fin) {
            dateFilter.fecha_pago = { [Op.between]: [inicio, fin] };
        }

        const hoy = new Date().toISOString().split('T')[0];

        const [ingresosHoy, ingresosPeriodo, conteoPagosPeriodo, graficoRaw] = await Promise.all([
            Pago.sum('total_recibo', { where: { fecha_pago: hoy, estado: 'REGISTRADO' } }),
            Pago.sum('total_recibo', { where: dateFilter }),
            Pago.count({ where: dateFilter }),
            Pago.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('fecha_pago')), 'fecha'],
                    [sequelize.fn('SUM', sequelize.col('total_recibo')), 'total']
                ],
                where: dateFilter,
                group: [sequelize.fn('DATE', sequelize.col('fecha_pago'))],
                order: [[sequelize.fn('DATE', sequelize.col('fecha_pago')), 'ASC']]
            })
        ]);

        const totalPeriodo = parseFloat(ingresosPeriodo || 0);
        const promedio = conteoPagosPeriodo > 0 ? (totalPeriodo / conteoPagosPeriodo) : 0;

        res.json({
            hoy: parseFloat(ingresosHoy || 0),
            periodo: totalPeriodo,
            promedio: parseFloat(promedio.toFixed(2)),
            grafico: graficoRaw.map(g => ({
                fecha: g.getDataValue('fecha'),
                total: parseFloat(g.getDataValue('total'))
            }))
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.obtenerAuditoriaFinanciera = async (req, res) => {
    try {
        const { alquiler_id } = req.params;

        const contrato = await Alquiler.findByPk(alquiler_id, {
            include: [
                { model: Cliente, attributes: ['nombre', 'apellido', 'cedula'] },
                {
                    model: AlquilerDetalle,
                    as: 'AlquilerDetalles',
                    include: [{ model: Vehiculo, attributes: ['marca', 'modelo'] }]
                },
                { model: Penalidades, as: 'Penalidades', required: false }
            ]
        });

        if (!contrato) return res.status(404).json({ error: "Contrato no hallado" });

        const pagos = await Pago.findAll({
            where: { alquiler_id: alquiler_id },
            attributes: ['pago_id', 'usuario_id', 'fecha_pago', 'metodo_pago', 'total_recibo', 'estado', 'alquiler_id'],
            include: [{ model: PagoDetalle, as: 'DesglosePago', required: false }]
        });

        const rentaBase = parseFloat(contrato.monto_total) || 0;
        const penalidadesTotal = contrato.Penalidades?.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0) || 0;
        const pagadoTotal = pagos?.reduce((acc, p) => acc + (parseFloat(p.total_recibo) || 0), 0) || 0;
        const balanceNeto = (rentaBase + penalidadesTotal) - pagadoTotal;

        res.json({
            info: {
                id: contrato.alquiler_id,
                cliente: `${contrato.Cliente?.nombre || 'S/N'} ${contrato.Cliente?.apellido || ''}`,
                fecha: contrato.fecha_alquiler,
            },
            financiero: {
                renta_base: rentaBase,
                penalidades: penalidadesTotal,
                pagado: pagadoTotal,
                balance: balanceNeto,
                status: balanceNeto <= 0 ? "SALDADO" : (penalidadesTotal > 0 ? "PENDIENTE CON PENALIDAD" : "PENDIENTE")
            },
            movimientos: pagos ? pagos.flatMap(p => (p.DesglosePago || []).map(d => ({
                pago_id: p.pago_id,
                fecha: p.fecha_pago,
                metodo: p.metodo_pago,
                monto: d.monto,
                tipo: d.tipo_cargo
            }))) : []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
