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

    const getBadgeClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'IN PROGRESS': case 'IN PROCESS': return 'badge-in-process';
            case 'REPORTED': return 'badge-reported';
            case 'RESOLVED': return 'badge-resolved';
            case 'ESCALATED': return 'badge-escalated';
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
                user={user ? user.name : "..."}
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
                                <img src={issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=300'} alt="evidence" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
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
                                <p className="text-sm font-bold">{issue.reportedBy?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray mb-1">👤 Assigned Officer</p>
                                <p className="text-sm font-bold">{issue.assignedTo?.name || 'Unassigned'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
