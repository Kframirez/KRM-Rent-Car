import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CalendarDays, Plus, Calendar, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';

const Feriados = () => {
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ fecha: '', descripcion: '' });

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3000/api/feriados';

  const fetchFeriados = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeriados(res.data);
    } catch (err) {
      console.error("Error al cargar feriados", err);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchFeriados();
  }, [fetchFeriados]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({ fecha: '', descripcion: '' });
      fetchFeriados();
      uiFeedback.success('Feriado registrado correctamente.');
    } catch (err) {
      console.error("Error al registrar feriado", err);
      uiFeedback.error("Error: Es posible que la fecha ya este registrada o los datos sean invalidos.");
    }
  };

  const eliminarFeriado = async (id) => {
    const confirmed = await uiFeedback.confirm({
      title: 'Eliminar fecha',
      message: 'Esta seguro de que desea eliminar esta fecha del calendario de feriados?',
      confirmText: 'Eliminar',
      tone: 'danger'
    });

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFeriados();
      uiFeedback.success('Feriado eliminado correctamente.');
    } catch (err) {
      console.error("Error al eliminar feriado", err);
      uiFeedback.error("No se pudo procesar la eliminacion de la fecha.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter text-[#2F2923]">
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div className="text-left">
          <h2 className="text-[34px] font-bold text-[#2F2923] tracking-tighter font-sora italic leading-none">
            Calendario <span className="text-[#C6A243] not-italic uppercase font-bold">Feriados</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">
            Gestion de Dias Especiales y Ajuste de Tarifas
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#C6A243]/5 border border-[#C6A243]/20 text-[#C6A243] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
          <AlertTriangle size={14} /> Este calendario afecta el calculo automatico de rentas
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-[#FCFAF5] p-6 rounded-2xl border border-[#D7CCBC] space-y-5 shadow-sm text-left">
          <div className="flex items-center gap-3 border-b border-[#D7CCBC]/40 pb-3">
            <div className="w-6 h-6 bg-[#C6A243]/10 rounded flex items-center justify-center text-[#C6A243]">
              <Plus size={14} />
            </div>
            <h4 className="text-[#2F2923] font-bold uppercase text-[11px] tracking-widest font-sora italic">Registrar Nueva Fecha</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#93887C] uppercase ml-1 block tracking-wider">Seleccionar Fecha del Feriado</label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[#2F2923] text-[13px] outline-none focus:border-[#C6A243] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#93887C] uppercase ml-1 block tracking-wider">Motivo o Descripcion</label>
              <input
                required
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Navidad 2026 o Semana-Santa"
                className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[#2F2923] text-[13px] outline-none focus:border-[#C6A243] transition-all"
              />
            </div>
            <button
              title="Haga clic para agregar permanentemente esta fecha al calendario"
              type="submit"
              className="w-full py-3.5 bg-[#C6A243] text-[#FCFAF5] rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#B58E35] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <CalendarDays size={14} /> CONFIRMAR REGISTRO DE FECHA
            </button>
          </div>
        </form>

        <div className="xl:col-span-2 bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#C6A243]" size={30} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#93887C]">Sincronizando calendario...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F4EFE6]/60 border-b border-[#D7CCBC]">
                <tr>
                  <th className="px-6 py-3.5 text-[#93887C] text-[10px] font-black uppercase tracking-widest">Fecha Programada</th>
                  <th className="px-6 py-3.5 text-[#93887C] text-[10px] font-black uppercase tracking-widest text-left">Descripcion del Feriado</th>
                  <th className="px-6 py-3.5 text-[#93887C] text-[10px] font-black uppercase tracking-widest text-right pr-10">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7CCBC]/30 text-[#2F2923]">
                {feriados.map((f) => (
                  <tr key={f.feriado_id} className="hover:bg-[#F3EEE4] transition-colors group">
                    <td className="px-6 py-4 text-[#C6A243] font-bold text-[13px] italic">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-[#93887C]" />
                        {new Date(f.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#2F2923] font-bold text-[12px] uppercase tracking-tight text-left">
                      {f.descripcion}
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                      <button
                        title="Eliminar esta fecha del calendario de dias especiales"
                        onClick={() => eliminarFeriado(f.feriado_id)}
                        className="flex items-center gap-1.5 ml-auto p-2 text-[#93887C] hover:text-[#C97B6A] hover:bg-[#C97B6A]/5 rounded-lg transition-all border border-transparent hover:border-[#C97B6A]/20"
                      >
                        <XCircle size={14} />
                        <span className="text-[9px] font-black uppercase">Quitar</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {feriados.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-20 text-center text-[#93887C] text-[10px] font-bold uppercase tracking-widest italic opacity-50">
                      No hay fechas especiales registradas en el sistema
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feriados;
