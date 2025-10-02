import React from 'react';

const PasswordChangeModal = ({ 
    onClose, 
    passwordData, 
    setPasswordData, 
    passwordErrors, 
    showPasswords, 
    handlePasswordSubmit, 
    handlePasswordChange, 
    togglePasswordVisibility, 
    getPasswordStrength, 
    validatePassword 
}) => {
    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title tc-6533 fw-bold">Change Password</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="modal-body">
                            {/* Current Password */}
                            <div className="mb-3">
                                <label className="form-label tc-6533 fw-semibold">Current Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        name="currentPassword"
                                        className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter your current password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => togglePasswordVisibility('current')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            {showPasswords.current ? (
                                                <path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                                            ) : (
                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {passwordErrors.currentPassword && (
                                    <div className="invalid-feedback d-block">
                                        {passwordErrors.currentPassword}
                                    </div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="mb-3">
                                <label className="form-label tc-6533 fw-semibold">New Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        name="newPassword"
                                        className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter your new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => togglePasswordVisibility('new')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            {showPasswords.new ? (
                                                <path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                                            ) : (
                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {passwordErrors.newPassword && (
                                    <div className="invalid-feedback d-block">
                                        {passwordErrors.newPassword}
                                    </div>
                                )}

                                {/* Password Strength Indicator */}
                                {passwordData.newPassword && (
                                    <div className="mt-2">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="text-muted">Password Strength:</small>
                                            <small className={`text-${getPasswordStrength(passwordData.newPassword).color}`}>
                                                {getPasswordStrength(passwordData.newPassword).label}
                                            </small>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className={`progress-bar bg-${getPasswordStrength(passwordData.newPassword).color}`}
                                                style={{ width: `${getPasswordStrength(passwordData.newPassword).strength}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-2">
                                            <small className="text-muted">Requirements:</small>
                                            <ul className="list-unstyled mt-1">
                                                {validatePassword(passwordData.newPassword).map((error, index) => (
                                                    <li key={index} className="small text-muted">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5A1.5,1.5 0 0,1 10.5,9A1.5,1.5 0 0,1 12,7.5A1.5,1.5 0 0,1 13.5,9A1.5,1.5 0 0,1 12,10.5Z" />
                                                        </svg>
                                                        {error}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-3">
                                <label className="form-label tc-6533 fw-semibold">Confirm New Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        name="confirmPassword"
                                        className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm your new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            {showPasswords.confirm ? (
                                                <path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                                            ) : (
                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                {passwordErrors.confirmPassword && (
                                    <div className="invalid-feedback d-block">
                                        {passwordErrors.confirmPassword}
                                    </div>
                                )}
                                {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                                    <div className="text-success mt-1">
                                        <small>
                                            <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                            </svg>
                                            Passwords match
                                        </small>
                                    </div>
                                )}
                            </div>

                            {/* Security Tips */}
                            <div className="alert alert-info">
                                <h6 className="alert-heading">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                    </svg>
                                    Security Tips
                                </h6>
                                <ul className="mb-0 small">
                                    <li>Use a unique password you don't use elsewhere</li>
                                    <li>Include a mix of letters, numbers, and symbols</li>
                                    <li>Avoid personal information like names or dates</li>
                                    <li>Consider using a password manager</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary btn-rd" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-c-2101 btn-rd"
                                disabled={
                                    !passwordData.currentPassword ||
                                    !passwordData.newPassword ||
                                    !passwordData.confirmPassword ||
                                    validatePassword(passwordData.newPassword).length > 0 ||
                                    passwordData.newPassword !== passwordData.confirmPassword
                                }
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="white">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                </svg>
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordChangeModal;