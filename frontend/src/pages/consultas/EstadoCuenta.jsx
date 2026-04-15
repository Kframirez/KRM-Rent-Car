import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Search, Wallet, FileText, CheckCircle, 
  AlertTriangle, Loader2, Calendar, Car, ArrowRight 
} from 'lucide-react';
import { formatUSD } from '../../utils/currency';

const EstadoCuenta = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [edc, setEdc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/clientes', config);
        setClientes(res.data);
      } catch (err) { console.error("Error cargando clientes", err); }
    };
    fetchClientes();
  }, []);

  const consultarEDC = async (cliente) => {
    setSelectedCliente(cliente);
    setLoading(true);
    setEdc(null);
    try {
      const res = await axios.get(`http://localhost:3000/api/pagos/estado-cuenta-cliente/${cliente.cliente_id}`, config);
      setEdc(res.data);
    } catch (err) { console.error("Error EDC", err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100dvh-140px)] lg:h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500 text-[#2F2923] font-inter lg:-mt-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-3 flex-shrink-0 text-left">
        <div>
          <h2 className="text-[22px] font-bold text-[#2F2923] tracking-tighter italic uppercase leading-none font-sora">
            Estado de <span className="text-[#C6A243] not-italic font-bold">Cuenta</span>
          </h2>
          <p className="text-[#93887C] text-[9px] font-bold uppercase mt-1 ml-0.5 tracking-[0.1em]">Auditoría de Movimientos y Abonos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* PANEL IZQUIERDO: LISTA DE CLIENTES */}
        <div className="xl:col-span-3 flex flex-col space-y-3 min-h-0 text-left xl:border-r border-[#D7CCBC]/20 pr-1">
          <div className="bg-[#FCFAF5] p-3 rounded-xl border border-[#D7CCBC]/60 shadow-sm flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93887C]" size={14} />
              <input 
                placeholder="Buscar cliente..." 
                className="w-full bg-white border border-[#D7CCBC] rounded-lg py-2 pl-10 pr-3 text-[12px] font-bold outline-none focus:border-[#C6A243]"
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
            {clientes.filter(c => `${c.nombre} ${c.apellido} ${c.cedula}`.toLowerCase().includes(busqueda.toLowerCase())).map((c) => (
              <div 
                key={c.cliente_id}
                onClick={() => consultarEDC(c)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${selectedCliente?.cliente_id === c.cliente_id ? 'bg-[#2F2923] text-white border-[#2F2923] shadow-md' : 'bg-[#FCFAF5] border-[#D7CCBC]/30 hover:border-[#C6A243]/50'}`}
              >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#C6A243] border border-[#D7CCBC]/30 shadow-sm">
                  <User size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[11px] uppercase leading-none truncate">{c.nombre} {c.apellido}</h4>
                  <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-tighter">{c.cedula}</p>
                </div>
                <ArrowRight size={12} className="opacity-20" />
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: REPORTE DETALLADO */}
        <div className="xl:col-span-9 bg-[#FCFAF5] rounded-[2rem] border border-[#D7CCBC]/60 shadow-sm overflow-hidden flex flex-col min-h-0 relative">
          {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center">
               <Loader2 className="animate-spin text-[#C6A243]" size={32} />
             </div>
          ) : edc ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-500">
               
               <div className="flex-shrink-0 bg-white border-b border-[#D7CCBC]/40 shadow-sm">
                  <div className="p-5 flex justify-between items-center text-left">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${edc.resumenGlobal.balancePendiente <= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {edc.resumenGlobal.balancePendiente <= 0 ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
                      </div>
                      <div>
                        <h3 className="text-[18px] font-black uppercase italic leading-none font-sora tracking-tighter">
                          {edc.resumenGlobal.balancePendiente <= 0 ? 'AL DÍA' : 'CON DEUDA'}
                        </h3>
                        <p className="text-[9px] font-black text-[#93887C] uppercase tracking-[0.1em] mt-1">
                          Cliente: {edc.cliente.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right border-r border-[#D7CCBC]/30 pr-6">
                            <p className="text-[8px] font-black text-[#93887C] uppercase mb-0.5">Total Facturado</p>
                            <p className="text-[18px] font-black text-[#2F2923]">{formatUSD(edc.resumenGlobal.totalFacturado)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-[#93887C] uppercase mb-0.5">Balance Pendiente</p>
                            <p className={`text-[24px] font-mono font-black italic tracking-tighter leading-none ${edc.resumenGlobal.balancePendiente > 0 ? 'text-red-500' : 'text-[#6F9B74]'}`}>
                                {formatUSD(edc.resumenGlobal.balancePendiente)}
                            </p>
                        </div>
                    </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#FCFAF5] custom-scrollbar text-left">
                  {edc.contratos.map((alq) => (
                    <div key={alq.alquiler_id} className="bg-white border border-[#D7CCBC]/50 rounded-[1.8rem] overflow-hidden shadow-sm">
                      
                      <div className="bg-[#F6F3EC]/50 p-4 border-b border-[#D7CCBC]/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-[#D7CCBC]/40 shadow-sm text-[#C6A243]">
                            <Car size={18}/>
                          </div>
                          <div>
                            <p className="text-[12px] font-black uppercase tracking-tight">Folio Contrato: KR-0{alq.alquiler_id}</p>
                            <p className="text-[9px] font-bold text-[#93887C] uppercase">{alq.vehiculos.join(' / ')}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${alq.estado === 'SALDADO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {alq.estado}
                        </span>
                      </div>

                      <div className="p-5 overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse min-w-[600px]">
                          <thead>
                            <tr className="text-[#93887C] uppercase text-[9px] border-b border-[#D7CCBC]/30">
                              <th className="pb-2 font-black text-left">Fecha</th>
                              <th className="pb-2 font-black text-left">Concepto del Movimiento</th>
                              <th className="pb-2 font-black text-right">Cargo (+)</th>
                              <th className="pb-2 font-black text-right">Abono (-)</th>
                              <th className="pb-2 font-black text-right">Saldo Restante</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D7CCBC]/10">
                            {alq.historial?.map((mov, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="py-2.5 font-mono text-gray-500">{new Date(mov.fecha).toLocaleDateString()}</td>
                                <td className="py-2.5 font-bold text-[#2F2923] uppercase">{mov.concepto}</td>
                                <td className="py-2.5 text-right font-bold text-red-400">{mov.cargo > 0 ? formatUSD(mov.cargo) : '-'}</td>
                                <td className="py-2.5 text-right font-bold text-[#6F9B74]">{mov.abono > 0 ? formatUSD(mov.abono) : '-'}</td>
                                <td className="py-2.5 text-right font-black text-[#2F2923]">{formatUSD(mov.saldo)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-[#2F2923] p-4 flex justify-between items-center px-6">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Resumen de liquidación del folio</p>
                         <div className="text-right">
                            <p className="text-[8px] font-bold text-white/50 uppercase mb-1">Saldo a la Fecha</p>
                            <p className={`text-[18px] font-black leading-none ${alq.saldo_final <= 0 ? 'text-[#C6A243]' : 'text-red-400'}`}>
                                {formatUSD(alq.saldo_final)}
                            </p>
                         </div>
                      </div>

                    </div>
                  ))}
                  
                  {edc.contratos.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                      <FileText size={60} className="mx-auto mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Sin actividad financiera registrada</p>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
              <Wallet size={48} className="text-[#93887C] mb-4" strokeWidth={1} />
              <h4 className="text-[#2F2923] font-black uppercase text-[12px] tracking-[0.3em]">Seleccione un arrendatario</h4>
              <p className="text-[10px] text-[#93887C] mt-2 max-w-[250px] mx-auto font-bold uppercase">Audite el desglose cronológico de cargos y abonos aplicados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstadoCuenta;
