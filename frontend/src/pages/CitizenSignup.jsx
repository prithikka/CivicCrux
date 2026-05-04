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
        <div className="flex flex-col items-center justify-center p-8 min-h-screen bg-gray-100">
            <div className="card p-8 w-full max-w-md bg-white rounded shadow text-center">
                <h2 className="text-2xl font-bold mb-6 text-primary">Citizen Signup</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input type="text" className="input w-full" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" className="input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input type="tel" className="input w-full" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                        <input type="text" placeholder="DD/MM/YYYY" className="input w-full" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPassword ? "text" : "password"} className="input w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength="8" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPassword ? "text" : "password"} className="input w-full" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required minLength="8" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4">Sign Up</button>
                </form>

                <p className="mt-6 text-sm text-gray-600">
                    Already have an account? <Link to="/citizen-login" className="text-primary hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
