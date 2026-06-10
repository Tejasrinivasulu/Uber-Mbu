
import React from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import StudentHeatmap from '../components/StudentHeatmap';

const HeatmapView: React.FC = () => {
    const { setView, allRides, authUser } = useFirebase();

    if (!authUser) return null;

    return (
        <div>
            <button onClick={() => setView('dashboard')} className="btn-action mb-4">
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </button>
            <div className="app-card">
                 <div className="section-title mb-1">Student Activity Hotspots</div>
                 <p className="small text-muted mb-3">A full overview of ride demand across campus by time and day.</p>
                 <StudentHeatmap rides={allRides} driverId={authUser.uid} />
             </div>
        </div>
    );
};

export default HeatmapView;
