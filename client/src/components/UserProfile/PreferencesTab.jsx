import React from 'react';

const PreferencesTab = () => {
    return (
        <div className="store-card fill-card">
            <h3 className="tc-6533 bold-text mb-4">Preferences & Settings</h3>

            {/* Notification Preferences */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Notifications</h5>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="emailNotifications" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="emailNotifications">
                        Email notifications for orders and promotions
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="smsNotifications" />
                    <label className="form-check-label tc-6533" htmlFor="smsNotifications">
                        SMS notifications for order updates
                    </label>
                </div>
            </div>

            {/* Language & Currency */}
            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Language</label>
                    <select className="form-select">
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="es">Español</option>
                    </select>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Currency</label>
                    <select className="form-select">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default PreferencesTab;