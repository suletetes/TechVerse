import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAuthSecurity } from '../../hooks/useAuthSecurity.js';
import {
    User,
    Shield,
    Clock,
    AlertTriangle,
    CheckCircle,
    Settings,
    LogOut,
    Smartphone
} from 'lucide-react';

const AuthStatus = ({ showDetails = false, className = '' }) => {
    const navigate = useNavigate();
    const {
        user,
        isAuthenticated,
        isFullyAuthenticated,
        getTimeUntilExpiry,
        isSessionExpiringSoon,
        logout
    } = useAuth();

    const { getSecurityRecommendations } = useAuthSecurity();
    const [recommendations, setRecommendations] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);

    // Update session time
    useEffect(() => {
        if (isAuthenticated) {
            const updateTime = () => {
                setTimeLeft(getTimeUntilExpiry());
            };

            updateTime();
            const interval = setInterval(updateTime, 1000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, getTimeUntilExpiry]);

    // Update security recommendations
    useEffect(() => {
        if (isAuthenticated) {
            setRecommendations(getSecurityRecommendations());
        }
    }, [isAuthenticated, getSecurityRecommendations]);

    const formatTime = (ms) => {
        if (!ms) return 'Unknown';

        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    const getStatusColor = () => {
        if (!isAuthenticated) return 'text-gray-500';
        if (!isFullyAuthenticated()) return 'text-yellow-600';
        if (isSessionExpiringSoon()) return 'text-orange-600';
        if (recommendations.some(r => r.priority === 'critical')) return 'text-red-600';
        return 'text-green-600';
    };

    const getStatusIcon = () => {
        if (!isAuthenticated) return User;
        if (!isFullyAuthenticated()) return AlertTriangle;
        if (isSessionExpiringSoon()) return Clock;
        if (recommendations.some(r => r.priority === 'critical')) return Shield;
        return CheckCircle;
    };

    const StatusIcon = getStatusIcon();

    if (!showDetails) {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
                <span className={`text-sm ${getStatusColor()}`}>
                    {isAuthenticated ? user?.name || user?.email : 'Not signed in'}
                </span>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
                {isAuthenticated && (
                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isAuthenticated ? (
                <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                    </div>

                    {/* Authentication Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-700">Signed In</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {user?.isEmailVerified ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700">Email Verified</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-gray-700">Email Pending</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {user?.mfaEnabled ? (
                                <>
                                    <Shield className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700">2FA Enabled</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-gray-700">2FA Disabled</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Clock className={`w-4 h-4 ${isSessionExpiringSoon() ? 'text-orange-600' : 'text-green-600'}`} />
                            <span className="text-sm text-gray-700">
                                {formatTime(timeLeft)} left
                            </span>
                        </div>
                    </div>

                    {/* Security Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Security Recommendations
                            </h4>
                            <div className="space-y-2">
                                {recommendations.slice(0, 3).map((rec, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start space-x-2 p-2 rounded-lg ${rec.priority === 'critical' ? 'bg-red-50' :
                                            rec.priority === 'high' ? 'bg-orange-50' : 'bg-yellow-50'
                                            }`}
                                    >
                                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${rec.priority === 'critical' ? 'text-red-600' :
                                            rec.priority === 'high' ? 'text-orange-600' : 'text-yellow-600'
                                            }`} />
                                        <p className="text-xs text-gray-700">{rec.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="border-t pt-4">
                        <div className="flex space-x-2">
                            <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>

                            {!user?.mfaEnabled && (
                                <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">
                                    <Smartphone className="w-4 h-4" />
                                    <span>Setup 2FA</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You are not signed in</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Sign In
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthStatus;