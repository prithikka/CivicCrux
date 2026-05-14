import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

export default function CitizenDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token found. Please go back to Home and login.');

                const userRes = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) setUser(await userRes.json());

                const res = await fetch('http://localhost:5000/api/complaints/my', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch issues');

                const data = await res.json();
                setIssues(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, []);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header
                title="My Civic Reports"
                user={user.username ? `${user.username} (Citizen)` : (user.name ? `${user.name} (Citizen)` : (user.email ? `${user.email.split('@')[0]} (Citizen)` : "Citizen"))}
                extraAction={
                    <Link to="/report" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none' }}>+ Report New Issue</Link>
                }
            />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                <div className="flex gap-4" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <StatCard count={issues.length} label="Total Issues" />
                    <StatCard count={issues.filter(i => i.status === 'REPORTED').length} label="Reported" />
                    <StatCard count={issues.filter(i => i.status === 'IN PROGRESS').length} label="In Process" />
                    <StatCard count={issues.filter(i => i.status === 'RESOLVED').length} label="Resolved" />
                </div>

                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="flex gap-2 text-sm font-bold flex-wrap">
                        <button 
                            className={filterStatus === 'All' ? 'btn btn-primary' : 'btn btn-outline'} 
                            style={{ borderRadius: '999px', padding: '0.25rem 1rem', ...(filterStatus !== 'All' ? { border: 'none', color: 'var(--text-secondary)' } : {}) }}
                            onClick={() => setFilterStatus('All')}
                        >All Issues</button>
                        <button 
                            className={filterStatus === 'REPORTED' ? 'btn btn-primary' : 'btn btn-outline'} 
                            style={{ borderRadius: '999px', padding: '0.25rem 1rem', ...(filterStatus !== 'REPORTED' ? { border: 'none', color: 'var(--text-secondary)' } : {}) }}
                            onClick={() => setFilterStatus('REPORTED')}
                        >Reported</button>
                        <button 
                            className={filterStatus === 'IN PROGRESS' ? 'btn btn-primary' : 'btn btn-outline'} 
                            style={{ borderRadius: '999px', padding: '0.25rem 1rem', ...(filterStatus !== 'IN PROGRESS' ? { border: 'none', color: 'var(--text-secondary)' } : {}) }}
                            onClick={() => setFilterStatus('IN PROGRESS')}
                        >In Process</button>
                        <button 
                            className={filterStatus === 'RESOLVED' ? 'btn btn-primary' : 'btn btn-outline'} 
                            style={{ borderRadius: '999px', padding: '0.25rem 1rem', ...(filterStatus !== 'RESOLVED' ? { border: 'none', color: 'var(--text-secondary)' } : {}) }}
                            onClick={() => setFilterStatus('RESOLVED')}
                        >Resolved</button>
                    </div>
                </div>

                {loading ? <p>Loading issues...</p> : (
                    <div className="flex flex-col gap-4">
                        {issues.filter(i => filterStatus === 'All' || i.status === filterStatus).length === 0 && <p className="text-gray text-center p-8">No issues found.</p>}
                        {issues.filter(i => filterStatus === 'All' || i.status === filterStatus).map(issue => (
                            <IssueCard key={issue._id} issue={{ ...issue, id: issue._id }} isOfficer={false} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
