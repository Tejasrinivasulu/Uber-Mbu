import React from 'react';
import '../styles/brand-logo.css';

interface BrandLogoProps {
    onClick?: () => void;
    className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ onClick, className = '' }) => (
    <button
        type="button"
        className={`mbu-brand ${className}`.trim()}
        onClick={onClick}
        aria-label="MBUGO — Home"
    >
        <span className="mbu-brand-mark">
            <img src="/brand-logo.png" alt="" className="mbu-brand-img" />
        </span>
        <span className="mbu-brand-name">
            <span className="mbu-brand-uber">MBU</span>
            <span className="mbu-brand-mbu">GO</span>
        </span>
    </button>
);

export default BrandLogo;
