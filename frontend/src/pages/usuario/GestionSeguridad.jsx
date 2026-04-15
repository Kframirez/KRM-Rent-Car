import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserPlus, ShieldCheck, Key, Edit3, Trash2, 
  Loader2, User, X, Power, CheckCircle2, ShieldAlert, PlusCircle, Camera
} from 'lucide-react';
import { uiFeedback } from '../../components/feedback/UiFeedbackProvider';

const GestionSeguridad = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userPermisos = currentUser?.permisos || [];
  const isAdmin = currentUser?.rol_id === 1;
  const canManageUsers = isAdmin || userPermisos.includes('Gestionar usuarios');
  const canManageRoles = isAdmin || userPermisos.includes('Gestionar roles');
  const canManagePermissions = isAdmin || userPermisos.includes('Gestionar permisos');
  const availableTabs = [
    canManageUsers ? 'usuarios' : null,
    (canManageRoles || canManagePermissions) ? 'roles' : null
  ].filter(Boolean);
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); 
  const [showRolModal, setShowRolModal] = useState(false); 
  const [showPermisosModal, setShowPermisosModal] = useState(false); 
  const [editingId, setEditingId] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosSistema, setPermisosSistema] = useState([]);
  const [permisosActivos, setPermisosActivos] = useState([]);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', username: '', password: '', rol_id: '' });
  const [rolFormData, setRolFormData] = useState({ nombre: '', descripcion: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [usuarioDestacado, setUsuarioDestacado] = useState(null);
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = getAuthConfig();
      const requests = [];

      if (canManageUsers) {
        requests.push(
          axios.get('http://localhost:3000/api/usuarios', config).then((res) => ({ key: 'usuarios', data: res.data }))
        );
      }

      if (canManageRoles || canManagePermissions) {
        requests.push(
          axios.get('http://localhost:3000/api/usuarios/roles', config).then((res) => ({ key: 'roles', data: res.data }))
        );
      }

      const responses = await Promise.all(requests);
      const usuariosResponse = responses.find((item) => item.key === 'usuarios')?.data || [];
      const rolesResponse = responses.find((item) => item.key === 'roles')?.data || [];

      setUsuarios(usuariosResponse);
      setRoles(rolesResponse);

      if (currentUser?.id && usuariosResponse.length) {
        const usuarioActualizado = usuariosResponse.find((usuario) => usuario.usuario_id === currentUser.id);
        if (usuarioActualizado) {
          localStorage.setItem('user', JSON.stringify({
            ...currentUser,
            nombre: usuarioActualizado.nombre,
            apellido: usuarioActualizado.apellido,
            imagen_url: usuarioActualizado.imagen_url
          }));
          window.dispatchEvent(new Event('krm-user-updated'));
        }
      }

      setUsuarioDestacado((prev) => {
        if (!usuariosResponse.length) return null;
        if (prev) {
          return usuariosResponse.find((usuario) => usuario.usuario_id === prev.usuario_id) || usuariosResponse[0] || null;
        }
        return usuariosResponse[0] || null;
      });
    } catch (e) { 
      console.error("Error al cargar datos:", e); 
      if (e.response?.status === 401) {
        uiFeedback.error("Sesión no autorizada o expirada. Por favor, inicie sesión de nuevo.");
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [canManageUsers, canManageRoles, canManagePermissions]);

  const abrirEditar = (u) => {
    setEditingId(u.usuario_id);
    setFormData({ nombre: u.nombre, apellido: u.apellido || '', username: u.username, password: '', rol_id: u.rol_id });
    setImagePreview(u.imagen_url ? `http://localhost:3000${u.imagen_url}` : null);
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const alternarEstado = async (u) => {
    const confirmed = await uiFeedback.confirm({
      title: 'Cambiar estado del usuario',
      message: `Desea cambiar el estado de ${u.nombre}?`,
      confirmText: 'Confirmar',
      tone: u.estado ? 'danger' : 'warning'
    });
    if (!confirmed) return;
    try {
      await axios.patch(`http://localhost:3000/api/usuarios/estado/${u.usuario_id}`, {}, getAuthConfig());
      fetchData();
      uiFeedback.success(u.estado ? 'Usuario desactivado correctamente.' : 'Usuario activado correctamente.');
    } catch (err) {
      console.error(err);
      uiFeedback.error("Error al cambiar estado: Acceso denegado."); 
    }
  };

  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          ...getAuthConfig().headers,
          'Content-Type': 'multipart/form-data'
        }
      };
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) payload.append(key, value);
      });

      if (selectedFile) payload.append('imagen', selectedFile);

      if (editingId) {
        await axios.put(`http://localhost:3000/api/usuarios/${editingId}`, payload, config);
      } else {
        await axios.post('http://localhost:3000/api/usuarios/crear', payload, config);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ nombre: '', apellido: '', username: '', password: '', rol_id: '' });
      setImagePreview(null);
      setSelectedFile(null);
      fetchData();
      uiFeedback.success(editingId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    } catch (err) { 
      uiFeedback.error(err.response?.data?.error || "Error en la operación"); 
    }
  };

  const handleCrearRol = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/usuarios/roles/crear', rolFormData, getAuthConfig());
      setShowRolModal(false);
      setRolFormData({ nombre: '', descripcion: '' });
      fetchData();
      uiFeedback.success("Rol creado correctamente.");
    } catch (err) {
      uiFeedback.error(err.response?.data?.error || "Error al crear el rol");
    }
  };

  const abrirGestionPermisos = async (rol) => {
    if (!canManagePermissions) {
      uiFeedback.warning("Tu rango puede ver roles, pero no gestionar privilegios.");
      return;
    }
    setRolSeleccionado(rol);
    try {
      const config = getAuthConfig();
      const [resTodos, resRol] = await Promise.all([
        axios.get('http://localhost:3000/api/usuarios/permisos/todos', config),
        axios.get(`http://localhost:3000/api/usuarios/roles/${rol.rol_id}/permisos`, config)
      ]);
      setPermisosSistema(resTodos.data);
      setPermisosActivos(resRol.data.map(p => p.permiso_id));
      setShowPermisosModal(true);
    } catch (err) {
      console.error("Error al cargar permisos:", err);
      uiFeedback.error("Error: No tienes permisos para gestionar privilegios.");
    }
  };

  const togglePermiso = (id) => {
    setPermisosActivos(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const guardarPermisos = async () => {
    try {
      await axios.post('http://localhost:3000/api/usuarios/roles/permisos/sync', {
        rol_id: rolSeleccionado.rol_id,
        permisosIds: permisosActivos
      }, getAuthConfig());
      setShowPermisosModal(false);
      uiFeedback.success("Privilegios sincronizados correctamente.");
    } catch (err) {
      console.error(err);
      uiFeedback.error("Error al guardar cambios de permisos");
    }
  };

  if (!availableTabs.length) {
    return (
      <div className="p-6">
        <div className="rounded-[2.5rem] border border-[#D7CCBC] bg-[#FCFAF5] p-10 text-left shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#C97B6A]">Acceso restringido</p>
          <h2 className="mt-3 font-sora text-[28px] font-black italic uppercase text-[#2F2923]">Sin privilegios para seguridad</h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#6E655B]">
            Tu rango actual no tiene permisos para gestionar usuarios, roles ni privilegios. Si necesitas acceso,
            solicita a un administrador que habilite al menos uno de esos permisos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 font-inter text-[#2F2923]">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-[#D7CCBC]/50 pb-4">
        <div className="text-left">
          <h2 className="text-[34px] font-bold tracking-tighter font-sora italic uppercase leading-none">
            Seguridad & <span className="text-[#C6A243] not-italic">Staff</span>
          </h2>
          <p className="text-[#93887C] text-[10px] font-bold uppercase mt-1 tracking-widest text-left">
            Administración de credenciales KRM
          </p>
        </div>
        <div className="flex bg-[#F6F3EC] p-1 rounded-xl border border-[#D7CCBC]/40 shadow-sm">
          {canManageUsers ? (
            <button onClick={() => setActiveTab('usuarios')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'usuarios' ? 'bg-[#C6A243] text-white shadow-md' : 'text-[#93887C] hover:text-[#2F2923]'}`}>Usuarios</button>
          ) : null}
          {(canManageRoles || canManagePermissions) ? (
            <button onClick={() => setActiveTab('roles')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'roles' ? 'bg-[#C6A243] text-white shadow-md' : 'text-[#93887C] hover:text-[#2F2923]'}`}>Roles</button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* PANEL IZQUIERDO DINÁMICO */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-[#FCFAF5] p-8 rounded-[2.5rem] border border-[#D7CCBC] shadow-sm text-left">
            <h4 className="text-[12px] font-black uppercase tracking-widest font-sora italic mb-4 text-[#C6A243]">
              {activeTab === 'usuarios' ? 'Gestión Staff' : 'Jerarquía'}
            </h4>
            <p className="text-[13px] text-[#6E655B] mb-6 leading-relaxed">
              {activeTab === 'usuarios' 
                ? 'Registre nuevos colaboradores para el acceso al sistema. Los usuarios desactivados no podrán iniciar sesión.' 
                : 'Cree nuevos niveles de autoridad y configure qué módulos y acciones puede realizar cada rango.'}
            </p>
            
            {activeTab === 'usuarios' ? (
              <button 
                onClick={() => { setEditingId(null); setFormData({nombre:'', apellido:'', username:'', password:'', rol_id:''}); setImagePreview(null); setSelectedFile(null); setShowModal(true); }}
                disabled={!canManageUsers}
                className="w-full py-4 bg-[#2F2923] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> CREAR NUEVO USUARIO
              </button>
            ) : (
              <button 
                onClick={() => setShowRolModal(true)}
                disabled={!canManageRoles}
                className="w-full py-4 bg-[#C6A243] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} /> CREAR NUEVO ROL
              </button>
            )}
          </div>

          <div className="bg-[#2F2923] p-8 rounded-[2.5rem] text-white relative overflow-hidden hidden xl:block text-left">
            <Key className="absolute -right-4 -bottom-4 text-white/5" size={120} />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C6A243] mb-2">Protocolo KRM</p>
            <p className="text-[14px] font-bold italic leading-tight">Accesos restringidos y cifrados bajo estándar industrial.</p>
          </div>

          {activeTab === 'usuarios' && usuarioDestacado ? (
            <div className="bg-[#FCFAF5] p-6 rounded-[2.5rem] border border-[#D7CCBC] shadow-sm text-left hidden xl:block">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#93887C]">Perfil visible</p>
              <div className="mt-4 overflow-hidden rounded-[2rem] border border-[#D7CCBC]/60 bg-[linear-gradient(180deg,rgba(244,239,230,0.95),rgba(252,250,245,1))]">
                <div className="flex items-center gap-4 p-5">
                  <div className="h-16 w-16 overflow-hidden rounded-[1.4rem] border border-[#D7CCBC] bg-[#F6F3EC] shadow-sm">
                    {usuarioDestacado.imagen_url ? (
                      <img
                        src={`http://localhost:3000${usuarioDestacado.imagen_url}`}
                        alt={`${usuarioDestacado.nombre} ${usuarioDestacado.apellido || ''}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#C6A243]">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-black uppercase italic font-sora text-[#2F2923]">
                      {usuarioDestacado.nombre} {usuarioDestacado.apellido}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7D94A8]">@{usuarioDestacado.username}</p>
                    <p className={`mt-2 text-[8px] font-black uppercase tracking-[0.18em] ${usuarioDestacado.estado ? 'text-green-500' : 'text-red-400'}`}>
                      {usuarioDestacado.estado ? 'Activo en sistema' : 'Acceso suspendido'}
                    </p>
                  </div>
                </div>
                <div className="border-t border-[#D7CCBC]/50 bg-white/80 px-5 py-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#93887C]">Rol asignado</p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#2F2923]">{usuarioDestacado.Role?.nombre || 'Sin rol'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="col-span-12 xl:col-span-8 bg-[#FCFAF5] rounded-[2.5rem] border border-[#D7CCBC] overflow-hidden shadow-sm min-h-[500px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <Loader2 className="animate-spin text-[#C6A243]" size={40} />
              <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Sincronizando datos...</p>
            </div>
          ) : activeTab === 'usuarios' ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-[#F4EFE6]/60 border-b border-[#D7CCBC]/50 text-left">
                    <tr className="text-[#93887C] text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Colaborador</th>
                    <th className="px-8 py-5">Username</th>
                    <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#D7CCBC]/30">
                    {usuarios.map((u) => (
                    <tr key={u.usuario_id} className={`hover:bg-white transition-colors group ${!u.estado ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-8 py-5 flex items-center gap-3 cursor-pointer" onClick={() => setUsuarioDestacado(u)}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shadow-sm transition-colors ${u.estado ? 'bg-white text-[#C6A243] border-[#D7CCBC]/20' : 'bg-gray-200 text-gray-400 border-transparent'}`}>
                            {u.imagen_url ? (
                              <img src={`http://localhost:3000${u.imagen_url}`} alt={`${u.nombre} ${u.apellido || ''}`} className="h-full w-full object-cover" />
                            ) : (
                              <User size={14} />
                            )}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className={`font-bold italic font-sora text-[14px] uppercase ${!u.estado ? 'text-gray-400' : ''}`}>
                            {u.nombre} {u.apellido}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${u.estado ? 'text-green-500' : 'text-red-400'}`}>
                            {u.estado ? '● Activo' : '○ Inactivo'}
                            </span>
                        </div>
                        </td>
                        <td className={`px-8 py-5 font-mono font-bold italic text-xs text-left ${u.estado ? 'text-[#7D94A8]' : 'text-gray-300'}`}>@{u.username}</td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2 pr-4">
                            <div className="relative">
                              <button
                                onClick={() => abrirEditar(u)}
                                title="Editar usuario"
                                className="p-2 text-[#93887C] hover:text-[#C6A243] transition-colors bg-white rounded-lg border border-[#D7CCBC]/30 shadow-sm"
                              >
                                  <Edit3 size={16} />
                              </button>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => alternarEstado(u)}
                                title={u.estado ? 'Desactivar usuario' : 'Activar usuario'}
                                className={`p-2 transition-colors bg-white rounded-lg border border-[#D7CCBC]/30 shadow-sm ${u.estado ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                              >
                                  <Power size={16} />
                              </button>
                            </div>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          ) : (
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map(r => (
                <div 
                  key={r.rol_id} 
                  onClick={() => abrirGestionPermisos(r)} 
                  className={`bg-white p-6 rounded-[2rem] border border-[#D7CCBC]/40 shadow-inner flex flex-col items-center text-center group transition-all ${canManagePermissions ? 'hover:border-[#C6A243]/50 cursor-pointer' : 'opacity-85 cursor-default'}`}
                >
                  <ShieldCheck className="text-[#C6A243] mb-4 group-hover:scale-110 transition-transform" size={32} />
                  <p className="text-[14px] font-black uppercase italic text-[#2F2923]">{r.nombre}</p>
                  <p className="text-[9px] text-[#93887C] mt-2 font-bold uppercase tracking-[0.2em]">
                    {canManagePermissions ? 'Configurar Privilegios' : 'Solo lectura'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL USUARIO */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2F2923]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[#D7CCBC] animate-in zoom-in duration-300 overflow-hidden text-left">
            <div className="bg-[#FCFAF5] p-6 border-b border-[#D7CCBC]/40 flex justify-between items-center">
               <h3 className="font-sora font-black italic uppercase text-[#2F2923]">{editingId ? 'Editar Perfil' : 'Nuevo Staff'}</h3>
               <button onClick={() => setShowModal(false)} className="hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmitUsuario} className="p-8 space-y-4">
               <div className="flex justify-center">
                  <div className="relative group">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#D7CCBC] bg-[#F6F3EC] shadow-inner">
                      {imagePreview ? <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" /> : <Camera size={28} className="text-[#D7CCBC]" />}
                    </div>
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" accept="image/*" />
                    <div className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#C6A243] p-2 text-white shadow-lg pointer-events-none"><Camera size={12} /></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Nombre</label>
                    <input required value={formData.nombre} className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243]" onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Apellido</label>
                    <input required value={formData.apellido} className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243]" onChange={(e) => setFormData({...formData, apellido: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Usuario (@)</label>
                  <input required value={formData.username} className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243]" onChange={(e) => setFormData({...formData, username: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Contraseña</label>
                  <input type="password" placeholder={editingId ? "Dejar en blanco para mantener" : "••••••••"} className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243]" onChange={(e) => setFormData({...formData, password: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Rango / Rol</label>
                  <select required value={formData.rol_id} className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243]" onChange={(e) => setFormData({...formData, rol_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {roles.map(r => <option key={r.rol_id} value={r.rol_id}>{r.nombre}</option>)}
                  </select>
               </div>
               <button type="submit" className="w-full py-4 bg-[#C6A243] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg mt-4 hover:bg-[#b5923a] transition-all">
                  {editingId ? 'GUARDAR CAMBIOS' : 'REGISTRAR ACCESO'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ROL */}
      {showRolModal && (
        <div className="fixed inset-0 bg-[#2F2923]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 text-left">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[#D7CCBC] animate-in zoom-in duration-300">
            <div className="bg-[#FCFAF5] p-6 border-b border-[#D7CCBC]/40 flex justify-between items-center text-left">
               <h3 className="font-sora font-black italic uppercase text-[#2F2923]">Crear Nuevo Rol</h3>
               <button onClick={() => setShowRolModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCrearRol} className="p-8 space-y-4">
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Nombre del Rol</label>
                  <input required placeholder="Ej: Supervisor" className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243]" onChange={(e) => setRolFormData({...rolFormData, nombre: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#93887C] ml-1">Descripción</label>
                  <textarea placeholder="Explique las funciones..." className="w-full bg-[#FCFAF5] border border-[#D7CCBC] rounded-xl p-3 text-xs font-bold outline-none focus:border-[#C6A243] h-24 resize-none" onChange={(e) => setRolFormData({...rolFormData, descripcion: e.target.value})} />
               </div>
               <button type="submit" className="w-full py-4 bg-[#C6A243] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg mt-4 hover:bg-[#b5923a] transition-all">
                  GUARDAR NUEVO ROL
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERMISOS */}
      {showPermisosModal && (
        <div className="fixed inset-0 bg-[#2F2923]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-[#D7CCBC] animate-in slide-in-from-bottom-8 duration-300 overflow-hidden text-left">
            <div className="bg-[#FCFAF5] p-8 border-b border-[#D7CCBC]/40 flex justify-between items-center text-left">
               <div>
                  <h3 className="font-sora font-black italic uppercase text-[#2F2923] text-xl">Privilegios: {rolSeleccionado?.nombre}</h3>
                  <p className="text-[9px] font-black text-[#C6A243] uppercase tracking-widest mt-1">Gestión de accesos modulares</p>
               </div>
               <button onClick={() => setShowPermisosModal(false)} className="bg-white p-2 rounded-full shadow-sm border border-[#D7CCBC]/40 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-10">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {permisosSistema.map(p => (
                    <div 
                      key={p.permiso_id} 
                      onClick={() => togglePermiso(p.permiso_id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center text-left ${permisosActivos.includes(p.permiso_id) ? 'border-[#C6A243] bg-[#C6A243]/5' : 'border-[#D7CCBC]/20 opacity-60 bg-white'}`}
                    >
                      <div>
                        <p className={`text-[11px] font-black uppercase ${permisosActivos.includes(p.permiso_id) ? 'text-[#2F2923]' : 'text-[#93887C]'}`}>{p.nombre}</p>
                        <span className="text-[8px] font-bold bg-[#F6F3EC] px-2 py-0.5 rounded text-[#C6A243] uppercase tracking-tighter">{p.modulo}</span>
                      </div>
                      {permisosActivos.includes(p.permiso_id) && <CheckCircle2 size={18} className="text-[#C6A243]" />}
                    </div>
                  ))}
               </div>
               <button onClick={guardarPermisos} className="w-full py-5 bg-[#2F2923] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl mt-8 hover:bg-black transition-all">Sincronizar Privilegios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionSeguridad;
