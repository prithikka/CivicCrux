import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CitizenLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/auth/citizen-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                alert('Logged in successfully');
                navigate('/citizen');
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
                <h2 className="text-2xl font-bold mb-6 text-primary">Citizen Login</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input type="text" className="input w-full" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" className="input w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-2">Login</button>
                </form>

                <div className="mt-6 flex flex-col gap-2 text-sm text-gray-600">
                    <p>
                        Don't have an account? <Link to="/citizen-signup" className="text-primary hover:underline">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
