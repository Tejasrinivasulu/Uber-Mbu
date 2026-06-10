import React from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
    const { authUser, student, driver, logout, setView, view } = useFirebase();

    const userProfile = authUser?.role === 'student' ? student : driver;
    const userInitial = userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : '?';

    return (
        <header className="header">
            <button
                type="button"
                className="logo"
                onClick={() => setView('dashboard')}
                aria-label="Go to dashboard"
                style={{ cursor: 'pointer' }}
            >
                <i className="fas fa-bus me-2" aria-hidden="true"></i>
                <span>AutoMate</span>
            </button>

            <nav className="header-nav d-none d-md-flex" aria-label="Main navigation">
                <button
                    type="button"
                    className={`header-nav-btn ${view === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setView('dashboard')}
                >
                    Dashboard
                </button>
                {student && (
                    <>
                        <button
                            type="button"
                            className={`header-nav-btn ${view === 'wallet' ? 'active' : ''}`}
                            onClick={() => setView('wallet')}
                        >
                            Wallet
                        </button>
                        <button
                            type="button"
                            className={`header-nav-btn ${view === 'scheduler' ? 'active' : ''}`}
                            onClick={() => setView('scheduler')}
                        >
                            Scheduler
                        </button>
                    </>
                )}
                {driver && (
                    <button
                        type="button"
                        className={`header-nav-btn ${view === 'heatmap' ? 'active' : ''}`}
                        onClick={() => setView('heatmap')}
                    >
                        Heatmap
                    </button>
                )}
            </nav>

            {student && (
                <button
                    type="button"
                    className="wallet-balance d-none d-md-block"
                    onClick={() => setView('wallet')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '0' }}
                    aria-label={`Wallet balance: ₹${student.walletBalance.toFixed(2)}. Click to manage wallet.`}
                >
                    <span><i className="fas fa-wallet me-2" aria-hidden="true"></i>Wallet</span>
                    <h3>₹ {student.walletBalance.toFixed(2)}</h3>
                </button>
            )}

            {driver && (
                <div className="wallet-balance d-none d-md-block">
                    <span>Welcome, {driver.name}</span>
                    <h3 className="mb-0" style={{ fontSize: '1rem', color: driver.isOnline ? 'var(--success)' : 'var(--text-muted-color)' }}>
                        {driver.isOnline ? '● Online' : '○ Offline'}
                    </h3>
                </div>
            )}

            <div className="user-menu">
                <button onClick={logout} className="btn-action btn-logout" style={{ marginTop: '0' }}>
                    Logout
                </button>
                <ThemeToggle />
                <button
                    type="button"
                    className="user-avatar"
                    onClick={() => setView('profile')}
                    aria-label="View profile and settings"
                    style={{ cursor: 'pointer' }}
                >
                    {userProfile?.photoURL ? (
                        <img src={userProfile.photoURL} alt="Profile" />
                    ) : (
                        <span>{userInitial}</span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
