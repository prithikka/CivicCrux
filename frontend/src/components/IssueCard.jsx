import React from 'react';
import { Link } from 'react-router-dom';

export default function IssueCard({ issue, isOfficer }) {
    const getBadgeClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'IN PROGRESS': case 'IN PROCESS': return 'badge-in-process';
            case 'REPORTED': return 'badge-reported';
            case 'RESOLVED': return 'badge-resolved';
            case 'ESCALATED': return 'badge-escalated';
            default: return '';
        }
    };

    const getDisplayStatus = (status) => {
        if (!status) return '';
        if (status.toUpperCase() === 'IN PROGRESS') return 'In Process';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const updateStatusLocal = async (id, newStatus) => {
        if (newStatus === 'RESOLVED') {
            alert('Resolution requires visual proof. Redirecting to Details page.');
            window.location.href = `/issue/${id}`;
            return;
        }
        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) window.location.reload();
            else alert('Update failed. Ensure you are an authorized officer.');
        } catch (e) { console.error(e); }
    };

    return (
        <div className="card issue-card flex gap-4" style={{ marginBottom: '1rem', border: '1px solid #f0f0f0' }}>
            <Link to={`/issue/${issue.id}`} style={{ textDecoration: 'none' }}>
                <img
                    src={issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=150'}
                    alt={issue.title}
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px' }}
                />
            </Link>

            <div className="flex flex-col w-full justify-between">
                <div>
                    <div className="flex justify-between items-start" style={{ marginBottom: '0.25rem' }}>
                        <Link to={`/issue/${issue.id}`} className="text-lg font-bold" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{issue.title}</Link>

                        <span className={`badge ${getBadgeClass(issue.status)}`}>
                            {issue.status.toUpperCase() === 'RESOLVED' && '✔ '}{issue.status.toUpperCase() === 'REPORTED' && '! '} {getDisplayStatus(issue.status)}
                        </span>
                    </div>
                    <p className="text-xs text-gray" style={{ marginBottom: '0.75rem' }}>{issue.category} • {issue.ward} • {issue.location}</p>
                    <p className="text-sm" style={{ marginBottom: '1rem' }}>{issue.description}</p>
                </div>

                <div className="text-xs flex gap-2 items-center" style={{ flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
                    <span>Reported by: {issue.reportedBy?.name || issue.reportedBy || 'Citizen'}</span>
                    <span>•</span>
                    {issue.assignedTo && <span>• Assigned to: {issue.assignedTo?.name || issue.assignedTo}</span>}
                    {issue.status.toUpperCase() === 'ESCALATED' && <span style={{ color: 'var(--color-error)' }}>⚠ Escalated</span>}
                </div>

                <div className="flex items-center gap-4" style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    {isOfficer && (
                        <>
                            <span className="text-sm font-semibold text-gray">Update Status:</span>
                            <select
                                className="select-input text-sm font-bold"
                                value={issue.status.toUpperCase()}
                                onChange={(e) => updateStatusLocal(issue.id, e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                            >
                                <option value="REPORTED">REPORTED</option>
                                <option value="IN PROGRESS">IN PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                            </select>
                        </>
                    )}
                    <Link to={`/issue/${issue.id}`} className="text-sm font-bold" style={{ marginLeft: 'auto', color: 'var(--color-primary)', textDecoration: 'none' }}>
                        View Details →
                    </Link>
                </div>
            </div>
        </div>
    );
}
