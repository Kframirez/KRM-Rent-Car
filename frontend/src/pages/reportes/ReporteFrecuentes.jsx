import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Star, Crown, ShieldCheck, Award, Target, Download, Loader2 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatUSD } from '../../utils/currency';

const ReporteFrecuentes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = 'http://localhost:3000';

  const fetchElite = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/reportes/clientes-elite', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(res.data);
    } catch (e) {
      console.error("Error cargando Elite:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchElite(); }, []);

  const imprimirReporte = () => {
    try {
      const doc = new jsPDF();
      const colorDorado = [198, 162, 67]; 
      const colorOscuro = [47, 41, 35];
      const marginX = 15;
      const emisionNow = new Date().toLocaleString('es-DO');

      doc.setFillColor(...colorOscuro);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("KRM RENT CAR", marginX, 22);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("AUDITORÍA DE FIDELIZACIÓN Y SCORING ELITE", marginX, 30);
      doc.text("SANTIAGO, REPÚBLICA DOMINICANA", marginX, 35);
      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ESTADO DE", 145, 21);
      doc.setFontSize(14); 
      doc.text("FIDELIDAD", 145, 31);
      doc.setTextColor(...colorOscuro);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DETALLES DEL REPORTE:", marginX, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de Emisión: ${emisionNow}`, marginX, 67);
      doc.text(`Criterio: Ranking de Facturación y Frecuencia de Renta`, marginX, 73);
      doc.text(`Generado por: ${localStorage.getItem('user_fullname') || 'Sistema KRM'}`, marginX, 79);

      autoTable(doc, {
        startY: 90,
        head: [["POS", "NOMBRE DEL CLIENTE", "CATEGORÍA", "RENTAS", "INVERSIÓN", "SCORE"]],
        body: clientes.map(c => [
          `#${c.rank}`,
          c.nombre,
          c.status,
          c.rentas,
          formatUSD(c.total),
          `${c.score}%`
        ]),
        headStyles: { 
          fillColor: colorOscuro, 
          textColor: 255, 
          fontStyle: 'bold', 
          halign: 'center' 
        },
        styles: { font: "helvetica", fontSize: 8, cellPadding: 4 },
        columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },
            2: { halign: 'center', fontStyle: 'bold' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'center', textColor: colorDorado, fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [248, 246, 242] }
      });
      if (clientes.length > 0) {
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setDrawColor(...colorDorado);
        doc.setLineWidth(0.5);
        doc.rect(marginX, finalY, 180, 25);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...colorDorado);
        doc.text("CLIENTE DIAMANTE DEL MES:", marginX + 5, finalY + 10);
        
        doc.setFontSize(14);
        doc.setTextColor(...colorOscuro);
        doc.text(`${clientes[0].nombre} - TRUST SCORE: ${clientes[0].score}%`, marginX + 5, finalY + 18);
      }
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("Este documento es para uso interno administrativo de KRM Rent Car - Autenticado vía Sistema.", 105, 285, { align: "center" });

      doc.save(`KRM_Clientes_Elite_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    } catch (e) {
      console.error("Error al generar PDF de clientes:", e);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#C6A243]" size={48} />
    </div>
  );

  const top3 = clientes.slice(0, 3);
  const elResto = clientes.slice(3);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 text-[#2F2923] font-inter">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div className="text-left">
          <h2 className="text-[32px] font-bold text-[#2F2923] tracking-tighter font-sora italic leading-none uppercase">
            Clientes <span className="text-[#C6A243] not-italic font-bold">Elite</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">
            Fidelización y Scoring de Confianza
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={imprimirReporte} className="p-3 bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl text-[#93887C] hover:text-[#C6A243] transition-all shadow-sm">
            <Download size={18} />
          </button>
          <div className="bg-[#FCFAF5] border border-[#D7CCBC] px-4 py-2 rounded-xl flex items-center gap-3">
            <ShieldCheck className="text-[#C6A243]" size={16} />
            <span className="text-[#C6A243] font-black text-[9px] uppercase tracking-widest text-right leading-tight">
              Auditoría de <br/> Confianza Activa
            </span>
          </div>
        </div>
      </div>

      {/* PODIO DINÁMICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        {top3.map((c) => (
          <div key={c.rank} className={`relative p-6 rounded-2xl border transition-all duration-500 overflow-hidden shadow-sm flex flex-col justify-between ${c.rank === 1 ? 'bg-[#FCFAF5] border-[#C6A243]/50 h-[360px] z-10 scale-105 shadow-md' : 'bg-[#FCFAF5]/80 border-[#D7CCBC] h-[320px]'}`}>
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] text-[#2F2923]">
              {c.rank === 1 ? <Crown size={140} /> : <Award size={110} />}
            </div>
            <div className="flex justify-between items-start">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black italic border ${c.rank === 1 ? 'bg-[#C6A243] text-white border-[#C6A243]' : 'bg-[#F6F3EC] text-[#93887C] border-[#D7CCBC]'}`}>
                #{c.rank}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[#C6A243] uppercase tracking-tighter leading-none">{c.status}</p>
                <p className="text-[8px] text-[#93887C] font-bold uppercase tracking-widest mt-1">Categoría</p>
              </div>
            </div>
            <div className="text-center space-y-4 relative z-10">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border-2 border-[#D7CCBC] bg-[#F6F3EC] overflow-hidden shadow-sm">
                {c.imagen_url ? (
                  <img
                    src={`${API_BASE_URL}${c.imagen_url}`}
                    className="w-full h-full object-cover"
                    alt={c.nombre}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${c.imagen_url ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-[#93887C]`}>
                  <User size={28} className="text-[#93887C]" />
                </div>
              </div>
              <div>
                <h4 className="font-bold uppercase italic font-sora text-[#2F2923] leading-tight tracking-tight">{c.nombre}</h4>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <Star size={10} className="fill-[#C6A243] text-[#C6A243]" />
                  <span className="text-[#C6A243] font-black text-[10px] italic">Trust Score: {c.score}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#D7CCBC]/40">
                <div className="border-r border-[#D7CCBC]/30">
                  <p className="text-[8px] font-bold text-[#93887C] uppercase tracking-tighter mb-0.5">Rentas</p>
                  <p className="text-[15px] font-black text-[#2F2923] italic leading-none">{c.rentas}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-[#93887C] uppercase tracking-tighter mb-0.5">Inversión</p>
                  <p className="text-[15px] font-mono font-black text-[#6F9B74] leading-none">{formatUSD(c.total)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LISTA GENERAL */}
      <div className="bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC]/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[#93887C] text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#D7CCBC]/30">
              <th className="px-6 py-4">Rango</th>
              <th className="px-6 py-4">Cliente Titular</th>
              <th className="px-6 py-4 text-center">Nivel</th>
              <th className="px-6 py-4 text-right">Factor Trust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7CCBC]/20">
            {elResto.length > 0 ? (
              elResto.map((c) => (
                <tr key={c.rank} className="hover:bg-[#F3EEE4] transition-colors group">
                  <td className="px-6 py-4 text-[18px] font-black italic text-[#D7CCBC] group-hover:text-[#93887C]">0{c.rank}</td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-[#D7CCBC]/40 bg-[#F6F3EC] flex items-center justify-center shadow-sm shrink-0">
                        {c.imagen_url ? (
                          <img
                            src={`${API_BASE_URL}${c.imagen_url}`}
                            className="w-full h-full object-cover"
                            alt={c.nombre}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${c.imagen_url ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-[#93887C]`}>
                          <User size={18} className="text-[#93887C]" />
                        </div>
                      </div>
                      <span className="font-bold uppercase text-[#2F2923] italic">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[9px] font-black text-[#6E655B] bg-[#F1EADF] px-2.5 py-1 rounded-lg uppercase border border-[#D7CCBC]/50">{c.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-1 bg-[#F6F3EC] rounded-full overflow-hidden border border-[#D7CCBC]/20">
                        <div className="h-full bg-[#6F9B74]/60 transition-all" style={{ width: `${c.score}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-[#6F9B74] italic w-8 text-right font-mono">{c.score}%</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-10 text-center text-[#93887C] font-bold italic uppercase opacity-50">Sin registros adicionales</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReporteFrecuentes;
