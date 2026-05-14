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
    const [userSubTab, setUserSubTab] = useState('CITIZENS');

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

    const officers = users.filter(u => u.role === 'officer');
    const uniqueWards = [...new Set(issues.map(i => i.ward))];

    const wardMetrics = {};
    const officerMetrics = {};

    officers.forEach(o => {
        const name = o.name || o.username;
        officerMetrics[name] = { total: 0, resolved: 0 };
    });

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


    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header title="Admin Oversight Dashboard" user={user.name ? `${user.name} (Admin)` : "Admin"} />

            <div className="container">
                {error && <div className="badge badge-escalated" style={{ marginBottom: '1rem', width: '100%', padding: '1rem' }}>{error}</div>}

                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center', background: 'white', padding: '0.5rem', borderRadius: '999px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'inline-flex' }}>
                        {['OVERVIEW', 'USERS', 'COMPLAINTS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="btn"
                                style={{
                                    background: activeTab === tab ? '#eef2ff' : 'transparent',
                                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)',
                                    borderRadius: '999px', padding: '0.75rem 2.5rem', transition: 'all 0.2s', fontWeight: 'bold', fontSize: '0.95rem', border: 'none'
                                }}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? <p>Loading data...</p> : (
                    <>
                        {activeTab === 'OVERVIEW' && (
                            <div className="flex flex-col gap-8">
                                <div className="flex gap-6 w-full" style={{ flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Total Issues', count: issues.length, color: 'var(--text-primary)' },
                                        { label: 'Reported', count: issues.filter(i => i.status === 'REPORTED').length, color: '#f59e0b' },
                                        { label: 'In Process', count: issues.filter(i => i.status === 'IN PROGRESS').length, color: '#3b82f6' },
                                        { label: 'Resolved', count: issues.filter(i => i.status === 'RESOLVED').length, color: '#10b981' },
                                        { label: 'Escalated', count: issues.filter(i => i.status === 'ESCALATED').length, color: '#ef4444' }
                                    ].map(s => (
                                        <div key={s.label} className="card" style={{ flex: 1, minWidth: '150px', padding: '1.75rem 1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div className="text-4xl font-bold mb-3" style={{ color: s.color }}>{s.count}</div>
                                            <div className="text-sm font-bold text-gray uppercase tracking-wide">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: '#f8faff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%' }}>
                                    <div className="flex items-center gap-3 mb-8 text-xl font-bold" style={{ color: 'var(--text-primary)', marginLeft: '0.5rem' }}>
                                        <span style={{ color: 'var(--color-primary)' }}>🎖️</span> Officer Performance
                                    </div>

                                    <div className="flex flex-col gap-8 w-full">
                                        {Object.keys(officerMetrics).map(officer => {
                                            const m = officerMetrics[officer];
                                            const resRate = m.total > 0 ? ((m.resolved / m.total) * 100).toFixed(1) : 0;
                                            const scoreClass = resRate >= 80 ? 'var(--color-success)' : resRate >= 50 ? 'var(--color-warning)' : 'var(--color-error)';
                                            const scoreText = resRate >= 80 ? 'Excellent' : resRate >= 50 ? 'Average' : 'Needs Focus';
                                            const scoreBg = resRate >= 80 ? '#e6fcf5' : resRate >= 50 ? '#fff9e6' : '#ffeeeb';

                                            return (
                                                <div key={officer} className="flex gap-6 w-full" style={{ flexWrap: 'wrap' }}>
                                                    <div className="card flex-1" style={{ minWidth: '300px', background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                        <div className="text-sm font-bold mb-4 flex justify-between" style={{ color: 'var(--text-primary)' }}>
                                                            <span>Performance Score: {officer}</span>
                                                        </div>
                                                        <div className="mb-4">
                                                            <span className="text-5xl font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(resRate)}</span>
                                                            <span className="text-xl font-bold text-gray"> /100</span>
                                                        </div>
                                                        <div className="badge mb-8 font-bold" style={{ background: scoreBg, color: scoreClass, padding: '0.4rem 1rem', borderRadius: '20px' }}>
                                                            ⚡ {scoreText}
                                                        </div>
                                                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${resRate}%`, height: '100%', background: 'var(--color-warning)' }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="card" style={{ flex: 2, minWidth: '400px', background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                        <h4 className="font-bold mb-6 text-lg" style={{ color: 'var(--text-primary)' }}>Key Metrics</h4>

                                                        <div className="flex flex-col gap-6 w-full">
                                                            <div>
                                                                <div className="flex justify-between text-sm font-bold mb-2">
                                                                    <span className="text-gray">Resolution Rate</span>
                                                                    <span style={{ color: 'var(--color-success)' }}>{resRate}%</span>
                                                                </div>
                                                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${resRate}%`, height: '100%', background: 'var(--color-success)' }}></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-sm font-bold mb-1">
                                                                    <span className="text-gray">Assignments Handled</span>
                                                                    <span style={{ color: 'var(--color-primary)' }}>{m.total}</span>
                                                                </div>
                                                                <div className="text-xs text-gray">Total issues assigned to boundary and officer scope</div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-sm font-bold mb-1">
                                                                    <span className="text-gray">Resolved Issues</span>
                                                                    <span style={{ color: 'var(--color-primary)' }}>{m.resolved}</span>
                                                                </div>
                                                                <div className="text-xs text-gray">Total issues definitively confirmed and closed</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(officerMetrics).length === 0 && <p className="text-gray p-4 text-center">No officer data available.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'USERS' && (
                            <div className="card" style={{ overflowX: 'auto', padding: '2rem' }}>
                                <h3 className="text-2xl font-bold mb-6">User Management</h3>
                                <div className="flex gap-3 mb-8" style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem' }}>
                                    {['CITIZENS', 'OFFICERS'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setUserSubTab(tab)}
                                            className="btn"
                                            style={{
                                                background: userSubTab === tab ? 'var(--color-primary)' : 'transparent',
                                                color: userSubTab === tab ? 'white' : 'var(--text-primary)',
                                                border: userSubTab === tab ? 'none' : '1px solid var(--color-border)',
                                                borderRadius: '8px', padding: '0.5rem 1.5rem', transition: 'all 0.2s', fontWeight: 'bold', fontSize: '0.95rem'
                                            }}>
                                            {tab === 'CITIZENS' ? 'Citizens' : 'Ward Officers'}
                                        </button>
                                    ))}
                                </div>
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
                                        {users.filter(u => userSubTab === 'CITIZENS' ? u.role === 'citizen' : u.role === 'officer').map(u => (
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
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 className="text-2xl font-bold mb-6">Complaint Management</h3>

                                <div className="flex flex-col gap-10 mb-10">
                                    {/* Issue Types subtabs */}
                                    <div>
                                        <span className="text-sm font-bold text-gray block mb-4 uppercase tracking-wide">Status Filter</span>
                                        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                                            {['ALL', 'REPORTED', 'IN PROGRESS', 'RESOLVED', 'REOPENED', 'ESCALATED'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setFilterStatus(status)}
                                                    className="btn"
                                                    style={{
                                                        background: filterStatus === status ? 'var(--color-primary)' : 'white',
                                                        color: filterStatus === status ? 'white' : 'var(--text-primary)',
                                                        border: filterStatus === status ? 'none' : '1px solid var(--color-border)',
                                                        boxShadow: filterStatus === status ? '0 4px 6px -1px rgba(67, 24, 255, 0.2)' : 'none',
                                                        borderRadius: '999px', padding: '0.5rem 1.5rem', transition: 'all 0.2s', fontWeight: 'bold', fontSize: '0.85rem'
                                                    }}>
                                                    {status === 'ALL' ? 'All Issues' : (status === 'IN PROGRESS' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase() + (['REOPENED', 'ESCALATED'].includes(status) ? ' Issues' : ''))}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ward subtabs */}
                                    <div>
                                        <span className="text-sm font-bold text-gray block mb-4 uppercase tracking-wide">Ward Scope</span>
                                        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => setFilterWard('ALL')}
                                                className="btn"
                                                style={{
                                                    background: filterWard === 'ALL' ? 'var(--color-primary)' : 'white',
                                                    color: filterWard === 'ALL' ? 'white' : 'var(--text-primary)',
                                                    border: filterWard === 'ALL' ? 'none' : '1px solid var(--color-border)',
                                                    boxShadow: filterWard === 'ALL' ? '0 4px 6px -1px rgba(67, 24, 255, 0.2)' : 'none',
                                                    borderRadius: '999px', padding: '0.5rem 1.5rem', transition: 'all 0.2s', fontWeight: 'bold', fontSize: '0.85rem'
                                                }}>
                                                All Wards
                                            </button>
                                            {uniqueWards.map(w => (
                                                <button
                                                    key={w}
                                                    onClick={() => setFilterWard(w)}
                                                    className="btn"
                                                    style={{
                                                        background: filterWard === w ? 'var(--color-primary)' : 'white',
                                                        color: filterWard === w ? 'white' : 'var(--text-primary)',
                                                        border: filterWard === w ? 'none' : '1px solid var(--color-border)',
                                                        boxShadow: filterWard === w ? '0 4px 6px -1px rgba(67, 24, 255, 0.2)' : 'none',
                                                        borderRadius: '999px', padding: '0.5rem 1.5rem', transition: 'all 0.2s', fontWeight: 'bold', fontSize: '0.85rem'
                                                    }}>
                                                    {w}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {issues.filter(i => (filterStatus === 'ALL' || i.status === filterStatus) && (filterWard === 'ALL' || i.ward === filterWard)).length === 0 && (
                                        <p className="text-gray text-center p-8">No issues found matching the selected criteria.</p>
                                    )}
                                    {issues.filter(i => (filterStatus === 'ALL' || i.status === filterStatus) && (filterWard === 'ALL' || i.ward === filterWard)).map(issue => (
                                        <IssueCard key={issue._id} issue={{ ...issue, id: issue._id }} isOfficer={false} isAdmin={true} officers={officers} onReassign={handleReassign} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
