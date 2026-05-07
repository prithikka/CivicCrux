import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

export default function AdminDashboard() {
    const [issues, setIssues] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});

    const [activeTab, setActiveTab] = useState('ISSUES'); // 'ISSUES' | 'OFFICERS' | 'CITIZENS'
    const [issueSubTab, setIssueSubTab] = useState('ALL'); // 'ALL' | 'ESCALATED' | 'REOPENED'
    const [wardFilter, setWardFilter] = useState('ALL');

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

                const usrRes = await fetch('http://localhost:5000/api/auth/users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (usrRes.ok) setUsers(await usrRes.json());

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, []);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u._id !== userId));
            } else {
                alert('Failed to delete user');
            }
        } catch (err) { alert(err.message); }
    };

    const handleReassign = async (issueId, officerId) => {
        try {
            const officer = users.find(u => u._id === officerId);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/complaints/${issueId}/reassign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ assignedTo: officerId, ward: officer.ward })
            });

            if (!res.ok) throw new Error('Failed to reassign');

            const updatedIssue = await res.json();
            setIssues(issues.map(i => i._id === issueId ? updatedIssue : i));
            alert('Reassigned successfully!');
        } catch (err) { alert(err.message); }
    };

    // Filtered lists
    const officers = useMemo(() => users.filter(u => u.role === 'officer' && u._id !== user._id), [users, user._id]);
    const citizens = useMemo(() => users.filter(u => u.role === 'citizen' && u._id !== user._id), [users, user._id]);

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

    const displayedIssues = useMemo(() => {
        let filtered = issues;
        if (wardFilter !== 'ALL') {
            filtered = filtered.filter(i => i.ward === wardFilter);
        }
        if (issueSubTab === 'ESCALATED') {
            filtered = filtered.filter(i => i.status === 'ESCALATED');
        } else if (issueSubTab === 'REOPENED') {
            filtered = filtered.filter(i => i.status === 'REOPENED');
        }
        return filtered;
    }, [issues, wardFilter, issueSubTab]);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header
                title="Admin Oversight Dashboard"
                user={user.name ? `${user.name} (Admin)` : "Loading..."}
            />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                {/* Top Tabs */}
                <div className="tabs-container flex gap-2" style={{ marginBottom: '2rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <button
                        className={`tab-btn ${activeTab === 'ISSUES' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ISSUES')}
                    >Issues</button>
                    <button
                        className={`tab-btn ${activeTab === 'OFFICERS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('OFFICERS')}
                    >Officers ({officers.length})</button>
                    <button
                        className={`tab-btn ${activeTab === 'CITIZENS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('CITIZENS')}
                    >Citizens ({citizens.length})</button>
                </div>

                {activeTab === 'ISSUES' && (
                    <>
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

                        <div className="flex justify-between items-center mb-4" style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div className="flex gap-2">
                                <button className={`badge ${issueSubTab === 'ALL' ? 'badge-in-process' : 'badge-reported'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setIssueSubTab('ALL')}>All Issues</button>
                                <button className={`badge ${issueSubTab === 'ESCALATED' ? 'badge-escalated' : 'badge-reported'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setIssueSubTab('ESCALATED')}>Escalated Issues</button>
                                <button className={`badge ${issueSubTab === 'REOPENED' ? 'badge-in-process' : 'badge-reported'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem', background: issueSubTab === 'REOPENED' ? '#ffce20' : '', color: issueSubTab === 'REOPENED' ? '#fff' : '' }} onClick={() => setIssueSubTab('REOPENED')}>Reopened Issues</button>
                            </div>
                            <div>
                                <select
                                    className="select-input"
                                    value={wardFilter}
                                    onChange={(e) => setWardFilter(e.target.value)}
                                >
                                    <option value="ALL">All Wards</option>
                                    <option value="Ward 1">Ward 1</option>
                                    <option value="Ward 2">Ward 2</option>
                                </select>
                            </div>
                        </div>

                        {loading ? <p>Loading global administrative data...</p> : (
                            <div className="flex flex-col gap-4">
                                {displayedIssues.length === 0 && <p className="text-gray text-center p-8">No issues found matching the criteria.</p>}
                                {displayedIssues.map(issue => (
                                    <div key={issue._id} className="relative flex flex-col gap-2 mb-2">
                                        <IssueCard issue={{ ...issue, id: issue._id }} isOfficer={false} />

                                        {(issue.status === 'REOPENED' || issue.status === 'ESCALATED') && (
                                            <div className="bg-orange-50 border border-orange-200 p-4 rounded flex items-center justify-between" style={{ backgroundColor: '#fffaf0', borderColor: '#ffd8a8' }}>
                                                <div>
                                                    <span className="text-sm font-bold text-error">Action Required:</span>
                                                    <p className="text-xs text-gray">Issue is {issue.status}. Assign to an officer.</p>
                                                </div>
                                                <select
                                                    className="select-input text-sm"
                                                    style={{ minWidth: '200px' }}
                                                    onChange={(e) => handleReassign(issue._id, e.target.value)}
                                                    value=""
                                                >
                                                    <option value="" disabled>Select Officer / Ward...</option>
                                                    {officers.map(o => (
                                                        <option key={o._id} value={o._id}>{o.username || o.name} ({o.ward})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'OFFICERS' && (
                    <div className="card flex flex-col gap-2" style={{ marginBottom: '2rem' }}>
                        <div className="text-sm font-bold text-gray mb-2">Ward Officers Management</div>
                        <div className="overflow-x-auto">
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: '#f9fafb' }}>
                                        <th style={{ padding: '0.75rem' }}>Name / Email</th>
                                        <th style={{ padding: '0.75rem' }}>Ward</th>
                                        <th style={{ padding: '0.75rem' }}>Role</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {officers.length === 0 && <tr><td colSpan="4" className="text-center p-4 text-gray">No officers found.</td></tr>}
                                    {officers.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="font-bold">{u.username || u.name}</div>
                                                <div className="text-xs text-gray">{u.email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{u.ward || 'N/A'}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#e2e8f0' }}>OFFICER</span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteUser(u._id)} className="text-xs text-error font-bold hover:underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'CITIZENS' && (
                    <div className="card flex flex-col gap-2" style={{ marginBottom: '2rem' }}>
                        <div className="text-sm font-bold text-gray mb-2">Citizens Management</div>
                        <div className="overflow-x-auto">
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: '#f9fafb' }}>
                                        <th style={{ padding: '0.75rem' }}>Username / Email</th>
                                        <th style={{ padding: '0.75rem' }}>Phone Number</th>
                                        <th style={{ padding: '0.75rem' }}>Role</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {citizens.length === 0 && <tr><td colSpan="4" className="text-center p-4 text-gray">No citizens found.</td></tr>}
                                    {citizens.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="font-bold">{u.username || u.name}</div>
                                                <div className="text-xs text-gray">{u.email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{u.phone || 'N/A'}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#dbeafe' }}>CITIZEN</span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteUser(u._id)} className="text-xs text-error font-bold hover:underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
