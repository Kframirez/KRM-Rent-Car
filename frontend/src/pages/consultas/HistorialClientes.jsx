import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as Lucide from 'lucide-react';
import { formatUSD } from '../../utils/currency';

const HistorialClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const cargarClientes = async () => {
      setLoadingClientes(true);
      try {
        const res = await axios.get('http://localhost:3000/api/clientes', config);
        setClientes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error cargando clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };

    cargarClientes();
  }, []);

  const consultarHistorial = async (cliente) => {
    setSelectedCliente(cliente);
    setLoading(true);
    setErrorConsulta('');
    setResultados([]);
    setClienteInfo(null);

    try {
      const res = await axios.get(`http://localhost:3000/api/alquileres/historial?query=${cliente.cedula}`, config);

      if (res.data && res.data.cliente) {
        setResultados(res.data.historial || []);
        setClienteInfo({
          nombre: `${res.data.cliente.nombre} ${res.data.cliente.apellido || ''}`.trim(),
          id: res.data.cliente.cedula,
          score: res.data.score || 'N/A'
        });
      } else {
        setErrorConsulta('No se encontró historial para este arrendatario.');
      }
    } catch (err) {
      console.error('Error en consulta:', err);
      setErrorConsulta('Error de conexión o arrendatario no registrado.');
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.cedula}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100dvh-140px)] lg:h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500 text-[#2F2923] font-inter lg:-mt-6">
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-3 flex-shrink-0 text-left">
        <div>
          <h2 className="text-[22px] font-bold text-[#2F2923] tracking-tighter italic uppercase leading-none font-sora">
            Historial de <span className="text-[#C6A243] not-italic font-bold">Alquileres</span>
          </h2>
          <p className="text-[#93887C] text-[9px] font-bold uppercase mt-1 ml-0.5 tracking-[0.12em]">
            Selección por arrendatario para consultar historial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="xl:col-span-3 flex flex-col space-y-3 min-h-0 text-left xl:border-r border-[#D7CCBC]/20 pr-1">
          <div className="bg-[#FCFAF5] p-3 rounded-xl border border-[#D7CCBC]/60 shadow-sm flex-shrink-0">
            <div className="relative">
              <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93887C]" size={14} />
              <input
                placeholder="Buscar cliente..."
                className="w-full bg-white border border-[#D7CCBC] rounded-lg py-2 pl-10 pr-3 text-[12px] font-bold outline-none focus:border-[#C6A243]"
                onChange={(e) => setBusqueda(e.target.value)}
                value={busqueda}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
            {loadingClientes ? (
              <div className="py-8 text-center text-[#93887C] text-[10px] font-bold uppercase">
                <Lucide.Loader2 className="animate-spin mx-auto mb-2" size={18} />
                Cargando clientes...
              </div>
            ) : clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((c) => (
                <button
                  key={c.cliente_id}
                  type="button"
                  onClick={() => consultarHistorial(c)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${selectedCliente?.cliente_id === c.cliente_id ? 'bg-[#2F2923] text-white border-[#2F2923] shadow-md' : 'bg-[#FCFAF5] border-[#D7CCBC]/30 hover:border-[#C6A243]/50'}`}
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#C6A243] border border-[#D7CCBC]/30 shadow-sm">
                    <Lucide.User size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[11px] uppercase leading-none truncate">{c.nombre} {c.apellido}</h4>
                    <p className="text-[9px] font-bold opacity-70 mt-1 uppercase tracking-tighter">{c.cedula}</p>
                  </div>
                  <Lucide.ArrowRight size={12} className="opacity-25" />
                </button>
              ))
            ) : (
              <p className="py-8 text-center text-[#93887C] text-[10px] font-bold uppercase">
                No hay clientes para mostrar
              </p>
            )}
          </div>
        </div>

        <div className="xl:col-span-9 bg-[#FCFAF5] rounded-[2rem] border border-[#D7CCBC]/60 shadow-sm overflow-hidden flex flex-col min-h-0 relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Lucide.Loader2 className="animate-spin text-[#C6A243]" size={32} />
            </div>
          ) : clienteInfo ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-500">
              <div className="bg-[#FCFAF5] p-5 rounded-2xl border-b border-[#D7CCBC] flex justify-between items-center shadow-sm flex-shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-[#C6A243]/10 rounded-2xl flex items-center justify-center text-[#C6A243] border border-[#C6A243]/20 shadow-inner">
                    <Lucide.User size={22} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[16px] font-bold uppercase italic tracking-tight text-[#2F2923]">{clienteInfo.nombre}</h3>
                    <p className="text-[#93887C] font-mono text-[9px] font-bold tracking-widest mt-0.5 uppercase leading-none">{clienteInfo.id}</p>
                  </div>
                </div>
                <div className="text-right border-l border-[#D7CCBC]/40 pl-8">
                  <p className="text-[8px] font-black text-[#93887C] uppercase tracking-widest mb-0.5">Confianza</p>
                  <p className="text-[28px] font-black text-[#6F9B74] italic leading-none">{clienteInfo.score}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {errorConsulta && (
                  <p className="text-red-500 text-[10px] font-bold uppercase italic m-4 flex items-center gap-1">
                    <Lucide.AlertCircle size={12} /> {errorConsulta}
                  </p>
                )}

                <div className="rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F4EFE6]/60 border-y border-[#D7CCBC]/60">
                      <tr className="text-[9px] font-black text-[#93887C] uppercase tracking-widest">
                        <th className="px-8 py-3.5">Unidades Rentadas</th>
                        <th className="px-8 py-3.5 text-center">Fecha</th>
                        <th className="px-8 py-3.5 text-center">Estado</th>
                        <th className="px-8 py-3.5 text-right italic">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7CCBC]/30 font-inter">
                      {resultados.length > 0 ? resultados.map((item, index) => (
                        <tr key={index} className="hover:bg-[#F3EEE4] transition-all group">
                          <td className="px-8 py-4">
                            {item.detalles && item.detalles.map((det, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 mb-1 last:mb-0">
                                <Lucide.Car size={12} className="text-[#93887C]" />
                                <span className="font-bold text-[#2F2923] uppercase text-[11px] italic">{det.auto}</span>
                                <span className="text-[9px] font-mono bg-[#F6F3EC] px-1.5 py-0.5 rounded text-[#93887C] border border-[#D7CCBC]/20">{det.placa}</span>
                              </div>
                            ))}
                          </td>
                          <td className="px-8 py-4 text-center text-[10px] font-bold text-[#93887C] uppercase italic">
                            {new Date(item.fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-4 text-center">
                            <span className={`text-[7.5px] font-black px-2 py-0.5 rounded-full border ${item.estado === 'ACTIVO' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right font-mono font-black text-[#2F2923] text-[15px] leading-none tracking-tighter">
                            {formatUSD(item.total)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-[10px] font-bold text-[#93887C] uppercase">
                            No hay registros previos de alquiler
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
              <Lucide.Fingerprint size={48} className="text-[#93887C] mb-4" strokeWidth={1.5} />
              <h4 className="text-[#2F2923] font-black uppercase text-[12px] tracking-[0.3em]">Seleccione un arrendatario</h4>
              <p className="text-[10px] text-[#93887C] mt-2 max-w-[280px] mx-auto font-bold uppercase">
                Visualice aquí el historial completo de contratos y montos del cliente seleccionado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialClientes;

