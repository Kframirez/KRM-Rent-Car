import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Trophy, Car, Award, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReporteRentados = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función de carga blindada con useCallback
  const fetchRendimiento = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/vehiculos/ranking-flota', {
        params: { 
          mes: new Date().getMonth() + 1, 
          anio: new Date().getFullYear() 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatos(res.data);
    } catch (e) {
      console.error("Error al cargar rendimiento", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchRendimiento(); 
  }, [fetchRendimiento]);

  const generarPDF = () => {
    const doc = new jsPDF();
    const colorOscuro = [47, 41, 35];
    
    doc.setFontSize(18);
    doc.text("KRM RENT CAR - REPORTE DE RENDIMIENTO", 15, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['POS', 'VEHÍCULO', 'PLACA', 'RENTAS', 'DÍAS RENTA', 'OCUPACIÓN']],
      body: datos.map(v => [v.rank, v.modelo, v.placa, v.rentas, v.diasRenta, v.ocupacion]),
      headStyles: { fillColor: colorOscuro },
      theme: 'grid'
    });
    
    doc.save(`Reporte_Flota_KRM_${new Date().toLocaleDateString()}.pdf`);
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#C6A243]" size={48} />
    </div>
  );

  const top3 = datos.slice(0, 3);
  const elResto = datos.slice(3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-[#2F2923] font-inter">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4 text-left">
        <div>
          <h2 className="text-[34px] font-bold tracking-tighter font-sora italic leading-none uppercase">
            Rendimiento de <span className="text-[#C6A243] not-italic font-bold">Flota</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">
            Análisis de Unidades con Mayor Rotación
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            title="Descargar Reporte PDF"
            onClick={generarPDF} 
            className="p-3 bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl text-[#93887C] hover:text-[#C6A243] transition-all shadow-sm"
          >
            <Download size={18} />
          </button>
          <div className="flex items-center gap-3 bg-[#FCFAF5] p-2.5 rounded-xl border border-[#D7CCBC] shadow-sm">
             <Trophy className="text-[#C6A243]" size={20} />
             <div className="text-right">
               <p className="text-[8px] font-black text-[#93887C] uppercase leading-none mb-1">Líder Mensual</p>
               <p className="text-[12px] font-bold italic uppercase leading-none text-[#2F2923]">{top3[0]?.modelo || '---'}</p>
             </div>
          </div>
        </div>
      </div>

      {/* PODIO DINÁMICO CON IMÁGENES REALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {top3.map((item) => (
          <div key={item.rank} className="bg-[#FCFAF5] p-6 rounded-[2rem] border border-[#D7CCBC]/80 shadow-sm relative overflow-hidden text-left group">
            <div className="absolute -right-4 -top-4 opacity-[0.05] text-[#2F2923] group-hover:scale-110 transition-transform">
              <Award size={120} />
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F6F3EC] border border-[#D7CCBC]/60 flex items-center justify-center text-xl font-black italic text-[#C6A243]">
                #{item.rank}
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#C6A243]/30 shadow-inner bg-white">
                {item.imagen_url ? (
                  <img 
                    src={`http://localhost:3000${item.imagen_url}`} 
                    className="w-full h-full object-cover" 
                    alt="Vehículo KRM" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D7CCBC] bg-[#F6F3EC]">
                    <Car size={35} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="border-l-2 border-[#C6A243] pl-3">
                <h4 className="text-[15px] font-bold uppercase italic tracking-tight text-[#2F2923] leading-none">
                  {item.modelo}
                </h4>
                <p className="text-[9px] font-mono text-[#C6A243] mt-1 font-bold tracking-widest uppercase">
                  {item.placa}
                </p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-[#93887C] uppercase tracking-widest mb-0.5">Rentas Totales</p>
                  <p className="text-[28px] font-black text-[#2F2923] italic leading-none font-sora">{item.rentas}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-[#93887C] uppercase tracking-widest mb-0.5">Ocupación</p>
                  <p className="text-[16px] font-mono font-black text-[#C6A243] leading-none italic">{item.ocupacion}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RANKING GENERAL CON MINIATURAS */}
      <div className="bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC]/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[#93887C] text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#D7CCBC]/30 bg-[#F4EFE6]/30">
              <th className="px-6 py-4">Pos.</th>
              <th className="px-6 py-4">Unidad / Identificación</th>
              <th className="px-6 py-4 text-center">Días Renta</th>
              <th className="px-6 py-4 text-right pr-10">Utilización Mensual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7CCBC]/20">
            {elResto.length > 0 ? elResto.map((item) => (
              <tr key={item.rank} className="hover:bg-[#F3EEE4] transition-colors group">
                <td className="px-6 py-4 text-[20px] font-black italic text-[#D7CCBC] group-hover:text-[#93887C]">
                  {item.rank < 10 ? `0${item.rank}` : item.rank}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-[#D7CCBC]/40 flex items-center justify-center shadow-sm">
                      {item.imagen_url ? (
                        <img 
                          src={`http://localhost:3000${item.imagen_url}`} 
                          className="w-full h-full object-cover" 
                          alt="Unidad" 
                        />
                      ) : (
                        <Car size={18} className="text-[#D7CCBC]" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold uppercase text-[#2F2923] italic leading-none">{item.modelo}</p>
                      <p className="text-[9px] font-mono text-[#93887C] font-bold mt-1 uppercase tracking-widest">{item.placa}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-[11px] font-black text-[#6E655B] uppercase italic">
                  {item.diasRenta} Días
                </td>
                <td className="px-6 py-4 pr-10">
                  <div className="flex items-center justify-end gap-4">
                    <div className="w-32 h-2 bg-[#E5DED0] rounded-full overflow-hidden border border-[#D7CCBC]/10">
                      <div 
                        className="h-full bg-[#C6A243] transition-all duration-1000 ease-out" 
                        style={{ width: `${item.porcentajeVal}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-black text-[#2F2923] italic font-mono w-10 text-right">
                      {item.ocupacion}
                    </span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="p-12 text-center text-[#93887C] uppercase font-bold text-[10px] italic tracking-[0.2em] opacity-50">
                  No se detectaron registros adicionales en el ranking
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReporteRentados;