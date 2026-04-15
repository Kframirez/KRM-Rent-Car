import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Edit2, UserX, UserPlus, X, CheckCircle, Save,
  Search, Mail, Phone, Hash, UserCheck, Camera
} from 'lucide-react';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', cedula: '', email: '', telefono: '', direccion: ''
  });

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:3000/api/clientes';

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(res.data);
    } catch (err) {
      console.error("Error al refrescar datos:", err.message);
    }
  }, [token, API_URL]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const formatCedula = (value) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/^(\d{3})(\d)/, "$1-$2")
      .replace(/^(\d{3}-\d{7})(\d)/, "$1-$2")
      .substring(0, 13);
  };

  const formatTelefono = (value) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/^(\d{3})(\d)/, "$1-$2")
      .replace(/^(\d{3}-\d{3})(\d)/, "$1-$2")
      .substring(0, 12);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'nombre' || name === 'apellido') {
      finalValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
    }
    if (name === 'cedula') finalValue = formatCedula(value);
    if (name === 'telefono') finalValue = formatTelefono(value);
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) data.append(key, formData[key]);
    });

    if (selectedFile) data.append('imagen', selectedFile);

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${selectedId}`, data, config);
      } else {
        await axios.post(API_URL, data, config);
      }
      setShowModal(false);
      refreshData();
      uiFeedback.success(isEditing ? "Cliente actualizado correctamente." : "Cliente registrado correctamente.");
    } catch (err) {
      uiFeedback.error(err.response?.data?.message || "Error al procesar el cliente");
    }
  };

  const toggleEstadoCliente = async (id, estadoActual) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    const confirmed = await uiFeedback.confirm({
      title: `Confirmar ${accion}`,
      message: `Seguro que desea ${accion} este registro?`,
      confirmText: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tone: estadoActual ? 'danger' : 'warning'
    });

    if (!confirmed) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL}/${id}`, { estado: !estadoActual }, config);
      refreshData();
      uiFeedback.success(estadoActual ? 'Cliente desactivado correctamente.' : 'Cliente activado correctamente.');
    } catch (err) {
      console.error("Error al cambiar estado:", err.message);
      uiFeedback.error(err.response?.data?.message || "Error al cambiar estado");
    }
  };

  const handleEdit = (c) => {
    setIsEditing(true);
    setSelectedId(c.cliente_id);
    setFormData({
      nombre: c.nombre, apellido: c.apellido, cedula: c.cedula,
      email: c.email, telefono: c.telefono, direccion: c.direccion
    });
    setImagePreview(c.imagen_url ? `http://localhost:3000${c.imagen_url}` : null);
    setSelectedFile(null);
    setShowModal(true);
  };

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.cedula} ${c.direccion}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter text-[#2F2923]">
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4 text-left">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight font-sora italic leading-none uppercase">
            Base de <span className="text-[#C6A243] not-italic">Clientes</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ml-0.5">Gestion de Arrendatarios KRM</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setShowModal(true);
            setFormData({ nombre: '', apellido: '', cedula: '', email: '', telefono: '', direccion: '' });
            setImagePreview(null);
            setSelectedFile(null);
          }}
          className="bg-[#C6A243] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#B58E35] transition-all shadow-md"
        >
          <UserPlus size={14} /> Nuevo Cliente
        </button>
      </div>

      <div className="relative group text-left">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93887C]" size={14} />
        <input
          type="text"
          placeholder="Filtrar por nombre, cedula o ubicacion..."
          className="w-full bg-[#FCFAF5] border border-[#D7CCBC]/60 rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none focus:border-[#C6A243] transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#FCFAF5] rounded-2xl border border-[#D7CCBC]/60 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#F4EFE6]/60 border-b border-[#D7CCBC]/60 text-[10px] font-black text-[#93887C] uppercase tracking-widest">
              <th className="px-6 py-4">Nombre Completo</th>
              <th className="px-6 py-4 text-center">Identificacion</th>
              <th className="px-6 py-4 text-center">Contacto</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right pr-10">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7CCBC]/30">
            {clientesFiltrados.map((c) => (
              <tr key={c.cliente_id} className="hover:bg-[#F3EEE4] transition-colors group italic font-sora">
                <td className="px-6 py-5 font-bold text-[#2F2923] uppercase leading-tight text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#E5DED0] overflow-hidden border-2 border-[#D7CCBC] flex-shrink-0 shadow-sm">
                      {c.imagen_url ? (
                        <img src={`http://localhost:3000${c.imagen_url}`} className="w-full h-full object-cover" alt="Perfil" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-[#93887C] not-italic font-black">KRM</div>
                      )}
                    </div>
                    <span>{c.nombre}<br />{c.apellido}</span>
                  </div>
                </td>
                <td className="px-6 py-4 not-italic font-inter text-center">
                  <div className="flex items-center justify-center gap-2 text-[#6E655B] font-mono font-bold">
                    <Hash size={10} className="text-[#C6A243]" /> {c.cedula}
                  </div>
                </td>
                <td className="px-6 py-4 space-y-0.5 not-italic font-inter text-[11px] text-left">
                  <div className="flex items-center gap-2 text-[#93887C] font-medium lowercase">
                    <Mail size={10} className="text-[#7E95A8]" /> {c.email}
                  </div>
                  <div className="flex items-center gap-2 text-[#93887C] font-bold">
                    <Phone size={10} className="text-[#6F9B74]" /> {c.telefono}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${c.estado ? 'text-[#6F9B74] bg-[#6F9B74]/10 border-[#6F9B74]/20' : 'text-[#C97B6A] bg-[#C97B6A]/10 border-[#C97B6A]/20'}`}>
                    {c.estado ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2 pr-10">
                  <button onClick={() => handleEdit(c)} className="p-2 text-[#93887C] hover:text-[#C6A243] transition-colors bg-white rounded-lg border border-[#D7CCBC]/30 shadow-sm"><Edit2 size={16} /></button>
                  <button onClick={() => toggleEstadoCliente(c.cliente_id, c.estado)} className={`p-2 transition-colors bg-white rounded-lg border border-[#D7CCBC]/30 shadow-sm ${c.estado ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}>
                    {c.estado ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#2F2923]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} autoComplete="off" className="bg-[#FCFAF5] border border-[#D7CCBC] w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 text-left">
            <div className="p-6 border-b border-[#D7CCBC] flex justify-between items-center bg-[#F4EFE6]/50">
              <h3 className="text-[#2F2923] font-bold uppercase tracking-widest text-[11px] italic font-sora">
                {isEditing ? 'Actualizar Ficha Cliente' : 'Registro de Cliente'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#93887C] hover:text-[#2F2923]"><X size={20} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex justify-center mb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-[#F6F3EC] border-2 border-dashed border-[#D7CCBC] flex items-center justify-center overflow-hidden shadow-inner">
                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" /> : <Camera size={30} className="text-[#D7CCBC]" />}
                  </div>
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  <div className="absolute bottom-0 right-0 bg-[#C6A243] text-white p-2 rounded-full shadow-lg pointer-events-none border-2 border-white"><Camera size={12} /></div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Documento de Identidad</label>
                <input name="cedula" required placeholder="000-0000000-0" className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-[#C6A243]" value={formData.cedula} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Telefono Movil</label>
                <input name="telefono" required placeholder="000-000-0000" className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-[#C6A243]" value={formData.telefono} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Nombres</label>
                <input name="nombre" required placeholder="Solo letras" className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-[#C6A243]" value={formData.nombre} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Apellidos</label>
                <input name="apellido" required placeholder="Solo letras" className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-[#C6A243]" value={formData.apellido} onChange={handleChange} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Correo Electronico</label>
                <input name="email" required type="email" className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-[#C6A243]" value={formData.email} onChange={handleChange} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-[#93887C] uppercase ml-1">Direccion / Ubicacion</label>
                <input name="direccion" className="w-full bg-[#F6F3EC] border border-[#D7CCBC] rounded-xl py-2.5 px-4 text-[13px] outline-none focus:border-[#C6A243]" value={formData.direccion} onChange={handleChange} />
              </div>
              <button type="submit" className="col-span-2 mt-2 w-full py-4 bg-[#C6A243] text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg hover:bg-[#B58E35]">
                {isEditing ? 'GUARDAR MODIFICACIONES' : 'CONFIRMAR REGISTRO'} {isEditing ? <Save size={14} /> : <CheckCircle size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Clientes;
