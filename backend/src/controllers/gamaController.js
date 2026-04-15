const Gama = require('../models/Gama');

exports.listarGamas = async (req, res) => {
  try {
    const gamas = await Gama.findAll({ order: [['nombre', 'ASC']] });
    res.json(gamas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener gamas", error: error.message });
  }
};

exports.crearGama = async (req, res) => {
  try {
    const nueva = await Gama.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(400).json({ message: "Error al crear gama. Nombre duplicado." });
  }
};

exports.actualizarGama = async (req, res) => {
  try {
    const { id } = req.params;
    await Gama.update(req.body, { where: { gama_id: id } });
    res.json({ message: "Gama actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la categoría" });
  }
};