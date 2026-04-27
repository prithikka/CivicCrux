import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center p-8" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f4f7fe, #ffffff)' }}>
            <h1 className="text-5xl font-bold mb-4 text-primary" style={{ letterSpacing: '-1px' }}>CivicCrux</h1>
            <h2 className="text-2xl font-bold mb-2">Making Cities Better, Together</h2>
            <p className="text-gray mb-8 text-lg" style={{ marginTop: '0.5rem', marginBottom: '4rem', maxWidth: '600px', textAlign: 'center' }}>
                The dedicated platform for reporting, tracking, and resolving local civic issues with complete operational transparency.
            </p>

            <div className="flex gap-6 justify-center w-full" style={{ maxWidth: '800px', marginBottom: '3rem' }}>
                <div className="card flex flex-col items-center" style={{ flex: 1, padding: '3rem', textAlign: 'center' }}>
                    <div style={{ background: '#e0e5ff', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>👥</span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ marginBottom: '1rem' }}>Citizen Portal</h2>
                    <p className="text-sm text-gray" style={{ marginBottom: '2rem', minHeight: '40px' }}>
                        Report civic issues like potholes, damaged roads, garbage, and broken street lights directly to the right ward officers.
                    </p>
                    <Link to="/citizen-login" className="btn btn-primary font-bold w-full mb-2 flex items-center justify-center">Log in as Citizen →</Link>
                    <Link to="/citizen-signup" className="text-sm text-primary hover:underline">Or sign up</Link>
                </div>

                <div className="card flex flex-col items-center" style={{ flex: 1, padding: '3rem', textAlign: 'center' }}>
                    <div style={{ background: '#e6fcf5', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ marginBottom: '1rem' }}>Officer Dashboard</h2>
                    <p className="text-sm text-gray" style={{ marginBottom: '2rem', minHeight: '40px' }}>
                        Manage and resolve reported issues in your ward with accountability scoring and automated metrics tracking.
                    </p>
                    <Link to="/officer-login" className="btn font-bold w-full flex items-center justify-center" style={{ background: 'var(--color-success)', color: 'white', border: 'none' }}>Staff Log in →</Link>
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <Link to="/officer-login" className="text-xs font-bold text-gray hover:underline">
                    Enter System Administrator Dashboard
                </Link>
            </div>
        </div>
    );
}
