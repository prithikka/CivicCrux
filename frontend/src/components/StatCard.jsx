import React from 'react';

export default function StatCard({ count, label }) {
    const color = label === 'Reported' ? 'var(--color-warning)' :
        label === 'In Process' ? 'var(--color-primary)' :
            label === 'Resolved' ? 'var(--color-success)' :
                label === 'Escalated' ? 'var(--color-error)' : 'var(--text-primary)';

    return (
        <div className="card stat-card flex flex-col gap-1" style={{ flex: 1, minWidth: '150px' }}>
            <div className="text-2xl font-bold" style={{ color, fontSize: '2rem' }}>{count}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
        </div>
    );
}
