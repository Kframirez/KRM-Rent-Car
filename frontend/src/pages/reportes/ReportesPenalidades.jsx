import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertOctagon, User, TrendingUp, Clock, 
  ShieldAlert, Activity, Download, Loader2 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatUSD } from '../../utils/currency';

const ReportesPenalidades = () => {
  const [data, setData] = useState({ totalRecaudado: 0, totalRetrasos: 0, otrosCargos: 0, frecuencia: '0%', lista: [] });
  const [loading, setLoading] = useState(true);

  const fetchPenalidades = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/reportes/penalidades', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (e) {
      console.error("Error cargando penalidades:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPenalidades(); }, []);

  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      const colorAlerta = [201, 123, 106];
      const colorOscuro = [47, 41, 35];
      const colorDorado = [198, 162, 67];
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
      doc.text("AUDITORÍA DE INFRACCIONES Y RECARGOS OPERATIVOS", marginX, 30);
      doc.text("SANTIAGO, REPÚBLICA DOMINICANA", marginX, 35);
      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("REPORTE DE", 145, 21);
      doc.setFontSize(14); 
      doc.text("SANCIONES", 145, 31);
      doc.setTextColor(...colorOscuro);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN DE AUDITORÍA:", marginX, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de Emisión: ${emisionNow}`, marginX, 67);
      doc.text(`Frecuencia de Infracción: ${data.frecuencia} sobre contratos totales`, marginX, 73);
      doc.text(`Generado por: ${localStorage.getItem('user_fullname') || 'Agente KRM'}`, marginX, 79);
      autoTable(doc, {
        startY: 90,
        head: [["ID CONTRATO", "CLIENTE", "MOTIVO DEL CARGO", "TIPO", "MONTO"]],
        body: data.lista.map(p => [
          p.id,
          p.cliente,
          p.motivo,
          p.tipo,
          formatUSD(p.monto)
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
            1: { fontStyle: 'bold' },
            3: { halign: 'center' },
            4: { halign: 'right', fontStyle: 'bold', textColor: colorAlerta }
        },
        alternateRowStyles: { fillColor: [250, 245, 245] }
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setDrawColor(...colorAlerta);
      doc.setLineWidth(0.5);
      doc.rect(125, finalY, 70, 22); 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colorAlerta);
      doc.text("TOTAL RECAUDADO:", 130, finalY + 9);
      doc.setFontSize(16); 
      doc.setTextColor(...colorOscuro);
      doc.text(formatUSD(data.totalRecaudado), 130, finalY + 17);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("Este reporte es una constancia de cargos adicionales. Reservados todos los derechos KRM Rent Car.", 105, 285, { align: "center" });

      doc.save(`KRM_Reporte_Penalidades_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    } catch (e) {
      console.error("Error al generar PDF de penalidades:", e);
    }
  };

  const formatMonto = (num) => formatUSD(num);

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#C97B6A]" size={48} />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-[#2F2923] font-inter">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div className="text-left">
          <h2 className="text-[34px] font-bold text-[#2F2923] tracking-tighter font-sora italic leading-none uppercase">
            Reporte de <span className="text-[#C97B6A] not-italic font-bold">Penalidades</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">Análisis de Recargos e Infracciones</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generarPDF} className="p-3 bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl text-[#93887C] hover:text-[#C97B6A] transition-all shadow-sm">
            <Download size={18} />
          </button>
          <div className="bg-[#FCFAF5] border border-[#C97B6A]/30 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="text-right">
              <p className="text-[8px] font-black text-[#C97B6A] uppercase tracking-widest leading-none mb-1">Total Recaudado</p>
              <p className="text-2xl font-mono font-black text-[#C97B6A] leading-none italic tracking-tighter font-sora">{formatMonto(data.totalRecaudado)}</p>
            </div>
            <div className="p-2 bg-[#C97B6A]/10 rounded-lg text-[#C97B6A]"><AlertOctagon size={20} /></div>
          </div>
        </div>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Por Retrasos" val={formatMonto(data.totalRetrasos)} icon={<Clock size={16}/>} color="text-[#C97B6A]" />
          <MetricCard label="Otros Cargos" val={formatMonto(data.otrosCargos)} icon={<ShieldAlert size={16}/>} color="text-[#C6A243]" />
          <MetricCard label="Frecuencia" val={`${data.frecuencia} Contratos`} icon={<TrendingUp size={16}/>} color="text-[#7D94A8]" />
      </div>

      {/* TABLA */}
      <div className="bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC]/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D7CCBC]/50 bg-[#F4EFE6]/40 flex justify-between items-center text-left">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2F2923] italic font-sora">Registro de Infracciones Mensuales</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[#C97B6A]/70 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#D7CCBC]/30">
              <th className="px-8 py-3.5">Contrato</th>
              <th className="px-8 py-3.5">Cliente</th>
              <th className="px-8 py-3.5">Motivo del Cargo</th>
              <th className="px-8 py-3.5 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7CCBC]/20 text-[13px]">
            {data.lista.length > 0 ? data.lista.map((p, i) => (
              <tr key={i} className="hover:bg-[#C97B6A]/5 transition-colors group">
                <td className="px-8 py-4 text-[11px] font-mono font-bold text-[#93887C] group-hover:text-[#C97B6A]">{p.id}</td>
                <td className="px-8 py-4 font-bold uppercase italic text-[#2F2923]">{p.cliente}</td>
                <td className="px-8 py-4">
                  <span className="text-[10px] font-bold uppercase text-[#6E655B]">{p.motivo}</span>
                </td>
                <td className="px-8 py-4 text-right font-black text-[#C97B6A] font-mono text-base italic">{formatMonto(p.monto)}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="p-10 text-center text-[#93887C] font-bold italic uppercase opacity-50 tracking-widest">Sin penalidades registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MetricCard = ({ label, val, icon, color }) => (
  <div className="bg-[#FCFAF5] p-4 rounded-xl border border-[#D7CCBC]/60 flex items-center gap-4 hover:border-[#C97B6A]/30 transition-all text-left">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text', 'bg')}/10 ${color}`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-[#93887C] uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-[18px] font-black italic font-sora leading-none text-[#2F2923]">{val}</p>
    </div>
  </div>
);

export default ReportesPenalidades;
