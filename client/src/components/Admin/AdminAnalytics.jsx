import React from 'react';

const AdminAnalytics = ({ 
    dashboardStats, 
    formatCurrency, 
    exportData, 
    setExportData, 
    handleExport 
}) => {
    return (
        <div className="row">
            <div className="col-12 mb-4">
                <h2>Analytics & Reports</h2>
                <p className="text-muted">Detailed insights and performance metrics</p>
            </div>
            
            {/* Performance Metrics */}
            <div className="col-md-4 mb-4">
                <div className="card">
                    <div className="card-body text-center">
                        <h5 className="card-title">Conversion Rate</h5>
                        <h2 className="text-success">{dashboardStats.conversionRate}%</h2>
                        <small className="text-muted">+0.3% from last month</small>
                    </div>
                </div>
            </div>
            <div className="col-md-4 mb-4">
                <div className="card">
                    <div className="card-body text-center">
                        <h5 className="card-title">Avg Order Value</h5>
                        <h2 className="text-primary">{formatCurrency(dashboardStats.avgOrderValue)}</h2>
                        <small className="text-muted">+£5.20 from last month</small>
                    </div>
                </div>
            </div>
            <div className="col-md-4 mb-4">
                <div className="card">
                    <div className="card-body text-center">
                        <h5 className="card-title">Customer Satisfaction</h5>
                        <h2 className="text-warning">{dashboardStats.customerSatisfaction}/5</h2>
                        <small className="text-muted">Based on 1,247 reviews</small>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Export Data</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Data Type</label>
                                <select 
                                    className="form-select"
                                    value={exportData.type}
                                    onChange={(e) => setExportData(prev => ({...prev, type: e.target.value}))}
                                >
                                    <option value="">Select type</option>
                                    <option value="orders">Orders</option>
                                    <option value="products">Products</option>
                                    <option value="users">Users</option>
                                    <option value="analytics">Analytics</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Format</label>
                                <select 
                                    className="form-select"
                                    value={exportData.format}
                                    onChange={(e) => setExportData(prev => ({...prev, format: e.target.value}))}
                                >
                                    <option value="csv">CSV</option>
                                    <option value="xlsx">Excel</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Date Range</label>
                                <select 
                                    className="form-select"
                                    value={exportData.dateRange}
                                    onChange={(e) => setExportData(prev => ({...prev, dateRange: e.target.value}))}
                                >
                                    <option value="7days">Last 7 days</option>
                                    <option value="30days">Last 30 days</option>
                                    <option value="90days">Last 90 days</option>
                                    <option value="1year">Last year</option>
                                    <option value="all">All time</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">&nbsp;</label>
                                <button 
                                    className="btn btn-primary w-100"
                                    onClick={() => handleExport(exportData.type)}
                                    disabled={!exportData.type || exportData.loading}
                                >
                                    {exportData.loading ? 'Exporting...' : 'Export Data'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;