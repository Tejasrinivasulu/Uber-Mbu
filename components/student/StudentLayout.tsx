import React, { useRef, useEffect } from 'react';
import ThemeToggle from '../ThemeToggle';
import BrandLogo from '../BrandLogo';

export type StudentSection =
    | 'home'
    | 'booking'
    | 'nearby'
    | 'scheduled'
    | 'history'
    | 'emergency'
    | 'profile'
    | 'wallet'
    | 'scheduler';

interface NavItem {
    id: StudentSection;
    label: string;
    icon: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'booking', label: 'Ride Booking', icon: 'fa-taxi' },
    { id: 'nearby', label: 'Near Autos', icon: 'fa-car-side' },
    { id: 'scheduled', label: 'Scheduled Rides', icon: 'fa-calendar-days' },
    { id: 'history', label: 'Ride History', icon: 'fa-clock-rotate-left' },
    { id: 'emergency', label: 'Emergency', icon: 'fa-triangle-exclamation' },
];

const SECTION_META: Partial<Record<StudentSection, { title: string; subtitle: string }>> = {
    booking: { title: 'Ride Booking', subtitle: 'Book instant, shared, or scheduled rides across campus' },
    nearby: { title: 'Near Autos', subtitle: 'Find available autos near MBU and Tirupati' },
    scheduled: { title: 'Scheduled Rides', subtitle: 'Manage your upcoming ride plans' },
    history: { title: 'Ride History', subtitle: 'View past trips and fares' },
    emergency: { title: 'Emergency & Safety', subtitle: 'Quick access to help, live location sharing, and campus support' },
    profile: { title: 'Profile', subtitle: 'Manage your student account' },
    wallet: { title: 'Wallet', subtitle: 'Balance, payments, and transactions' },
    scheduler: { title: 'Ride Planner', subtitle: 'Plan recurring rides for your schedule' },
};

interface StudentLayoutProps {
    studentName: string;
    photoURL?: string;
    activeSection: StudentSection;
    onNavigate: (section: StudentSection) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSelect: (stopName: string) => void;
    onLogout: () => void;
    onProfileAction: (action: 'profile' | 'wallet' | 'settings') => void;
    children: React.ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({
    studentName,
    photoURL,
    activeSection,
    onNavigate,
    searchQuery,
    onSearchChange,
    onSearchSelect,
    onLogout,
    onProfileAction,
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

    const navigate = (section: StudentSection) => {
        onNavigate(section);
        setSidebarOpen(false);
    };

    const initial = studentName.charAt(0).toUpperCase();
    const pageMeta = SECTION_META[activeSection];

    return (
        <div className="mbu-dashboard">
            <header className="mbu-navbar">
                <button type="button" className="mbu-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
                    <i className="fas fa-bars"></i>
                </button>

                <BrandLogo onClick={() => navigate('home')} />

                <div className="mbu-search d-none d-lg-block">
                    <i className="fas fa-search mbu-search-icon"></i>
                    <input
                        type="search"
                        placeholder="Search stops, rides, locations..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                                onSearchSelect(searchQuery.trim());
                                onNavigate('booking');
                            }
                        }}
                        aria-label="Search locations"
                    />
                </div>

                <div className="mbu-nav-actions">
                    <ThemeToggle />
                    <div className="mbu-profile-wrap" ref={dropdownRef}>
                        <button type="button" className="mbu-profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)} aria-expanded={dropdownOpen}>
                            <span className="mbu-avatar">
                                {photoURL ? <img src={photoURL} alt="" /> : initial}
                            </span>
                            <span className="d-none d-md-inline">{studentName.split(' ')[0]}</span>
                            <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.5 }}></i>
                        </button>
                        {dropdownOpen && (
                            <div className="mbu-dropdown">
                                <button type="button" className="mbu-dropdown-item" onClick={() => { onProfileAction('profile'); setDropdownOpen(false); }}>
                                    <i className="fas fa-user"></i> View Profile
                                </button>
                                <button type="button" className="mbu-dropdown-item" onClick={() => { onProfileAction('profile'); setDropdownOpen(false); }}>
                                    <i className="fas fa-pen"></i> Edit Profile
                                </button>
                                <button type="button" className="mbu-dropdown-item" onClick={() => { onProfileAction('settings'); setDropdownOpen(false); }}>
                                    <i className="fas fa-gear"></i> Settings
                                </button>
                                <button type="button" className="mbu-dropdown-item" onClick={() => { onProfileAction('wallet'); setDropdownOpen(false); }}>
                                    <i className="fas fa-wallet"></i> Wallet
                                </button>
                                <hr className="mbu-dropdown-divider" />
                                <button type="button" className="mbu-dropdown-item danger" onClick={() => { onLogout(); setDropdownOpen(false); }}>
                                    <i className="fas fa-right-from-bracket"></i> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="mbu-search-mobile d-lg-none">
                <div className="mbu-search">
                    <i className="fas fa-search mbu-search-icon"></i>
                    <input
                        type="search"
                        placeholder="Search stops, rides, locations..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                                onSearchSelect(searchQuery.trim());
                                onNavigate('booking');
                            }
                        }}
                        aria-label="Search locations"
                    />
                </div>
            </div>

            <div className={`mbu-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            <div className="mbu-body">
                <aside className={`mbu-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
                    <div className="mbu-sidebar-title">Navigation</div>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`mbu-nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => navigate(item.id)}
                        >
                            <i className={`fas ${item.icon} mbu-nav-icon`}></i>
                            <span className="mbu-nav-label">{item.label}</span>
                        </button>
                    ))}
                    <div style={{ marginTop: 'auto', padding: '0.5rem' }}>
                        <button
                            type="button"
                            className="mbu-nav-item d-none d-lg-flex"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        >
                            <i className={`fas fa-${sidebarCollapsed ? 'angles-right' : 'angles-left'} mbu-nav-icon`}></i>
                            <span className="mbu-nav-label">Collapse</span>
                        </button>
                    </div>
                </aside>

                <main className="mbu-main">
                    <div className="mbu-page">
                        {activeSection !== 'home' && pageMeta && (
                            <header className="mbu-page-header">
                                <h1 className="mbu-page-title">{pageMeta.title}</h1>
                                <p className="mbu-page-subtitle">{pageMeta.subtitle}</p>
                            </header>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
