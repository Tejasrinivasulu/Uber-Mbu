import React, { useState } from 'react';
import { UserRole } from '../types';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../auth';
import ThemeToggle from '../components/ThemeToggle';
import { useFirebase } from '../contexts/FirebaseContext';

export const AuthScreen: React.FC = () => {
    const { login, loginAsDemo, signUp } = useFirebase();
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signUp(name, email, password, role);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign up. The email might already be in use.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };
    
    const toggleView = (e: React.MouseEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoginView(!isLoginView);
    };

    const handleDemoLogin = async (role: UserRole) => {
        setError(null);
        setLoading(true);
        try {
            await loginAsDemo(role);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign in with demo account.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-bg-image" aria-hidden="true"></div>
            <div className="auth-theme-toggle">
                <ThemeToggle />
            </div>
            <div className="auth-form-section">
                <div className="auth-form-card">
                    <div className="auth-brand text-center">
                        <h1 className="auth-brand-title">
                            <span>UBER</span> <span className="auth-brand-mbu">MBU</span>
                        </h1>
                    </div>

                    <h3 className="auth-form-title">{isLoginView ? 'Welcome Back' : 'Create Account'}</h3>
                    
                    {isLoginView ? (
                        <form onSubmit={handleLogin}>
                            <div className="mb-2 form-group-floating">
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="form-control" />
                                <label htmlFor="email">Email Address</label>
                            </div>
                            <div className="mb-2 form-group-floating">
                                 <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="form-control" />
                                 <label htmlFor="password">Password</label>
                            </div>
                            {error && <p className="text-danger small mb-2">{error}</p>}
                            <button type="submit" disabled={loading} className="btn-book w-100 auth-submit-btn">
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUp}>
                             <div className="mb-2 form-group-floating">
                                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="form-control" />
                                <label htmlFor="name">Full Name</label>
                            </div>
                            <div className="mb-2 form-group-floating">
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="form-control" />
                                <label htmlFor="email">Email Address</label>
                            </div>
                            <div className="mb-2 form-group-floating">
                                 <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" required className="form-control" />
                                 <label htmlFor="password">Password</label>
                            </div>
                            <div className="mb-2">
                                <label className="form-label small text-muted mb-1">I am a...</label>
                                <div className="ride-option">
                                    <button type="button" onClick={() => setRole(UserRole.STUDENT)} className={`ride-option-btn ${role === UserRole.STUDENT ? 'active' : ''}`}>
                                        <i className="fas fa-user-graduate me-2"></i>Student
                                    </button>
                                    <button type="button" onClick={() => setRole(UserRole.DRIVER)} className={`ride-option-btn ${role === UserRole.DRIVER ? 'active' : ''}`}>
                                        <i className="fas fa-car-side me-2"></i>Driver
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-danger small mb-2">{error}</p>}
                            <button type="submit" disabled={loading} className="btn-book w-100 auth-submit-btn">
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>
                    )}
                     <p className="text-center small auth-switch-text mb-0 text-muted">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <a href="#" onClick={toggleView} className="fw-bold ms-1" style={{color: 'var(--accent)'}}>
                             {isLoginView ? "Sign Up" : "Login"}
                        </a>
                    </p>

                    {isLoginView && (
                        <div className="auth-demo-box">
                            <p className="mb-1 small text-center"><strong>Demo Logins</strong></p>
                            <p className="mb-2 small text-muted text-center">
                                Password: <strong>{DEMO_PASSWORD}</strong>
                            </p>
                            <div className="d-grid gap-2">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleDemoLogin(UserRole.STUDENT)}
                                    className="btn-book w-100"
                                >
                                    <i className="fas fa-user-graduate me-2"></i>
                                    Login as Student
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleDemoLogin(UserRole.DRIVER)}
                                    className="btn btn-outline-secondary w-100"
                                >
                                    <i className="fas fa-car-side me-2"></i>
                                    Login as Driver
                                </button>
                            </div>
                            <p className="mb-0 mt-2 small text-muted text-center auth-demo-emails">
                                {DEMO_ACCOUNTS.student.email} · {DEMO_ACCOUNTS.driver.email}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
