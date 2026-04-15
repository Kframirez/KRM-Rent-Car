import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  TrendingUp, DollarSign, ArrowUpRight, Filter, 
  Download, BarChart3, Loader2, AlertCircle, Calendar,
  ArrowDownRight as ArrowIcon 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatUSD } from '../../utils/currency';

const ReporteIngresos = () => {
  const [metricas, setMetricas] = useState({ hoy: 0, periodo: 0, promedio: 0, grafico: [] });
  const [filtros, setFiltros] = useState({ inicio: '', fin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarMetricas = useCallback(async () => {
    if (filtros.inicio && filtros.fin && filtros.fin < filtros.inicio) {
      setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/pagos/metricas-ingresos', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          inicio: filtros.inicio || undefined,
          fin: filtros.fin || undefined
        }
      });
      setMetricas(response.data);
    } catch (err) {
      console.error("Error al cargar métricas de ingresos:", err);
      setError("Error al sincronizar con el motor de analítica.");
    } finally {
      setLoading(false);
    }
  }, [filtros.inicio, filtros.fin]);

  useEffect(() => { cargarMetricas(); }, []);

  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      const colorDorado = [198, 162, 67]; 
      const colorOscuro = [47, 41, 35];
      const marginX = 15;
      const emisionNow = new Date().toLocaleString('es-DO');
      const fechaArchivo = new Date().toLocaleDateString().replace(/\//g, '-');
      doc.setFillColor(...colorOscuro);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("KRM RENT CAR", marginX, 22);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("ANALÍTICA Y RENDIMIENTO FINANCIERO", marginX, 30);
      doc.text("SANTIAGO, REPÚBLICA DOMINICANA", marginX, 35);
      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TIPO DE REPORTE", 145, 21);
      doc.setFontSize(14); 
      doc.text("INGRESOS", 145, 31);
      doc.setTextColor(...colorOscuro);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("PARÁMETROS DEL REPORTE:", marginX, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de Emisión: ${emisionNow}`, marginX, 67);
      doc.text(`Rango Desde: ${filtros.inicio || 'Inicio de operaciones'}`, marginX, 73);
      doc.text(`Rango Hasta: ${filtros.fin || 'Fecha actual'}`, marginX, 79);
      autoTable(doc, {
        startY: 90,
        head: [["DESCRIPCIÓN DE MÉTRICA", "VALOR CALCULADO"]],
        body: [
          ['INGRESOS PERIODO SELECCIONADO', formatMonto(metricas.periodo)],
          ['INGRESOS REGISTRADOS HOY', formatMonto(metricas.hoy)],
          ['TICKET PROMEDIO POR OPERACIÓN', formatMonto(metricas.promedio)],
        ],
        headStyles: { fillColor: colorOscuro, textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [248, 246, 242] }
      });
      if (metricas.grafico && metricas.grafico.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("DESGLOSE CRONOLÓGICO:", marginX, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 22,
          head: [["FECHA", "TOTAL RECAUDADO (USD)"]],
          body: metricas.grafico.map(g => [g.fecha, formatMonto(g.total)]),
          headStyles: { fillColor: colorDorado, textColor: 255, halign: 'center' },
          styles: { font: "helvetica", fontSize: 9 },
          columnStyles: { 0: { halign: 'center' }, 1: { halign: 'right' } },
          alternateRowStyles: { fillColor: [248, 246, 242] }
        });
      }
      doc.save(`KRM_Reporte_Ingresos_${fechaArchivo}.pdf`);
    } catch (err) {
      console.error("Error al generar PDF:", err);
    }
  };

  const obtenerAltura = (valor) => {
    if (!metricas.grafico || metricas.grafico.length === 0) return '0%';
    const max = Math.max(...metricas.grafico.map(g => g.total), 1); 
    return `${(valor / max) * 100}%`;
  };

  const formatMonto = (num) => formatUSD(num);

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500 text-[#2F2923] font-inter">
      {/* HEADER PREMIUM MÁS PEQUEÑO */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-2">
        <div className="text-left">
          <h2 className="text-[24px] font-bold tracking-tighter font-sora italic uppercase leading-none">
            Reporte de <span className="text-[#C6A243] not-italic">Ingresos</span>
          </h2>
          <p className="text-[#93887C] text-[8px] font-bold uppercase mt-0.5 tracking-[0.1em]">
            Administración KRM Luxury Fleet
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-[#6F9B74]/10 border border-[#6F9B74]/20 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <TrendingUp className="text-[#6F9B74]" size={12} />
            <span className="text-[#6F9B74] font-black text-[9px] uppercase">
              {formatMonto(metricas.periodo)}
            </span>
          </div>
          <button onClick={generarPDF} className="bg-[#FCFAF5] border border-[#D7CCBC] p-2 rounded-lg text-[#93887C] hover:text-[#C6A243] transition-all shadow-sm">
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* PANEL DE FILTROS REDUCIDO */}
        <div className="col-span-12 xl:col-span-3">
          <div className="bg-[#FCFAF5] p-5 rounded-[1.8rem] border border-[#D7CCBC] shadow-sm text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest font-sora italic mb-3 text-[#C6A243]">Analítica</h4>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[8px] font-black uppercase text-[#93887C] ml-1">Desde</label>
                <input type="date" className="w-full bg-[#F6F3EC]/50 border border-[#D7CCBC]/50 rounded-lg p-2 text-[11px] font-bold outline-none focus:border-[#C6A243]" 
                  value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-[#93887C] ml-1">Hasta</label>
                <input type="date" min={filtros.inicio} className="w-full bg-[#F6F3EC]/50 border border-[#D7CCBC]/50 rounded-lg p-2 text-[11px] font-bold outline-none focus:border-[#C6A243]" 
                  value={filtros.fin} onChange={(e) => setFiltros({ ...filtros, fin: e.target.value })} />
              </div>
            </div>
            <button onClick={cargarMetricas} disabled={loading} className="w-full py-2.5 bg-[#2F2923] text-white rounded-xl font-black uppercase text-[9px] tracking-[0.1em] shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={12} /> : <Filter size={12}/>} FILTRAR
            </button>
          </div>
          {error && <div className="mt-2 bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}
        </div>

        {/* GRÁFICO DINÁMICO COMPACTO */}
        <div className="col-span-12 xl:col-span-9 bg-[#FCFAF5] rounded-[1.8rem] border border-[#D7CCBC] p-6 min-h-[280px] relative shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="text-left border-l-2 border-[#C6A243] pl-3">
              <p className="text-[12px] font-bold uppercase italic text-[#2F2923] font-sora">Flujo de Caja</p>
              <p className="text-[9px] text-[#93887C] font-black uppercase tracking-widest">Base de datos real</p>
            </div>
            <BarChart3 size={18} className="text-[#C6A243] opacity-30" />
          </div>

          <div className="h-32 flex items-end justify-between gap-2 relative px-1">
            {!loading && metricas.grafico.length > 0 ? (
              metricas.grafico.map((g, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-8 bg-[#2F2923] text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 font-bold shadow-md">
                    {formatMonto(g.total)}
                  </div>
                  <div className="w-full max-w-[25px] bg-[#C6A243]/20 rounded-t-md transition-all duration-700 relative overflow-hidden group-hover:bg-[#C6A243]/40" style={{ height: obtenerAltura(g.total) }}>
                    <div className="absolute inset-0 bg-[#C6A243]"></div>
                  </div>
                  <span className="text-[7px] font-black text-[#93887C] mt-2 uppercase">
                    {g.fecha.split('-')[2]}/{g.fecha.split('-')[1]}
                  </span>
                </div>
              ))
            ) : !loading && (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                <Calendar size={30}/>
                <p className="text-[9px] font-bold uppercase mt-1 tracking-widest">Sin registros</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FCFAF5]/80 z-10">
                <Loader2 className="animate-spin text-[#C6A243]" size={24}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS COMPACTAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Ingresos de Hoy" val={formatMonto(metricas.hoy)} tag="HOY" />
        <StatCard label="Total del Periodo" val={formatMonto(metricas.periodo)} tag="FILTRO" />
        <StatCard label="Ticket Promedio" val={formatMonto(metricas.promedio)} tag="MEDIA" />
      </div>
    </div>
  );
};

const StatCard = ({ label, val, tag }) => (
  <div className="bg-[#FCFAF5] p-4 rounded-[1.8rem] border border-[#D7CCBC]/60 shadow-sm text-left group hover:border-[#C6A243]/40 transition-all flex flex-col justify-between min-h-[110px]">
    <div className="flex justify-between items-center mb-3">
      <div className="p-2 bg-[#F6F3EC] rounded-lg text-[#C6A243] group-hover:bg-[#C6A243] group-hover:text-white transition-all shadow-inner">
        <DollarSign size={14} />
      </div>
      <span className="text-[6px] font-black bg-[#F6F3EC] px-2 py-0.5 rounded-md text-[#93887C] uppercase tracking-wider">{tag}</span>
    </div>
    <div>
      <p className="text-[9px] font-black text-[#93887C] uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[20px] font-mono font-black italic text-[#2F2923] tracking-tighter leading-none">{val}</p>
    </div>
  </div>
);

export default ReporteIngresos;
