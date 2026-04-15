import React, { useState } from 'react';
import { User, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import logoKRM from '../assets/logo-krm.png'; 

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || "Usuario o contraseña incorrectos";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4EFE6] px-4 font-inter relative overflow-hidden text-left">
      {/* Fondo orgánico sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none text-left">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#C6A243]/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#7D94A8]/5 rounded-full blur-[120px]"></div>
      </div>

      {/* TARJETA HORIZONTAL */}
      <div className="max-w-[1000px] w-full bg-[#FCFAF5] rounded-[3rem] border border-[#D7CCBC]/60 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700 flex overflow-hidden min-h-[600px]">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="w-[100%] lg:w-[35%] p-12 border-r border-[#D7CCBC]/40 flex flex-col items-center justify-center bg-white/30 relative">
          <div className="w-full relative -top-4">
            <div className="text-center mb-10">
              <h2 className="text-[22px] font-bold text-[#2F2923] tracking-tighter font-sora italic leading-none uppercase">
                Acceso al <span className="text-[#C6A243] not-italic">Sistema</span>
              </h2>
              <p className="text-[#93887C] text-[9px] uppercase tracking-[0.3em] font-black mt-2 opacity-70">
                Portal Operativo KRM
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 bg-[#C97B6A]/10 border border-[#C97B6A]/30 text-[#C97B6A] p-3 rounded-xl text-[11px] font-bold animate-in shake duration-300">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[#93887C] text-[9px] uppercase ml-1 font-black tracking-widest opacity-60">Usuario</label>
                <div className="group flex items-center bg-[#F6F3EC]/50 border border-[#D7CCBC]/50 rounded-xl focus-within:border-[#C6A243] focus-within:bg-white transition-all">
                  <span className="pl-4 text-[#D7CCBC] group-focus-within:text-[#C6A243]"><User size={16} /></span>
                  <input 
                    type="text" name="username" 
                    className="w-full bg-transparent text-[#2F2923] p-3.5 focus:outline-none text-[13px] font-bold"
                    placeholder="Admin" value={credentials.username} onChange={handleChange} required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#93887C] text-[9px] uppercase ml-1 font-black tracking-widest opacity-60">Contraseña</label>
                <div className="group flex items-center bg-[#F6F3EC]/50 border border-[#D7CCBC]/50 rounded-xl focus-within:border-[#C6A243] focus-within:bg-white transition-all">
                  <span className="pl-4 text-[#D7CCBC] group-focus-within:text-[#C6A243]"><Lock size={16} /></span>
                  <input 
                    type="password" name="password" 
                    className="w-full bg-transparent text-[#2F2923] p-3.5 focus:outline-none text-[13px] font-bold"
                    placeholder="••••••••" value={credentials.password} onChange={handleChange} required 
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#C6A243] hover:bg-[#B58E35] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 mt-4 shadow-lg shadow-[#C6A243]/20 active:scale-[0.98] uppercase text-[10px] tracking-[0.2em]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>ACCEDER AL PANEL <LogIn size={18} /></>}
              </button>
            </form>
          </div>
          
          <p className="absolute bottom-8 text-[8px] text-[#93887C] font-bold uppercase tracking-[0.2em] opacity-40 italic">
            © 2026 KRM Luxury Fleet Management
          </p>
        </div>

        {/* COLUMNA DERECHA: LOGO (Solo visible en pantallas grandes) */}
        <div className="hidden lg:flex w-[65%] bg-[#F6F3EC] items-center justify-center relative overflow-hidden p-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FCFAF5] to-transparent opacity-60"></div>
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <img 
              src={logoKRM} 
              alt="KRM Logo" 
              className="h-[450px] w-auto object-contain drop-shadow-2xl transition-transform duration-1000 hover:scale-105" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;