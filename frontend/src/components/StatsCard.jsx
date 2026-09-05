import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'from-primary-500/20 to-primary-600/5 border-primary-500/20',
  success: 'from-green-500/20 to-green-600/5 border-green-500/20',
  warning: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20',
  danger: 'from-red-500/20 to-red-600/5 border-red-500/20',
  info: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
};

const ICON_COLORS = {
  primary: 'text-primary-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
  info: 'text-cyan-400',
};

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendValue, variant = 'primary' }) {
  const trendUp = trend === 'up';
  const trendDown = trend === 'down';
  const trendNeutral = trend === 'neutral';

  return (
    <div className={clsx(
      'card bg-gradient-to-br border',
      VARIANTS[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-dark-800/50',
            ICON_COLORS[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {(trendValue !== undefined) && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-dark-700/30">
          {trendUp && <TrendingUp className="w-4 h-4 text-green-400" />}
          {trendDown && <TrendingDown className="w-4 h-4 text-red-400" />}
          {trendNeutral && <Minus className="w-4 h-4 text-gray-400" />}
          <span className={clsx(
            'text-sm font-medium',
            trendUp && 'text-green-400',
            trendDown && 'text-red-400',
            trendNeutral && 'text-gray-400'
          )}>
            {trendValue}
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
}
