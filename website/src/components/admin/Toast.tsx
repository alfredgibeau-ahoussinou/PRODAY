"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const TOAST_COLORS = {
  success: "bg-green-500/20 border-green-500/30 text-green-400",
  error: "bg-red-500/20 border-red-500/30 text-red-400",
  warning: "bg-amber-500/20 border-amber-500/30 text-amber-400",
  info: "bg-blue-500/20 border-blue-500/30 text-blue-400",
};

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = TOAST_ICONS[toast.type];

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 ${
        TOAST_COLORS[toast.type]
      } ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="flex-shrink-0 rounded-full p-1 transition hover:bg-white/10"
      >
        <X size={16} className="text-white/60" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

let toastListeners: ((toast: Toast) => void)[] = [];
let toasts: Toast[] = [];

export function toast(message: string, type: ToastType = "info", duration?: number) {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { id, type, message, duration };
  toasts.push(newToast);
  toastListeners.forEach((listener) => listener(newToast));
  return id;
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setCurrentToasts((prev) => [...prev, toast]);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setCurrentToasts((prev) => prev.filter((t) => t.id !== id));
    toasts = toasts.filter((t) => t.id !== id);
  };

  return { toasts: currentToasts, removeToast };
}
