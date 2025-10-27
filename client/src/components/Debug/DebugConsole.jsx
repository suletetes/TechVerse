import React, { useState, useEffect } from 'react';
import { dataDebugger } from '../../utils/dataDebugger';

const DebugConsole = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [report, setReport] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        if (autoRefresh && isVisible) {
            const interval = setInterval(() => {
                setReport(dataDebugger.getReport());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, isVisible]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl + Shift + D to toggle debug console
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                setIsVisible(!isVisible);
                if (!isVisible) {
                    setReport(dataDebugger.getReport());
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isVisible]);

    const runTests = async () => {
        try {
            await dataDebugger.testUserProfileOperations();
            await dataDebugger.testAdminOperations();
            setReport(dataDebugger.getReport());
        } catch (error) {
            console.error('Test failed:', error);
        }
    };

    if (!isVisible) {
        return (
            <div 
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}
                onClick={() => setIsVisible(true)}
                title="Click to open debug console (Ctrl+Shift+D)"
            >
                🐛 DEBUG
            </div>
        );
    }

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '400px',
                maxHeight: '500px',
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                border: '1px solid #333',
                borderRadius: '8px',
                zIndex: 9999,
                fontFamily: 'monospace',
                fontSize: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
        >
            {/* Header */}
            <div style={{
                backgroundColor: '#007bff',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 'bold' }}>🐛 Debug Console</span>
                <div>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            marginRight: '8px',
                            fontSize: '12px'
                        }}
                        title="Toggle auto-refresh"
                    >
                        {autoRefresh ? '⏸️' : '▶️'}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {/* Action Buttons */}
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={runTests}
                        style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        🧪 Run Tests
                    </button>
                    <button
                        onClick={() => setReport(dataDebugger.getReport())}
                        style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => dataDebugger.clear()}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        🗑️ Clear
                    </button>
                    <button
                        onClick={() => dataDebugger.export()}
                        style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        💾 Export
                    </button>
                </div>

                {/* Report */}
                {report && (
                    <div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>Summary:</strong>
                        </div>
                        <div style={{ 
                            backgroundColor: '#2d2d2d', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginBottom: '12px'
                        }}>
                            <div>Total Logs: {report.totalLogs}</div>
                            <div style={{ color: '#dc3545' }}>Errors: {report.errors.length}</div>
                            <div>Categories: {report.categories.join(', ')}</div>
                        </div>

                        {/* Category Summary */}
                        <div style={{ marginBottom: '8px' }}>
                            <strong>By Category:</strong>
                        </div>
                        <div style={{ 
                            backgroundColor: '#2d2d2d', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginBottom: '12px'
                        }}>
                            {Object.entries(report.summary).map(([category, stats]) => (
                                <div key={category} style={{ marginBottom: '4px' }}>
                                    <span style={{ color: '#ffc107' }}>{category}:</span> 
                                    <span style={{ color: '#28a745', marginLeft: '8px' }}>✅ {stats.success}</span>
                                    <span style={{ color: '#dc3545', marginLeft: '8px' }}>❌ {stats.errors}</span>
                                </div>
                            ))}
                        </div>

                        {/* Recent Errors */}
                        {report.errors.length > 0 && (
                            <>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong style={{ color: '#dc3545' }}>Recent Errors:</strong>
                                </div>
                                <div style={{ 
                                    backgroundColor: '#2d2d2d', 
                                    padding: '8px', 
                                    borderRadius: '4px',
                                    maxHeight: '150px',
                                    overflowY: 'auto'
                                }}>
                                    {report.errors.slice(-5).map((log, index) => (
                                        <div key={index} style={{ 
                                            marginBottom: '8px', 
                                            paddingBottom: '8px',
                                            borderBottom: '1px solid #444'
                                        }}>
                                            <div style={{ color: '#ffc107' }}>
                                                {log.category} - {log.action}
                                            </div>
                                            <div style={{ color: '#dc3545', fontSize: '10px' }}>
                                                {log.error}
                                            </div>
                                            <div style={{ color: '#6c757d', fontSize: '10px' }}>
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div style={{ 
                    marginTop: '12px', 
                    fontSize: '10px', 
                    color: '#6c757d',
                    textAlign: 'center'
                }}>
                    Press Ctrl+Shift+D to toggle • F12 for browser console
                </div>
            </div>
        </div>
    );
};

export default DebugConsole;