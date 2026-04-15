import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Car, Calculator, CheckCircle, Search, 
  ChevronRight, AlertCircle, Receipt, ArrowLeft,
  Loader2, PlusCircle, Trash2, Ban, XCircle, ShieldAlert,
  RotateCcw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';
import { formatUSD } from '../../utils/currency';

const Alquileres = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [listaClientes, setListaClientes] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [alquileresActivos, setAlquileresActivos] = useState([]); 
  const [feriados, setFeriados] = useState([]);
  const [carrito, setCarrito] = useState([]); 
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [fechas, setFechas] = useState({ salida: '', entrega: '' });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const token = localStorage.getItem('token');
  const userFullname = localStorage.getItem('user_fullname') || 'Agente Operativo KRM';
  const getConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });
  const hoyString = useMemo(() => new Date().toISOString().split('T')[0], []);

  const formatearFecha = (fechaStr) => {
    if(!fechaStr) return '--/--/----';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const obtenerImagenVehiculo = (vehiculo) => (
    vehiculo.imagen_url ? `http://localhost:3000${vehiculo.imagen_url}` : null
  );

  const obtenerEtiquetaEstadoVehiculo = (vehiculo) => {
    if (vehiculo.en_renta) return { label: 'En renta', className: 'bg-[#C97B6A]/12 text-[#C97B6A] border-[#C97B6A]/20' };
    if (!vehiculo.estado) return { label: 'Inactivo', className: 'bg-[#93887C]/10 text-[#93887C] border-[#93887C]/20' };
    return { label: 'Disponible', className: 'bg-[#6F9B74]/12 text-[#6F9B74] border-[#6F9B74]/20' };
  };

  const generarPDF = (reservaId, datos) => {
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
      doc.text("SOLUCIONES LOGÍSTICAS DE TRANSPORTE", marginX, 30);
      doc.text("SANTIAGO, REPÚBLICA DOMINICANA", marginX, 35);
      
      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ID CONTRATO", 145, 21);
      doc.setFontSize(18); 
      doc.text(`KR-${reservaId}`, 145, 31);

      doc.setTextColor(...colorOscuro);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL TITULAR:", marginX, 60);
      doc.text("DETALLES DE LA OPERACIÓN:", 120, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${datos.cliente.nombre} ${datos.cliente.apellido}`, marginX, 67);
      doc.text(`Cédula: ${datos.cliente.cedula}`, marginX, 73);
      doc.text(`Teléfono: ${datos.cliente.telefono || 'N/D'}`, marginX, 79);
      doc.text(`Fecha Emisión: ${formatearFecha(hoyString)}`, 120, 67);
      doc.text(`Inicio Renta: ${formatearFecha(fechas.salida)}`, 120, 73);
      doc.text(`Fin Renta: ${formatearFecha(fechas.entrega)}`, 120, 79);
      doc.text(`Atendido por: ${userFullname}`, 120, 85);

      const rows = datos.vehiculos.map(v => [
        v.nombre, 
        v.placa, 
        v.dias, 
        formatUSD(parseFloat(v.subtotal) / v.dias), 
        formatUSD(v.subtotal)
      ]);

      autoTable(doc, {
        startY: 95,
        head: [["DESCRIPCIÓN UNIDAD", "PLACA", "DÍAS", "TARIFA / DÍA", "SUBTOTAL"]],
        body: rows,
        headStyles: { fillColor: colorOscuro, textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 65 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' }, 
            4: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [248, 246, 242] }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setDrawColor(...colorDorado);
      doc.setLineWidth(0.5);
      doc.rect(125, finalY, 70, 22); 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL A PAGAR:", 130, finalY + 9);
      doc.setFontSize(16); 
      doc.setTextColor(...colorOscuro);
      doc.text(formatUSD(datos.total), 130, finalY + 17);

      doc.setTextColor(100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TÉRMINOS Y CONDICIONES DEL CONTRATO:", marginX, finalY + 40);
      doc.setFont("helvetica", "normal");
      const clausulas = [
        "1. El vehículo debe ser entregado en las mismas condiciones mecánicas, estéticas y de limpieza.",
        "2. El retraso en la entrega generará penalidades automáticas según la tarifa de feriado vigente.",
        "3. El arrendatario es responsable de cualquier infracción de tránsito durante el periodo de renta.",
        "4. Queda terminantemente prohibido fumar dentro de la unidad o transportar sustancias ilícitas."
      ];
      clausulas.forEach((c, index) => {
        doc.text(c, marginX, finalY + 48 + (index * 7)); 
      });

      doc.setDrawColor(...colorDorado);
      doc.line(marginX, 255, 85, 255); 
      doc.line(125, 255, 195, 255); 
      doc.setFontSize(9);
      doc.setTextColor(...colorOscuro);
      doc.text("FIRMA DEL ARRENDATARIO", marginX + 12, 262);
      doc.text("AUTORIZADO POR KRM RENT CAR", 132, 262);

      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Documento generado automáticamente por KRM Rent Car - Emisión: ${emisionNow}`, 105, 282, { align: "center" });
      doc.text("Este comprobante es una constancia de operación interna. Reservados todos los derechos KRM Rent Car.", 105, 287, { align: "center" });

      doc.save(`Contrato_Alquiler_KR_${reservaId}.pdf`);
    } catch (e) {
      console.error("Error al generar el PDF del contrato:", e);
    }
  };

  const cargarDatosIniciales = useCallback(async () => {
    if (!token) return;
    try {
      const [resC, resF, resA] = await Promise.all([
        axios.get('http://localhost:3000/api/clientes?soloActivos=true', getConfig()),
        axios.get('http://localhost:3000/api/feriados', getConfig()),
        axios.get('http://localhost:3000/api/alquileres', getConfig()) 
      ]);
      setListaClientes(resC.data);
      setFeriados(resF.data.map(f => f.fecha));
      setAlquileresActivos(resA.data.filter(a => a.estado === 'ACTIVO'));
    } catch(e) { console.error("Error carga:", e); }
  }, [token]);

  useEffect(() => { cargarDatosIniciales(); }, [cargarDatosIniciales]);

  useEffect(() => {
    if (step === 2 && token) {
      axios.get('http://localhost:3000/api/vehiculos', getConfig())
        .then(res => setListaVehiculos(res.data))
        .catch(err => console.error("Error flota:", err));
    }
  }, [step, token]);

  const agregarAlContrato = (v) => {
    if (!fechas.entrega) return;
    if (carrito.some(item => item.vehiculo_id === v.vehiculo_id)) return;
    const inicio = new Date(fechas.salida + 'T00:00:00');
    const fin = new Date(fechas.entrega + 'T00:00:00');
    let total = 0; let dias = 0;
    for (let d = new Date(inicio); d < fin; d.setDate(d.getDate() + 1)) {
      dias++;
      const fStr = d.toISOString().split('T')[0];
      if (feriados.includes(fStr)) total += parseFloat(v.precios.feriado);
      else if (d.getDay() === 0 || d.getDay() === 6) total += parseFloat(v.precios.finSemana);
      else total += parseFloat(v.precios.normal);
    }
    setCarrito([...carrito, { vehiculo_id: v.vehiculo_id, nombre: `${v.marca} ${v.modelo}`, placa: v.placa, dias, subtotal: total }]);
  };

  const totalGeneral = carrito.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/alquileres', {
        cliente_id: selectedCliente.cliente_id,
        vehiculos: carrito.map(v => ({ ...v, fecha_salida: fechas.salida, fecha_regreso: fechas.entrega })),
        monto_total: totalGeneral
      }, getConfig());
      const resId = res.data.alquiler_id;
      generarPDF(resId, { cliente: selectedCliente, vehiculos: carrito, total: totalGeneral });
      uiFeedback.success(`Contrato KR-${resId} registrado correctamente.`);
      window.location.reload();
    } catch (err) {
      uiFeedback.error("Error al procesar el contrato: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const handleCancelarFolio = async (id) => {
    if (!motivoCancelacion.trim()) return uiFeedback.warning("Indique el motivo.");
    const confirmed = await uiFeedback.confirm({
      title: 'Anular contrato',
      message: 'Seguro que desea ANULAR este contrato?',
      confirmText: 'Anular',
      tone: 'danger'
    });
    if (!confirmed) return;
    setLoading(true);
    try {
        await axios.post('http://localhost:3000/api/alquileres/cancelar', { alquiler_id: id, motivo: motivoCancelacion }, getConfig());
        uiFeedback.success("Contrato anulado correctamente.");
        window.location.reload();
    } catch (e) { 
      console.error("Error cancelar:", e);
      uiFeedback.error("Error al cancelar."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 space-y-6 font-inter text-[#2F2923] animate-in fade-in duration-500 text-left">
      
      {/* HEADER DINÁMICO */}
      <div className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-500 ${step === 4 ? 'bg-[#1A1814] border-red-900/40 shadow-2xl' : 'bg-[#FCFAF5] border-[#D7CCBC]/60 shadow-sm'}`}>
        <div className="flex items-center gap-6">
          {step === 4 ? (
            <div className="flex items-center gap-3 animate-in slide-in-from-left-4">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20"><ShieldAlert size={22} /></div>
              <div>
                <h2 className="text-white font-black uppercase tracking-tighter leading-none font-sora">Módulo de Seguridad</h2>
                <p className="text-red-500/80 text-[9px] font-bold uppercase mt-1 tracking-widest">Restricción y Anulación de Folios</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-8 transition-opacity duration-300">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex items-center gap-2 ${step < s ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold ${step === s ? 'bg-[#C6A243] text-white shadow-md' : 'bg-[#F4EFE6] text-[#93887C]'}`}>{s}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{s===1?'Cliente':s===2?'Vehículos':'Resumen'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={() => setStep(step === 4 ? 1 : 4)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${step === 4 ? 'bg-white text-black border-white hover:bg-gray-200' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}`}>
          {step === 4 ? <RotateCcw size={16}/> : <Ban size={16}/>}
          {step === 4 ? "Volver a Rentas" : "Gestión de Anulaciones"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO */}
        <div className={`col-span-8 p-8 pb-24 rounded-[2rem] border shadow-sm relative min-h-[550px] transition-all duration-700 ${step === 4 ? 'bg-[#1A1814] border-red-900/20 shadow-inner' : 'bg-[#FCFAF5] border-[#D7CCBC]/80'}`}>
          
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase italic border-b pb-2 font-sora text-[#2F2923]">1. Selección de Titular</h3>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93887C]" size={16} />
                <input placeholder="Buscar por nombre o cédula..." className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-3 pl-10 text-sm outline-none focus:border-[#C6A243] transition-all" onChange={e=>setBusqueda(e.target.value)} />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {listaClientes.filter(c => `${c.nombre} ${c.cedula}`.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
                  <div key={c.cliente_id} onClick={()=>setSelectedCliente(c)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCliente?.cliente_id === c.cliente_id ? 'border-[#C6A243] bg-[#C6A243]/5' : 'bg-white border-[#D7CCBC]/30 hover:bg-[#F9F7F2]'}`}>
                    <div className="flex justify-between items-center uppercase font-bold text-sm">
                      <span>{c.nombre} {c.apellido}</span>
                      <span className="text-[10px] font-mono text-[#93887C]">{c.cedula}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase italic border-b pb-2 font-sora text-[#2F2923]">2. Configuración de Flota</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F1EADF] rounded-2xl border border-[#D7CCBC]">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#93887C] uppercase ml-1">Fecha Salida</label>
                  <input type="date" min={hoyString} className="w-full bg-white border border-[#D7CCBC] rounded-lg p-2 text-sm outline-none" value={fechas.salida} onChange={e=>setFechas({...fechas, salida:e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#93887C] uppercase ml-1">Fecha Entrega</label>
                  <input type="date" min={fechas.salida || hoyString} className="w-full bg-white border border-[#D7CCBC] rounded-lg p-2 text-sm outline-none" value={fechas.entrega} onChange={e=>setFechas({...fechas, entrega:e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 max-h-[30rem] overflow-y-auto pr-2 custom-scrollbar xl:grid-cols-2">
                {listaVehiculos.filter(v=>v.estado).map(v => {
                  const yaEn = carrito.some(i => i.vehiculo_id === v.vehiculo_id);
                  const estadoVisual = obtenerEtiquetaEstadoVehiculo(v);
                  const imagenVehiculo = obtenerImagenVehiculo(v);
                  return (
                    <div
                      key={v.vehiculo_id}
                      className={`overflow-hidden rounded-[1.8rem] border bg-white transition-all ${
                        yaEn
                          ? 'opacity-45 border-[#D7CCBC]/50'
                          : 'border-[#D7CCBC]/70 shadow-[0_14px_40px_rgba(47,41,35,0.08)] hover:-translate-y-1 hover:border-[#C6A243]'
                      }`}
                    >
                      <div className="relative h-40 overflow-hidden border-b border-[#D7CCBC]/40 bg-gradient-to-br from-[#F4EFE6] via-[#FBF8F2] to-[#E9DFD1]">
                        {imagenVehiculo ? (
                          <img
                            src={imagenVehiculo}
                            alt={`${v.marca} ${v.modelo}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${imagenVehiculo ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(198,162,67,0.22),_transparent_55%)]`}>
                          <div className="flex flex-col items-center gap-2 text-[#A28C66]">
                            <Car size={32} strokeWidth={1.8} />
                            <span className="text-[10px] font-black uppercase tracking-[0.22em]">Sin foto</span>
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2F2923]/70 via-[#2F2923]/20 to-transparent px-4 pb-4 pt-8">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/20 bg-white/16 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                              {v.tipo || 'Unidad'}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] backdrop-blur-sm ${estadoVisual.className}`}>
                              {estadoVisual.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-sora text-[20px] font-black uppercase italic leading-none text-[#2F2923]">
                              {v.marca} {v.modelo}
                            </p>
                            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#93887C]">
                              Placa {v.placa} {v.gama ? `• ${v.gama}` : ''}
                            </p>
                          </div>
                          <button
                            disabled={!fechas.entrega || yaEn}
                            onClick={()=>agregarAlContrato(v)}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
                              yaEn
                                ? 'bg-[#E8E1D6] text-[#93887C]'
                                : 'bg-[#6F9B74] text-white shadow-lg shadow-[#6F9B74]/20 hover:scale-105'
                            }`}
                          >
                            {yaEn ? <CheckCircle size={20}/> : <PlusCircle size={20}/>}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-2xl border border-[#D7CCBC]/50 bg-[#FCFAF5] px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#93887C]">Normal</p>
                            <p className="mt-1 text-[15px] font-black text-[#2F2923]">{formatUSD(v.precios.normal)}</p>
                          </div>
                          <div className="rounded-2xl border border-[#C6A243]/20 bg-[#C6A243]/8 px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#93887C]">Fin sem.</p>
                            <p className="mt-1 text-[15px] font-black text-[#C6A243]">{formatUSD(v.precios.finSemana)}</p>
                          </div>
                          <div className="rounded-2xl border border-[#C97B6A]/20 bg-[#C97B6A]/8 px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#93887C]">Feriado</p>
                            <p className="mt-1 text-[15px] font-black text-[#C97B6A]">{formatUSD(v.precios.feriado)}</p>
                          </div>
                        </div>

                        {!fechas.entrega && (
                          <div className="rounded-2xl border border-dashed border-[#D7CCBC] bg-[#F8F3EA] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#93887C]">
                            Selecciona las fechas para habilitar la unidad.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b pb-2">
                <Receipt size={22} className="text-[#C6A243]"/>
                <h3 className="text-xl font-bold uppercase italic font-sora text-[#2F2923]">3. Verificación Contractual</h3>
              </div>
              <div className="border border-[#D7CCBC] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-[#F1EADF] font-black uppercase text-[#93887C] tracking-widest">
                    <tr><th className="p-4 text-left">Unidad</th><th className="p-4 text-center">Días</th><th className="p-4 text-right">Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {carrito.map((it, i) => (
                      <tr key={i} className="bg-white border-b border-[#D7CCBC]/30">
                        <td className="p-4 font-bold uppercase">{it.nombre} <br/> <span className="text-[#C6A243] font-black">{it.placa}</span></td>
                        <td className="p-4 text-center font-bold font-mono">{it.dias}</td>
                        <td className="p-4 text-right font-black text-sm text-[#2F2923]">{formatUSD(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleFinalizar} disabled={loading || carrito.length === 0} className="w-full py-5 bg-[#2F2923] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : 'FINALIZAR CONTRATO'}
              </button>
            </div>
          )}

          {/* MODO ANULACIÓN */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-500 text-left">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-2xl font-black uppercase italic font-sora text-white flex items-center gap-3">
                    <XCircle size={28} className="text-red-600 animate-pulse"/> Gestión de <span className="text-red-600">Anulaciones</span>
                  </h3>
               </div>
               <div className="bg-red-950/20 p-5 rounded-2xl border border-red-900/30 flex items-start gap-4">
                  <AlertCircle className="text-red-600 shrink-0 mt-1" size={22}/>
                  <p className="text-[10px] font-bold text-gray-300 uppercase leading-relaxed tracking-wider">Atención: Esta acción es irreversible. Se liberará la unidad y se anulará el balance.</p>
               </div>
               <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar-dark pr-2">
                  {alquileresActivos.length > 0 ? alquileresActivos.map(a => (
                    <div key={a.alquiler_id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-all">
                      <div className="text-left">
                        <p className="text-[14px] font-black uppercase text-white tracking-tighter">KR-0{a.alquiler_id} | {a.Cliente?.nombre}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Monto: {formatUSD(a.monto_total)}</p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input placeholder="Motivo..." className="bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:border-red-600 w-64" onChange={e => setMotivoCancelacion(e.target.value)}/>
                        <button onClick={() => handleCancelarFolio(a.alquiler_id)} className="bg-red-600 text-white p-3.5 rounded-2xl hover:bg-red-700 active:scale-90"><Ban size={20} strokeWidth={3}/></button>
                      </div>
                    </div>
                  )) : <div className="text-center py-24 text-white/10 italic font-black uppercase">No hay actividad para anular</div>}
               </div>
            </div>
          )}

          {step > 1 && step < 4 && (
            <button
              onClick={()=>setStep(step-1)}
              className="absolute bottom-8 left-8 z-10 inline-flex items-center gap-2 rounded-full border border-[#D7CCBC]/70 bg-white/96 px-4 py-2 text-[#7F7467] font-black text-[10px] uppercase shadow-sm transition-all hover:-translate-x-0.5 hover:border-[#C6A243] hover:text-[#2F2923]"
            >
              <ArrowLeft size={16}/>
              REGRESAR
            </button>
          )}
        </div>

        {/* SIDEBAR DERECHO */}
        <div className="col-span-4 transition-all duration-500">
          <div className={`p-7 rounded-[2.5rem] border shadow-sm sticky top-4 space-y-6 min-h-[400px] transition-all duration-700 ${step === 4 ? 'bg-[#12110F] border-red-900/20' : 'bg-[#F1EADF] border-[#D7CCBC]'}`}>
             {step === 4 ? (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-10">
                  <ShieldAlert size={48} className="text-red-900/30" />
                  <p className="text-[9px] font-black text-red-900/60 uppercase tracking-[0.3em] leading-relaxed">SEGURIDAD ACTIVA</p>
                  <p className="text-[8px] font-bold text-gray-700 uppercase italic">Operaciones de venta suspendidas.</p>
               </div>
             ) : (
               <div className="animate-in fade-in">
                  <h4 className="text-[10px] font-black uppercase border-b border-[#D7CCBC]/60 pb-3 flex items-center gap-2 tracking-widest text-[#2F2923]">
                    <Calculator size={14} className="text-[#C6A243]"/> Resumen Operativo
                  </h4>
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold uppercase text-[9px] text-[#93887C]">Titular:</span>
                      <span className="font-bold uppercase truncate max-w-[150px] text-[#2F2923]">{selectedCliente?.nombre || '--'}</span>
                    </div>
                    <div className="border-t border-[#D7CCBC]/50 pt-4 space-y-3 max-h-40 overflow-y-auto">
                      {carrito.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-white/50 p-2.5 rounded-xl border border-[#D7CCBC]/20">
                          <span className="font-bold uppercase truncate max-w-[130px]">{it.nombre}</span>
                          <Trash2 size={13} className="text-red-400 cursor-pointer" onClick={()=>setCarrito(carrito.filter((_,i)=>i!==idx))} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-end border-t border-[#D7CCBC] pt-5">
                       <span className="text-[10px] font-black uppercase text-[#93887C]">Total:</span>
                       <span className="text-2xl font-black italic tracking-tighter text-[#C6A243]">{formatUSD(totalGeneral)}</span>
                    </div>
                    {step < 3 && (
                      <button disabled={(!selectedCliente && step === 1) || loading} onClick={()=>setStep(step+1)} className="w-full mt-4 py-4 bg-[#C6A243] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md hover:bg-[#B58E35] transition-all">Continuar</button>
                    )}
                  </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Alquileres;
