import React, { useState } from 'react';
import { X, Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const SecurityAlert = ({ alert, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const getAlertConfig = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'high':
        return {
          icon: Shield,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600'
        };
      case 'medium':
        return {
          icon: Info,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  const config = getAlertConfig(alert.priority);
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg
      transform transition-all duration-300 ease-in-out
      ${config.bgColor} ${config.borderColor}
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
        
        <div className="flex-1">
          <h4 className={`font-medium ${config.textColor}`}>
            Security Alert
          </h4>
          <p className={`mt-1 text-sm ${config.textColor}`}>
            {alert.message}
          </p>
          
          {alert.action && (
            <button
              onClick={alert.action.handler}
              className={`
                mt-2 px-3 py-1 text-xs font-medium rounded
                ${config.textColor} hover:bg-opacity-20 hover:bg-current
                transition-colors duration-200
              `}
            >
              {alert.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className={`
            p-1 rounded hover:bg-opacity-20 hover:bg-current
            ${config.textColor} transition-colors duration-200
          `}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SecurityAlert;