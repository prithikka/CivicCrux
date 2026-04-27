import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function OfficerLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

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
        <div className="flex flex-col items-center justify-center p-8 min-h-screen bg-gray-100">
            <div className="card p-8 w-full max-w-md bg-white rounded shadow text-center">
                <div style={{ background: '#e6fcf5', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                </div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-success)' }}>Staff / Admin Login</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" className="input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" className="input w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn w-full mt-2" style={{ background: 'var(--color-success)', color: 'white', border: 'none' }}>Login</button>
                </form>

                <p className="mt-6 text-sm text-gray-600">
                    <Link to="/" className="text-primary hover:underline">Back to Home</Link>
                </p>
            </div>
        </div>
    );
}
