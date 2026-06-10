
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { Student, Driver } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import { achievementsList } from '../data/achievements';

// A small, self-contained component for displaying profile details in a consistent way.
const ProfileDetailItem: React.FC<{ icon: string; label: string; value?: string | number; className?: string }> = ({ icon, label, value, className }) => (
    <div className={`d-flex align-items-center ${className || 'mb-4'}`}>
        <i className={`fas ${icon} fa-fw me-3 text-muted`} style={{ width: '24px', fontSize: '1.2rem', textAlign: 'center' }}></i>
        <div>
            <div className="small text-muted">{label}</div>
            <div className="fw-bold">{value || 'Not set'}</div>
        </div>
    </div>
);


const ProfileScreen: React.FC = () => {
    const { authUser, student, driver, setView, updateUserProfile } = useFirebase();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // State for image upload
    const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

    // FIX: The intersection `Student & Driver` creates a `role: never` property, causing type errors.
    // Redefined `ProfileData` to specify only the editable fields, resolving the issue.
    type ProfileData = {
        name?: string;
        age?: string;
        gender?: string;
        mobileNumber?: string;
        photoURL?: string;
        emergencyContact?: {
            name: string;
            phone: string;
        };
    };
    const [formData, setFormData] = useState<ProfileData>({});

    const userProfile = authUser?.role === 'student' ? student : driver;
    const userInitial = userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : '?';

    useEffect(() => {
        if (userProfile) {
            const initialData: ProfileData = {
                name: userProfile.name || '',
                age: userProfile.age || '',
                gender: userProfile.gender || '',
                mobileNumber: userProfile.mobileNumber || '',
                photoURL: userProfile.photoURL || '',
            };
            if(student) {
                initialData.emergencyContact = student.emergencyContact || { name: '', phone: '' };
            }
            setFormData(initialData);
        }
    }, [userProfile, student]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "emergencyContactName" || name === "emergencyContactPhone") {
            const field = name === "emergencyContactName" ? "name" : "phone";
            setFormData(prev => ({
                ...prev,
                emergencyContact: {
                    ...(prev.emergencyContact || { name: '', phone: '' }),
                    [field]: value,
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileSelect = (file: File) => {
        setNewProfilePicFile(file);
        setProfilePicPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!authUser) return;
        setLoading(true);
        try {
            await updateUserProfile(formData, newProfilePicFile);
            
            // On success, reset state and exit edit mode
            setNewProfilePicFile(null);
            setProfilePicPreview(null);
            setIsEditing(false);
        } catch (error) {
            // The error is already logged and notified by the context.
            console.error("Caught error in ProfileScreen:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (userProfile) {
            // FIX: Reset all form fields, including photoURL, to match initial state setup.
            const initialData: ProfileData = {
                name: userProfile.name || '',
                age: userProfile.age || '',
                gender: userProfile.gender || '',
                mobileNumber: userProfile.mobileNumber || '',
                photoURL: userProfile.photoURL || '',
            };
            if(student) {
                initialData.emergencyContact = student.emergencyContact || { name: '', phone: '' };
            }
            setFormData(initialData);
        }
        setNewProfilePicFile(null);
        setProfilePicPreview(null);
        setIsEditing(false);
    };

    if (!userProfile) {
        return <div className="text-center p-5"><p className="text-white">Loading profile...</p></div>;
    }

    return (
        <div>
            <button onClick={() => setView('dashboard')} className="btn-action mb-4">
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </button>
            
            <div className="row gy-4">

                {/* --- Left Column: Avatar & Static Info --- */}
                <div className="col-lg-4">
                    <div className="app-card text-center p-4">
                        <ProfilePicture
                            src={userProfile.photoURL}
                            preview={profilePicPreview}
                            initial={userInitial}
                            isEditable={isEditing}
                            onFileSelect={handleFileSelect}
                        />
                        <h4 className="mt-3 mb-1">{formData.name || userProfile.name}</h4>
                        <p className="text-muted mb-2">{authUser?.email}</p>
                        <span className={`badge text-capitalize ${userProfile.role === 'student' ? 'bg-primary' : 'bg-success'}`}>{userProfile.role}</span>
                        
                        {driver && driver.vehicleDetails && (
                            <>
                                <hr className="my-4" style={{borderColor: 'var(--card-border-color)'}}/>
                                <div className="text-start">
                                    <h5 className="section-title mb-3 text-center">Vehicle Details</h5>
                                    <ProfileDetailItem icon="fa-car" label="Make & Model" value={`${driver.vehicleDetails.make} ${driver.vehicleDetails.model}`} />
                                    <ProfileDetailItem icon="fa-id-card" label="License Plate" value={driver.vehicleDetails.licensePlate} className="mb-0" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* --- Right Column: Editable Details & Ride History --- */}
                <div className="col-lg-8">
                    <div className="app-card p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="booking-title mb-0">Profile Information</h3>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn-action">
                                    <i className="fas fa-pencil-alt me-2"></i>Edit Profile
                                </button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <>
                                <h5 className="section-title mb-3">Personal Details</h5>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <div className="form-group-floating">
                                            <i className="fas fa-user form-group-icon"></i>
                                            <input id="name" type="text" name="name" className="form-control" value={formData.name || ''} onChange={handleInputChange} placeholder="Full Name" />
                                            <label htmlFor="name">Full Name</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="form-group-floating">
                                            <i className="fas fa-phone form-group-icon"></i>
                                            <input id="mobileNumber" type="tel" name="mobileNumber" className="form-control" value={formData.mobileNumber || ''} onChange={handleInputChange} placeholder="e.g., 9876543210" />
                                            <label htmlFor="mobileNumber">Mobile Number</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="form-group-floating">
                                            <i className="fas fa-birthday-cake form-group-icon"></i>
                                            <input id="age" type="number" name="age" className="form-control" value={formData.age || ''} onChange={handleInputChange} placeholder="e.g., 21" />
                                            <label htmlFor="age">Age</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="gender" className="form-label" style={{position: 'absolute', top: '-10px', left: '12px', fontSize: '0.75rem', color: 'var(--accent)'}}>Gender</label>
                                        <select id="gender" name="gender" className="form-control" value={formData.gender || ''} onChange={handleInputChange} style={{height: '56px', paddingTop: '1.2rem'}}>
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>

                                {student && (
                                    <>
                                        <h5 className="section-title mt-4 mb-3">Emergency Contact</h5>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                 <div className="form-group-floating">
                                                    <i className="fas fa-user-shield form-group-icon"></i>
                                                    <input id="emergencyContactName" type="text" name="emergencyContactName" className="form-control" value={formData.emergencyContact?.name || ''} onChange={handleInputChange} placeholder="e.g., Jane Doe" />
                                                    <label htmlFor="emergencyContactName">Contact Name</label>
                                                 </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                 <div className="form-group-floating">
                                                    <i className="fas fa-mobile-alt form-group-icon"></i>
                                                    <input id="emergencyContactPhone" type="tel" name="emergencyContactPhone" className="form-control" value={formData.emergencyContact?.phone || ''} onChange={handleInputChange} placeholder="e.g., 9876543210" />
                                                    <label htmlFor="emergencyContactPhone">Contact Phone</label>
                                                 </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                <div className="d-flex justify-content-end mt-4">
                                    <button onClick={handleCancel} className="btn-action me-2">Cancel</button>
                                    <button onClick={handleSave} className="btn-book" disabled={loading} style={{width: 'auto', padding: '0.8rem 1.5rem'}}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h5 className="section-title mb-3">Personal Details</h5>
                                <div className="row">
                                    <div className="col-md-6"><ProfileDetailItem icon="fa-user" label="Full Name" value={userProfile.name} /></div>
                                    <div className="col-md-6"><ProfileDetailItem icon="fa-phone" label="Mobile Number" value={userProfile.mobileNumber} /></div>
                                    <div className="col-md-6"><ProfileDetailItem icon="fa-birthday-cake" label="Age" value={userProfile.age} /></div>
                                    <div className="col-md-6"><ProfileDetailItem icon="fa-venus-mars" label="Gender" value={userProfile.gender} /></div>
                                </div>
                                
                                {student && student.emergencyContact && (
                                    <>
                                        <h5 className="section-title mt-4 mb-3">Emergency Contact</h5>
                                        <div className="row">
                                            <div className="col-md-6"><ProfileDetailItem icon="fa-user-shield" label="Contact Name" value={student.emergencyContact.name} /></div>
                                            <div className="col-md-6"><ProfileDetailItem icon="fa-mobile-alt" label="Contact Phone" value={student.emergencyContact.phone} /></div>
                                        </div>
                                    </>
                                )}

                                {student && (
                                    <div className="mt-4">
                                        <h5 className="section-title mb-3">Achievements</h5>
                                        <div className="achievements-grid">
                                            {achievementsList.map(ach => {
                                                const isUnlocked = student.achievements?.[ach.id] || false;
                                                return (
                                                    <div key={ach.id} className={`achievement-badge ${!isUnlocked ? 'locked' : ''}`} title={isUnlocked ? ach.description : `Locked: ${ach.description}`}>
                                                        <i className={`fas ${ach.icon} achievement-icon`}></i>
                                                        <span className="achievement-name">{ach.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
