import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Search, Plus, Hash, X, Save, DollarSign,
  Loader2, Car, ChevronDown, Edit2, Camera, Power, Ban
} from 'lucide-react';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';

const Vehiculos = () => {
  const [flota, setFlota] = useState([]);
  const [gamas, setGamas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openGama, setOpenGama] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3000/api/vehiculos';

  const [formData, setFormData] = useState({
    vehiculo_id: null,
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    placa: '',
    gama_id: '',
    tipo: 'Sedán',
    precios: { normal: '', finSemana: '', feriado: '' }
  });

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resFlota, resGamas] = await Promise.all([
        axios.get(API_URL, config),
        axios.get('http://localhost:3000/api/gamas', config)
      ]);
      setFlota(resFlota.data);
      setGamas(resGamas.data.filter((g) => g.estado));
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) fetchData();
    return () => { isMounted = false; };
  }, [fetchData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      precios: { ...prev.precios, [name]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    };

    const data = new FormData();
    data.append('vehiculo_id', formData.vehiculo_id);
    data.append('marca', formData.marca);
    data.append('modelo', formData.modelo);
    data.append('anio', formData.anio);
    data.append('placa', formData.placa);
    data.append('gama_id', formData.gama_id);
    data.append('tipo', formData.tipo);
    data.append('precios', JSON.stringify(formData.precios));

    if (selectedFile) data.append('imagen', selectedFile);

    try {
      await axios.post(API_URL, data, config);
      setShowModal(false);
      fetchData();
      uiFeedback.success(formData.vehiculo_id ? 'Unidad actualizada correctamente.' : 'Unidad registrada correctamente.');
    } catch (err) {
      uiFeedback.error(err.response?.data?.message || 'Error al procesar la unidad');
    }
  };

  const cambiarEstado = async (vehiculo) => {
    if (vehiculo.en_renta) {
      uiFeedback.warning('No se puede cambiar el estado de una unidad que está en renta.');
      return;
    }

    const activar = !vehiculo.estado;
    const confirmed = await uiFeedback.confirm({
      title: activar ? 'Activar unidad' : 'Desactivar unidad',
      message: activar
        ? `¿Desea activar la unidad ${vehiculo.marca} ${vehiculo.modelo}?`
        : `¿Desea desactivar la unidad ${vehiculo.marca} ${vehiculo.modelo}?`,
      confirmText: activar ? 'Activar' : 'Desactivar',
      tone: activar ? 'warning' : 'danger'
    });

    if (!confirmed) return;

    try {
      await axios.patch(
        `${API_URL}/estado/${vehiculo.vehiculo_id}`,
        { estado: activar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      uiFeedback.success(activar ? 'Unidad activada correctamente.' : 'Unidad desactivada correctamente.');
      fetchData();
    } catch (err) {
      uiFeedback.error(err.response?.data?.message || 'No se pudo cambiar el estado de la unidad.');
    }
  };

  const flotaFiltrada = flota.filter((v) =>
    `${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const obtenerDescripcionCorta = (vehiculo) => {
    const tipo = vehiculo.tipo || 'Unidad';
    const anio = vehiculo.anio || '--';
    return `${tipo} • ${anio}`;
  };

  const obtenerEstadoVisual = (vehiculo) => {
    if (vehiculo.en_renta) {
      return { label: 'En renta', className: 'text-[#C97B6A] bg-[#C97B6A]/10 border-[#C97B6A]/20' };
    }
    if (!vehiculo.estado) {
      return { label: 'Inactivo', className: 'text-[#93887C] bg-[#93887C]/10 border-[#93887C]/20' };
    }
    return { label: 'Activo', className: 'text-[#6F9B74] bg-[#6F9B74]/10 border-[#6F9B74]/20' };
  };

  const abrirNuevoRegistro = () => {
    setFormData({
      vehiculo_id: null,
      marca: '',
      modelo: '',
      anio: 2024,
      placa: '',
      gama_id: gamas[0]?.gama_id || '',
      tipo: 'Sedán',
      precios: { normal: '', finSemana: '', feriado: '' }
    });
    setImagePreview(null);
    setSelectedFile(null);
    setOpenGama(false);
    setOpenTipo(false);
    setShowModal(true);
  };

  const abrirEdicion = (vehiculo) => {
    setFormData({ ...vehiculo });
    setImagePreview(vehiculo.imagen_url ? `http://localhost:3000${vehiculo.imagen_url}` : null);
    setSelectedFile(null);
    setOpenGama(false);
    setOpenTipo(false);
    setShowModal(true);
  };

  const obtenerImagenVehiculo = (vehiculo) => (
    vehiculo.imagen_url ? `http://localhost:3000${vehiculo.imagen_url}` : null
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter text-[#2F2923]">
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4 text-left">
        <div>
          <h2 className="text-[34px] font-bold tracking-tighter font-sora italic leading-none uppercase">
            Gestión de <span className="text-[#C6A243] not-italic">Flota</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">Control de Inventario KRM</p>
        </div>
        <button
          onClick={abrirNuevoRegistro}
          className="bg-[#C6A243] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#B58E35] transition-all shadow-md"
        >
          <Plus size={14} /> Registrar Unidad
        </button>
      </div>

      <div className="relative group text-left">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93887C]" size={14} />
        <input
          type="text"
          placeholder="Filtrar por placa, marca o modelo..."
          className="w-full bg-[#FCFAF5] border border-[#D7CCBC]/60 rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none focus:border-[#C6A243] transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC]/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#C6A243]" size={30} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#93887C]">Sincronizando flota...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#F4EFE6]/60 border-b border-[#D7CCBC]/60 text-[10px] font-black text-[#93887C] uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Descripción de Unidad</th>
                <th className="px-6 py-4 text-center">Identificación</th>
                <th className="px-6 py-4 text-center">US$ Normal</th>
                <th className="px-6 py-4 text-center">US$ Fines Sem.</th>
                <th className="px-6 py-4 text-center">US$ Feriados</th>
                <th className="px-6 py-4 text-right pr-10">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7CCBC]/30">
              {flotaFiltrada.map((v) => {
                const estadoVisual = obtenerEstadoVisual(v);
                return (
                  <tr key={v.vehiculo_id} className="hover:bg-[#F3EEE4] transition-colors font-sora italic">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 rounded-[1.35rem] border border-[#D7CCBC]/35 bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                        <div className="relative h-[76px] w-[120px] shrink-0 overflow-hidden rounded-[1.15rem] border border-[#D7CCBC]/80 bg-gradient-to-br from-[#F8F3EA] via-white to-[#EFE6D9] shadow-sm">
                          {v.imagen_url ? (
                            <button
                              type="button"
                              className="group h-full w-full"
                              title={`Ampliar foto de ${v.marca} ${v.modelo}`}
                              onClick={() => setImagenExpandida({
                                src: obtenerImagenVehiculo(v),
                                alt: `${v.marca} ${v.modelo}`,
                                titulo: `${v.marca} ${v.modelo}`,
                                placa: v.placa
                              })}
                            >
                              <img
                                src={obtenerImagenVehiculo(v)}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                alt={`${v.marca} ${v.modelo}`}
                                onError={(e) => {
                                  e.currentTarget.parentElement.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.nextElementSibling;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2F2923]/80 via-[#2F2923]/10 to-transparent px-2 py-1 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white">Click para ampliar</span>
                              </div>
                            </button>
                          ) : null}
                          <div className={`${v.imagen_url ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}>
                            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(198,162,67,0.18),_transparent_55%)]">
                              <div className="flex flex-col items-center gap-1 text-[#A28C66] not-italic">
                                <Car size={24} strokeWidth={1.8} />
                                <span className="text-[8px] font-black uppercase tracking-[0.22em]">Sin foto</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col text-left">
                          <span className="truncate font-bold text-[#2F2923] uppercase text-[15px] leading-tight">{v.marca} {v.modelo}</span>
                          <span className="mt-1 text-[11px] text-[#93887C] not-italic font-bold">{obtenerDescripcionCorta(v)}</span>
                          <div className="mt-2 flex items-center gap-2 not-italic flex-wrap">
                            <span className="rounded-full border border-[#D7CCBC]/70 bg-[#F8F3EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#7B6F62]">
                              {v.gama}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${estadoVisual.className}`}>
                              {estadoVisual.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center not-italic font-inter">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-[#2F2923] uppercase"><Hash size={10} className="inline mr-1 text-[#C6A243]" />{v.placa}</span>
                        <span className="text-[10px] font-black text-[#C6A243] uppercase tracking-widest">{v.gama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-[#2F2923]">{v.precios.normal}</td>
                    <td className="px-6 py-4 text-center font-bold text-[#C6A243]">{v.precios.finSemana}</td>
                    <td className="px-6 py-4 text-center font-bold text-[#C97B6A]">{v.precios.feriado}</td>
                    <td className="px-6 py-4 text-right pr-10">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Editar especificaciones de la unidad"
                          onClick={() => abrirEdicion(v)}
                          className="p-2 text-[#93887C] hover:text-[#C6A243] bg-white rounded-lg border shadow-sm transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          title={v.en_renta ? 'Unidad en renta' : v.estado ? 'Desactivar unidad' : 'Activar unidad'}
                          onClick={() => cambiarEstado(v)}
                          disabled={v.en_renta}
                          className={`p-2 rounded-lg border shadow-sm transition-colors ${
                            v.en_renta
                              ? 'bg-[#F6F3EC] text-[#B7AA99] cursor-not-allowed'
                              : v.estado
                                ? 'bg-white text-[#C97B6A] hover:bg-red-50'
                                : 'bg-white text-[#6F9B74] hover:bg-green-50'
                          }`}
                        >
                          {v.en_renta ? <Ban size={16} /> : <Power size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#2F2924]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-[#FCFAF5] border border-[#D7CCBC] w-full max-w-2xl rounded-[2.5rem] shadow-xl overflow-visible animate-in zoom-in-95 text-left">
            <div className="p-6 border-b border-[#D7CCBC]/60 flex justify-between items-center bg-[#F4EFE6]/50 rounded-t-[2.5rem]">
              <h3 className="text-[#2F2923] font-bold uppercase tracking-widest text-[11px] italic font-sora ml-2">
                {formData.vehiculo_id ? 'Modificar Registro de Unidad' : 'Registrar nueva unidad en flota'}
              </h3>
              <button type="button" title="Cerrar formulario" onClick={() => setShowModal(false)} className="text-[#93887C] hover:text-[#2F2923] mr-2"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-center mb-2">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full bg-[#F6F3EC] border-2 border-dashed border-[#D7CCBC] flex items-center justify-center overflow-hidden shadow-inner">
                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" /> : <Car size={40} className="text-[#D7CCBC]" />}
                  </div>
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  <div className="absolute bottom-0 right-0 bg-[#C6A243] text-white p-2 rounded-full shadow-lg border-2 border-white"><Camera size={14} /></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Marca</label>
                  <input name="marca" value={formData.marca} onChange={handleChange} required className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-[1.2rem] py-2.5 px-4 text-[13px] font-bold outline-none focus:border-[#C6A243]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Modelo</label>
                  <input name="modelo" value={formData.modelo} onChange={handleChange} required className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-[1.2rem] py-2.5 px-4 text-[13px] font-bold outline-none focus:border-[#C6A243]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Año</label>
                  <input name="anio" type="number" value={formData.anio} onChange={handleChange} required className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-[1.2rem] py-2.5 px-4 text-[13px] font-bold outline-none focus:border-[#C6A243]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Placa</label>
                  <input name="placa" value={formData.placa} onChange={handleChange} required className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-[1.2rem] py-2.5 px-4 text-[13px] font-mono font-bold outline-none focus:border-[#C6A243]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Gama / Categoría</label>
                  <div onClick={() => setOpenGama(!openGama)} className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-[1.5rem] py-3 px-5 text-[13px] font-bold flex justify-between items-center cursor-pointer hover:border-[#C6A243]">
                    <span className="uppercase">{gamas.find((g) => g.gama_id === formData.gama_id)?.nombre || 'Seleccionar'}</span>
                    <ChevronDown size={16} className={`text-[#C6A243] transition-transform ${openGama ? 'rotate-180' : ''}`} />
                  </div>
                  {openGama && (
                    <div className="absolute top-[110%] left-0 w-full bg-white border border-[#D7CCBC] rounded-[1.5rem] shadow-2xl z-50 py-2 overflow-hidden">
                      {gamas.map((g) => (
                        <div key={g.gama_id} onClick={() => { setFormData({ ...formData, gama_id: g.gama_id }); setOpenGama(false); }} className="px-5 py-3 text-[12px] font-bold uppercase hover:bg-[#F6F3EC] hover:text-[#C6A243] cursor-pointer">
                          {g.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Tipo de Vehículo</label>
                  <div onClick={() => setOpenTipo(!openTipo)} className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-[1.5rem] py-3 px-5 text-[13px] font-bold flex justify-between items-center cursor-pointer hover:border-[#C6A243]">
                    <span className="uppercase">{formData.tipo}</span>
                    <ChevronDown size={16} className={`text-[#C6A243] transition-transform ${openTipo ? 'rotate-180' : ''}`} />
                  </div>
                  {openTipo && (
                    <div className="absolute top-[110%] left-0 w-full bg-white border border-[#D7CCBC] rounded-[1.5rem] shadow-2xl z-50 py-2 overflow-hidden">
                      {['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Lujo'].map((t) => (
                        <div key={t} onClick={() => { setFormData({ ...formData, tipo: t }); setOpenTipo(false); }} className="px-5 py-3 text-[12px] font-bold uppercase hover:bg-[#F6F3EC] hover:text-[#C6A243] cursor-pointer">
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 bg-[#F4EFE6]/40 p-6 rounded-[2rem] border border-[#D7CCBC]/60">
                <h4 className="text-[11px] font-black text-[#C6A243] uppercase tracking-[0.2em] flex items-center gap-2 ml-1"><DollarSign size={14} /> Esquema Tarifario</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#93887C] uppercase ml-1">US$ Normal</label>
                    <input name="normal" type="number" step="0.01" value={formData.precios.normal} onChange={handlePriceChange} required className="w-full bg-white border border-[#D7CCBC] rounded-[1rem] py-2.5 px-4 text-[14px] font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#93887C] uppercase ml-1">US$ Fines Sem.</label>
                    <input name="finSemana" type="number" step="0.01" value={formData.precios.finSemana} onChange={handlePriceChange} required className="w-full bg-white border border-[#D7CCBC] rounded-[1rem] py-2.5 px-4 text-[14px] font-bold outline-none text-[#C6A243]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#93887C] uppercase ml-1">US$ Feriado</label>
                    <input name="feriado" type="number" step="0.01" value={formData.precios.feriado} onChange={handlePriceChange} required className="w-full bg-white border border-[#D7CCBC] rounded-[1rem] py-2.5 px-4 text-[14px] font-bold outline-none text-[#C97B6A]" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-[#2F2923] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all">
                {formData.vehiculo_id ? 'GUARDAR MODIFICACIONES' : 'PROCESAR ALTA DE VEHÍCULO'} <Save size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {imagenExpandida && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1C1814]/62 p-6 backdrop-blur-2xl"
          onClick={() => setImagenExpandida(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-[#FCFAF5]/96 shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="Cerrar vista ampliada"
              onClick={() => setImagenExpandida(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-[#2F2923] shadow-lg transition-colors hover:bg-white"
            >
              <X size={18} />
            </button>

            <div className="border-b border-[#D7CCBC]/50 bg-gradient-to-b from-[#FCFAF5]/98 via-[#F7F1E7]/94 to-[#F3ECE1]/88 px-6 py-4 text-left backdrop-blur-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#C6A243]">Vista ampliada</p>
              <h4 className="mt-1 text-xl font-bold uppercase italic font-sora text-[#2F2923]">{imagenExpandida.titulo}</h4>
              <p className="text-[11px] font-mono font-bold uppercase text-[#93887C]">Placa: {imagenExpandida.placa}</p>
            </div>

            <div className="bg-[radial-gradient(circle_at_top,_rgba(198,162,67,0.14),_transparent_58%)] p-4 sm:p-6">
              <img
                src={imagenExpandida.src}
                alt={imagenExpandida.alt}
                className="max-h-[75vh] w-full rounded-[1.6rem] object-contain bg-white"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Vehiculos;
