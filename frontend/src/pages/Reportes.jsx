import React from 'react';
import { BarChart3, TrendingUp, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatUSD } from '../utils/currency';

const Reportes = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic italic">
            Análisis de <span className="text-[#D4AF37]">Ingresos</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-1">
            Reporte Ejecutivo de Facturación (Requisito 5.1)
          </p>
        </div>
        <div className="flex gap-4">
            <select className="bg-[#16191d] border border-gray-800 text-white text-[10px] font-black uppercase py-3 px-6 rounded-xl outline-none focus:border-[#D4AF37]">
                <option>Últimos 30 días</option>
                <option>Este Año</option>
            </select>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#16191d] p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl group hover:border-[#D4AF37]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                    <TrendingUp size={24}/>
                </div>
                <span className="flex items-center gap-1 text-green-500 text-[10px] font-black italic">
                    +12.5% <ArrowUpRight size={14}/>
                </span>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Ingresos Totales</p>
            <h3 className="text-3xl font-mono font-black text-white">{formatUSD(12450)}</h3>
        </div>

        <div className="bg-[#16191d] p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl group hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <CreditCard size={24}/>
                </div>
                <span className="text-blue-500 text-[10px] font-black italic tracking-widest">ESTE MES</span>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Alquileres Cerrados</p>
            <h3 className="text-3xl font-mono font-black text-white">48</h3>
        </div>

        <div className="bg-[#16191d] p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl group hover:border-red-500/30 transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                    <AlertCircle size={24}/>
                </div>
                <span className="flex items-center gap-1 text-red-500 text-[10px] font-black italic">
                    -2.4% <ArrowDownRight size={14}/>
                </span>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Penalidades Cobradas</p>
            <h3 className="text-3xl font-mono font-black text-white">{formatUSD(1120)}</h3>
        </div>
      </div>

      {/* GRÁFICO SIMULADO */}
      <div className="bg-[#16191d] p-10 rounded-[3rem] border border-gray-800 shadow-2xl">
         <div className="flex justify-between items-center mb-10">
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3">
                <BarChart3 className="text-[#D4AF37]" size={18}/> Tendencia de Ingresos Diarios
            </h4>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#D4AF37] rounded-full"></div>
                <span className="text-[9px] text-gray-500 font-black uppercase">Alquileres</span>
            </div>
         </div>
         
         <div className="h-48 flex items-end gap-3 px-4">
            {[40, 70, 45, 90, 65, 80, 50, 95, 30, 85, 60, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-white/5 rounded-t-lg relative group transition-all">
                    <div 
                        style={{ height: `${h}%` }} 
                        className="absolute bottom-0 left-0 right-0 bg-[#D4AF37] rounded-t-lg group-hover:bg-white transition-all"
                    ></div>
                </div>
            ))}
         </div>
         <div className="flex justify-between mt-4 px-4 text-[9px] text-gray-600 font-black uppercase tracking-widest">
            <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
         </div>
      </div>
    </div>
  );
};

export default Reportes;
