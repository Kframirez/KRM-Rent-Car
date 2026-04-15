import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Car, User, Calendar, Loader2, Activity, Clock, ShieldAlert } from 'lucide-react';
import { formatUSD } from '../../utils/currency';

const AlquileresActivos = () => {
  const [alquileres, setAlquileres] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchActivos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/alquileres/activos', config);
      setAlquileres(res.data);
    } catch (err) {
      console.error("Error cargando activos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivos(); }, []);

  const formatearFechaCorta = (fechaRaw) => {
    if (!fechaRaw) return 'S/D';
    const fecha = new Date(fechaRaw.split('T')[0] + 'T00:00:00');
    return fecha.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const obtenerInfoFecha = (fechaRaw) => {
    if (!fechaRaw) return { fechaFormateada: "S/D", mensajeDias: "S/D", esRetraso: false };
    const entrega = new Date(fechaRaw.split('T')[0] + 'T00:00:00');
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const diffDias = Math.round((entrega - hoy) / (1000 * 60 * 60 * 24));
    
    return {
      fechaFormateada: entrega.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }),
      mensajeDias: diffDias === 0 ? "ENTREGA HOY" : diffDias < 0 ? `RETRASO ${Math.abs(diffDias)} DÍAS` : `FALTAN ${diffDias} DÍAS`,
      esRetraso: diffDias < 0
    };
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
      <Loader2 className="animate-spin mb-4 text-[#C6A243]" size={35} />
      <p className="text-[10px] font-black uppercase tracking-widest text-[#2F2923]">Sincronizando KRM System...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-5 font-inter text-[#2F2923] animate-in fade-in">
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tighter italic uppercase leading-none">Alquileres <span className="text-[#C6A243]">Activos</span></h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase flex items-center gap-2 mt-1">
            <Activity size={11} className="text-[#C6A243]"/> Monitoreo en Tiempo Real
          </p>
        </div>
        <div className="bg-[#FCFAF5] border border-[#D7CCBC] px-5 py-2.5 rounded-xl shadow-sm text-center">
          <p className="text-[9px] font-black text-[#93887C] uppercase">Fuera</p>
          <p className="text-2xl font-black italic">{alquileres.length.toString().padStart(2, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {alquileres.length === 0 ? (
          <div className="col-span-full py-24 text-center opacity-30 border-2 border-dashed border-[#D7CCBC] rounded-[2.5rem]">
            <ShieldAlert size={45} className="mx-auto mb-3"/>
            <p className="text-xs font-black uppercase tracking-[0.4em]">No hay unidades en calle</p>
          </div>
        ) : (
          alquileres.map((item) => {
            const { fechaFormateada, mensajeDias, esRetraso } = obtenerInfoFecha(item.fecha_fin);
            const fechaInicioFormateada = formatearFechaCorta(item.fecha_inicio);
            return (
              <div key={item.id} className="bg-[#FCFAF5] border border-[#D7CCBC]/80 p-6 rounded-[2.2rem] shadow-sm group hover:border-[#C6A243] transition-all relative">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${esRetraso ? 'bg-red-600 text-white' : 'bg-white text-[#C6A243]'}`}>
                      <Car size={22} />
                    </div>
                    <div>
                      <h4 className="text-[17px] font-black uppercase italic leading-tight truncate max-w-[150px]">{item.vehiculo}</h4>
                      <p className="text-[#93887C] font-mono text-[10px] font-bold">PLACA: {item.placa}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[7.5px] font-black px-2.5 py-1 rounded-full border ${esRetraso ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-green-50 text-green-600 border-green-200'}`}>
                      {esRetraso ? 'RETRASO' : 'OK'}
                    </span>
                    <span className={`text-[7.5px] font-black px-2.5 py-1 rounded-full border ${item.esta_pagado ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {item.esta_pagado ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-2xl border border-white/60 mb-4">
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black text-[#93887C] uppercase tracking-tighter flex items-center gap-1.5"><User size={11}/> Cliente</p>
                    <p className="font-bold text-[12px] uppercase truncate">{item.cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-[#93887C] uppercase tracking-tighter flex items-center justify-end gap-1.5"><Calendar size={11}/> Entrega</p>
                    <p className={`text-[12px] font-black uppercase italic ${esRetraso ? 'text-red-600' : ''}`}>{fechaFormateada}</p>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-[#D7CCBC]/50 bg-[#F6F3EC] px-4 py-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#93887C]">Periodo rentado</p>
                  <p className="mt-1 text-[11px] font-black uppercase text-[#2F2923]">
                    Desde {fechaInicioFormateada} hasta {fechaFormateada}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#D7CCBC]/30">
                   <div className="flex items-center gap-2">
                      <Clock size={13} className={esRetraso ? 'text-red-500' : 'text-[#C6A243]'} />
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${esRetraso ? 'text-red-600' : ''}`}>{mensajeDias}</span>
                   </div>
                   <div className="text-right">
                      <p className="text-[14px] font-black text-[#2F2923]">{formatUSD(item.monto)}</p>
                      {!item.esta_pagado && (
                        <p className="text-[9px] font-black uppercase text-[#C97B6A]">
                          Debe: {formatUSD(item.saldo_pendiente || 0)}
                        </p>
                      )}
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlquileresActivos;
