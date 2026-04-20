import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

export default function OfficerDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token found. Please go back to Home and auto login.');

                const userRes = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) setUser(await userRes.json());

                const res = await fetch('http://localhost:5000/api/complaints/officer', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch officer issues or unauthorized.');

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
                title="Officer Dashboard"
                user={user.name || "Loading..."}
                ward={user.ward || "..."}
            />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                <div className="flex gap-4" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <StatCard count={issues.length} label="Total Issues" />
                    <StatCard count={issues.filter(i => i.status === 'REPORTED').length} label="Reported" />
                    <StatCard count={issues.filter(i => i.status === 'IN PROGRESS').length} label="In Process" />
                    <StatCard count={issues.filter(i => i.status === 'RESOLVED').length} label="Resolved" />
                    <StatCard count={issues.filter(i => i.status === 'ESCALATED').length} label="Escalated" />
                </div>

                <div className="card flex flex-col gap-2" style={{ marginBottom: '2rem' }}>
                    <div className="text-sm font-bold text-gray mb-2">Filter Issues</div>
                    <div className="flex gap-2 text-sm font-bold flex-wrap">
                        <button className="btn" style={{ background: 'var(--color-success)', color: 'white', borderRadius: '999px', padding: '0.25rem 1rem' }}>All {user.ward} Issues</button>
                    </div>
                </div>

                {loading ? <p>Loading issues for your ward...</p> : (
                    <div className="flex flex-col gap-4">
                        {issues.length === 0 && <p className="text-gray text-center p-8">No issues found in your designated ward.</p>}
                        {issues.map(issue => (
                            <IssueCard key={issue._id} issue={{ ...issue, id: issue._id }} isOfficer={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
