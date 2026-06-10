import React, { useRef, useEffect } from 'react';
import ThemeToggle from '../ThemeToggle';
import BrandLogo from '../BrandLogo';

export type DriverSection =
    | 'home'
    | 'requests'
    | 'active'
    | 'scheduled'
    | 'earnings'
    | 'history'
    | 'emergency'
    | 'profile';

interface NavItem {
    id: DriverSection;
    label: string;
    icon: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'requests', label: 'Ride Requests', icon: 'fa-inbox' },
    { id: 'active', label: 'Active Ride', icon: 'fa-taxi' },
    { id: 'scheduled', label: 'Scheduled Rides', icon: 'fa-calendar-days' },
    { id: 'earnings', label: 'Earnings', icon: 'fa-indian-rupee-sign' },
    { id: 'history', label: 'Ride History', icon: 'fa-clock-rotate-left' },
    { id: 'emergency', label: 'Emergency & Support', icon: 'fa-triangle-exclamation' },
];

const SECTION_META: Record<DriverSection, { title: string; subtitle: string }> = {
    home: { title: 'Dashboard', subtitle: 'Your daily overview and quick actions' },
    requests: { title: 'Ride Requests', subtitle: 'Review and accept incoming student bookings' },
    active: { title: 'Active Ride', subtitle: 'Navigate, manage, and complete the current trip' },
    scheduled: { title: 'Scheduled Rides', subtitle: 'Upcoming bookings across campus and Tirupati' },
    earnings: { title: 'Earnings', subtitle: 'Track income, analytics, and transactions' },
    history: { title: 'Ride History', subtitle: 'Browse completed trips and fares collected' },
    emergency: { title: 'Emergency & Support', subtitle: 'Safety tools and help when you need them' },
    profile: { title: 'Profile', subtitle: 'Manage your driver account' },
};

interface DriverLayoutProps {
    driverName: string;
    photoURL?: string;
    activeSection: DriverSection;
    onNavigate: (section: DriverSection) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onLogout: () => void;
    onProfileAction: (action: 'profile' | 'vehicle' | 'edit') => void;
    requestCount?: number;
    children: React.ReactNode;
}

const DriverLayout: React.FC<DriverLayoutProps> = ({
    driverName,
    photoURL,
    activeSection,
    onNavigate,
    searchQuery,
    onSearchChange,
    onLogout,
    onProfileAction,
    requestCount = 0,
    children,
}) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const navigate = (section: DriverSection) => {
        onNavigate(section);
        setSidebarOpen(false);
    };

    const initial = driverName.charAt(0).toUpperCase();

    return (
        <div className="mbu-driver-dashboard">
            <header className="mbu-driver-navbar">
                <button
                    type="button"
                    className="mbu-sidebar-toggle"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle menu"
                >
                    <i className="fas fa-bars"></i>
                </button>

                <BrandLogo onClick={() => navigate('home')} />

                <div className="mbu-driver-search d-none d-lg-block">
                    <i className="fas fa-search mbu-driver-search-icon"></i>
                    <input
                        type="search"
                        placeholder="Search student, ride ID, pickup, destination..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        aria-label="Search rides"
                    />
                </div>

                <div className="mbu-driver-nav-actions">
                    <ThemeToggle />
                    <div className="mbu-driver-profile-wrap" ref={dropdownRef}>
                        <button
                            type="button"
                            className="mbu-driver-profile-btn"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            aria-expanded={dropdownOpen}
                        >
                            <span className="mbu-driver-avatar">
                                {photoURL ? <img src={photoURL} alt="" /> : initial}
                            </span>
                            <span className="d-none d-md-inline">{driverName.split(' ')[0]}</span>
                            <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.5 }}></i>
                        </button>
                        {dropdownOpen && (
                            <div className="mbu-driver-dropdown">
                                <button type="button" className="mbu-driver-dropdown-item" onClick={() => { onProfileAction('profile'); setDropdownOpen(false); }}>
                                    <i className="fas fa-user"></i> View Profile
                                </button>
                                <button type="button" className="mbu-driver-dropdown-item" onClick={() => { onProfileAction('edit'); setDropdownOpen(false); }}>
                                    <i className="fas fa-pen"></i> Edit Profile
                                </button>
                                <button type="button" className="mbu-driver-dropdown-item" onClick={() => { onProfileAction('vehicle'); setDropdownOpen(false); }}>
                                    <i className="fas fa-car"></i> Vehicle Details
                                </button>
                                <hr className="mbu-driver-dropdown-divider" />
                                <button type="button" className="mbu-driver-dropdown-item danger" onClick={() => { onLogout(); setDropdownOpen(false); }}>
                                    <i className="fas fa-right-from-bracket"></i> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="mbu-driver-search-mobile d-lg-none">
                <div className="mbu-driver-search">
                    <i className="fas fa-search mbu-driver-search-icon"></i>
                    <input
                        type="search"
                        placeholder="Search student, ride ID, location..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        aria-label="Search rides"
                    />
                </div>
            </div>

            <div className={`mbu-driver-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            <div className="mbu-driver-body">
                <aside className={`mbu-driver-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
                    <div className="mbu-driver-sidebar-title">Navigation</div>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`mbu-driver-nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => navigate(item.id)}
                        >
                            <i className={`fas ${item.icon} mbu-driver-nav-icon`}></i>
                            <span className="mbu-driver-nav-label">
                                {item.label}
                                {item.id === 'requests' && requestCount > 0 && (
                                    <span className="mbu-driver-nav-badge">{requestCount}</span>
                                )}
                            </span>
                        </button>
                    ))}
                    <div style={{ marginTop: 'auto', padding: '0.5rem' }}>
                        <button
                            type="button"
                            className="mbu-driver-nav-item d-none d-lg-flex"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        >
                            <i className={`fas fa-${sidebarCollapsed ? 'angles-right' : 'angles-left'} mbu-driver-nav-icon`}></i>
                            <span className="mbu-driver-nav-label">Collapse</span>
                        </button>
                    </div>
                </aside>

                <main className="mbu-driver-main">
                    <div className="mbu-driver-page">
                        {activeSection !== 'profile' && activeSection !== 'home' && SECTION_META[activeSection] && (
                            <header className="mbu-driver-page-header">
                                <h1 className="mbu-driver-page-title">{SECTION_META[activeSection].title}</h1>
                                <p className="mbu-driver-page-subtitle">{SECTION_META[activeSection].subtitle}</p>
                            </header>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DriverLayout;
