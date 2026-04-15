import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, PieChart, Crown, Sparkles, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportesFeriados = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/reportes/analitica-feriados', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (e) {
        console.error("Error cargando analítica festiva:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generarPDF = () => {
    if (!data) return;
    try {
      const doc = new jsPDF();
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
      doc.text("ANALÍTICA DE IMPACTO: PERIODOS FESTIVOS", marginX, 30);
      doc.text("SANTIAGO, REPÚBLICA DOMINICANA", marginX, 35);
      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TIPO REPORTE", 145, 21);
      doc.setFontSize(14); 
      doc.text("FERIADOS", 145, 31);
      doc.setTextColor(...colorOscuro);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN OPERATIVO DE TEMPORADA", marginX, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de Emisión: ${emisionNow}`, marginX, 70);
      doc.text(`Nivel de Ocupación Festiva: ${data.porcentajeOcupacion || 0}%`, marginX, 78);
      doc.text(`Impacto en Ingresos: +${data.tendenciaExtra || 0}% vs Periodos Normales`, marginX, 86);
      autoTable(doc, {
        startY: 95,
        head: [["DESCRIPCIÓN DE PERIODO", "VOLUMEN DE DÍAS RENTA"]],
        body: [
          ["DÍAS EN TEMPORADA FESTIVA (FERIADOS)", `${data.diasFeriados || 0} Unidades`],
          ["DÍAS EN TEMPORADA ESTÁNDAR (NORMALES)", `${data.diasNormales || 0} Unidades`]
        ],
        headStyles: { fillColor: colorOscuro, textColor: 255, fontStyle: 'bold' },
        styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
        alternateRowStyles: { fillColor: [248, 246, 242] }
      });
      if (data.gamas && data.gamas.length > 0) {
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFont("helvetica", "bold");
        doc.text("DEMANDA SEGÚN GAMA DE VEHÍCULO:", marginX, finalY);
        autoTable(doc, {
          startY: finalY + 5,
          head: [["GAMA DEL VEHÍCULO", "PARTICIPACIÓN EN FERIADOS"]],
          body: data.gamas.map(g => [g.nombre.toUpperCase(), `${g.porcentaje}%`]),
          headStyles: { fillColor: colorDorado, textColor: 255, fontStyle: 'bold' },
          styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
          alternateRowStyles: { fillColor: [248, 246, 242] }
        });
      }
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("Documento generado por KRM System Analytica. Confidencial.", 105, 285, { align: "center" });

      doc.save(`KRM_Analitica_Feriados_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    } catch (e) {
      console.error("Error al generar PDF de feriados:", e);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#C6A243]" size={48} />
    </div>
  );

  if (!data) return (
    <div className="flex h-96 items-center justify-center text-[#93887C] uppercase font-black text-xs italic tracking-widest">
      Sincronizando motor de analítica festiva...
    </div>
  );

  const strokeDash = 2 * Math.PI * 80;
  const safePercent = data.porcentajeOcupacion || 0;
  const offset = strokeDash * (1 - (safePercent / 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-[#2F2923] font-inter">
      
      {/* HEADER COMPACTO */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div className="text-left">
          <h2 className="text-[34px] font-bold text-[#2F2923] tracking-tighter font-sora italic leading-none uppercase">
            Impacto en <span className="text-[#C6A243] not-italic font-bold">Feriados</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">Días Festivos vs Periodos Normales</p>
        </div>
        <button onClick={generarPDF} className="p-3 bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl text-[#93887C] hover:text-[#C6A243] transition-all shadow-sm">
          <Download size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: VOLUMEN (Gráfico Circular) */}
        <div className="xl:col-span-7 bg-[#FCFAF5] p-8 rounded-[2rem] border border-[#D7CCBC] shadow-sm flex flex-col items-center justify-between relative overflow-hidden group">
          <div className="absolute top-6 left-8 flex items-center gap-2 opacity-60">
            <PieChart size={14} className="text-[#C6A243]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#93887C]">Volumen de Rentas</span>
          </div>

          {/* Gráfico Circular Dinámico */}
          <div className="relative flex items-center justify-center my-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="80" stroke="#F4EFE6" strokeWidth="12" fill="transparent" />
              <circle 
                cx="96" cy="96" r="80" 
                stroke="#C6A243" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray={strokeDash} 
                strokeDashoffset={offset} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black italic text-[#2F2923] leading-none font-sora">{safePercent}%</span>
              <span className="text-[9px] font-black text-[#93887C] uppercase tracking-[0.3em] mt-1">Ocupación</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-[#D7CCBC]/40 font-inter text-left">
            <div className="bg-[#F6F3EC] p-4 rounded-xl border border-[#D7CCBC]/40">
              <p className="text-[8px] font-black text-[#93887C] uppercase tracking-widest mb-1">Días Feriados</p>
              <p className="text-2xl font-black italic text-[#2F2923] leading-none font-sora">{data.diasFeriados || 0}</p>
            </div>
            <div className="bg-[#F6F3EC] p-4 rounded-xl border border-[#D7CCBC]/40">
              <p className="text-[8px] font-black text-[#93887C] uppercase tracking-widest mb-1">Días Normales</p>
              <p className="text-2xl font-black italic text-[#93887C]/50 leading-none font-sora">{data.diasNormales || 0}</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: INSIGHTS */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Tarjeta de Tendencia (Destaque en Oro) */}
          <div className="bg-[#C6A243] p-6 rounded-[2rem] shadow-md relative overflow-hidden group">
            <Sparkles className="absolute -right-2 -top-2 text-white/20 group-hover:rotate-12 transition-transform" size={80} />
            <div className="relative z-10 space-y-3 text-left">
              <div className="flex items-center gap-2 text-white/80">
                <TrendingUp size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Tendencia Operativa</span>
              </div>
              <p className="text-white font-bold text-[13px] leading-relaxed tracking-tight">
                Los periodos feriados generan un <span className="font-black underline underline-offset-4">{data.tendenciaExtra}% más de ingresos</span> brutos por tarifa especial.
              </p>
            </div>
          </div>

          {/* Bloque de Gamas con Jerarquía */}
          <div className="bg-[#FCFAF5] p-6 rounded-[2rem] border border-[#D7CCBC] border-dashed shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-[#C6A243]" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2F2923]">Gamas en Feriados</h4>
            </div>

            <div className="space-y-5 text-left">
              {data.gamas && data.gamas.length > 0 ? data.gamas.slice(0, 3).map((g, i) => (
                <div key={i} className={`flex items-end justify-between border-b border-[#D7CCBC]/40 pb-3 ${i > 0 ? 'opacity-60' : ''}`}>
                  <div>
                    <p className="text-[12px] font-black uppercase text-[#2F2923] tracking-tight italic leading-none">{g.nombre}</p>
                    <p className="text-[9px] font-bold text-[#93887C] uppercase mt-1.5 leading-none">Preferencia festiva</p>
                  </div>
                  <span className="text-2xl font-black text-[#C6A243] italic font-sora leading-none">{g.porcentaje}%</span>
                </div>
              )) : (
                <p className="text-[10px] text-center text-[#93887C] italic py-4">Sin datos de gamas registrados</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportesFeriados;