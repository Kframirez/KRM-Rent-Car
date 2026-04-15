import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, DollarSign, Receipt, Trash2, PlusCircle, 
  Loader2, Clock, History, Car, CheckCircle, Ban, AlertCircle, Info 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';
import { formatUSD } from '../../utils/currency';

const Pagos = () => {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [deudas, setDeudas] = useState({ alquileres: [], penalidades: [] });
  const [carritoPago, setCarritoPago] = useState([]);
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [loading, setLoading] = useState(false);
  
  // Control individual de cada cargo (monto a pagar y si es abono o completo)
  const [configCargos, setConfigCargos] = useState({});

  const token = localStorage.getItem('token');
  const userFullname = localStorage.getItem('user_fullname') || 'Cajero Operativo KRM';
  const configHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get('http://localhost:3000/api/clientes?soloActivos=true', configHeader)
      .then(res => setClientes(res.data))
      .catch(console.error);
  }, []);

  const generarPDFRecibo = (pagoId, datos) => {
    try {
      const doc = new jsPDF();
      const colorDorado = [198, 162, 67]; 
      const colorOscuro = [47, 41, 35];
      const marginX = 15;
      const emisionNow = new Date().toLocaleString('es-DO');

      // --- ENCABEZADO ---
      doc.setFillColor(...colorOscuro);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("KRM RENT CAR", marginX, 22);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("RECIBO OFICIAL DE COBRO / CAJA", marginX, 30);
      doc.text("SANTIAGO, REPÚBLICA DOMINICANA", marginX, 35);
      
      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("NÚMERO DE RECIBO", 145, 21);
      doc.setFontSize(16); 
      doc.text(`PAG-${pagoId}`, 145, 31);

      // --- DATOS DEL CLIENTE Y CAJERO ---
      doc.setTextColor(...colorOscuro);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("TITULAR DEL PAGO:", marginX, 60);
      doc.text("DETALLES DEL MOVIMIENTO:", 120, 60);
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${datos.cliente.nombre} ${datos.cliente.apellido}`, marginX, 67);
      doc.text(`Cédula: ${datos.cliente.cedula}`, marginX, 73);
      doc.text(`Fecha/Hora: ${emisionNow}`, 120, 67);
      doc.text(`Método de Pago: ${datos.metodo}`, 120, 73);
      doc.text(`Atendido por: ${userFullname}`, 120, 79);

      // --- TABLA DE CARGOS ---
      // Aquí especificamos: Concepto, Modalidad, Deuda Anterior, Lo Pagado y Lo que queda debiendo
      const rows = datos.cargos.map(c => [
        c.descripcion.toUpperCase(),
        c.modo_pdf, 
        formatUSD(c.deuda_anterior),
        formatUSD(c.monto),
        formatUSD(c.deuda_anterior - c.monto)
      ]);

      autoTable(doc, {
        startY: 90,
        head: [["DESCRIPCIÓN", "MODALIDAD", "DEUDA PREVIA", "PAGO", "SALDO REST."]],
        body: rows,
        headStyles: { fillColor: colorOscuro, textColor: 255, halign: 'center', fontStyle: 'bold' },
        styles: { font: "helvetica", fontSize: 8, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { halign: 'center', cellWidth: 35 },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [248, 246, 242] }
      });

      // --- TOTAL FINAL ---
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setDrawColor(...colorDorado);
      doc.setLineWidth(0.5);
      doc.rect(125, finalY, 70, 20); 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL RECIBIDO:", 130, finalY + 8);
      doc.setFontSize(16); 
      doc.setTextColor(...colorOscuro);
      doc.text(formatUSD(datos.total), 130, finalY + 16);

      // --- PIE DE PÁGINA ---
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Este recibo es un comprobante legal de la transacción realizada.", 105, 280, { align: "center" });
      doc.text("Gracias por confiar en KRM Rent Car.", 105, 285, { align: "center" });

      doc.save(`Recibo_KRM_PAG_${pagoId}.pdf`);
    } catch (e) {
      console.error("Error al generar PDF:", e);
    }
  };

  const buscarDeudas = async (cliente) => {
    setSelectedCliente(cliente);
    setCarritoPago([]);
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/pagos/pendientes/${cliente.cliente_id}`, configHeader);
      setDeudas(res.data);
      
      const iniciales = {};
      // Los alquileres inician en COMPLETO pero permiten ABONO
      res.data.alquileres.forEach(a => {
        iniciales[`ALQUILER-${a.detalle_alquiler_id}`] = { monto: a.monto_total, modo: 'COMPLETO' };
      });
      // Las penalidades inician en COMPLETO y NO permiten ABONO
      res.data.penalidades.forEach(p => {
        iniciales[`PENALIDAD-${p.penalidad_id}`] = { monto: p.monto, modo: 'COMPLETO' };
      });
      setConfigCargos(iniciales);
    } catch (e) {
      console.error(e);
      setDeudas({ alquileres: [], penalidades: [] });
    } finally { setLoading(false); }
  };

  const agregarAlRecibo = (item, tipo) => {
    const idRef = tipo === 'ALQUILER' ? item.detalle_alquiler_id : item.penalidad_id;
    const idUnico = `${tipo}-${idRef}`;
    const conf = configCargos[idUnico];
    const deudaActual = item.monto_total || item.monto;

    const montoFinal = parseFloat(conf.monto);

    if (isNaN(montoFinal) || montoFinal <= 0) return uiFeedback.warning("Ingrese un monto válido.");
    if (montoFinal > deudaActual) return uiFeedback.warning("El monto no puede ser mayor a la deuda.");
    
    // Si es multa y el monto no es el total, rechazar (segunda validación por seguridad)
    if (tipo === 'PENALIDAD' && montoFinal < deudaActual) {
        return uiFeedback.warning("Las penalidades deben pagarse en su totalidad.");
    }

    if (carritoPago.find(x => x.key === idUnico)) return;
    if (carritoPago.length > 0 && carritoPago[0].alquiler_id !== item.alquiler_id) {
      return uiFeedback.warning("Debe liquidar cargos de un mismo contrato a la vez.");
    }

    setCarritoPago([...carritoPago, {
      key: idUnico,
      alquiler_id: item.alquiler_id,
      id: idRef,
      tipo,
      descripcion: tipo === 'ALQUILER' ? `Renta: ${item.vehiculo}` : `Multa: ${item.tipo}`,
      monto: montoFinal,
      deuda_anterior: deudaActual,
      modo_pdf: conf.modo === 'COMPLETO' ? 'PAGO COMPLETO' : 'ABONO PARCIAL'
    }]);
  };

  const totalRecibo = carritoPago.reduce((acc, curr) => acc + curr.monto, 0);

  const procesarPago = async () => {
    if (carritoPago.length === 0) return uiFeedback.warning("Seleccione cargos.");
    setLoading(true);
    try {
      const payload = {
        alquiler_id: carritoPago[0].alquiler_id,
        cargos: carritoPago.map(c => ({ id: c.id, tipo: c.tipo, monto: c.monto })),
        metodo, 
        total: totalRecibo
      };
      
      const res = await axios.post('http://localhost:3000/api/pagos/registrar', payload, configHeader);
      
      generarPDFRecibo(res.data.pago_id, {
        cliente: selectedCliente,
        metodo: metodo,
        total: totalRecibo,
        cargos: carritoPago
      });

      uiFeedback.success(`Transacción PAG-${res.data.pago_id} procesada correctamente.`);
      setSelectedCliente(null);
      setCarritoPago([]);
    } catch (e) { 
      uiFeedback.error(e.response?.data?.error || "Error en el servidor"); 
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 text-[#2F2923] p-4 font-inter animate-in fade-in duration-500 text-left -mt-6">
      {/* HEADER CAJA */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-3">
        <div>
          <h2 className="text-[30px] font-bold uppercase italic leading-none font-sora">
            CAJA <span className="text-[#C6A243]">COBROS</span>
          </h2>
          <p className="text-[9px] font-black text-[#93887C] uppercase tracking-widest mt-0.5">Liquidación de Renta y Multas</p>
        </div>
        <div className="bg-[#FCFAF5] p-2.5 px-6 rounded-2xl flex items-center gap-4 border border-[#D7CCBC] shadow-sm">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-[#93887C]">Monto en Recibo</p>
              <p className="text-[32px] font-black italic text-[#2F2923] leading-none">{formatUSD(totalRecibo)}</p>
            </div>
            <div className="w-12 h-12 bg-[#C6A243] rounded-xl flex items-center justify-center text-white shadow-lg"><DollarSign size={28}/></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 -mt-1">
        {/* COLUMNA BUSQUEDA */}
        <div className="col-span-4 bg-[#FCFAF5] p-5 rounded-[2rem] border border-[#D7CCBC] h-[600px] flex flex-col shadow-sm">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#93887C]" size={16} />
            <input 
              placeholder="Buscar cliente..." 
              className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-3.5 pl-12 text-sm font-bold outline-none focus:border-[#C6A243] transition-all" 
              onChange={e => setBusqueda(e.target.value)} 
            />
          </div>
          <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {clientes.filter(c => `${c.nombre} ${c.apellido} ${c.cedula}`.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
              <div 
                key={c.cliente_id} 
                onClick={() => buscarDeudas(c)} 
                className={`p-5 rounded-[1.8rem] border cursor-pointer transition-all ${selectedCliente?.cliente_id === c.cliente_id ? 'bg-[#2F2923] text-white shadow-lg' : 'bg-white border-[#D7CCBC]/30 hover:border-[#C6A243]'}`}
              >
                <p className="text-[13px] font-black uppercase leading-none">{c.nombre} {c.apellido}</p>
                <p className="text-[10px] opacity-60 font-mono mt-1.5">{c.cedula}</p>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA CARGOS */}
        <div className="col-span-8 space-y-5">
          {selectedCliente ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-[2rem] border border-[#D7CCBC] mb-5 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-[#C6A243] mb-4 flex items-center gap-2 italic tracking-widest leading-none"><Clock size={14}/> Cargos Pendientes</h4>
                
                <div className="space-y-4">
                  {/* UNIFICAMOS RENTAS Y MULTAS PARA EL MAPEO */}
                  {[...deudas.alquileres, ...deudas.penalidades.map(p => ({...p, isPen: true}))].map((item) => {
                    const idKey = item.isPen ? `PENALIDAD-${item.penalidad_id}` : `ALQUILER-${item.detalle_alquiler_id}`;
                    const config = configCargos[idKey] || { modo: 'COMPLETO', monto: 0 };
                    const deudaBase = item.monto_total || item.monto;

                    return (
                      <div key={idKey} className={`p-4 rounded-[1.5rem] border transition-all ${item.isPen ? 'bg-red-50/50 border-red-100' : 'bg-[#F6F3EC] border-[#D7CCBC]/30'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#D7CCBC]/50 shadow-sm">
                                {item.isPen ? <AlertCircle className="text-red-500" size={18}/> : <Car className="text-[#C6A243]" size={18}/>}
                            </div>
                            <div>
                              <p className="text-[12px] font-black uppercase leading-none">{item.vehiculo || `MULTA: ${item.tipo}`}</p>
                              <p className={`text-[10px] font-bold mt-1.5 uppercase ${item.isPen ? 'text-red-600' : 'text-[#93887C]'}`}>Total Deuda: {formatUSD(deudaBase)}</p>
                            </div>
                          </div>
                          
                          {/* SELECTOR EXCLUSIVO */}
                          <div className="flex bg-white p-1 rounded-xl border border-[#D7CCBC]/50 shadow-sm">
                            <button 
                              onClick={() => setConfigCargos({...configCargos, [idKey]: { modo: 'COMPLETO', monto: deudaBase }})}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${config.modo === 'COMPLETO' ? 'bg-[#2F2923] text-white' : 'text-[#93887C] hover:bg-[#F6F3EC]'}`}
                            >COMPLETO</button>
                            
                            {!item.isPen && (
                              <button 
                                onClick={() => setConfigCargos({...configCargos, [idKey]: { ...config, modo: 'ABONO' }})}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${config.modo === 'ABONO' ? 'bg-[#C6A243] text-white' : 'text-[#93887C] hover:bg-[#F6F3EC]'}`}
                              >ABONAR</button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-dashed border-[#D7CCBC]/50">
                          <div className="flex-1 relative">
                            <p className="text-[8px] font-black text-[#93887C] uppercase mb-1 ml-1">Efectivo a cobrar</p>
                            <input 
                              type="number" 
                              disabled={config.modo === 'COMPLETO'}
                              value={config.monto}
                              onChange={(e) => setConfigCargos({...configCargos, [idKey]: { ...config, monto: e.target.value }})}
                              className={`w-full p-2.5 rounded-xl border font-mono font-bold text-sm ${config.modo === 'COMPLETO' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white border-[#C6A243] text-[#2F2923]'}`}
                            />
                            {config.modo === 'COMPLETO' && <Ban size={12} className="absolute right-3 bottom-3.5 text-gray-300"/>}
                          </div>
                          <button 
                            onClick={() => agregarAlRecibo(item, item.isPen ? 'PENALIDAD' : 'ALQUILER')} 
                            className="bg-[#2F2923] text-white h-11 px-5 rounded-xl flex items-center gap-2 hover:bg-[#C6A243] transition-all self-end shadow-md"
                          >
                            <PlusCircle size={18}/>
                            <span className="text-[10px] font-black uppercase">Añadir</span>
                          </button>
                        </div>
                        {item.isPen && <div className="mt-2 flex items-center gap-1.5 text-red-500 font-bold text-[8px] uppercase"><Info size={10}/> Las multas no aceptan pagos parciales</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RESUMEN LIQUIDACIÓN */}
              <div className="bg-[#2F2923] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <h3 className="text-xl font-black italic mb-6 border-b border-white/10 pb-4 uppercase tracking-tighter flex items-center gap-3">
                  <Receipt className="text-[#C6A243]" size={22}/> Liquidación Final
                </h3>
                
                <div className="max-h-[160px] overflow-y-auto mb-8 pr-2 custom-scrollbar-dark text-left">
                  <table className="w-full text-left text-[11px]">
                    <tbody className="divide-y divide-white/5">
                      {carritoPago.map(item => (
                        <tr key={item.key}>
                          <td className="py-4 font-bold uppercase text-white/80">
                            {item.descripcion} 
                            <span className="ml-2 text-[8px] px-2 py-0.5 rounded bg-white/10 text-[#C6A243]">{item.modo_pdf}</span>
                          </td>
                          <td className="py-4 text-right font-black text-[#C6A243] text-[15px]">{formatUSD(item.monto)}</td>
                          <td className="py-4 text-center">
                            <button onClick={() => setCarritoPago(carritoPago.filter(x => x.key !== item.key))} className="text-red-400 hover:text-white transition-colors p-1"><Trash2 size={20}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-[#93887C] uppercase tracking-widest leading-none">Método de Pago</p>
                    <div className="flex gap-2">
                      {["EFECTIVO", "TARJETA", "TRANSFERENCIA"].map(m => (
                        <button 
                          key={m} 
                          onClick={() => setMetodo(m)} 
                          className={`px-5 py-3 rounded-2xl text-[10px] font-black transition-all ${metodo === m ? 'bg-[#C6A243] text-white shadow-lg' : 'bg-white/10 text-white/30 hover:bg-white/15'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-[#93887C] uppercase mb-1 leading-none">Neto a Cobrar</p>
                      <p className="text-[52px] font-black italic text-[#C6A243] tracking-tighter leading-none">{formatUSD(totalRecibo)}</p>
                  </div>
                </div>

                <button 
                  onClick={procesarPago} 
                  disabled={loading || carritoPago.length === 0} 
                  className={`w-full mt-10 py-6 rounded-[1.8rem] font-black uppercase text-[13px] tracking-[0.4em] flex justify-center items-center gap-3 transition-all ${carritoPago.length > 0 ? 'bg-[#6F9B74] text-white hover:bg-[#5e8563] shadow-xl' : 'bg-white/5 text-white/20'}`}
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'FINALIZAR COBRO Y GENERAR COMPROBANTE'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-[#FCFAF5] rounded-[3rem] border border-dashed border-[#D7CCBC] opacity-30">
              <History size={80} className="mb-6 animate-pulse text-[#93887C]"/>
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[#2F2923]">Seleccione un cliente para ver folios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pagos;
