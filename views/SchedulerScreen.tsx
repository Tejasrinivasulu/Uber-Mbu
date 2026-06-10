
import React, { useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { ScheduledEvent, RidePlan } from '../types';
import { generateRideSuggestions } from '../ai/Scheduler';
import { useNotification } from '../contexts/NotificationContext';

const SchedulerScreen: React.FC = () => {
    const { 
        setView, weeklySchedule, ridePlans, 
        updateWeeklySchedule, acceptRidePlan, removeRidePlan 
    } = useFirebase();
    const { showNotification } = useNotification();

    const [events, setEvents] = useState<ScheduledEvent[]>(weeklySchedule);
    const [suggestions, setSuggestions] = useState<Omit<RidePlan, 'id'>[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showEventForm, setShowEventForm] = useState(false);
    
    // Form state for a new event
    const [eventName, setEventName] = useState('');
    const [eventDays, setEventDays] = useState<string[]>([]);
    const [eventTime, setEventTime] = useState('');
    const [eventLocation, setEventLocation] = useState('');

    const handleDayToggle = (day: string) => {
        setEventDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleAddEvent = () => {
        if (!eventName || eventDays.length === 0 || !eventTime || !eventLocation) {
            showNotification('Incomplete Form', 'Please fill out all fields for the event.');
            return;
        }
        const newEvent: ScheduledEvent = {
            id: `event-${Date.now()}`,
            name: eventName,
            days: eventDays,
            time: eventTime,
            location: eventLocation
        };
        setEvents(prev => [...prev, newEvent]);
        // Reset form
        setEventName('');
        setEventDays([]);
        setEventTime('');
        setEventLocation('');
        setShowEventForm(false);
    };
    
    const handleSaveSchedule = async () => {
        setIsLoading(true);
        setSuggestions([]);
        try {
            await updateWeeklySchedule(events);
            if (events.length > 0) {
                const generatedSuggestions = await generateRideSuggestions(events);
                setSuggestions(generatedSuggestions);
            } else {
                 showNotification('Schedule Cleared', 'Your schedule is empty.');
            }
        } catch (error) {
            console.error("Error generating suggestions:", error);
            showNotification('AI Error', 'Could not generate ride suggestions.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAcceptSuggestion = (suggestion: Omit<RidePlan, 'id'>) => {
        acceptRidePlan(suggestion);
        setSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="row gy-4">
            <div className="col-12">
                <button onClick={() => setView('dashboard')} className="btn-action">
                    <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
                </button>
            </div>

            <div className="col-lg-6">
                <div className="app-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                         <h3 className="booking-title mb-0">My Weekly Schedule</h3>
                         <button className="btn-action" onClick={() => setShowEventForm(!showEventForm)}>
                            <i className={`fas ${showEventForm ? 'fa-times' : 'fa-plus'} me-2`}></i>
                            {showEventForm ? 'Cancel' : 'Add Event'}
                        </button>
                    </div>
                    
                    {showEventForm && (
                        <div className="p-3 mb-3 rounded" style={{border: '1px solid rgba(255,255,255,0.2)'}}>
                            <input type="text" className="form-control mb-2" placeholder="Event Name (e.g., CS101 Lecture)" value={eventName} onChange={e => setEventName(e.target.value)} />
                            <input type="text" className="form-control mb-2" placeholder="Location (e.g., Engineering Building)" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                            <input type="time" className="form-control mb-2" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                            <div className="destination-chips mb-2">
                                {daysOfWeek.map(day => (
                                    <button 
                                      key={day} 
                                      type="button"
                                      onClick={() => handleDayToggle(day)} 
                                      className={`destination-chip ${eventDays.includes(day) ? 'active' : ''}`}
                                      aria-pressed={eventDays.includes(day)}
                                    >
                                      {day}
                                    </button>
                                ))}
                            </div>
                            <button className="btn-outline-primary w-100" onClick={handleAddEvent}>Add to Schedule</button>
                        </div>
                    )}

                    {events.length > 0 ? (
                        events.map(event => (
                            <div key={event.id} className="d-flex justify-content-between align-items-center p-2 border-bottom" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
                                <div>
                                    <p className="mb-0 fw-bold">{event.name} @ {event.location}</p>
                                    <p className="small text-muted mb-0">{event.days.join(', ')} at {event.time}</p>
                                </div>
                                <button className="btn-action cancel" onClick={() => setEvents(events.filter(e => e.id !== event.id))}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted text-center p-3">Add your recurring classes or activities to get started.</p>
                    )}
                    <button className="btn-book w-100 mt-3" onClick={handleSaveSchedule} disabled={isLoading}>
                       {isLoading ? 'Analyzing...' : 'Analyze & Suggest Rides'}
                    </button>
                </div>
            </div>

            <div className="col-lg-6">
                <div className="app-card">
                    <h3 className="booking-title mb-3">
                        <i className="fas fa-brain me-2" style={{color: 'var(--accent)'}}></i>
                        AI Suggestions & Plans
                    </h3>
                    {isLoading && (
                        <div className="text-center p-5">
                            <div className="spinner-border text-warning" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Our AI is planning your perfect week...</p>
                        </div>
                    )}
                    {suggestions.length > 0 && (
                        <div className="mb-4">
                            <h5 className="section-title">New Suggestions</h5>
                            {suggestions.map((s, i) => (
                                <div key={i} className="p-3 mb-2 rounded" style={{background: 'rgba(255,255,255,0.05)'}}>
                                    <p className="fw-bold mb-1">Ride for: {s.forEvent}</p>
                                    <p className="small text-muted fst-italic">"{s.reason}"</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{s.day} @ {s.pickupTime} to {s.destination}</span>
                                        <div>
                                            <button className="btn-action" onClick={() => setSuggestions(suggestions.filter(sug => sug !== s))}>Decline</button>
                                            <button className="btn-action call ms-2" onClick={() => handleAcceptSuggestion(s)}>Accept</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {ridePlans.length > 0 ? (
                         <div>
                            <h5 className="section-title">Your Active Ride Plans</h5>
                            {ridePlans.map(plan => (
                                <div key={plan.id} className="d-flex justify-content-between align-items-center p-2 border-bottom" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
                                    <div>
                                        <p className="mb-0 fw-bold">{plan.forEvent}</p>
                                        <p className="small text-muted mb-0">{plan.day} @ {plan.pickupTime} to {plan.destination}</p>
                                    </div>
                                    <button className="btn-action cancel" onClick={() => removeRidePlan(plan.id)}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))}
                         </div>
                    ) : (
                       !isLoading && suggestions.length === 0 && <p className="text-muted text-center p-3">Your accepted ride plans will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchedulerScreen;