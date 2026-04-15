import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Car, CheckCircle, XCircle, Loader2, Activity } from 'lucide-react';
import { formatUSD } from '../../utils/currency';

const Disponibilidad = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });
  const [errorFiltro, setErrorFiltro] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const cargarInventario = async (usarFechas = false) => {
    setLoading(true);
    setErrorFiltro('');
    try {
      const params = usarFechas && fechas.desde && fechas.hasta
        ? { desde: fechas.desde, hasta: fechas.hasta }
        : {};

      const res = await axios.get(`http://localhost:3000/api/disponibilidad`, {
        ...config,
        params
      });
      setVehiculos(res.data); 
    } catch (err) {
      console.error("Error cargando inventario:", err);
      setErrorFiltro(err.response?.data?.message || 'No se pudo consultar la disponibilidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarInventario(); }, []);

  const consultarDisponibilidad = () => {
    if (!fechas.desde || !fechas.hasta) {
      setErrorFiltro('Seleccione fecha desde y fecha hasta para aplicar el filtro.');
      return;
    }

    if (fechas.desde > fechas.hasta) {
      setErrorFiltro('La fecha desde no puede ser mayor que la fecha hasta.');
      return;
    }

    cargarInventario(true);
  };

  const total = vehiculos.length;
  const libres = vehiculos.filter(v => v.estado === 'DISPONIBLE').length;

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500 font-inter text-[#2F2923]">

      {/* Header Compacto */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-3">
        <div>
          <h1 className="text-[26px] font-black italic uppercase tracking-tighter leading-none">
            Disponibilidad <span className="text-[#C6A243] not-italic">de Flota</span>
          </h1>
          <p className="text-[#93887C] text-[9px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <Activity size={10} className="text-[#C6A243]"/> CONTROL DE INVENTARIO 2026
          </p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white border border-[#D7CCBC] px-3 py-1.5 rounded-xl shadow-sm text-center min-w-[100px]">
              <p className="text-[8px] font-black text-[#93887C] uppercase">Libres</p>
              <p className="text-xl font-black text-[#6F9B74] italic leading-tight">{libres}</p>
            </div>
            <div className="bg-[#2F2923] px-3 py-1.5 rounded-xl shadow-sm text-center min-w-[100px]">
              <p className="text-[8px] font-black text-[#D7CCBC] uppercase">Total</p>
              <p className="text-xl font-black text-white italic leading-tight">{total}</p>
            </div>
        </div>
      </div>

      {/* Filtros más pequeños */}
      <div className="bg-[#FCFAF5] p-4 rounded-2xl border border-[#D7CCBC] grid grid-cols-1 md:grid-cols-3 gap-3 items-end shadow-sm">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Fecha Desde</label>
          <input 
            type="date" 
            className="w-full bg-white border border-[#D7CCBC] rounded-lg p-2 text-xs outline-none focus:border-[#C6A243] transition-all" 
            value={fechas.desde}
            onChange={(e) => setFechas({...fechas, desde: e.target.value})}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Fecha Hasta</label>
          <input 
            type="date" 
            className="w-full bg-white border border-[#D7CCBC] rounded-lg p-2 text-xs outline-none focus:border-[#C6A243] transition-all" 
            value={fechas.hasta}
            onChange={(e) => setFechas({...fechas, hasta: e.target.value})}
          />
        </div>
        <button onClick={consultarDisponibilidad} className="bg-[#C6A243] hover:bg-black text-white font-black py-2.5 rounded-lg uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 transition-all active:scale-95 shadow-md">
          <Filter size={14} /> Consultar
        </button>
      </div>
      {errorFiltro ? (
        <p className="text-[11px] font-bold text-[#C97B6A] px-1">{errorFiltro}</p>
      ) : null}

      {/* Tabla Compacta */}
      <div className="bg-white rounded-2xl border border-[#D7CCBC] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#FCFAF5] border-b border-[#D7CCBC] text-[9px] font-black uppercase text-[#93887C] tracking-widest">
              <th className="px-5 py-3">Vehículo / Identificación</th>
              <th className="px-5 py-3">Gama</th>
              <th className="px-5 py-3 text-center">Estado</th>
              <th className="px-5 py-3 text-right">Tarifa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F6F3EC]">
            {loading ? (
              <tr><td colSpan="4" className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-[#C6A243]" size={30}/></td></tr>
            ) : vehiculos.map((v) => (
              <tr key={v.id} className="hover:bg-[#FCFAF5]/50 transition-colors group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${v.estado === 'DISPONIBLE' ? 'bg-[#F6F3EC] text-[#93887C]' : 'bg-red-50 text-red-400'}`}>
                      <Car size={18}/>
                    </div>
                    <div>
                      <p className="font-bold text-[#2F2923] uppercase text-[13px] italic leading-tight">{v.marca} {v.modelo}</p>
                      <p className="text-[10px] font-mono font-bold text-[#93887C] uppercase tracking-tighter">PLACA: {v.placa}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="bg-[#F6F3EC] text-[#93887C] text-[8px] font-black px-3 py-1 rounded-full uppercase border border-[#D7CCBC]/30">{v.gama}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter px-2.5 py-0.5 rounded-full border
                    ${v.estado === 'DISPONIBLE' ? 'text-[#6F9B74] bg-[#6F9B74]/5 border-[#6F9B74]/20' : 'text-[#C97B6A] bg-[#C97B6A]/5 border-[#C97B6A]/20'}`}>
                    {v.estado === 'DISPONIBLE' ? <CheckCircle size={12}/> : <XCircle size={12}/>} {v.estado}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <p className="text-[16px] font-black italic text-[#2F2923] tracking-tighter">
                    {formatUSD(v.tarifa)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Disponibilidad;
