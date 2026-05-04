import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function IssueDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [resolutionFile, setResolutionFile] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const [showRaiseModal, setShowRaiseModal] = useState(false);
    const [raiseReason, setRaiseReason] = useState('');
    const [raising, setRaising] = useState(false);
    const [raiseError, setRaiseError] = useState('');

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const token = localStorage.getItem('token');
                const userRes = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                if (userRes.ok) setUser(await userRes.json());

                const res = await fetch(`http://localhost:5000/api/complaints/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) setIssue(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchIssue();
    }, [id]);

    const handleResolve = async (e) => {
        e.preventDefault();
        setUpdating(true); setUpdateError('');
        try {
            if (!resolutionFile) throw new Error('Resolution proof image is required to mark as Resolved.');

            const uploadData = new FormData();
            uploadData.append('image', resolutionFile);
            const uploadRes = await fetch('http://localhost:5000/api/uploads', { method: 'POST', body: uploadData });
            if (!uploadRes.ok) throw new Error('Proof image upload failed');
            const uploadResult = await uploadRes.json();
            const resolutionImageUrl = `http://localhost:5000${uploadResult.imageUrl}`;

            const res = await fetch(`http://localhost:5000/api/complaints/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ status: 'RESOLVED', resolutionImageUrl, officerRemarks: remarks })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to resolve issue');
            }
            window.location.reload();
        } catch (e) {
            setUpdateError(e.message);
            setUpdating(false);
        }
    };

    const handleRaiseComplaint = async (e) => {
        e.preventDefault();
        if (!raiseReason) { setRaiseError('Please mention a reason.'); return; }
        setRaising(true); setRaiseError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/complaints/${id}/raise`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason: raiseReason })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to raise complaint');
            }
            window.location.reload();
        } catch (e) {
            setRaiseError(e.message);
            setRaising(false);
        }
    };

    const getBadgeClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'IN PROGRESS': case 'IN PROCESS': return 'badge-in-process';
            case 'REPORTED': return 'badge-reported';
            case 'RESOLVED': return 'badge-resolved';
            case 'ESCALATED': case 'REOPENED': return 'badge-escalated';
            default: return '';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray">Loading Issue Details...</div>;
    if (!issue) return <div className="p-8 text-center text-error">Issue not found.</div>;

    const isOfficer = user && user.role === 'officer';

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header
                title={issue.title}
                user={user ? (user.name || user.username) : "..."}
                extraAction={<button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>← Back</button>}
            />
            <div className="text-xs text-gray" style={{ marginLeft: '2rem', marginTop: '-1.5rem', marginBottom: '2rem' }}>CivicCrux - Issue ID: {issue._id}</div>

            <div className="container flex gap-6" style={{ flexWrap: 'wrap' }}>
                <div className="flex flex-col gap-6" style={{ flex: 2, minWidth: '350px' }}>

                    <div className="card flex justify-between items-center" style={{ background: issue.status === 'RESOLVED' ? '#e6fcf5' : 'white' }}>
                        <span className="font-bold text-lg">Status</span>
                        <span className={`badge ${getBadgeClass(issue.status)} font-bold`} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>{issue.status}</span>
                    </div>

                    <div className="card flex flex-col gap-4">
                        <h3 className="font-bold text-lg">Issue Images</h3>
                        <div className="flex gap-4 flex-wrap">
                            <div className="w-full" style={{ flex: 1, minWidth: '200px' }}>
                                <p className="text-sm font-bold mb-2">Evidence Image</p>
                                {issue.imageUrl && (
                                    <img src={issue.imageUrl} alt="evidence" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem' }} />
                                )}
                                <p className="text-xs text-gray mt-2">GPS: {issue.gpsCoordinates?.lat || 'N/A'}, {issue.gpsCoordinates?.lng || 'N/A'}</p>
                            </div>
                            <div className="w-full" style={{ flex: 1, minWidth: '200px' }}>
                                <p className="text-sm font-bold mb-2">Resolution Image</p>
                                {issue.status === 'RESOLVED' ? (
                                    <>
                                        <img src={issue.resolutionImageUrl} alt="resolved" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                                        {issue.officerRemarks && <div className="mt-2 text-sm"><strong>Officer Remarks:</strong> {issue.officerRemarks}</div>}
                                    </>
                                ) : isOfficer ? (
                                    <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {updateError && <div className="text-xs text-error font-bold">{updateError}</div>}
                                        <div style={{ border: '2px dashed var(--color-border)', padding: '1rem', borderRadius: '8px', background: '#fafbff', textAlign: 'center' }}>
                                            <p className="text-xs font-bold mb-2 text-primary">Upload Proof (Required)</p>
                                            <input type="file" required accept="image/*" className="text-xs w-full" onChange={e => setResolutionFile(e.target.files[0])} />
                                        </div>
                                        <textarea
                                            className="select-input w-full text-sm"
                                            placeholder="Add resolution remarks..."
                                            rows="2"
                                            value={remarks}
                                            onChange={e => setRemarks(e.target.value)}
                                        />
                                        <button type="submit" disabled={updating} className="btn btn-primary text-sm font-bold">
                                            {updating ? 'Resolving...' : 'Upload & Mark Resolved'}
                                        </button>
                                    </form>
                                ) : (
                                    <div style={{ width: '100%', height: '200px', border: '1px dashed var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbff' }}>
                                        <span className="text-xs text-gray">Pending Resolution</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-lg mb-2">Description</h3>
                        <p className="text-sm">{issue.description}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6" style={{ flex: 1, minWidth: '250px' }}>
                    <div className="card">
                        <h3 className="font-bold text-lg mb-4">Details</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <p className="text-xs text-gray mb-1">🏷️ Category</p>
                                <p className="text-sm font-bold">{issue.category}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray mb-1">📍 Ward / Area</p>
                                <p className="text-sm font-bold">{issue.ward}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray mb-1">📍 Location</p>
                                <p className="text-sm font-bold" style={{ lineHeight: '1.2' }}>{issue.location}<br /><span className="text-xs font-normal text-gray">Verified</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray mb-1">👤 Reported By</p>
                                <p className="text-sm font-bold">{issue.reportedBy?.name || issue.reportedBy?.username || 'Citizen'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray mb-1">👤 Assigned Officer</p>
                                <p className="text-sm font-bold">{issue.assignedTo?.name || issue.assignedTo?.username || 'Unassigned'}</p>
                            </div>
                        </div>
                    </div>

                    {issue.history && issue.history.length > 0 && (
                        <div className="card">
                            <h3 className="font-bold text-lg mb-4">Timeline</h3>
                            <div className="flex flex-col gap-4">
                                {issue.history.map((event, idx) => (
                                    <div key={idx} className="flex flex-col gap-1" style={{ position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid var(--color-border)' }}>
                                        <div className="text-xs text-gray" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ position: 'absolute', left: '-0.375rem', width: '0.625rem', height: '0.625rem', borderRadius: '50%', backgroundColor: event.status === 'RESOLVED' ? 'var(--color-success)' : 'var(--color-primary)' }}></span>
                                            <span className="font-bold" style={{ color: event.status === 'RESOLVED' ? 'var(--color-success)' : 'inherit' }}>{event.status}</span>
                                        </div>
                                        {event.note && <p className="text-sm">{event.note}</p>}
                                        <div className="flex gap-2 text-xs text-gray items-center font-bold">
                                            <span>📅 {new Date(event.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                            {event.changedByRole && <span>• by {event.changedByRole}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {issue.status === 'RESOLVED' && user && user.role === 'citizen' && issue.reportedBy?._id === user._id && (
                        <div className="card" style={{ border: '1px solid #f26322' }}>
                            <h3 className="font-bold text-lg mb-2">Resolution Feedback</h3>
                            <p className="text-sm text-gray mb-4">Not satisfied with the resolution? Raise a complaint for review.</p>
                            <button onClick={() => setShowRaiseModal(true)} className="btn w-full shadow text-sm font-bold text-white hover:bg-orange-600 transition-colors" style={{ backgroundColor: '#f26322' }}>
                                ⓘ Raise Complaint
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showRaiseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%', position: 'relative', backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Raise Complaint</h3>
                            <button onClick={() => setShowRaiseModal(false)} className="text-gray hover:text-black transition-colors" style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div className="mb-4 text-xs font-medium" style={{ backgroundColor: '#fffbf0', border: '1px solid #ffeeba', padding: '1rem', borderRadius: '8px', color: '#856404' }}>
                            Please provide specific details about why you are not satisfied with the resolution.
                        </div>
                        <form onSubmit={handleRaiseComplaint}>
                            <div className="mb-4">
                                <label className="text-xs font-bold mb-2 block">Reason for Complaint <span className="text-error">*</span></label>
                                <textarea
                                    className="select-input w-full text-sm"
                                    rows="4"
                                    placeholder="Explain why you believe the issue is not properly resolved..."
                                    value={raiseReason}
                                    onChange={e => setRaiseReason(e.target.value)}
                                    required
                                    style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem' }}
                                />
                            </div>
                            {raiseError && <div className="text-xs text-error font-bold mb-4">{raiseError}</div>}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowRaiseModal(false)} className="btn btn-outline hover:bg-gray-50 transition-colors" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" disabled={raising} className="btn text-white disabled:opacity-50 transition-colors" style={{ flex: 1, backgroundColor: '#f26322' }}>
                                    {raising ? 'Submitting...' : 'ⓘ Submit Complaint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
