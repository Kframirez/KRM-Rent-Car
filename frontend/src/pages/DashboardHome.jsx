import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Car,
  CheckCircle,
  ClipboardList,
  CreditCard,
  DollarSign,
  Loader2,
  PieChart,
  Receipt,
  ShieldAlert,
  TrendingUp,
  Users
} from 'lucide-react';
import { formatUSD, formatUSDCompact } from '../utils/currency';

const toneClasses = {
  blue: { icon: 'text-[#7D94A8]', bg: 'bg-[#7D94A8]/10', border: 'border-[#7D94A8]/20' },
  gold: { icon: 'text-[#C6A243]', bg: 'bg-[#C6A243]/10', border: 'border-[#C6A243]/20' },
  green: { icon: 'text-[#6F9B74]', bg: 'bg-[#6F9B74]/10', border: 'border-[#6F9B74]/20' },
  coral: { icon: 'text-[#C97B6A]', bg: 'bg-[#C97B6A]/10', border: 'border-[#C97B6A]/20' },
  slate: { icon: 'text-[#93887C]', bg: 'bg-[#93887C]/10', border: 'border-[#93887C]/20' }
};

const alertToneClasses = {
  ok: 'text-[#6F9B74] bg-[#6F9B74]/8 border-[#6F9B74]/20',
  warning: 'text-[#C6A243] bg-[#C6A243]/10 border-[#C6A243]/20',
  danger: 'text-[#C97B6A] bg-[#C97B6A]/10 border-[#C97B6A]/20'
};

