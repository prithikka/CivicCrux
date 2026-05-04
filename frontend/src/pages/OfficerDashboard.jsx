import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

export default function OfficerDashboard() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});
    const [filterStatus, setFilterStatus] = useState('ALL');

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
                setIssues(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
                setIssues([]);
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
                user={user.username ? user.username : (user.name || "Loading...")}
                ward={user.ward || "..."}
            />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                <div className="flex gap-4" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <StatCard count={issues.length} label="Total Issues" />
                    <StatCard count={issues.filter(i => i.status?.toUpperCase() === 'REPORTED').length} label="Reported" />
                    <StatCard count={issues.filter(i => i.status?.toUpperCase() === 'IN PROGRESS' || i.status?.toUpperCase() === 'IN PROCESS').length} label="In Process" />
                    <StatCard count={issues.filter(i => i.status?.toUpperCase() === 'RESOLVED').length} label="Resolved" />
                    <StatCard count={issues.filter(i => i.status?.toUpperCase() === 'ESCALATED' || i.status?.toUpperCase() === 'REOPENED').length} label="Escalated" />
                </div>

                <div className="card flex flex-col gap-2" style={{ marginBottom: '2rem' }}>
                    <div className="text-sm font-bold text-gray mb-2">Filter Issues</div>
                    <div className="flex gap-2 text-sm font-bold flex-wrap">
                        {['ALL', 'REPORTED', 'IN PROGRESS', 'RESOLVED', 'ESCALATED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className="btn hover:opacity-90"
                                style={{
                                    background: filterStatus === status ? 'var(--color-success)' : '#e2e8f0',
                                    color: filterStatus === status ? 'white' : 'var(--text-primary)',
                                    borderRadius: '999px', padding: '0.25rem 1rem', transition: 'all 0.2s'
                                }}>
                                {status === 'ALL' ? `All ${user.ward || 'Ward'} Issues` : status}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? <p className="text-gray text-center p-8 font-bold">Loading issues for your ward...</p> : (
                    <div className="flex flex-col gap-4">
                        {issues.length === 0 && <p className="text-gray text-center p-8">No issues found in your designated ward.</p>}
                        {issues.length > 0 && issues.filter(issue => filterStatus === 'ALL' || issue.status?.toUpperCase() === filterStatus || (filterStatus === 'ESCALATED' && issue.status?.toUpperCase() === 'REOPENED') || (filterStatus === 'IN PROGRESS' && issue.status?.toUpperCase() === 'IN PROCESS')).length === 0 && (
                            <p className="text-gray text-center p-8">No issues found for status: {filterStatus}.</p>
                        )}
                        {issues
                            .filter(issue => filterStatus === 'ALL' || issue.status?.toUpperCase() === filterStatus || (filterStatus === 'ESCALATED' && issue.status?.toUpperCase() === 'REOPENED') || (filterStatus === 'IN PROGRESS' && issue.status?.toUpperCase() === 'IN PROCESS'))
                            .map(issue => (
                                <IssueCard key={issue._id} issue={{ ...issue, id: issue._id }} isOfficer={true} />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
