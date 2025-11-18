import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onClose, action }) => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    const handleAction = () => {
        if (action?.onClick) {
            action.onClick();
        } else if (action?.path) {
            navigate(action.path);
        }
        onClose();
    };

    return (
        <div className={`toast-notification toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            {action && (
                <button className="toast-action" onClick={handleAction}>
                    {action.label || 'View'}
                </button>
            )}
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
};

export default Toast;
