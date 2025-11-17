import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function DashboardWidget({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  colorScheme = "purple"
}) {
  const colorClasses = {
    purple: {
      bg: "from-purple-200 to-blue-200",
      icon: "text-purple-600",
      text: "text-purple-600",
      value: "from-purple-600 to-blue-600"
    },
    green: {
      bg: "from-green-200 to-emerald-200",
      icon: "text-green-600",
      text: "text-green-600",
      value: "text-green-600"
    },
    blue: {
      bg: "from-blue-200 to-cyan-200",
      icon: "text-blue-600",
      text: "text-blue-600",
      value: "text-blue-600"
    },
    amber: {
      bg: "from-amber-200 to-orange-200",
      icon: "text-amber-600",
      text: "text-amber-600",
      value: "text-amber-600"
    }
  };

  const colors = colorClasses[colorScheme] || colorClasses.purple;

  return (
    <div className="clay-card p-6 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend && (
          trend === 'up' ? 
            <TrendingUp className="w-5 h-5 text-green-500" /> : 
            <TrendingDown className="w-5 h-5 text-red-500" />
        )}
      </div>
      <p className={`${colors.text} text-sm font-medium`}>{title}</p>
      <p className={`text-4xl font-bold ${colorScheme === 'green' || colorScheme === 'blue' || colorScheme === 'amber' ? colors.value : `bg-gradient-to-r ${colors.value} bg-clip-text text-transparent`} mt-2`}>
        {value}
      </p>
      <p className={`text-xs ${colors.text} opacity-70 mt-2`}>
        {subtitle}
        {trendValue && ` • ${trendValue}`}
      </p>
    </div>
  );
}