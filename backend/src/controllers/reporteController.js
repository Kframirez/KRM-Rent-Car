const { 
  AlquilerDetalle, 
  Vehiculo, 
  Cliente, 
  Alquiler, 
  Penalidades,
  Gama,
  Feriado
} = require('../models/index'); 

const sequelize = require('../config/db');
const { Op } = require('sequelize');

exports.obtenerRendimientoFlota = async (req, res) => {
    try {
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        const diasEnMes = new Date(anioActual, mesActual, 0).getDate();

        const ranking = await AlquilerDetalle.findAll({
            attributes: [
                'vehiculo_id',
                [sequelize.fn('COUNT', sequelize.col('AlquilerDetalle.vehiculo_id')), 'total_rentas'],
                [sequelize.fn('SUM', sequelize.col('cantidad_dias')), 'total_dias_renta']
            ],
            include: [{
                model: Vehiculo,
                attributes: ['marca', 'modelo', 'placa']
            }],
            group: ['AlquilerDetalle.vehiculo_id', 'Vehiculo.vehiculo_id'],
            order: [[sequelize.literal('total_rentas'), 'DESC']],
            limit: 10
        });

        const resultado = ranking.map((item, index) => {
            const diasRenta = parseInt(item.getDataValue('total_dias_renta') || 0);
            const porcentaje = Math.min(((diasRenta / diasEnMes) * 100), 100).toFixed(0);

            return {
                rank: index + 1,
                modelo: `${item.Vehiculo.marca} ${item.Vehiculo.modelo}`,
                placa: item.Vehiculo.placa,
                rentas: parseInt(item.getDataValue('total_rentas')),
                diasRenta: diasRenta,
                ocupacion: `${porcentaje}%`,
                porcentajeVal: parseInt(porcentaje)
            };
        });

        res.json(resultado);
    } catch (error) {
        console.error("Error en reporte de flota:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerClientesElite = async (req, res) => {
    try {
        const ranking = await Cliente.findAll({
            attributes: [
                'cliente_id',
                'nombre',
                'apellido',
                'cedula',
                'imagen_url',
                [sequelize.fn('COUNT', sequelize.col('Alquilers.alquiler_id')), 'total_rentas'],
                [sequelize.fn('SUM', sequelize.col('Alquilers.monto_total')), 'total_inversion']
            ],
            include: [{
                model: Alquiler,
                as: 'Alquilers', 
                attributes: [],
                where: { estado: { [Op.ne]: 'CANCELADO' } },
                required: false 
            }],
            group: ['Cliente.cliente_id'],
            order: [[sequelize.literal('total_rentas'), 'DESC']],
            limit: 10,
            subQuery: false 
        });

        const resultado = ranking.map((c, index) => {
            const rentas = parseInt(c.getDataValue('total_rentas') || 0);
            const inversion = parseFloat(c.getDataValue('total_inversion') || 0);
            const score = Math.min(100, (rentas * 5) + (inversion / 500)).toFixed(0);

            let status = 'BRONCE';
            if (rentas > 0) {
                if (index === 0) status = 'DIAMANTE';
                else if (index === 1) status = 'PLATINO';
                else if (index === 2) status = 'ORO';
                else if (rentas > 3) status = 'PLATA';
            }

            return {
                rank: index + 1,
                nombre: `${c.nombre} ${c.apellido}`.toUpperCase(),
                cedula: c.cedula,
                imagen_url: c.imagen_url,
                score: parseInt(score),
                rentas,
                total: inversion,
                status
            };
        });

        res.json(resultado);
    } catch (error) {
        console.error("CRITICAL ERROR IN CLIENTES ELITE:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerMetricasPenalidades = async (req, res) => {
    try {
        const [totales, lista] = await Promise.all([
            Penalidades.findAll({
                attributes: [
                    'tipo', 
                    [sequelize.fn('SUM', sequelize.col('monto')), 'total']
                ],
                group: ['tipo']
            }),
            Penalidades.findAll({
                limit: 10,
                order: [['penalidad_id', 'DESC']], 
                include: [{
                    model: Alquiler,
                    include: [{ model: Cliente, attributes: ['nombre', 'apellido'] }]
                }]
            })
        ]);

        let totalRetrasos = 0;
        let otrosCargos = 0;
        
        totales.forEach(t => {
            const valorTipo = t.getDataValue('tipo');
            const monto = parseFloat(t.getDataValue('total') || 0);
            
            if (valorTipo === 'RETRASO') {
                totalRetrasos += monto;
            } else {
                otrosCargos += monto;
            }
        });

        res.json({
            totalRecaudado: totalRetrasos + otrosCargos,
            totalRetrasos,
            otrosCargos,
            frecuencia: "12%", 
            lista: lista.map(p => ({
                id: `#KRM-${p.alquiler_id}`,
                cliente: p.Alquiler?.Cliente ? 
                    `${p.Alquiler.Cliente.nombre} ${p.Alquiler.Cliente.apellido}` : "S/N",
                motivo: p.descripcion ? p.descripcion.toUpperCase() : "CARGO ADICIONAL",
                monto: parseFloat(p.monto),
                tipo: p.tipo
            }))
        });
    } catch (error) {
        console.error("Error en reporte de penalidades:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerAnaliticaFeriados = async (req, res) => {
    try {
        const feriadosResult = await Feriado.findAll({
            where: { estado: true },
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('fecha'), '%Y-%m-%d'), 'fechaStr']
            ],
            raw: true
        });
        
        const fechasFeriados = feriadosResult.map(f => f.fechaStr);

        const detalles = await AlquilerDetalle.findAll({
            include: [
                { 
                    model: Alquiler, 
                    attributes: ['fecha_inicio'] 
                },
                { 
                    model: Vehiculo, 
                    include: [{ model: Gama, attributes: ['nombre'] }] 
                }
            ]
        });

        let diasFeriados = 0;
        let diasNormales = 0;
        const ocupacionGamas = {};

        detalles.forEach(det => {
            if (!det.Alquiler) return;

            const fechaInicioAlq = new Date(det.Alquiler.fecha_inicio).toISOString().split('T')[0];
            
            const esFeriado = fechasFeriados.includes(fechaInicioAlq);
            const dias = parseInt(det.cantidad_dias || 0);
            const nombreGama = det.Vehiculo?.Gama?.nombre || 'ESTÁNDAR';

            if (esFeriado) {
                diasFeriados += dias;
                ocupacionGamas[nombreGama] = (ocupacionGamas[nombreGama] || 0) + dias;
            } else {
                diasNormales += dias;
            }
        });

        const totalDias = diasFeriados + diasNormales;
        const ocupacionTotal = totalDias > 0 ? ((diasFeriados / totalDias) * 100).toFixed(0) : 0;

        res.json({
            porcentajeOcupacion: parseInt(ocupacionTotal),
            diasFeriados,
            diasNormales,
            tendenciaExtra: 25,
            gamas: Object.entries(ocupacionGamas).map(([nombre, dias]) => ({
                nombre,
                porcentaje: diasFeriados > 0 ? ((dias / diasFeriados) * 100).toFixed(0) : 0
            })).sort((a, b) => b.porcentaje - a.porcentaje)
        });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO ANALÍTICA:", error);
        res.status(500).json({ error: error.message });
    }
};
