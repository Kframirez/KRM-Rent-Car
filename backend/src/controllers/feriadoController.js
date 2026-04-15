const Feriado = require('../models/Feriado');

exports.listarFeriados = async (req, res) => {
  try {
    const feriados = await Feriado.findAll({ order: [['fecha', 'ASC']] });
    res.json(feriados); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearFeriado = async (req, res) => {
  try {
    const nuevo = await Feriado.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ message: "La fecha ya existe o el formato es incorrecto" });
  }
};

exports.eliminarFeriado = async (req, res) => {
  try {
    const { id } = req.params;
    await Feriado.destroy({ where: { feriado_id: id } });
    res.json({ message: "Feriado eliminado" });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el feriado" });
  }
};