import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOAST_TYPES = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'text-emerald-900',
    accent: 'bg-emerald-500'
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    title: 'text-rose-900',
    accent: 'bg-rose-500'
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'text-amber-900',
    accent: 'bg-amber-500'
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-900',
    accent: 'bg-blue-500'
  }
};

const CustomToast = ({ t, message, type = 'success' }) => {
  const styles = TOAST_TYPES[type] || TOAST_TYPES.success;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        ${styles.bg} ${styles.border} border-2
        pointer-events-auto flex max-w-[300px] rounded-2xl shadow-xl shadow-gray-200/50 
        overflow-hidden relative
      `}
    >
      {/* Visual Accent Line */}
      <div className={`absolute top-0 left-0 w-1 h-full ${styles.accent}`} />
      
      <div className="flex-1 p-4 text-center items-center justify-center">
        <div className="flex items-center justify-center">
          <div className="flex-shrink-0 pt-0.5">
            {styles.icon}
          </div>
          <div className="ml-2 flex-1">
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex border-l border-gray-100">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const notify = {
  success: (msg) => toast.custom((t) => <CustomToast t={t} message={msg} type="success" />),
  error: (msg) => toast.custom((t) => <CustomToast t={t} message={msg} type="error" />),
  warning: (msg) => toast.custom((t) => <CustomToast t={t} message={msg} type="warning" />),
  info: (msg) => toast.custom((t) => <CustomToast t={t} message={msg} type="info" />),
};

export default function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}
