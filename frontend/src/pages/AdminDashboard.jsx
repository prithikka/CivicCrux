import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';

export default function AdminDashboard() {
    const [issues, setIssues] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});
    const [activeTab, setActiveTab] = useState('OVERVIEW');

    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterWard, setFilterWard] = useState('ALL');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found. Please login again.');

            const userRes = await fetch('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) setUser(await userRes.json());

            const resIssues = await fetch('http://localhost:5000/api/complaints', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resIssues.ok) setIssues(await resIssues.json());

            const resUsers = await fetch('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resUsers.ok) setUsers(await resUsers.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u._id !== userId));
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleReassign = async (issueId, officerId) => {
        if (!officerId) return;
        if (!window.confirm('Reassign this issue to the selected officer?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${issueId}/reassign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ assignedTo: officerId })
            });
            if (res.ok) {
                alert('Issue reassigned successfully');
                fetchAllData(); // Refresh data
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            alert('Failed to reassign issue');
        }
    };

    const wardMetrics = {};
    const officerMetrics = {};
    issues.forEach(issue => {
        if (!wardMetrics[issue.ward]) wardMetrics[issue.ward] = { total: 0, resolved: 0, pending: 0 };
        wardMetrics[issue.ward].total++;
        if (issue.status === 'RESOLVED') wardMetrics[issue.ward].resolved++;
        else wardMetrics[issue.ward].pending++;

        if (issue.assignedTo) {
            const officerName = issue.assignedTo.name || issue.assignedTo.username || 'Unknown Officer';
            if (!officerMetrics[officerName]) officerMetrics[officerName] = { total: 0, resolved: 0 };
            officerMetrics[officerName].total++;
            if (issue.status === 'RESOLVED') officerMetrics[officerName].resolved++;
        }
    });

    const officers = users.filter(u => u.role === 'officer');
    const uniqueWards = [...new Set(issues.map(i => i.ward))];

    const escalatedIssues = issues.filter(i => i.status?.toUpperCase() === 'ESCALATED');
    const reopenedIssues = issues.filter(i => i.status?.toUpperCase() === 'REOPENED');

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header title="Admin Oversight Dashboard" user={user.name ? `${user.name} (Admin)` : "Admin"} />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                <div className="flex gap-2" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {['OVERVIEW', 'USERS', 'COMPLAINTS', 'ACTION REQUIRED'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="btn"
                            style={{
                                background: activeTab === tab ? 'var(--color-primary)' : '#e2e8f0',
                                color: activeTab === tab ? 'white' : 'var(--text-primary)',
                                borderRadius: '999px', padding: '0.5rem 1.5rem', transition: 'all 0.2s', fontWeight: 'bold'
                            }}>
                            {tab}
                            {tab === 'ACTION REQUIRED' && (escalatedIssues.length > 0 || reopenedIssues.length > 0) && (
                                <span style={{ marginLeft: '8px', background: 'red', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem' }}>
                                    {escalatedIssues.length + reopenedIssues.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? <p>Loading data...</p> : (
                    <>
                        {activeTab === 'OVERVIEW' && (
                            <div>
                                <div className="flex gap-4" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
                                    <StatCard count={issues.length} label="Total Issues Network-Wide" />
                                    <StatCard count={issues.filter(i => i.status === 'REPORTED').length} label="New / Reported" />
                                    <StatCard count={issues.filter(i => i.status === 'IN PROGRESS').length} label="In Process" />
                                    <StatCard count={issues.filter(i => i.status === 'RESOLVED').length} label="Successfully Resolved" />
                                </div>
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
                            </div>
                        )}

                        {activeTab === 'USERS' && (
                            <div className="card" style={{ overflowX: 'auto' }}>
                                <h3 className="text-lg font-bold mb-4">User Management</h3>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '0.75rem' }}>Name/Username</th>
                                            <th style={{ padding: '0.75rem' }}>Email</th>
                                            <th style={{ padding: '0.75rem' }}>Role</th>
                                            <th style={{ padding: '0.75rem' }}>Ward</th>
                                            <th style={{ padding: '0.75rem' }}>Status</th>
                                            <th style={{ padding: '0.75rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '0.75rem' }} className="font-bold">{u.name || u.username}</td>
                                                <td style={{ padding: '0.75rem' }}>{u.email}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span className={`badge ${u.role === 'admin' ? 'badge-escalated' : u.role === 'officer' ? 'badge-in-process' : 'badge-reported'}`}>{u.role}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{u.ward || '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {u.lockUntil && new Date(u.lockUntil) > new Date() ? (
                                                        <span className="text-error font-bold">Locked</span>
                                                    ) : (
                                                        <span className="text-success font-bold">Active</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {u.role !== 'admin' && (
                                                        <button onClick={() => handleDeleteUser(u._id)} className="btn btn-outline text-error" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Delete</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'COMPLAINTS' && (
                            <div className="card">
                                <h3 className="text-lg font-bold mb-4">Complaint Management</h3>
                                <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                                    <select className="select-input font-bold text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px' }}>
                                        <option value="ALL">All Statuses</option>
                                        <option value="REPORTED">REPORTED</option>
                                        <option value="IN PROGRESS">IN PROGRESS</option>
                                        <option value="RESOLVED">RESOLVED</option>
                                        <option value="ESCALATED">ESCALATED</option>
                                        <option value="REOPENED">REOPENED</option>
                                    </select>
                                    <select className="select-input font-bold text-sm" value={filterWard} onChange={e => setFilterWard(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px' }}>
                                        <option value="ALL">All Wards</option>
                                        {uniqueWards.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {issues.filter(i => (filterStatus === 'ALL' || i.status === filterStatus) && (filterWard === 'ALL' || i.ward === filterWard)).map(issue => (
                                        <IssueCard key={issue._id} issue={{ ...issue, id: issue._id }} isOfficer={false} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ACTION REQUIRED' && (
                            <div className="flex flex-col gap-8">
                                <div className="card">
                                    <h3 className="text-xl font-bold mb-4 text-error border-b pb-2">🚨 Escalated Issues</h3>
                                    {escalatedIssues.length === 0 ? <p className="text-gray text-sm">No escalated issues currently.</p> : (
                                        <div className="flex flex-col gap-4">
                                            {escalatedIssues.map(issue => (
                                                <div key={issue._id} className="flex flex-col p-4 border rounded" style={{ borderColor: 'var(--color-error)' }}>
                                                    <IssueCard issue={{ ...issue, id: issue._id }} isOfficer={false} />
                                                    <div className="mt-4 p-4 bg-gray-50 rounded flex items-center justify-between gap-4 flex-wrap">
                                                        <span className="font-bold text-sm">Reassign to Officer:</span>
                                                        <div className="flex gap-2">
                                                            <select id={`reassign-${issue._id}`} className="select-input text-sm font-bold" style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '200px' }}>
                                                                <option value="">Select an Officer...</option>
                                                                {officers.map(o => <option key={o._id} value={o._id}>{o.name || o.username} ({o.ward})</option>)}
                                                            </select>
                                                            <button onClick={() => handleReassign(issue._id, document.getElementById(`reassign-${issue._id}`).value)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Assign</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="card">
                                    <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: '#f26322' }}>🔄 Reopened Issues</h3>
                                    {reopenedIssues.length === 0 ? <p className="text-gray text-sm">No reopened issues currently.</p> : (
                                        <div className="flex flex-col gap-4">
                                            {reopenedIssues.map(issue => (
                                                <div key={issue._id} className="flex flex-col p-4 border rounded" style={{ borderColor: '#f26322' }}>
                                                    <IssueCard issue={{ ...issue, id: issue._id }} isOfficer={false} />
                                                    <div className="mt-4 p-4 bg-gray-50 rounded flex items-center justify-between gap-4 flex-wrap">
                                                        <span className="font-bold text-sm">Assign to Officer for Review:</span>
                                                        <div className="flex gap-2">
                                                            <select id={`reassign-${issue._id}`} className="select-input text-sm font-bold" style={{ padding: '0.5rem', borderRadius: '6px', minWidth: '200px' }}>
                                                                <option value="">Select an Officer...</option>
                                                                {officers.map(o => <option key={o._id} value={o._id}>{o.name || o.username} ({o.ward})</option>)}
                                                            </select>
                                                            <button onClick={() => handleReassign(issue._id, document.getElementById(`reassign-${issue._id}`).value)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Assign</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
