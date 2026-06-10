import React, { useState, useRef, useEffect } from 'react';
import { searchStops } from '../../data/campusStops';

interface LocationSearchProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    onSelect?: (name: string) => void;
    showLocate?: boolean;
    onLocate?: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
    id, label, value, onChange, onSelect, showLocate, onLocate,
}) => {
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const suggestions = searchStops(value).slice(0, 8);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const select = (name: string) => {
        onChange(name);
        onSelect?.(name);
        setOpen(false);
    };

    return (
        <div className="mbu-location-search mb-3" ref={ref}>
            <label htmlFor={id} className="form-label small fw-semibold text-muted mb-1">{label}</label>
            <div className="d-flex gap-2">
                <input
                    id={id}
                    type="text"
                    className="form-control"
                    placeholder={`Search ${label.toLowerCase()}...`}
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => { setFocused(true); setOpen(true); }}
                    onBlur={() => setFocused(false)}
                    autoComplete="off"
                />
                {showLocate && (
                    <button type="button" className="btn btn-outline-primary" onClick={onLocate} title="Use current location" style={{ flexShrink: 0 }}>
                        <i className="fas fa-location-crosshairs"></i>
                    </button>
                )}
            </div>
            {open && (focused || value) && suggestions.length > 0 && (
                <div className="mbu-suggestions">
                    {suggestions.map((stop) => (
                        <button key={stop.id} type="button" className="mbu-suggestion-item" onMouseDown={() => select(stop.name)}>
                            <i className={`fas fa-${stop.category === 'campus' ? 'graduation-cap' : 'map-pin'} me-2 text-primary`}></i>
                            {stop.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
