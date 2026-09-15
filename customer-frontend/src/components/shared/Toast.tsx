import React from 'react';
import { useApp } from '../../core/context/AppContext';
import { CheckCircle } from 'lucide-react';

const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-toastSlideUp">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 shadow-2xl border border-slate-700/80 backdrop-blur-md">
        <CheckCircle className="text-emerald-400 shrink-0" size={16} />
        <span className="tracking-normal">{toastMessage}</span>
      </div>
    </div>
  );
};

export default Toast;
