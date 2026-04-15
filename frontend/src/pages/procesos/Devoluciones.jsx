import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Loader2, History, Fuel, X, Trash2, User, Car
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';
import { formatUSD } from '../../utils/currency';

const Devoluciones = () => {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [showModalPenalidad, setShowModalPenalidad] = useState(false);
  const [form, setForm] = useState({ combustible: 100, kilometraje: '', danos: 'Sin novedades.' });
  const [listaPenalidades, setListaPenalidades] = useState([]);
  const [nuevaPenalidad, setNuevaPenalidad] = useState({ tipo: 'DANO', monto: '', descripcion: '' });

  const token = localStorage.getItem('token');
  const userFullname = localStorage.getItem('user_fullname') || 'Agente Operativo KRM';
  const getConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClientes(busqueda);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [busqueda]);

  const fetchClientes = async (query) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/devoluciones/clientes?busqueda=${query}`, getConfig());
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setVehiculoSeleccionado(null);
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/devoluciones/vehiculos/${cliente.cliente_id}`, getConfig());
      setVehiculos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generarActaPDF = (datos) => {
    try {
      const doc = new jsPDF();
      const colorDorado = [198, 162, 67];
      const colorOscuro = [47, 41, 35];
      const marginX = 15;
      const emisionNow = new Date().toLocaleString('es-DO');

      doc.setFillColor(...colorOscuro);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.text('KRM RENT CAR', marginX, 22);
      doc.setFontSize(9);
      doc.text('RECEPCION TECNICA Y LIBERACION DE UNIDAD', marginX, 30);
      doc.text(`EMISION: ${emisionNow}`, marginX, 35);

      doc.setFillColor(...colorDorado);
      doc.rect(140, 15, 55, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('ID RECEPCION', 145, 21);
      doc.setFontSize(18);
      doc.text(`KR-DEV-${datos.devolucion_id}`, 145, 31);

      doc.setTextColor(...colorOscuro);
      doc.setFontSize(10);
      doc.text('DATOS DEL ARRENDATARIO:', marginX, 60);
      doc.text('DETALLES DEL RETORNO:', 110, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`, marginX, 67);
      doc.text(`Cedula: ${clienteSeleccionado.cedula}`, marginX, 73);
      doc.text(`Vehiculo: ${datos.vehiculo.marca} ${datos.vehiculo.modelo}`, 110, 67);
      doc.text(`Placa: ${datos.vehiculo.placa}`, 110, 73);
      doc.text(`Atendido por: ${userFullname}`, 110, 79);

      const totalP = listaPenalidades.reduce((acc, p) => acc + parseFloat(p.monto), 0);
      autoTable(doc, {
        startY: 95,
        head: [['PUNTO DE INSPECCION', 'VALOR REGISTRADO']],
        body: [
          ['ODOMETRO', `${datos.inspeccion.kilometraje} KM`],
          ['COMBUSTIBLE', `${datos.inspeccion.combustible}%`],
          ['OBSERVACIONES', datos.inspeccion.danos.toUpperCase()],
          ['TOTAL CARGOS EXTRAS', formatUSD(totalP)]
        ],
        headStyles: { fillColor: colorOscuro },
        theme: 'grid'
      });

      if (listaPenalidades.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['TIPO CARGO', 'DESCRIPCION', 'MONTO']],
          body: listaPenalidades.map((p) => [p.tipo, p.descripcion, formatUSD(p.monto)]),
          headStyles: { fillColor: [200, 200, 200], textColor: 0 }
        });
      }

      const finalY = 250;
      doc.line(marginX, finalY, 85, finalY);
      doc.line(125, finalY, 195, finalY);
      doc.text('FIRMA CLIENTE', marginX + 15, finalY + 7);
      doc.text('REVISADO KRM', 145, finalY + 7);
      doc.save(`Acta_Recepcion_KR_${datos.devolucion_id}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const agregarPenalidadLista = () => {
    if (!nuevaPenalidad.monto || !nuevaPenalidad.descripcion) {
      return uiFeedback.warning('Complete los campos.');
    }

    setListaPenalidades([...listaPenalidades, { ...nuevaPenalidad, idTemp: Date.now() }]);
    setNuevaPenalidad({ tipo: 'DANO', monto: '', descripcion: '' });
    setShowModalPenalidad(false);
    uiFeedback.success('Cargo agregado correctamente.');
  };

  const confirmarDevolucion = async () => {
    if (!vehiculoSeleccionado?.puede_devolver) {
      return uiFeedback.warning(`Debe saldar primero ${formatUSD(vehiculoSeleccionado?.saldo_pendiente || 0)} para devolver esta unidad.`);
    }

    if (!form.kilometraje) {
      return uiFeedback.warning('Indique el kilometraje.');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        alquiler_id: vehiculoSeleccionado.alquiler_id,
        detalle_alquiler_id: vehiculoSeleccionado.detalle_alquiler_id,
        vehiculo_id: vehiculoSeleccionado.vehiculo_id,
        penalidades: listaPenalidades
      };

      const response = await axios.post('http://localhost:3000/api/devoluciones/confirmar', payload, getConfig());
      generarActaPDF({
        ...vehiculoSeleccionado,
        devolucion_id: response.data?.devolucion_id,
        inspeccion: form
      });
      uiFeedback.success('Recepcion finalizada correctamente.');
      window.location.reload();
    } catch (err) {
      uiFeedback.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarAlertaRetraso = () => {
    if (!vehiculoSeleccionado) return false;
    const fFin = new Date(vehiculoSeleccionado.fecha_fin);
    const hoy = new Date();
    const valorHoy = (hoy.getFullYear() * 10000) + ((hoy.getMonth() + 1) * 100) + hoy.getDate();
    const valorPactado = (fFin.getUTCFullYear() * 10000) + ((fFin.getUTCMonth() + 1) * 100) + fFin.getUTCDate();
    return valorHoy > valorPactado;
  };

  const vehiculoPuedeDevolverse = vehiculoSeleccionado?.puede_devolver ?? false;

  return (
    <div className="p-6 space-y-6 text-[#2F2923] text-left font-inter">
      <h2 className="text-3xl font-black uppercase italic tracking-tighter">SISTEMA DE <span className="text-[#C6A243]">DEVOLUCIONES</span></h2>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4 space-y-6">
          <div className="bg-[#FCFAF5] p-6 rounded-3xl border border-[#D7CCBC] shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-[#93887C]" size={18} />
              <input
                placeholder="Cedula o Placa..."
                className="w-full pl-10 p-3 bg-[#F6F3EC] border rounded-xl font-bold outline-none focus:border-[#C6A243]"
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {clientes.map((c) => (
                <button
                  key={c.cliente_id}
                  onClick={() => seleccionarCliente(c)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${clienteSeleccionado?.cliente_id === c.cliente_id ? 'bg-[#C6A243] text-white border-[#C6A243]' : 'bg-white hover:bg-[#F9F7F2]'}`}
                >
                  <User size={18} />
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-[11px]">{c.nombre} {c.apellido}</span>
                    <span className="text-[9px] font-mono opacity-80">{c.cedula}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {clienteSeleccionado && (
            <div className="bg-[#F1EADF] p-6 rounded-3xl border border-[#D7CCBC] space-y-3 animate-in slide-in-from-left">
              <h4 className="text-[11px] font-black uppercase text-[#C6A243] flex items-center gap-2"><Car size={14} /> Unidades en Posesion</h4>
              {vehiculos.map((v) => (
                <button
                  key={v.detalle_alquiler_id}
                  onClick={() => setVehiculoSeleccionado(v)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${vehiculoSeleccionado?.detalle_alquiler_id === v.detalle_alquiler_id ? 'bg-[#2F2923] text-white' : 'bg-white hover:border-[#C6A243]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-xs uppercase">{v.vehiculo.marca} {v.vehiculo.modelo}</p>
                      <p className="text-[10px] font-mono opacity-70 uppercase font-bold">PLACA: {v.vehiculo.placa}</p>
                    </div>
                    <span className={`text-[8px] px-2 py-1 rounded-full border font-black uppercase whitespace-nowrap ${v.puede_devolver ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {v.puede_devolver ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  {!v.puede_devolver && (
                    <p className="mt-2 text-[9px] font-black uppercase text-[#C97B6A]">
                      Saldo pendiente: {formatUSD(v.saldo_pendiente || 0)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-8 bg-[#FCFAF5] p-10 rounded-[2.5rem] border border-[#D7CCBC] min-h-[500px] shadow-sm relative text-left">
          {vehiculoSeleccionado ? (
            <div className="space-y-8 animate-in fade-in">
              {!vehiculoPuedeDevolverse && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
                  <p className="text-[10px] font-black uppercase tracking-widest">Pago pendiente</p>
                  <p className="text-sm font-bold mt-1">
                    Este vehiculo no puede devolverse todavia. Falta pagar {formatUSD(vehiculoSeleccionado?.saldo_pendiente || 0)} del alquiler.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-3xl border border-[#D7CCBC]/30 text-left">
                  <p className="text-[10px] font-black text-[#93887C] mb-1 uppercase text-left">Kilometraje</p>
                  <input
                    type="number"
                    value={form.kilometraje}
                    onChange={(e) => setForm({ ...form, kilometraje: e.target.value })}
                    className="w-full text-xl font-black outline-none text-left"
                  />
                </div>
                <div className="p-6 bg-white rounded-3xl border border-[#D7CCBC]/30 text-left">
                  <p className="text-[10px] font-black text-[#93887C] mb-1 uppercase text-left">Combustible: {form.combustible}%</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.combustible}
                    onChange={(e) => setForm({ ...form, combustible: e.target.value })}
                    className="w-full accent-[#C6A243]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {parseInt(form.combustible, 10) < 25 && !listaPenalidades.some((p) => p.tipo === 'COMBUSTIBLE') && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 font-black text-[10px] uppercase animate-pulse">
                    <Fuel size={16} /> Cargo por combustible bajo requerido
                  </div>
                )}
                {mostrarAlertaRetraso() && !listaPenalidades.some((p) => p.tipo === 'RETRASO') && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 font-black text-[10px] uppercase animate-pulse">
                    <History size={16} /> Cargo por entrega tardia requerido
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase text-[#93887C]">Cargos Adicionales:</h5>
                  <button onClick={() => setShowModalPenalidad(true)} className="text-[10px] font-black text-[#C6A243] hover:underline"> + AGREGAR CARGO</button>
                </div>
                <div className="space-y-2">
                  {listaPenalidades.map((p) => (
                    <div key={p.idTemp} className="flex justify-between bg-white p-4 rounded-2xl border border-[#D7CCBC]/30 items-center">
                      <span className="text-[10px] font-black uppercase">{p.tipo}: {p.descripcion}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-[#C6A243]">{formatUSD(p.monto)}</span>
                        <Trash2 size={16} className="text-red-400 cursor-pointer" onClick={() => setListaPenalidades(listaPenalidades.filter((x) => x.idTemp !== p.idTemp))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Observaciones fisicas del vehiculo..."
                value={form.danos}
                onChange={(e) => setForm({ ...form, danos: e.target.value })}
                className="w-full p-4 bg-white border rounded-2xl text-xs h-24 resize-none"
              />

              <button
                onClick={confirmarDevolucion}
                disabled={!vehiculoPuedeDevolverse || loading}
                className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl ${!vehiculoPuedeDevolverse || loading ? 'bg-[#93887C] text-white cursor-not-allowed' : 'bg-[#2F2923] text-white hover:bg-black'}`}
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'CONFIRMAR RECEPCION'}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <History size={100} className="mb-4 animate-pulse" />
              <p className="font-black uppercase tracking-[0.4em] text-sm">Seleccione cliente y unidad</p>
            </div>
          )}
        </div>
      </div>

      {showModalPenalidad && (
        <div className="fixed inset-0 bg-[#2F2923]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase italic text-[#2F2923]">Adjuntar Cargo</h3>
              <button onClick={() => setShowModalPenalidad(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <select
                value={nuevaPenalidad.tipo}
                onChange={(e) => setNuevaPenalidad({ ...nuevaPenalidad, tipo: e.target.value })}
                className="w-full p-4 bg-[#F6F3EC] border rounded-2xl font-bold"
              >
                <option value="DANO">DANOS / CARROCERIA</option>
                <option value="COMBUSTIBLE">COMBUSTIBLE BAJO</option>
                <option value="RETRASO">RETRASO</option>
                <option value="OTRO">OTROS</option>
              </select>
              <input
                type="number"
                placeholder="Monto US$"
                value={nuevaPenalidad.monto}
                onChange={(e) => setNuevaPenalidad({ ...nuevaPenalidad, monto: e.target.value })}
                className="w-full p-4 bg-[#F6F3EC] border rounded-2xl font-bold"
              />
              <textarea
                placeholder="Justificacion del cargo..."
                value={nuevaPenalidad.descripcion}
                onChange={(e) => setNuevaPenalidad({ ...nuevaPenalidad, descripcion: e.target.value })}
                className="w-full p-4 bg-[#F6F3EC] border rounded-2xl text-sm h-24 resize-none"
              />
              <button onClick={agregarPenalidadLista} className="w-full py-4 bg-[#C6A243] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#2F2923]">ADJUNTAR CARGO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devoluciones;
