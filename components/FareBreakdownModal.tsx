

import React from 'react';
import { FareBreakdownDetails } from '../types';

interface FareBreakdownModalProps {
  show: boolean;
  onClose: () => void;
  details: FareBreakdownDetails;
}

const FareBreakdownModal: React.FC<FareBreakdownModalProps> = ({ show, onClose, details }) => {
  if (!show) {
    return null;
  }

  const isCapped = details.surgeMultiplier >= 1.5;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="fare-modal-title">
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="fare-modal-title">Fare Estimate Breakdown</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent">
                Base Fare
                <span>₹{details.baseFare.toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent">
                <div>
                  Est. Distance Charge
                  <small className="d-block opacity-75">{details.distanceKm} km × ₹10/km</small>
                </div>
                <span>₹{details.distanceCharge.toFixed(2)}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent">
                Est. Time Charge
                <span>₹{details.timeCharge.toFixed(2)}</span>
              </li>
              {details.surgeCharge > 0 && (
                <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-warning">
                  <div>
                    Surge Surcharge 
                    {isCapped && <span className="small text-muted ms-1">(Capped)</span>}
                    <small className="d-block opacity-75">{details.surgeMultiplier}x Peak Time</small>
                  </div>
                  <span>+ ₹{details.surgeCharge.toFixed(2)}</span>
                </li>
              )}
            </ul>
          </div>
          <div className="modal-footer d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Total Estimated Fare</h5>
            <h5 className="mb-0" style={{color: 'var(--accent)'}}>₹{details.totalFare.toFixed(2)}</h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FareBreakdownModal;
