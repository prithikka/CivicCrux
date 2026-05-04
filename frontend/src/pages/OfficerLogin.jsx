import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function OfficerLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/auth/officer-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                alert('Logged in successfully');
                // Redirect based on role
                if (data.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/officer');
                }
            } else {
                setError(data.message || 'Login failed');
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
                <p className="text-sm text-gray" style={{ color: 'var(--text-secondary)' }}>Log in to your staff portal to manage issues</p>
            </div>

            <div className="bg-white w-full max-w-sm rounded-xl shadow-sm overflow-hidden" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', maxWidth: '400px' }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Staff / Admin Login</h2>
                    {error && <p className="text-red-500 mb-4 text-sm font-bold text-center">{error}</p>}

                    <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left border-b border-gray-200 pb-6 mb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Staff Email</label>
                            <div style={{ position: 'relative' }}>
                                <input type="email" className="input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="your.email@civiccrux.com" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} className="input w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required placeholder="Enter your password" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem 2.5rem 0.6rem 0.75rem', width: '100%', fontSize: '0.875rem' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn w-full mt-2" style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', background: '#000000', color: 'white' }}>Sign In</button>
                    </form>
                </div>

                <div className="py-4 text-center" style={{ backgroundColor: '#f9fafb' }}>
                    <Link to="/" className="text-sm font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
