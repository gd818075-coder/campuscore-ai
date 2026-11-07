import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: string;
  badge?: string;
  variant?: 'default' | 'teal' | 'amber' | 'emerald' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'border-slate-800 bg-slate-900/90 text-slate-100',
    teal: 'border-teal-800/40 bg-teal-950/20 text-teal-300',
    amber: 'border-amber-800/40 bg-amber-950/20 text-amber-300',
    emerald: 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300',
    rose: 'border-rose-800/40 bg-rose-950/20 text-rose-300'
  };

  const iconColors = {
    default: 'text-slate-400 bg-slate-800',
    teal: 'text-teal-400 bg-teal-900/40',
    amber: 'text-amber-400 bg-amber-900/40',
    emerald: 'text-emerald-400 bg-emerald-900/40',
    rose: 'text-rose-400 bg-rose-900/40'
  };

  return (
    <div className={`p-4 rounded-lg border shadow-xs transition-colors ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded-md ${iconColors[variant]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {badge && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="text-teal-400 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
};
