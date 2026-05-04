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
        <div className="flex flex-col items-center justify-center p-8 min-h-screen bg-gray-100">
            <div className="card p-8 w-full max-w-md bg-white rounded shadow text-center">
                <h2 className="text-2xl font-bold mb-6 text-primary">Reset Password</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4 font-bold">{success}</p>}

                {step === 1 && (
                    <form onSubmit={handleVerify} className="flex flex-col gap-4 text-left">
                        <p className="text-sm text-gray-600 mb-2">Please enter your registered email/phone and Date of Birth.</p>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email or Phone</label>
                            <input type="text" className="input w-full" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date of Birth</label>
                            <input type="text" placeholder="DD/MM/YYYY" className="input w-full" value={dob} onChange={e => setDob(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-2">Verify</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleReset} className="flex flex-col gap-4 text-left">
                        <div>
                            <label className="block text-sm font-medium mb-1">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} className="input w-full" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="8" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} className="input w-full" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="8" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-2">Reset Password</button>
                    </form>
                )}

                <p className="mt-6 text-sm text-gray-600">
                    <Link to="/citizen-login" className="text-primary hover:underline">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
