import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

export default function AdminDashboard() {
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

                const res = await fetch('http://localhost:5000/api/complaints', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch global complaints or unauthorized.');

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

    // Compute Metrics
    const wardMetrics = {};
    const officerMetrics = {};

    issues.forEach(issue => {
        // Ward processing
        if (!wardMetrics[issue.ward]) wardMetrics[issue.ward] = { total: 0, resolved: 0, pending: 0 };
        wardMetrics[issue.ward].total++;
        if (issue.status === 'RESOLVED') wardMetrics[issue.ward].resolved++;
        else wardMetrics[issue.ward].pending++;

        // Officer processing
        if (issue.assignedTo) {
            const officerName = issue.assignedTo.name || 'Unknown Officer';
            if (!officerMetrics[officerName]) officerMetrics[officerName] = { total: 0, resolved: 0 };
            officerMetrics[officerName].total++;
            if (issue.status === 'RESOLVED') officerMetrics[officerName].resolved++;
        }
    });

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header
                title="Admin Oversight Dashboard"
                user={user.name ? `${user.name} (Admin)` : "Loading..."}
            />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                <div className="flex gap-4" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <StatCard count={issues.length} label="Total Issues Network-Wide" />
                    <StatCard count={issues.filter(i => i.status === 'REPORTED').length} label="New / Reported" />
                    <StatCard count={issues.filter(i => i.status === 'IN PROGRESS').length} label="In Process" />
                    <StatCard count={issues.filter(i => i.status === 'RESOLVED').length} label="Successfully Resolved" />
                </div>

                {/* Analytics Section */}
                {!loading && !error && (
                    <div className="flex gap-6 flex-wrap" style={{ marginBottom: '2rem' }}>
                        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                            <h3 className="text-lg font-bold mb-4">Ward Performance</h3>
                            <div className="flex flex-col gap-4">
                                {Object.keys(wardMetrics).map(ward => {
                                    const m = wardMetrics[ward];
                                    const percent = Math.round((m.resolved / m.total) * 100) || 0;
                                    return (
                                        <div key={ward}>
                                            <div className="flex justify-between text-sm mb-1 font-bold">
                                                <span>{ward}</span>
                                                <span>{percent}% Resolved</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${percent}%`, height: '100%', background: 'var(--color-success)' }}></div>
                                            </div>
                                            <div className="text-xs text-gray mt-1">{m.pending} pending / {m.total} total</div>
                                        </div>
                                    );
                                })}
                                {Object.keys(wardMetrics).length === 0 && <p className="text-xs text-gray">No ward data available.</p>}
                            </div>
                        </div>

                        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                            <h3 className="text-lg font-bold mb-4">Officer Efficiency</h3>
                            <div className="flex flex-col gap-4 text-sm">
                                {Object.keys(officerMetrics).map(officer => {
                                    const m = officerMetrics[officer];
                                    return (
                                        <div key={officer} className="flex justify-between items-center" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                                            <span className="font-bold">{officer}</span>
                                            <div className="flex gap-4">
                                                <span className="text-success font-bold">{m.resolved} Solved</span>
                                                <span className="text-gray">{m.total} Assigned</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {Object.keys(officerMetrics).length === 0 && <p className="text-xs text-gray">No officer data available.</p>}
                            </div>
                        </div>
                    </div>
                )}

                <div className="card flex flex-col gap-2" style={{ marginBottom: '2rem' }}>
                    <div className="text-sm font-bold text-gray mb-2">Unresolved Complaints Monitoring</div>
                </div>

                {loading ? <p>Loading global administrative data...</p> : (
                    <div className="flex flex-col gap-4">
                        {issues.filter(i => i.status !== 'RESOLVED').length === 0 && <p className="text-gray text-center p-8">No unresolved issues in the network! Excellent.</p>}
                        {issues.filter(i => i.status !== 'RESOLVED').map(issue => (
                            <IssueCard key={issue._id} issue={{ ...issue, id: issue._id }} isOfficer={false} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
