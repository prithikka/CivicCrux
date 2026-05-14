import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CitizenForgot() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [identifier, setIdentifier] = useState('');
    const [dob, setDob] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/auth/forgot-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, dob })
            });
            const data = await res.json();
            if (res.ok) {
                setResetToken(data.resetToken);
                setStep(2);
            } else {
                setError(data.message || 'Details do not match');
            }
        } catch (err) {
            setError('Server error.');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');

        const minLength = newPassword.length >= 8;
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        if (!minLength || !hasUpper || !hasLower || !hasSpecial) {
            setError('Password must be at least 8 characters, include uppercase, lowercase, and special character.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/forgot-password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, resetToken, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Password updated successfully! Redirecting...');
                setTimeout(() => navigate('/citizen-login'), 2000);
            } else {
                setError(data.message || 'Reset failed');
            }
        } catch (err) {
            setError('Server error.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#f4f7fe', minHeight: '100vh' }}>
            <div className="text-center mb-6 mt-2">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <img src="/logo.png" alt="CivicCrux Logo" style={{ width: '42px', height: '42px' }} />
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', margin: 0 }}>CivicCrux</h1>
                </div>
                <p className="text-sm text-gray" style={{ color: 'var(--text-secondary)' }}>Recover your account access</p>
            </div>

            <div className="bg-white w-full max-w-sm rounded-xl shadow-sm overflow-hidden" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', maxWidth: '400px' }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Reset Password</h2>
                    {error && <p className="text-red-500 mb-4 text-sm font-bold text-center">{error}</p>}
                    {success && <p className="text-green-500 mb-4 text-sm font-bold text-center">{success}</p>}

                    {step === 1 && (
                        <form onSubmit={handleVerify} className="flex flex-col gap-4 text-left border-b border-gray-200 pb-6 mb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <p className="text-xs text-gray-600 mb-2 font-bold" style={{ color: 'var(--text-secondary)' }}>Please enter your registered email/phone and Date of Birth.</p>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Email or Phone</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" className="input w-full" value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder="your.email@example.com" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Date of Birth</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" placeholder="DD/MM/YYYY" className="input w-full" value={dob} onChange={e => setDob(e.target.value)} required style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', background: 'var(--color-primary)' }}>Verify</button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleReset} className="flex flex-col gap-4 text-left border-b border-gray-200 pb-6 mb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? "text" : "password"} className="input w-full" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="8" placeholder="Enter new password" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 2.5rem 0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? "text" : "password"} className="input w-full" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="8" placeholder="Confirm new password" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 2.5rem 0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', background: 'var(--color-primary)' }}>Reset Password</button>
                        </form>
                    )}
                </div>

                <div className="py-4 text-center" style={{ backgroundColor: '#f9fafb' }}>
                    <Link to="/citizen-login" className="text-sm font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
