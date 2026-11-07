import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'teal' | 'emerald' | 'amber' | 'rose' | 'blue';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', size = 'sm' }) => {
  const styles = {
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    teal: 'bg-teal-950/60 text-teal-300 border-teal-700/60',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-700/60',
    blue: 'bg-blue-950/60 text-blue-300 border-blue-700/60'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded border ${styles[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
