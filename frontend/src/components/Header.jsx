import React from 'react';
import { Link } from 'react-router-dom';

export default function Header({ title, user, ward, onLogout, extraAction }) {
    return (
        <header className="header flex justify-between items-center" style={{ padding: '1.25rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
            {/* Brand & Context */}
            <div className="flex items-center gap-6">
                <Link to="/" className="text-primary font-bold text-2xl" style={{ letterSpacing: '-0.5px' }}>CivicCrux</Link>
                <div style={{ paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0' }}>
                    <h1 className="text-xl font-bold" style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h1>
                </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-6">
                {extraAction && <div>{extraAction}</div>}
                {user && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray">
                            Welcome, <span className="font-bold text-primary">{user} {ward ? `(${ward})` : ''}</span>
                        </span>
                        <Link to="/" onClick={onLogout} className="btn btn-outline text-sm font-bold" style={{ padding: '0.4rem 1rem' }}>Logout</Link>
                    </div>
                )}
            </div>
        </header>
    );
}
