import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios'; // Importamos la librería directamente
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardHome from './pages/DashboardHome';
import Clientes from './pages/mantenimientos/Clientes';
import Vehiculos from './pages/mantenimientos/Vehiculos';
import Gamas from './pages/mantenimientos/Gamas';
import Alquileres from './pages/procesos/Alquileres';
import Devoluciones from './pages/procesos/Devoluciones';
import Pagos from './pages/procesos/Pagos';
import Feriados from './pages/mantenimientos/Feriados';
import ConsultaDisponibilidad from './pages/consultas/ConsultaDisponibilidad';
import EstadoCuenta from './pages/consultas/EstadoCuenta';
import ReportesRendimiento from './pages/reportes/ReportesRendimiento';
import ReportesPenalidades from './pages/reportes/ReportesPenalidades';
import ReportesFeriados from './pages/reportes/ReportesFeriados';
import HistorialClientes from './pages/consultas/HistorialClientes';
import AlquileresActivos from './pages/consultas/AlquileresActivos';
import ReporteRentados from './pages/reportes/ReporteRentados';
import ReporteFrecuentes from './pages/reportes/ReporteFrecuentes';
import GestionSeguridad from './pages/usuario/GestionSeguridad';

function App() {

  // CONFIGURACIÓN DE SEGURIDAD GLOBAL
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Sesión expirada o token inválido. Redirigiendo...");
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="gamas" element={<Gamas />} />
          <Route path="feriados" element={<Feriados />} />
          <Route path="alquileres" element={<Alquileres />} />
          <Route path="devoluciones" element={<Devoluciones />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="disponibilidad" element={<ConsultaDisponibilidad />} />
          <Route path="alquileres-activos" element={<AlquileresActivos />} /> 
          <Route path="historial-clientes" element={<HistorialClientes />} /> 
          <Route path="estados-cuenta" element={<EstadoCuenta />} />

          {/* ÚNICA RUTA DE ADMINISTRACIÓN */}
          <Route path="seguridad" element={<GestionSeguridad />} />
            
          <Route path="reporte-ingresos" element={<ReportesRendimiento />} />
          <Route path="reporte-rentados" element={<ReporteRentados />} />
          <Route path="reporte-frecuentes" element={<ReporteFrecuentes />} />
          <Route path="reporte-penalidades" element={<ReportesPenalidades />} />
          <Route path="reporte-feriados" element={<ReportesFeriados />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;