const activityToneClasses = {
  gold: 'bg-[#C6A243]/10 text-[#C6A243] border-[#C6A243]/20',
  green: 'bg-[#6F9B74]/10 text-[#6F9B74] border-[#6F9B74]/20',
  slate: 'bg-[#93887C]/10 text-[#93887C] border-[#93887C]/20'
};

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/dashboard/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
        setError('');
      } catch (e) {
        console.error('Error en Dashboard:', e);
        setError('No se pudo cargar el panel operativo.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatMoney = (value) => formatUSD(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatCompactMoney = (value) => formatUSDCompact(value).replace('US$ ', 'US$');

  const valueClassName = 'mt-2 max-w-full text-[clamp(1.35rem,1.9vw,1.95rem)] font-black italic leading-[0.92] tracking-tight font-sora';

  const formatDateLabel = (value) => {
    if (!value) return 'Sin fecha';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const chartMax = useMemo(() => {
    if (!data?.graficoIngresos?.length) return 1;
    return Math.max(...data.graficoIngresos.map((item) => Number(item.total || 0)), 1);
  }, [data]);

  const actividadReciente = useMemo(() => {
    if (!data?.actividad?.length) return [];

    return [...data.actividad].sort((a, b) => {
      const fechaA = a?.fecha ? new Date(`${a.fecha}T00:00:00`).getTime() : 0;
      const fechaB = b?.fecha ? new Date(`${b.fecha}T00:00:00`).getTime() : 0;

      if (fechaA !== fechaB) return fechaB - fechaA;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [data]);

  const ingresosVehiculo = useMemo(() => {
    const base = Array.isArray(data?.ingresosPorVehiculo) ? data.ingresosPorVehiculo : [];
    const total = base.reduce((acc, item) => acc + Number(item?.total || 0), 0);

    if (!base.length || total <= 0) {
      return {
        total: 0,
        lider: null,
        segmentos: [],
        gradiente: '#E7DFD2'
      };
    }

    const palette = ['#C6A243', '#7D94A8', '#6F9B74', '#C97B6A'];
    let cursor = 0;

    const segmentos = base.map((item, index) => {
      const monto = Number(item?.total || 0);
      const porcentaje = (monto / total) * 100;
      const start = cursor;
      const end = cursor + porcentaje;
      cursor = end;

      return {
        key: item.vehiculo_id || index,
        nombre: item.nombre,
        placa: item.placa,
        total: monto,
        rentas: Number(item?.rentas || 0),
        porcentaje,
        color: palette[index % palette.length],
        range: `${palette[index % palette.length]} ${start}% ${end}%`
      };
    });

    return {
      total,
      lider: segmentos[0] || null,
      segmentos,
      gradiente: `conic-gradient(${segmentos.map((segmento) => segmento.range).join(', ')})`
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-[#C6A243]" size={48} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[2rem] border border-[#D7CCBC] bg-[#FCFAF5] p-8 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C97B6A]">Panel no disponible</p>
        <h3 className="mt-3 text-[26px] font-black italic uppercase font-sora text-[#2F2923]">No se pudo cargar el dashboard</h3>
        <p className="mt-3 text-[13px] leading-relaxed text-[#6E655B]">
          {error || 'El endpoint de métricas no respondió correctamente. Revise el backend e intente de nuevo.'}
        </p>
      </div>
    );
  }

  const principalMetrics = [
    { label: 'Clientes', value: data.principal.clientes, icon: <Users size={18} />, tone: 'blue', helper: 'Base activa' },
    { label: 'Vehículos', value: data.principal.vehiculos, icon: <Car size={18} />, tone: 'gold', helper: 'Flota total' },
    { label: 'Disponibles', value: data.principal.disponibles, icon: <CheckCircle size={18} />, tone: 'green', helper: 'Listos para rentar' },
    {
      label: 'Ingresos',
      value: formatCompactMoney(data.principal.ingresos),
      fullValue: formatMoney(data.principal.ingresos),
      icon: <DollarSign size={18} />,
      tone: 'coral',
      helper: `Hoy ${formatCompactMoney(data.principal.ingresosHoy)}`,
      cardClassName: 'sm:col-span-2 lg:col-span-2',
      valueClassName: 'mt-2 max-w-full break-words text-[clamp(1.5rem,2.2vw,2.35rem)] font-black italic leading-[0.9] tracking-tight font-sora'
    }
  ];

  const operationalMetrics = [
    { label: 'Alquileres activos', value: data.operativo.alquileresActivos, icon: <ClipboardList size={16} />, tone: 'gold' },
    { label: 'Vehículos en renta', value: data.operativo.vehiculosEnRenta, icon: <Car size={16} />, tone: 'blue' },
    { label: 'Devoluciones de hoy', value: data.operativo.devolucionesPendientesHoy, icon: <Activity size={16} />, tone: 'green' },
    { label: 'Pagos pendientes', value: data.operativo.pagosPendientes, icon: <CreditCard size={16} />, tone: 'coral' },
    { label: 'Penalidades', value: data.operativo.penalidadesPendientes, icon: <ShieldAlert size={16} />, tone: 'coral' },
    { label: 'Clientes con deuda', value: data.operativo.clientesConDeuda, icon: <Receipt size={16} />, tone: 'slate' }
  ];

  const quickActions = [
    { label: 'Nueva renta', path: '/alquileres', icon: <ClipboardList size={16} />, tone: 'gold' },
    { label: 'Registrar devolución', path: '/devoluciones', icon: <Activity size={16} />, tone: 'green' },
    { label: 'Procesar pago', path: '/pagos', icon: <Banknote size={16} />, tone: 'coral' },
    { label: 'Consultar disponibilidad', path: '/disponibilidad', icon: <Car size={16} />, tone: 'blue' },
    { label: 'Ver estado de cuenta', path: '/estados-cuenta', icon: <Receipt size={16} />, tone: 'slate' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-[#2F2923] font-inter">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 relative overflow-hidden rounded-[2.5rem] border border-[#D7CCBC] bg-[#FCFAF5] p-6 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(198,162,67,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(125,148,168,0.12),_transparent_35%)]" />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#93887C]">Resumen operativo</p>
                <h2 className="mt-3 text-[34px] font-black italic uppercase tracking-tight leading-none font-sora">
                  Sistema vivo <span className="text-[#C6A243] not-italic">KRM</span>
                </h2>
                <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#6E655B]">
                  Supervise rentas activas, caja, alertas y movimiento de flota desde un solo panel para tomar decisiones rápidas.
                </p>
              </div>
              <div className="w-full max-w-[16rem] self-start rounded-[1.6rem] border border-[#D7CCBC]/70 bg-white/80 px-5 py-4 text-right shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#93887C]">Ingresos de hoy</p>
                <p className="mt-1 text-[13px] font-bold text-[#B09F89]">{formatMoney(data.principal.ingresosHoy)}</p>
                <p className="mt-1 max-w-full break-words text-[clamp(1.3rem,2vw,1.8rem)] font-black italic leading-[0.92] tracking-tight text-[#2F2923]">{formatCompactMoney(data.principal.ingresosHoy)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
              {principalMetrics.map((metric) => {
                const tone = toneClasses[metric.tone];
                return (
                  <div key={metric.label} className={`min-w-0 rounded-[1.8rem] border border-[#D7CCBC]/70 bg-white/80 p-4 shadow-sm transition-transform hover:-translate-y-0.5 ${metric.cardClassName || ''}`}>
                    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ${tone.bg} ${tone.border} ${tone.icon}`}>
                      {metric.icon}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#93887C]">{metric.label}</p>
                    {metric.fullValue ? <p className="mt-2 text-[11px] font-bold text-[#B09F89]">{metric.fullValue}</p> : null}
                    <p className={metric.valueClassName || valueClassName}>{metric.value}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B09F89]">{metric.helper}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 rounded-[2.5rem] border border-[#D7CCBC] bg-[#2F2923] p-6 shadow-sm text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C6A243]">Distribución de flota</p>
              <h3 className="mt-2 text-[24px] font-black italic uppercase font-sora">Estado actual</h3>
            </div>
            <TrendingUp size={22} className="text-[#C6A243]" />
          </div>

          <div className="mt-6 space-y-4">
            {[
              { label: 'Disponibles', value: data.flota.disponibles, color: 'bg-[#6F9B74]' },
              { label: 'En renta', value: data.flota.enRenta, color: 'bg-[#C6A243]' },
              { label: 'Desactivados', value: data.flota.desactivados, color: 'bg-[#93887C]' }
            ].map((item) => {
              const porcentaje = data.principal.vehiculos > 0 ? Math.max((item.value / data.principal.vehiculos) * 100, item.value > 0 ? 8 : 0) : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.16em]">
                    <span className="text-white/85">{item.label}</span>
                    <span className="text-[#D7CCBC]">{item.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {operationalMetrics.map((metric) => {
          const tone = toneClasses[metric.tone] || toneClasses.slate;
          return (
            <div key={metric.label} className="min-w-0 rounded-[1.7rem] border border-[#D7CCBC] bg-[#FCFAF5] p-4 shadow-sm transition-all hover:-translate-y-0.5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border ${tone.bg} ${tone.border} ${tone.icon}`}>
                {metric.icon}
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#93887C]">{metric.label}</p>
              <p className="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.2rem,1.6vw,1.65rem)] font-black italic leading-none tracking-tight font-sora">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-[2.4rem] border border-[#D7CCBC] bg-[#FCFAF5] p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2F2923] flex items-center gap-2">
                <Activity size={15} className="text-[#C6A243]" />
                Actividad reciente
              </h4>
              <p className="mt-1 text-[11px] text-[#93887C] font-bold uppercase tracking-[0.14em]">Movimiento real del sistema</p>
            </div>
          </div>

          <div className="space-y-3">
            {actividadReciente.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-[#D7CCBC]/60 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${activityToneClasses[item.tono] || activityToneClasses.slate}`}>
                        {item.tipo}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#93887C]">{item.referencia}</span>
                    </div>
                    <p className="mt-2 text-[15px] font-black italic uppercase leading-tight">{item.titulo}</p>
                    <p className="mt-1 text-[12px] text-[#6E655B] font-semibold">{item.detalle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#93887C]">{formatDateLabel(item.fecha)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B09F89]">{item.usuario}</p>
                    {item.monto ? <p className="mt-2 text-[13px] font-black text-[#6F9B74]">{formatMoney(item.monto)}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-[2.4rem] border border-[#D7CCBC] bg-[#FCFAF5] p-5 shadow-sm">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2F2923] flex items-center gap-2">
                <TrendingUp size={15} className="text-[#C6A243]" />
                Ingresos semanales
              </h4>
              <p className="mt-1 text-[11px] text-[#93887C] font-bold uppercase tracking-[0.14em]">Últimos 7 días registrados</p>
            </div>
            <div className="rounded-[1.2rem] border border-[#D7CCBC]/70 bg-white px-4 py-3 text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#93887C]">Acumulado</p>
              <p className="mt-1 max-w-[10rem] break-words text-[clamp(1.1rem,2vw,1.4rem)] font-black italic leading-[0.95] tracking-tight">{formatCompactMoney(data.principal.ingresos)}</p>
            </div>
            </div>

            <div className="mt-8 flex h-[240px] items-end gap-3">
              {data.graficoIngresos.map((item) => {
                const altura = Math.max((Number(item.total || 0) / chartMax) * 100, item.total > 0 ? 12 : 5);
                return (
                  <div key={item.fecha} className="flex flex-1 flex-col items-center gap-3">
                    <p className="text-[10px] font-black text-[#6F9B74]">{item.total > 0 ? formatMoney(item.total) : 'US$0'}</p>
                    <div className="relative flex h-44 w-full items-end rounded-[1.4rem] bg-[#F4EFE6] px-2 py-2">
                      <div className="w-full rounded-[1rem] bg-gradient-to-t from-[#2F2923] via-[#C6A243] to-[#E8D3A0] shadow-[0_10px_20px_rgba(198,162,67,0.25)] transition-all duration-500" style={{ height: `${altura}%` }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#93887C]">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid flex-1 grid-cols-1 gap-4 rounded-[2rem] border border-[#D7CCBC]/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(246,241,232,0.92))] p-4 xl:grid-cols-[190px_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center rounded-[1.6rem] border border-[#E8DECF] bg-[radial-gradient(circle_at_top,_rgba(198,162,67,0.18),_rgba(255,255,255,0)_62%)] px-4 py-5 text-center">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#93887C]">
                  <PieChart size={14} className="text-[#C6A243]" />
                  Ingreso por vehiculo
                </div>
                <div className="relative mt-5 flex h-36 w-36 items-center justify-center rounded-full shadow-[0_16px_36px_rgba(47,41,35,0.08)]" style={{ background: ingresosVehiculo.gradiente }}>
                  <div className="flex h-[5.7rem] w-[5.7rem] flex-col items-center justify-center rounded-full border border-[#E6DDD0] bg-[#FCFAF5] shadow-inner">
                    <span className="text-[23px] font-black italic leading-none font-sora text-[#2F2923]">{formatCompactMoney(ingresosVehiculo.total || 0)}</span>
                    <span className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#93887C]">Top vehiculos</span>
                  </div>
                </div>
                <div className="mt-4 rounded-full border border-[#E6DDD0] bg-white px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#B09F89]">
                    {ingresosVehiculo.segmentos.length ? `${ingresosVehiculo.segmentos.length} unidades en el ranking` : 'Sin registros'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-3">
                <div className="rounded-[1.4rem] border border-[#D7CCBC]/60 bg-[#F8F4EC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#93887C]">Vehiculo lider</p>
                  <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#6E655B]">
                    {ingresosVehiculo.lider
                      ? `${ingresosVehiculo.lider.nombre} (${ingresosVehiculo.lider.placa}) lidera los ingresos acumulados con ${formatMoney(ingresosVehiculo.lider.total)} en ${ingresosVehiculo.lider.rentas} rentas.`
                      : 'Todavia no hay ingresos suficientes para construir el ranking por vehiculo.'}
                  </p>
                </div>

                <div className="space-y-2">
                  {ingresosVehiculo.segmentos.map((segmento) => (
                    <div key={segmento.key} className="flex items-center justify-between rounded-[1.2rem] border border-[#D7CCBC]/50 bg-[#FCFAF5] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segmento.color }} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#2F2923]">{segmento.nombre}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#93887C]">{segmento.placa}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-[#2F2923]">{formatMoney(segmento.total)}</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#93887C]">{Math.round(segmento.porcentaje)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-[2.4rem] border border-[#D7CCBC] bg-[#FCFAF5] p-5 shadow-sm">
          <div className="mb-5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2F2923] flex items-center gap-2">
              <AlertTriangle size={15} className="text-[#C97B6A]" />
              Alertas operativas
            </h4>
            <p className="mt-1 text-[11px] text-[#93887C] font-bold uppercase tracking-[0.14em]">Pendientes que requieren atención</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.alertas.map((alerta) => (
              <div key={alerta.id} className="rounded-[1.6rem] border border-[#D7CCBC]/60 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${alertToneClasses[alerta.tono] || alertToneClasses.ok}`}>
                      {alerta.titulo}
                    </span>
                    <p className="mt-3 text-[clamp(1.65rem,2.6vw,2.25rem)] font-black italic leading-[0.95] font-sora">{alerta.valor}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {alerta.detalle.map((item, idx) => (
                    <div key={`${alerta.id}-${idx}`} className="rounded-xl bg-[#F8F4EC] px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#2F2923]">{item.referencia}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#6E655B] leading-relaxed">{item.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-[2.4rem] border border-[#D7CCBC] bg-[#FCFAF5] p-5 shadow-sm">
          <div className="mb-5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2F2923] flex items-center gap-2">
              <ArrowRight size={15} className="text-[#C6A243]" />
              Próximas acciones
            </h4>
            <p className="mt-1 text-[11px] text-[#93887C] font-bold uppercase tracking-[0.14em]">Acceso rápido a los módulos clave</p>
          </div>

          <div className="space-y-3">
            {quickActions.map((action) => {
              const tone = toneClasses[action.tone] || toneClasses.slate;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group flex w-full items-center justify-between rounded-[1.5rem] border border-[#D7CCBC]/70 bg-white px-4 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C6A243]/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tone.bg} ${tone.border} ${tone.icon}`}>
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#2F2923]">{action.label}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#93887C]">Abrir módulo</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[#B09F89] transition-transform group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
