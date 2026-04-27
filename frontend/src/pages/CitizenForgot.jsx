import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function CitizenForgot() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
        }
    }, []);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const appVerifier = window.recaptchaVerifier;
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep(2);
        } catch (err) {
            setError('Failed to send OTP. Try again.');
            console.error(err);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await confirmationResult.confirm(otp);
            setStep(3);
        } catch (err) {
            setError('Invalid OTP code.');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const res = await fetch('http://localhost:5000/api/auth/citizen-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone, newPassword })
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

                <div id="recaptcha-container"></div>

                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600 mb-2">Enter phone number to receive reset OTP</p>
                        <input type="tel" placeholder="Phone Number" className="input" value={phone} onChange={e => setPhone(e.target.value)} required />
                        <button type="submit" className="btn btn-primary w-full">Send OTP</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                        <input type="text" placeholder="6-digit OTP" className="input" value={otp} onChange={e => setOtp(e.target.value)} required />
                        <button type="submit" className="btn btn-primary w-full">Verify OTP</button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleReset} className="flex flex-col gap-4 text-left">
                        <div>
                            <label className="block text-sm font-medium mb-1">New Password</label>
                            <input type="password" className="input w-full" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="6" />
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
