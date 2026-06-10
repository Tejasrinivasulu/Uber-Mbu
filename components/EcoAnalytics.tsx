
import React from 'react';

interface EcoAnalyticsProps {
  co2Savings: number;
}

const EcoAnalytics: React.FC<EcoAnalyticsProps> = ({ co2Savings }) => {
  // Average CO2 absorption of a mature tree per year is ~22kg.
  const treesPlantedEquivalent = (co2Savings / 22).toFixed(1);

  return (
    <div className="app-card accent-card flex-row align-items-center justify-content-center p-3 h-100">
      <div className="stats-icon flex-shrink-0" style={{background: 'none', color: 'var(--accent)', fontSize: '2.5rem', marginBottom: 0, width: 'auto'}}>
        <i className="fas fa-globe-americas"></i>
      </div>
      <div className="ms-3 text-start">
        <div className="stats-number" style={{fontSize: '1.5rem'}}>
          {co2Savings.toFixed(1)} kg
        </div>
        <div className="stats-label" style={{fontSize: '0.8rem'}}>
          CO2 Saved
        </div>
        <div className="stats-label text-muted" style={{fontSize: '0.7rem'}}>
          🌱 ~{treesPlantedEquivalent} trees planted
        </div>
      </div>
    </div>
  );
};

export default EcoAnalytics;