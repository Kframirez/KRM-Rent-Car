import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Tag, Plus, Edit2, Power, X, Loader2, Save } from 'lucide-react';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';

const Gamas = () => {
  const [gamas, setGamas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '' });

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3000/api/gamas';

  const fetchGamas = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGamas(res.data);
    } catch (err) {
      console.error("Error al cargar gamas:", err);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchGamas();
  }, [fetchGamas]);

  const handleChange = (e) => {
    const { value } = e.target;
    const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
    setFormData({ nombre: soloLetras });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${selectedId}`, formData, config);
      } else {
        await axios.post(API_URL, formData, config);
      }
      setShowModal(false);
      fetchGamas();
      uiFeedback.success(isEditing ? 'Gama actualizada correctamente.' : 'Gama registrada correctamente.');
    } catch (err) {
      console.error("Error al guardar gama:", err);
      uiFeedback.error(err.response?.data?.message || "Error al procesar la solicitud");
    }
  };

  const toggleStatus = async (id, status) => {
    const accion = status ? 'desactivar' : 'activar';
    const confirmed = await uiFeedback.confirm({
      title: `Confirmar ${accion}`,
      message: `Desea ${accion} esta categoria de gama?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tone: status ? 'danger' : 'warning'
    });

    if (!confirmed) return;

    try {
      await axios.put(`${API_URL}/${id}`, { estado: !status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGamas();
      uiFeedback.success(status ? 'Gama desactivada correctamente.' : 'Gama activada correctamente.');
    } catch (err) {
      console.error("Error al cambiar estado de la gama:", err);
      uiFeedback.error("Error al cambiar estado de la gama");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 font-inter text-[#2F2923]">
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div className="text-left">
          <h2 className="text-[28px] font-bold tracking-tight font-sora italic leading-none uppercase">
            Gamas <span className="text-[#C6A243] not-italic">Vehiculares</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ml-0.5">Categorizacion de Flota KRM</p>
        </div>
        <button
          title="Agregar una nueva categoria de gama"
          onClick={() => {
            setIsEditing(false);
            setFormData({ nombre: '' });
            setShowModal(true);
          }}
          className="bg-[#C6A243] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#B58E35] transition-all shadow-md"
        >
          <Plus size={14} /> Registrar Nueva Gama
        </button>
      </div>

      <div className="bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC]/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-[#C6A243]" size={30} />
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F4EFE6]/60 text-[10px] font-black uppercase text-[#93887C] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Nombre de Categoria</th>
                <th className="px-6 py-4 text-center">Estado Operativo</th>
                <th className="px-6 py-4 text-right">Acciones de Gestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7CCBC]/30">
              {gamas.map((g) => (
                <tr key={g.gama_id} className="hover:bg-[#F3EEE4] transition-colors group italic font-sora">
                  <td className="px-6 py-4 font-bold text-[#2F2923] uppercase">
                    <Tag size={14} className="inline mr-3 text-[#C6A243] not-italic" />
                    {g.nombre}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${g.estado ? 'text-[#6F9B74] bg-[#6F9B74]/10 border-[#6F9B74]/20' : 'text-[#93887C] bg-gray-100 border-gray-200'}`}>
                      {g.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      title="Editar nombre de la gama"
                      onClick={() => { setIsEditing(true); setSelectedId(g.gama_id); setFormData({ nombre: g.nombre }); setShowModal(true); }}
                      className="p-2 text-[#93887C] hover:text-[#C6A243] transition-colors bg-white rounded-lg border border-[#D7CCBC]/30 shadow-sm"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      title={g.estado ? "Desactivar esta gama" : "Activar esta gama"}
                      onClick={() => toggleStatus(g.gama_id, g.estado)}
                      className={`p-2 transition-colors bg-white rounded-lg border border-[#D7CCBC]/30 shadow-sm ${g.estado ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                    >
                      <Power size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#2F2923]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#FCFAF5] border border-[#D7CCBC] w-full max-w-sm rounded-[2rem] shadow-xl overflow-hidden animate-in zoom-in-95 text-left">
            <div className="p-6 border-b border-[#D7CCBC]/60 flex justify-between items-center bg-[#F4EFE6]/50">
              <h3 className="text-[#2F2923] font-bold uppercase tracking-widest text-[11px] italic font-sora">
                {isEditing ? 'Actualizar Gama' : 'Nueva Categoria'}
              </h3>
              <button title="Cerrar ventana" onClick={() => setShowModal(false)} className="text-[#93887C] hover:text-[#2F2923]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Nombre de la Gama</label>
                <input
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Economica o Premium"
                  className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-3 px-4 text-[13px] font-bold outline-none focus:border-[#C6A243]"
                />
              </div>
              <button
                title={isEditing ? "Haga clic para guardar los cambios" : "Haga clic para registrar la nueva categoria"}
                className="w-full bg-[#2F2923] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all"
              >
                {isEditing ? 'GUARDAR MODIFICACIONES' : 'CONFIRMAR REGISTRO'} <Save size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gamas;
