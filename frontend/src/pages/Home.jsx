import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    const handleCitizenLogin = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Rahul M.', email: 'rahul@civiccrux.com', password: 'password123' })
            });
            let data = await res.json();
            if (!res.ok && data.message === 'User already exists') {
                const loginRes = await fetch('http://localhost:5000/api/auth/citizen-login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'rahul@civiccrux.com', password: 'password123' })
                });
                data = await loginRes.json();
            }
            localStorage.setItem('token', data.token);
            navigate('/citizen');
        } catch (err) { console.error(err); alert('Ensure backend is running on 5000'); }
    };

    const handleOfficerLogin = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/officer-login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'john@civiccrux.com', password: 'password123' })
            });
            let data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                navigate('/officer');
            } else {
                alert('Invalid logic. Please run node seeder.js -i first');
            }
        } catch (err) { console.error(err); alert('Ensure backend is running on 5000'); }
    };

    const handleAdminLogin = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/officer-login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@civiccrux.com', password: 'password123' })
            });
            let data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                navigate('/admin');
            } else {
                alert('Invalid logic. Please run node seeder.js -i first');
            }
        } catch (err) { console.error(err); alert('Ensure backend is running on 5000'); }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f4f7fe, #ffffff)' }}>
            <h1 className="text-5xl font-bold mb-4 text-primary" style={{ letterSpacing: '-1px' }}>CivicCrux</h1>
            <h2 className="text-2xl font-bold mb-2">Making Cities Better, Together</h2>
            <p className="text-gray mb-8 text-lg" style={{ marginTop: '0.5rem', marginBottom: '4rem', maxWidth: '600px', textAlign: 'center' }}>
                The dedicated platform for reporting, tracking, and resolving local civic issues with complete operational transparency.
            </p>

            <div className="flex gap-6 justify-center w-full" style={{ maxWidth: '800px', marginBottom: '3rem' }}>
                <div onClick={handleCitizenLogin} className="card flex flex-col items-center" style={{ flex: 1, padding: '3rem', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                    <div style={{ background: '#e0e5ff', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>👥</span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ marginBottom: '1rem' }}>Citizen Portal</h2>
                    <p className="text-sm text-gray" style={{ marginBottom: '2rem', minHeight: '40px' }}>
                        Report civic issues like potholes, damaged roads, garbage, and broken street lights directly to the right ward officers.
                    </p>
                    <button className="btn btn-primary font-bold">Auto Log in as Citizen →</button>
                </div>

                <div onClick={handleOfficerLogin} className="card flex flex-col items-center" style={{ flex: 1, padding: '3rem', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                    <div style={{ background: '#e6fcf5', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ marginBottom: '1rem' }}>Officer Dashboard</h2>
                    <p className="text-sm text-gray" style={{ marginBottom: '2rem', minHeight: '40px' }}>
                        Manage and resolve reported issues in your ward with accountability scoring and automated metrics tracking.
                    </p>
                    <button className="btn font-bold" style={{ background: 'var(--color-success)', color: 'white', border: 'none' }}>Auto Log in as Officer →</button>
                </div>
            </div>

            <div onClick={handleAdminLogin} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <p className="text-xs font-bold text-gray" style={{ textDecoration: 'underline' }}>Enter System Administrator Dashboard (Demo Setup)</p>
            </div>
        </div>
    );
}
