
import React from 'react';
import { RideType, FareBreakdownDetails } from '../types';

interface BookingWidgetProps {
  rideType: RideType;
  setRideType: (type: RideType) => void;
  bookingType: 'ASAP' | 'Scheduled';
  setBookingType: (type: 'ASAP' | 'Scheduled') => void;
  pickup: string;
  setPickup: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  scheduledDate: string;
  setScheduledDate: (val: string) => void;
  scheduledTime: string;
  setScheduledTime: (val: string) => void;
  fareDetails: FareBreakdownDetails | null;
  onShowFareDetails: () => void;
  onBook: () => void;
  loading: boolean;
  noDriversAvailable: boolean;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({
  rideType, setRideType, bookingType, setBookingType,
  pickup, setPickup, destination, setDestination,
  scheduledDate, setScheduledDate, scheduledTime, setScheduledTime,
  fareDetails, onShowFareDetails, onBook, loading, noDriversAvailable
}) => {
  return (
    <div className="app-card booking-widget">
      <h3 className="booking-title mb-4">Book a Ride</h3>
      <div className="ride-option mb-3" role="group">
        <button type="button" onClick={() => setRideType(RideType.SOLO)} className={`ride-option-btn ${rideType === RideType.SOLO ? 'active' : ''}`} aria-pressed={rideType === RideType.SOLO}><i className="fas fa-user me-2"></i>Solo</button>
        <button type="button" onClick={() => setRideType(RideType.SHARED)} className={`ride-option-btn ${rideType === RideType.SHARED ? 'active' : ''}`} aria-pressed={rideType === RideType.SHARED}><i className="fas fa-users me-2"></i>Shared</button>
      </div>
      <div className="form-group-floating mb-3">
        <input type="text" id="pickup-location" className="form-control" placeholder="Pickup Location" value={pickup} onChange={(e) => setPickup(e.target.value)} />
        <label htmlFor="pickup-location">Pickup</label>
      </div>
      <div className="destination-chips" style={{ marginTop: '0.25rem', marginBottom: '1.5rem' }}>
        {["MBU Main Gate", "Hostel Block C", "Library"].map(loc => (
          <button type="button" key={loc} className={`destination-chip ${pickup.trim().toLowerCase() === loc.toLowerCase() ? 'active' : ''}`} onClick={() => setPickup(loc)} aria-pressed={pickup.trim().toLowerCase() === loc.toLowerCase()}>{loc}</button>
        ))}
      </div>
      <div className="form-group-floating mb-3">
        <input type="text" id="destination-location" className="form-control" placeholder="Destination Location" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <label htmlFor="destination-location">Destination</label>
      </div>
      <div className="destination-chips" style={{ marginTop: '0.25rem', marginBottom: '1.5rem' }}>
        {["Tirupati Railway Station", "Central Mall", "City Bus Stand"].map(loc => (
          <button type="button" key={loc} className={`destination-chip ${destination.trim().toLowerCase() === loc.toLowerCase() ? 'active' : ''}`} onClick={() => setDestination(loc)} aria-pressed={destination.trim().toLowerCase() === loc.toLowerCase()}>{loc}</button>
        ))}
      </div>
      <div className="ride-option mb-3" role="group">
        <button type="button" onClick={() => setBookingType('ASAP')} className={`ride-option-btn ${bookingType === 'ASAP' ? 'active' : ''}`} aria-pressed={bookingType === 'ASAP'}>ASAP</button>
        <button type="button" onClick={() => setBookingType('Scheduled')} className={`ride-option-btn ${bookingType === 'Scheduled' ? 'active' : ''}`} aria-pressed={bookingType === 'Scheduled'}>Scheduled</button>
      </div>
      {bookingType === 'Scheduled' && (
        <div className="row g-2">
          <div className="col-6"><input type="date" className="form-control" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} /></div>
          <div className="col-6"><input type="time" className="form-control" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} /></div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center my-3">
        <div>
          <span className="text-muted">Fare Estimate</span>
          <div className="fare-amount">₹{fareDetails?.totalFare.toFixed(2) || '...'}</div>
        </div>
        <button onClick={onShowFareDetails} className="btn-action">Details</button>
      </div>
      <button onClick={onBook} disabled={loading} className="btn-book" aria-busy={loading}>
        {loading ? 'Booking...' : (noDriversAvailable ? 'Join Waitlist' : 'Book Now')}
      </button>
    </div>
  );
};

export default BookingWidget;
