const { Alquiler, AlquilerDetalle, Vehiculo, Cliente, Penalidades, Pago, PagoDetalle } = require('../models/index');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

const calcularTrustScore = (historial) => {
    if (!historial || historial.length === 0) return "N/A";
    let puntos = 100;
    let alquileresFinalizados = 0;
    historial.forEach(alq => {
        if (alq.Penalidades && alq.Penalidades.length > 0) {
            alq.Penalidades.forEach(p => {
                if (p.estado === 'PENDIENTE') puntos -= 30;
                else puntos -= 10;
            });
        }
        if (alq.estado === 'FINALIZADO') {
            alquileresFinalizados++;
            puntos += 5;
        }
    });
    puntos = Math.max(0, Math.min(100, puntos));
    if (puntos >= 95 && alquileresFinalizados >= 5) return "A+";
    if (puntos >= 85) return "A";
    if (puntos >= 70) return "B";
    if (puntos >= 50) return "C";
    return "D";
};

const obtenerAlquileresActivos = async (req, res) => {
    try {
        const detalles = await AlquilerDetalle.findAll({
            where: { estado: 'ACTIVO' }, 
            include: [
                { 
                    model: Alquiler, 
                    include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }] 
                },
                { 
                    model: Vehiculo, 
                    attributes: ['marca', 'modelo', 'placa'] 
                }
            ],
            order: [[Alquiler, 'fecha_fin', 'ASC']] 
        });
        const detalleIds = detalles.map((d) => d.detalle_alquiler_id);
        const pagosActivos = detalleIds.length > 0
            ? await PagoDetalle.findAll({
                where: {
                    tipo_cargo: 'ALQUILER',
                    referencia_id: { [Op.in]: detalleIds },
                    estado: 'ACTIVO'
                },
                attributes: ['referencia_id', 'monto']
            })
            : [];

        const pagosPorDetalle = pagosActivos.reduce((acc, pago) => {
            const referenciaId = Number(pago.referencia_id);
            acc[referenciaId] = (acc[referenciaId] || 0) + Number(pago.monto || 0);
            return acc;
        }, {});

        const formatData = detalles.map(d => {
            const monto = Number(d.subtotal || 0);
            const montoPagado = pagosPorDetalle[d.detalle_alquiler_id] || 0;
            const saldoPendiente = Math.max(monto - montoPagado, 0);

            return {
                id: d.detalle_alquiler_id,
                folio: d.alquiler_id,
                vehiculo: `${d.Vehiculo.marca} ${d.Vehiculo.modelo}`,
                placa: d.Vehiculo.placa,
                cliente: `${d.Alquiler.Cliente.nombre} ${d.Alquiler.Cliente.apellido}`,
                fecha_inicio: d.Alquiler.fecha_inicio,
                fecha_fin: d.Alquiler.fecha_fin,
                monto,
                monto_pagado: montoPagado,
                saldo_pendiente: saldoPendiente,
                esta_pagado: saldoPendiente <= 0
            };
        });
        res.json(formatData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const consultarHistorialBusqueda = async (req, res) => {
    try {
        const { query } = req.query; 
        if (!query) return res.json([]);
        const resultados = await Alquiler.findAll({
            include: [
                { model: Cliente, where: { cedula: query } },
                { 
                    model: AlquilerDetalle, 
                    as: 'AlquilerDetalles', 
                    include: [{ model: Vehiculo, attributes: ['marca', 'modelo', 'placa'] }] 
                },
                { model: Penalidades, as: 'Penalidades', required: false }
            ],
            order: [['fecha_alquiler', 'DESC']]
        });
        if (resultados.length === 0) return res.json({ message: "No encontrado" });
        const trustScore = calcularTrustScore(resultados);
        const formatData = {
            score: trustScore,
            cliente: {
                nombre: `${resultados[0].Cliente.nombre} ${resultados[0].Cliente.apellido}`,
                cedula: resultados[0].Cliente.cedula
            },
            historial: resultados.map(alq => ({
                id: alq.alquiler_id,
                detalles: alq.AlquilerDetalles.map(d => ({
                    auto: `${d.Vehiculo.marca} ${d.Vehiculo.modelo}`,
                    placa: d.Vehiculo.placa
                })),
                fecha: alq.fecha_alquiler,
                total: alq.monto_total,
                estado: alq.estado
            }))
        };
        res.json(formatData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const listarAlquileres = async (req, res) => {
    try {
        const resultados = await Alquiler.findAll({
            include: [
                { model: Cliente, attributes: ['nombre', 'apellido', 'cedula'] }, 
                { model: AlquilerDetalle, as: 'AlquilerDetalles', include: [{ model: Vehiculo, attributes: ['marca', 'modelo', 'placa'] }] }
            ],
            order: [['alquiler_id', 'DESC']]
        });
        res.json(resultados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crearAlquiler = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { cliente_id, vehiculos, monto_total } = req.body;
        const maestro = await Alquiler.create({
            cliente_id,
            usuario_id: req.user.id || 1, 
            fecha_alquiler: new Date(),
            fecha_inicio: vehiculos[0].fecha_salida,
            fecha_fin: vehiculos[0].fecha_regreso,
            monto_total: monto_total,
            estado: 'ACTIVO' 
        }, { transaction: t });
        for (const v of vehiculos) {
            await AlquilerDetalle.create({
                alquiler_id: maestro.alquiler_id,
                vehiculo_id: v.vehiculo_id,
                precio_dia: parseFloat(v.subtotal) / parseInt(v.dias),
                cantidad_dias: v.dias,
                subtotal: v.subtotal,
                estado: 'ACTIVO'
            }, { transaction: t });
            await Vehiculo.update({ estado: false }, { where: { vehiculo_id: v.vehiculo_id }, transaction: t });
        }
        await t.commit();
        res.status(201).json({ message: "Éxito", alquiler_id: maestro.alquiler_id });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

const procesarDevolucion = async (req, res) => {
    try {
        const { id } = req.body;
        await Alquiler.update({ estado: 'FINALIZADO' }, { where: { alquiler_id: id } });
        res.json({ message: "Contrato finalizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cancelarAlquiler = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { alquiler_id, motivo } = req.body;

        const alq = await Alquiler.findByPk(alquiler_id, {
            include: [{ model: AlquilerDetalle, as: 'AlquilerDetalles' }, { model: Pago }]
        });

        if (!alq) return res.status(404).json({ error: "No encontrado" });

        const vehiculoIds = alq.AlquilerDetalles.map(d => d.vehiculo_id);
        await Vehiculo.update({ estado: true }, { where: { vehiculo_id: vehiculoIds }, transaction: t });
        const totalAbonado = alq.Pagos?.reduce((acc, p) => {
            const monto = p.total_recibo || p.monto || 0;
            return acc + parseFloat(monto);
        }, 0) || 0;

        if (totalAbonado > 0) {
            await Penalidades.create({
                alquiler_id: alq.alquiler_id,
                cliente_id: alq.cliente_id,
                tipo: 'OTRO',
                monto: totalAbonado,
                descripcion: `Anulación KR-${alq.alquiler_id}. Motivo: ${motivo}`,
                estado: 'PAGADA',
                fecha_registro: new Date()
            }, { transaction: t });
        }

        await alq.update({ estado: 'CANCELADO' }, { transaction: t });

        await t.commit();
        res.json({ message: "Éxito" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("Error en Backend Cancelar:", error);
        res.status(500).json({ error: error.message });
    }
};
module.exports = {
    obtenerAlquileresActivos,
    consultarHistorialBusqueda,
    listarAlquileres,
    crearAlquiler,
    procesarDevolucion,
    cancelarAlquiler
};
