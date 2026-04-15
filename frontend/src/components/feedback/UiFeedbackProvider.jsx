import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Info, ShieldAlert, X, XCircle } from 'lucide-react';

const UiFeedbackContext = createContext(null);
export const uiFeedback = {
  notify: () => {},
  confirm: async () => false,
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
};

const toneMap = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-[#6F9B74]',
    badgeClass: 'text-[#6F9B74] bg-[#6F9B74]/10 border-[#6F9B74]/20',
    buttonClass: 'bg-[#6F9B74] hover:bg-[#5d8562] text-white',
    ringClass: 'from-[#6F9B74]/20 to-transparent',
    defaultTitle: 'Operacion completada',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-[#C97B6A]',
    badgeClass: 'text-[#C97B6A] bg-[#C97B6A]/10 border-[#C97B6A]/20',
    buttonClass: 'bg-[#C97B6A] hover:bg-[#b76c5c] text-white',
    ringClass: 'from-[#C97B6A]/20 to-transparent',
    defaultTitle: 'Atencion operativa',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-[#C6A243]',
    badgeClass: 'text-[#C6A243] bg-[#C6A243]/10 border-[#C6A243]/20',
    buttonClass: 'bg-[#C6A243] hover:bg-[#b58e35] text-white',
    ringClass: 'from-[#C6A243]/20 to-transparent',
    defaultTitle: 'Validacion requerida',
  },
  info: {
    icon: Bell,
    iconClass: 'text-[#7D94A8]',
    badgeClass: 'text-[#7D94A8] bg-[#7D94A8]/10 border-[#7D94A8]/20',
    buttonClass: 'bg-[#2F2923] hover:bg-[#1f1b17] text-white',
    ringClass: 'from-[#7D94A8]/20 to-transparent',
    defaultTitle: 'Panel operativo',
  },
  danger: {
    icon: ShieldAlert,
    iconClass: 'text-[#C97B6A]',
    badgeClass: 'text-[#C97B6A] bg-[#C97B6A]/10 border-[#C97B6A]/20',
    buttonClass: 'bg-[#2F2923] hover:bg-[#1f1b17] text-white',
    ringClass: 'from-[#C97B6A]/20 to-transparent',
    defaultTitle: 'Confirmacion critica',
  },
};

const normalizeOptions = (input, fallbackTone = 'info') => {
  if (typeof input === 'string') {
    return { message: input, tone: fallbackTone };
  }
  return { tone: fallbackTone, ...input };
};

export const UiFeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const idRef = useRef(0);

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const notify = (input) => {
    const options = normalizeOptions(input);
    const id = ++idRef.current;
    const duration = options.duration ?? (options.tone === 'error' ? 5200 : 3600);

    setToasts((current) => [
      ...current,
      {
        id,
        title: options.title || toneMap[options.tone]?.defaultTitle || toneMap.info.defaultTitle,
        message: options.message,
        tone: options.tone || 'info',
      },
    ]);

    window.setTimeout(() => dismissToast(id), duration);
  };

  const confirm = (input) =>
    new Promise((resolve) => {
      const options = normalizeOptions(input, 'warning');
      setConfirmState({
        title: options.title || toneMap[options.tone]?.defaultTitle || toneMap.warning.defaultTitle,
        message: options.message,
        tone: options.tone || 'warning',
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        resolve,
      });
    });

  const closeConfirm = (accepted) => {
    if (confirmState?.resolve) {
      confirmState.resolve(accepted);
    }
    setConfirmState(null);
  };

  const value = useMemo(
    () => ({
      notify,
      confirm,
      success: (input) => notify({ ...normalizeOptions(input, 'success'), tone: 'success' }),
      error: (input) => notify({ ...normalizeOptions(input, 'error'), tone: 'error' }),
      warning: (input) => notify({ ...normalizeOptions(input, 'warning'), tone: 'warning' }),
      info: (input) => notify({ ...normalizeOptions(input, 'info'), tone: 'info' }),
    }),
    []
  );

  useEffect(() => {
    uiFeedback.notify = value.notify;
    uiFeedback.confirm = value.confirm;
    uiFeedback.success = value.success;
    uiFeedback.error = value.error;
    uiFeedback.warning = value.warning;
    uiFeedback.info = value.info;

    const previousAlert = window.alert;
    window.alert = (message) => {
      value.info(typeof message === 'string' ? message : 'Notificacion del sistema');
    };

    return () => {
      window.alert = previousAlert;
    };
  }, [value]);

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-5 top-5 z-[140] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const tone = toneMap[toast.tone] || toneMap.info;
          const Icon = tone.icon || Info;

          return (
            <div
              key={toast.id}
              className="pointer-events-auto relative overflow-hidden rounded-[2.25rem] border border-[#D7CCBC] bg-[#FCFAF5] shadow-[0_20px_55px_rgba(47,41,35,0.18)] animate-in slide-in-from-top-3 fade-in duration-300"
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tone.ringClass}`} />
              <div className="relative flex items-start gap-4 p-6 pr-7">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] border border-[#D7CCBC]/60 bg-white shadow-sm">
                  <Icon size={20} className={tone.iconClass} />
                </div>
                <div className="min-w-0 flex-1 pr-5 text-left">
                  <div className={`inline-flex min-h-8 items-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] ${tone.badgeClass}`}>
                    {toast.title}
                  </div>
                  <p className="mt-3 text-[13px] font-semibold leading-relaxed text-[#2F2923]">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#93887C] transition-colors hover:bg-white/70 hover:text-[#2F2923]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmState && (() => {
        const tone = toneMap[confirmState.tone] || toneMap.warning;
        const Icon = tone.icon || AlertTriangle;

        return (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#2F2923]/45 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-[#D7CCBC] bg-[#FCFAF5] shadow-[0_28px_80px_rgba(47,41,35,0.28)] animate-in zoom-in-95 fade-in duration-200">
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tone.ringClass}`} />
              <div className="relative border-b border-[#D7CCBC]/60 bg-[#F4EFE6]/70 px-7 py-6 text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D7CCBC]/70 bg-white shadow-sm">
                    <Icon size={22} className={tone.iconClass} />
                  </div>
                  <div>
                    <p className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${tone.badgeClass}`}>
                      Confirmacion KRM
                    </p>
                    <h3 className="mt-2 text-[20px] font-black uppercase italic tracking-tight text-[#2F2923]">
                      {confirmState.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="px-7 py-6 text-left">
                <p className="text-[15px] leading-relaxed text-[#6E655B]">{confirmState.message}</p>
              </div>

              <div className="flex items-center justify-end gap-3 px-7 pb-7">
                <button
                  type="button"
                  onClick={() => closeConfirm(false)}
                  className="rounded-xl border border-[#D7CCBC] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#6E655B] transition-all hover:border-[#93887C] hover:text-[#2F2923]"
                >
                  {confirmState.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => closeConfirm(true)}
                  className={`rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] shadow-lg transition-all ${tone.buttonClass}`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </UiFeedbackContext.Provider>
  );
};

export const useUiFeedback = () => {
  const context = useContext(UiFeedbackContext);

  if (!context) {
    throw new Error('useUiFeedback debe usarse dentro de UiFeedbackProvider');
  }

  return context;
};
