import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

export default function ReportIssue() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '', description: '', category: 'Pothole', ward: 'Ward 1', location: ''
    });
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLocationCapture = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setGpsCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude }),
                (err) => setError('Could not get GPS location. Please type fallback address in Location field.')
            );
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let imageUrl = null;
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                const uploadRes = await fetch('http://localhost:5000/api/uploads', {
                    method: 'POST', body: uploadData
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                const uploadResult = await uploadRes.json();
                imageUrl = `http://localhost:5000${uploadResult.imageUrl}`;
            }

            const token = localStorage.getItem('token');
            if (!token) throw new Error('You must log in as a citizen to report an issue. (Run seed script and retrieve token)');

            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                ward: formData.ward,
                location: formData.location,
                lat: gpsCoordinates?.lat,
                lng: gpsCoordinates?.lng,
                imageUrl
            };

            const res = await fetch('http://localhost:5000/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.message || 'Failed to save complaint');

            navigate('/citizen');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Header title="Report New Issue" user="Citizen" extraAction={<Link to="/citizen" className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>Cancel</Link>} />
            <div className="container" style={{ maxWidth: '600px' }}>
                <form onSubmit={submitForm} className="card flex flex-col gap-4">
                    <h2 className="text-xl font-bold mb-2">Complaint Details</h2>
                    {error && <div className="badge badge-escalated font-bold" style={{ width: '100%', borderRadius: '4px', padding: '0.75rem', justifyContent: 'center' }}>{error}</div>}

                    <div>
                        <label className="text-sm font-bold mb-1 block">Issue Title</label>
                        <input required type="text" className="select-input w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Broken street light" />
                    </div>

                    <div>
                        <label className="text-sm font-bold mb-1 block">Category</label>
                        <select className="select-input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            <option>Pothole</option><option>Garbage</option><option>Electrical</option><option>Water</option><option>Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-bold mb-1 block">Description</label>
                        <textarea required className="select-input w-full" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the problem..."></textarea>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <div className="w-full" style={{ flex: 1, minWidth: '200px' }}>
                            <label className="text-sm font-bold mb-1 block">Ward</label>
                            <select className="select-input w-full" value={formData.ward} onChange={e => setFormData({ ...formData, ward: e.target.value })}>
                                <option>Ward 1</option><option>Ward 2</option>
                            </select>
                        </div>
                        <div className="w-full" style={{ flex: 2, minWidth: '200px' }}>
                            <label className="text-sm font-bold mb-1 block">Address Fallback</label>
                            <input required type="text" className="select-input w-full" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Area or landmark" />
                        </div>
                    </div>

                    <div style={{ border: '1px dashed var(--color-border)', padding: '1rem', borderRadius: '8px', background: '#fafbff' }}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold">GPS Tracker</label>
                            <button type="button" onClick={handleLocationCapture} className="btn text-xs font-bold" style={{ color: 'var(--color-primary)', background: '#e0e5ff', padding: '0.4rem 1rem' }}>📍 Capture Device Location</button>
                        </div>
                        <p className="text-xs text-gray" style={{ marginBottom: '0.5rem' }}>Helps officials find the exact spot.</p>
                        {gpsCoordinates && <div className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>✅ Captured successfully: {gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lng.toFixed(4)}</div>}
                    </div>

                    <div>
                        <label className="text-sm font-bold mb-1 block">Upload Photo Evidence</label>
                        <input type="file" accept="image/*" className="select-input w-full" onChange={e => setImageFile(e.target.files[0])} style={{ background: 'white' }} />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary mt-4 text-base" style={{ padding: '0.75rem', width: '100%' }}>
                        {loading ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </form>
            </div>
        </div>
    );
}
