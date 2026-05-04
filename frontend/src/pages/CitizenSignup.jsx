import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CitizenSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', phone: '', dob: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.username.length < 5) {
            setError('Username must be at least 5 characters long.');
            return;
        }

        const minLength = formData.password.length >= 8;
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasLower = /[a-z]/.test(formData.password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
        if (!minLength || !hasUpper || !hasLower || !hasSpecial) {
            setError('Password must be at least 8 characters, include uppercase, lowercase, and special character.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    dob: formData.dob,
                    password: formData.password
                })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                alert('Signed in successfully');
                navigate('/citizen');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Server error.');
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#f4f7fe', minHeight: '100vh' }}>
            <div className="text-center mb-6 mt-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <img src="/logo.png" alt="CivicCrux Logo" style={{ width: '42px', height: '42px' }} />
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', margin: 0 }}>CivicCrux</h1>
                </div>
                <p className="text-sm text-gray" style={{ color: 'var(--text-secondary)' }}>Create your account to get started</p>
            </div>

            <div className="bg-white w-full max-w-sm rounded-xl shadow-sm overflow-hidden mb-8" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', maxWidth: '400px' }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Citizen Signup</h2>
                    {error && <p className="text-red-500 mb-4 text-sm font-bold text-center">{error}</p>}

                    <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left border-b border-gray-200 pb-6 mb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Username</label>
                            <div style={{ position: 'relative' }}>
                                <input type="text" className="input w-full" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required placeholder="johndoe" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <input type="email" className="input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="your@email.com" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="tel" pattern="\d{10}" minLength="10" maxLength="10" className="input w-full" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="1234567890" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Date of Birth</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="date" className="input w-full" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} required style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.4rem 0.5rem', width: '100%', fontSize: '0.875rem', height: '41.6px' }} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} className="input w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength="8" placeholder="Create a password" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 2.5rem 0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} className="input w-full" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required minLength="8" placeholder="Confirm your password" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 2.5rem 0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', background: 'var(--color-primary)' }}>Create Account</button>
                    </form>
                </div>

                <div className="py-4 text-center" style={{ backgroundColor: '#f9fafb' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
                    <Link to="/citizen-login" className="text-sm font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
}
