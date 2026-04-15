const { Vehiculo, Gama, PrecioVehiculo, AlquilerDetalle, Alquiler } = require('../models/index');
const sequelize = require('../config/db');

exports.listarVehiculos = async (req, res) => {
    try {
        const vehiculos = await Vehiculo.findAll({
            include: [
                { model: Gama, attributes: ['nombre'] },
                { model: PrecioVehiculo, as: 'ListaPrecios' }
            ]
        });

        const detallesActivos = await AlquilerDetalle.findAll({
            where: { estado: 'ACTIVO' },
            attributes: ['vehiculo_id']
        });

        const vehiculosRentados = new Set(detallesActivos.map((detalle) => detalle.vehiculo_id));

        const formatData = vehiculos.map(v => ({
            vehiculo_id: v.vehiculo_id,
            marca: v.marca,
            modelo: v.modelo,
            anio: v.anio,
            placa: v.placa,
            tipo: v.tipo || 'Sedán',
            estado: v.estado,
            en_renta: vehiculosRentados.has(v.vehiculo_id),
            imagen_url: v.imagen_url,
            gama: v.Gama?.nombre || 'S/G',
            gama_id: v.gama_id,
            precios: {
                normal: v.ListaPrecios?.find(p => p.tipo_dia_id === 1)?.precio || "0.00",
                finSemana: v.ListaPrecios?.find(p => p.tipo_dia_id === 2)?.precio || "0.00",
                feriado: v.ListaPrecios?.find(p => p.tipo_dia_id === 3)?.precio || "0.00"
            }
        }));
        
        res.json(formatData);
    } catch (error) {
        res.status(500).json({ message: "Error al cargar flota", error: error.message });
    }
};

exports.guardarVehiculo = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { vehiculo_id, marca, modelo, anio, placa, gama_id, tipo, precios } = req.body;
                let preciosParsed;
        try {
            preciosParsed = typeof precios === 'string' ? JSON.parse(precios) : precios;
        } catch (e) {
            return res.status(400).json({ message: "Formato de precios inválido" });
        }
        const cleanId = (vehiculo_id === "null" || vehiculo_id === "undefined" || !vehiculo_id) ? null : vehiculo_id;

        const datosVehiculo = { 
            marca, 
            modelo, 
            anio: parseInt(anio) || new Date().getFullYear(), 
            placa, 
            gama_id: parseInt(gama_id), 
            tipo 
        };
        if (req.file) {
            datosVehiculo.imagen_url = `/uploads/vehiculos/${req.file.filename}`;
        }

        let vId;
        if (cleanId) {
            await Vehiculo.update(datosVehiculo, { where: { vehiculo_id: cleanId }, transaction: t });
            vId = cleanId;
        } else {
            const nuevo = await Vehiculo.create(datosVehiculo, { transaction: t });
            vId = nuevo.vehiculo_id;
        }
        await PrecioVehiculo.destroy({ where: { vehiculo_id: vId }, transaction: t });
        await PrecioVehiculo.bulkCreate([
            { vehiculo_id: vId, tipo_dia_id: 1, precio: preciosParsed.normal || 0, estado: true },
            { vehiculo_id: vId, tipo_dia_id: 2, precio: preciosParsed.finSemana || 0, estado: true },
            { vehiculo_id: vId, tipo_dia_id: 3, precio: preciosParsed.feriado || 0, estado: true }
        ], { transaction: t });

        await t.commit();
        res.json({ message: "Vehículo guardado correctamente", vehiculo_id: vId });
    } catch (error) {
        if (t) await t.rollback();
        console.error("ERROR EN BACKEND:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.actualizarEstadoVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const vehiculo = await Vehiculo.findByPk(id);
        if (!vehiculo) {
            return res.status(404).json({ message: "Vehículo no encontrado" });
        }

        const detalleActivo = await AlquilerDetalle.findOne({
            where: { vehiculo_id: id, estado: 'ACTIVO' }
        });

        if (detalleActivo) {
            return res.status(400).json({ message: "No se puede cambiar el estado de una unidad que está en renta." });
        }

        await Vehiculo.update(
            { estado: Boolean(estado) },
            { where: { vehiculo_id: id } }
        );

        res.json({
            message: Boolean(estado)
                ? "Vehículo activado correctamente"
                : "Vehículo desactivado correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado del vehículo", error: error.message });
    }
};

exports.obtenerRankingFlota = async (req, res) => {
    try {
        const { mes, anio } = req.query;
        if (!mes || !anio) return res.status(400).json({ message: "Mes y año requeridos" });

        const fechaFin = new Date(anio, mes - 1, 0);
        const diasDelMes = fechaFin.getDate();
        
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaTermino = new Date(anio, mes, 0);

        const ranking = await AlquilerDetalle.findAll({
            attributes: [
                'vehiculo_id',
                'alquiler_id',
                'cantidad_dias'
            ],
            include: [{
                model: Vehiculo,
                attributes: ['marca', 'modelo', 'placa', 'anio', 'imagen_url']
            }, {
                model: Alquiler,
                attributes: ['fecha_inicio']
            }],
            raw: true,
            subQuery: false
        });
        const datosDelMes = ranking.filter(item => {
            const fecha = new Date(item['Alquiler.fecha_inicio']);
            return fecha >= fechaInicio && fecha <= fechaTermino;
        });
        const agrupado = {};
        datosDelMes.forEach(item => {
            if (!agrupado[item.vehiculo_id]) {
                agrupado[item.vehiculo_id] = {
                    vehiculo_id: item.vehiculo_id,
                    marca: item['Vehiculo.marca'],
                    modelo: item['Vehiculo.modelo'],
                    placa: item['Vehiculo.placa'],
                    anio: item['Vehiculo.anio'],
                    imagen_url: item['Vehiculo.imagen_url'],
                    total_rentas: 0,
                    total_dias_renta: 0
                };
            }
            agrupado[item.vehiculo_id].total_rentas++;
            agrupado[item.vehiculo_id].total_dias_renta += item.cantidad_dias;
        });

        const dataProcesada = Object.values(agrupado)
            .sort((a, b) => b.total_rentas - a.total_rentas)
            .slice(0, 10)
            .map((item, index) => {
                const diasRenta = item.total_dias_renta || 0;
                const ocupacion = Math.min(((diasRenta / diasDelMes) * 100).toFixed(0), 100);

                return {
                    rank: index + 1,
                    modelo: `${item.marca} ${item.modelo}`,
                    anio: item.anio,
                    placa: item.placa,
                    imagen_url: item.imagen_url,
                    rentas: item.total_rentas,
                    diasRenta: diasRenta,
                    ocupacion: `${ocupacion}%`,
                    porcentajeVal: ocupacion
                };
            });

        res.json(dataProcesada);
    } catch (error) {
        console.error("Error en ranking:", error);
        res.status(500).json({ error: error.message });
    }
};
