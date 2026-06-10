import React, { useState, useRef } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNotification } from '../contexts/NotificationContext';

const DriverOnboarding: React.FC = () => {
    const { driver, completeDriverOnboarding } = useFirebase();
    const { showNotification } = useNotification();
    const [step, setStep] = useState(1);
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [licenseUploaded, setLicenseUploaded] = useState(false);
    const [registrationUploaded, setRegistrationUploaded] = useState(false);
    const [loading, setLoading] = useState(false);

    const licenseInputRef = useRef<HTMLInputElement>(null);
    const registrationInputRef = useRef<HTMLInputElement>(null);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleFileUpload = (type: 'license' | 'registration') => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            if (type === 'license') {
                setLicenseUploaded(true);
                showNotification('Success', 'License uploaded successfully.');
            } else {
                setRegistrationUploaded(true);
                showNotification('Success', 'Registration uploaded successfully.');
            }
        }
    };

    const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleSubmit = async () => {
        if (!vehicleMake || !vehicleModel || !licensePlate) {
            showNotification('Error', 'Please fill in all vehicle details.');
            return;
        }
        if (!licenseUploaded || !registrationUploaded) {
            showNotification('Error', 'Please upload all required documents.');
            return;
        }
        setLoading(true);
        try {
            await completeDriverOnboarding({
                make: vehicleMake,
                model: vehicleModel,
                licensePlate,
            });
            showNotification('Setup Complete!', 'Welcome to AutoMate. You are now verified.');
            // The App component will automatically switch to the dashboard upon state change
        } catch (error) {
            showNotification('Error', 'Could not save details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <div className="text-center mb-4">
                            <i className="fas fa-gift fa-3x" style={{color: 'var(--accent)'}}></i>
                        </div>
                        <p className="text-center h5 mb-3">Welcome, {driver?.name}!</p>
                        <p className="text-center text-muted">Let's get you set up to start earning.</p>
                        <div className="p-3 my-4 rounded text-center" style={{background: 'rgba(203, 161, 53, 0.1)', border: '1px solid var(--accent)'}}>
                            <h5 className="mb-1" style={{color: 'var(--accent)'}}>Sign-Up Bonus!</h5>
                            <p className="mb-0">Complete your first <strong>10 rides</strong> to earn a <strong>₹250 bonus</strong> in your wallet.</p>
                        </div>
                        <button onClick={handleNext} className="btn-book w-100">Let's Start</button>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <div className="mb-3 d-flex align-items-center">
                            <div className="stats-icon me-3 flex-shrink-0" style={{background: 'rgba(5, 150, 105, 0.2)', color: 'var(--success)'}}><i className="fas fa-power-off"></i></div>
                            <div>
                                <h6 className="mb-0">1. Go Online</h6>
                                <p className="small text-muted mb-0">Use the toggle on your dashboard to start receiving ride requests.</p>
                            </div>
                        </div>
                        <div className="mb-3 d-flex align-items-center">
                            <div className="stats-icon me-3 flex-shrink-0" style={{background: 'rgba(20, 184, 166, 0.2)', color: 'var(--primary-light)'}}><i className="fas fa-check"></i></div>
                            <div>
                                <h6 className="mb-0">2. Accept Rides</h6>
                                <p className="small text-muted mb-0">Review requests and tap 'Accept' to start a trip.</p>
                            </div>
                        </div>
                         <div className="mb-4 d-flex align-items-center">
                            <div className="stats-icon me-3 flex-shrink-0" style={{background: 'rgba(203, 161, 53, 0.2)', color: 'var(--accent)'}}><i className="fas fa-flag-checkered"></i></div>
                            <div>
                                <h6 className="mb-0">3. Complete & Earn</h6>
                                <p className="small text-muted mb-0">Tap 'Complete Ride' after dropping off the student to get paid instantly.</p>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between">
                            <button onClick={handleBack} className="btn-action">Back</button>
                            <button onClick={handleNext} className="btn-book" style={{width: 'auto', padding: '0.8rem 1.5rem'}}>Next</button>
                        </div>
                    </div>
                );
            case 3:
                const isFormComplete = vehicleMake && vehicleModel && licensePlate && licenseUploaded && registrationUploaded;
                return (
                    <div>
                        <div className="mb-3">
                            <label className="form-label">Vehicle Make</label>
                            <input type="text" className="form-control" placeholder="e.g., Bajaj" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Vehicle Model</label>
                            <input type="text" className="form-control" placeholder="e.g., RE Compact" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">License Plate</label>
                            <input type="text" className="form-control" placeholder="e.g., AP03 TX 1234" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} />
                        </div>
                         <div className="mb-4">
                            <label className="form-label">Required Documents</label>
                            <div className="p-3 rounded" style={{border: '1px solid rgba(255,255,255,0.2)'}}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Driver's License</span>
                                    {licenseUploaded ? (
                                        <span className="text-success fw-bold"><i className="fas fa-check-circle me-1"></i>Uploaded</span>
                                    ) : (
                                        <button className="btn-action" style={{padding: '0.25rem 0.75rem'}} onClick={() => triggerFileInput(licenseInputRef)}>
                                            Upload
                                        </button>
                                    )}
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span>Vehicle Registration</span>
                                    {registrationUploaded ? (
                                        <span className="text-success fw-bold"><i className="fas fa-check-circle me-1"></i>Uploaded</span>
                                    ) : (
                                        <button className="btn-action" style={{padding: '0.25rem 0.75rem'}} onClick={() => triggerFileInput(registrationInputRef)}>
                                            Upload
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={licenseInputRef} onChange={handleFileUpload('license')} style={{ display: 'none' }} accept="image/*,.pdf" />
                        <input type="file" ref={registrationInputRef} onChange={handleFileUpload('registration')} style={{ display: 'none' }} accept="image/*,.pdf" />

                        <div className="d-flex justify-content-between">
                            <button onClick={handleBack} className="btn-action">Back</button>
                            <button onClick={handleSubmit} className="btn-book" disabled={loading || !isFormComplete} style={{width: 'auto', padding: '0.8rem 1.5rem'}}>
                                {loading ? 'Saving...' : 'Finish Setup'}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const totalSteps = 3;
    const progressPercentage = (step / totalSteps) * 100;
    const stepTitles = ["Welcome", "How It Works", "Vehicle & Documents"];

    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 p-3">
            <div className="app-card w-100" style={{ maxWidth: '450px' }}>
                <div className="mb-4 text-center">
                    <h3 className="booking-title mb-1">Driver Setup</h3>
                    <p className="text-muted">Step {step} of {totalSteps}: {stepTitles[step - 1]}</p>
                    <div className="onboarding-progress" style={{ margin: '1rem auto 0' }}>
                        <div className="progress-bar-inner" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

export default DriverOnboarding;