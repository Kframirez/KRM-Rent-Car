const { Alquiler, AlquilerDetalle, Vehiculo, Cliente, Recepcion, RecepcionDetalle, Penalidades, PagoDetalle } = require('../models/index');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

const calcularSaldoDetalle = async (detalleAlquilerId, subtotal, transaction) => {
    const totalPagado = await PagoDetalle.sum('monto', {
        where: {
            tipo_cargo: 'ALQUILER',
            referencia_id: detalleAlquilerId,
            estado: 'ACTIVO'
        },
        transaction
    });

    return Number(subtotal || 0) - Number(totalPagado || 0);
};

exports.listarClientesConAlquilerActivo = async (req, res) => {
    try {
        const { busqueda } = req.query;
        
        const clientes = await Cliente.findAll({
            include: [{
                model: Alquiler,
                where: { estado: 'ACTIVO' },
                required: true,
                include: [{
                    model: AlquilerDetalle,
                    as: 'AlquilerDetalles',
                    where: { estado: 'ACTIVO' },
                    include: [{
                        model: Vehiculo,
                        required: true
                    }]
                }]
            }]
        });

        if (!busqueda) return res.json(clientes);

        const query = busqueda.trim().toUpperCase();

        const filtrados = clientes.filter(cliente => {
            const matchCedula = cliente.cedula.includes(query);
            const matchNombre = (cliente.nombre + ' ' + cliente.apellido).toUpperCase().includes(query);
            
            const matchPlaca = cliente.Alquilers.some(alq => 
                alq.AlquilerDetalles.some(det => 
                    det.Vehiculo && det.Vehiculo.placa.toUpperCase().includes(query)
                )
            );

            return matchCedula || matchNombre || matchPlaca;
        });

        res.json(filtrados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerVehiculosActivosPorCliente = async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const detalles = await AlquilerDetalle.findAll({
            where: { estado: 'ACTIVO' },
            include: [
                { model: Vehiculo, required: true },
                { model: Alquiler, where: { estado: 'ACTIVO', cliente_id }, required: true }
            ]
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

        res.json(detalles.map(d => {
            const subtotal = Number(d.subtotal || 0);
            const montoPagado = pagosPorDetalle[d.detalle_alquiler_id] || 0;
            const saldoPendiente = Math.max(subtotal - montoPagado, 0);

            return {
                alquiler_id: d.Alquiler.alquiler_id,
                detalle_alquiler_id: d.detalle_alquiler_id,
                vehiculo_id: d.vehiculo_id,
                vehiculo: d.Vehiculo,
                fecha_fin: d.Alquiler.fecha_fin,
                monto_total: subtotal,
                monto_pagado: montoPagado,
                saldo_pendiente: saldoPendiente,
                puede_devolver: saldoPendiente <= 0
            };
        }));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.confirmarRecepcion = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { alquiler_id, detalle_alquiler_id, vehiculo_id, combustible, kilometraje, danos, penalidades } = req.body;
        const alquiler = await Alquiler.findByPk(alquiler_id);
        const detalleAlquiler = await AlquilerDetalle.findOne({
            where: {
                detalle_alquiler_id,
                alquiler_id,
                vehiculo_id,
                estado: 'ACTIVO'
            },
            transaction: t
        });
        const listaP = penalidades || [];

        if (!alquiler) {
            throw new Error('No se encontró el alquiler indicado.');
        }

        if (!detalleAlquiler) {
            throw new Error('No se encontró un detalle de alquiler activo para este vehículo.');
        }

        const saldoPendiente = await calcularSaldoDetalle(
            detalleAlquiler.detalle_alquiler_id,
            detalleAlquiler.subtotal,
            t
        );

        if (saldoPendiente > 0) {
            throw new Error(`No se puede devolver el vehículo porque el alquiler tiene un saldo pendiente de US$ ${saldoPendiente.toFixed(2)}.`);
        }
        
        const fFin = new Date(alquiler.fecha_fin);
        const hoy = new Date();
        const valorHoy = (hoy.getFullYear() * 10000) + ((hoy.getMonth() + 1) * 100) + hoy.getDate();
        const valorPactado = (fFin.getUTCFullYear() * 10000) + ((fFin.getUTCMonth() + 1) * 100) + fFin.getUTCDate();

        if (valorHoy > valorPactado && !listaP.some(p => p.tipo === 'RETRASO')) {
            throw new Error("El vehículo tiene retraso. Debe registrar el cargo por RETRASO.");
        }

        const nuevaDev = await Recepcion.create({
            alquiler_id,
            usuario_id: req.user.id,
            fecha_devolucion: hoy,
            observaciones: danos || 'Sin novedades',
            estado: 'REGISTRADA'
        }, { transaction: t });

        await RecepcionDetalle.create({
            devolucion_id: nuevaDev.devolucion_id,
            vehiculo_id,
            combustible_devuelto: combustible,
            kilometraje_devuelto: kilometraje,
            danos: danos || 'Ninguno',
            estado: 'ACTIVO'
        }, { transaction: t });

        if (listaP.length > 0) {
            await Penalidades.bulkCreate(listaP.map(p => ({
                alquiler_id, vehiculo_id, tipo: p.tipo, descripcion: p.descripcion,
                monto: p.monto, estado: 'PENDIENTE'
            })), { transaction: t });
        }

        await AlquilerDetalle.update({ estado: 'DEVUELTO' }, { where: { detalle_alquiler_id }, transaction: t });
        await Vehiculo.update({ estado: true }, { where: { vehiculo_id }, transaction: t });

        const pendientes = await AlquilerDetalle.count({ where: { alquiler_id, estado: 'ACTIVO' }, transaction: t });
        if (pendientes === 0) await Alquiler.update({ estado: 'FINALIZADO' }, { where: { alquiler_id }, transaction: t });

        await t.commit();
        res.json({ message: 'Éxito', devolucion_id: nuevaDev.devolucion_id });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

exports.verificarPorPlaca = async (req, res) => {
    res.status(410).json({ message: "Esta ruta ha sido reemplazada por /clientes y /vehiculos/:id" });
};
