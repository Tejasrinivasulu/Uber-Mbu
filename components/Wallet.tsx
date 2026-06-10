
import React, { useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNotification } from '../contexts/NotificationContext';

const Wallet: React.FC = () => {
    const { student, addFundsToWallet } = useFirebase();
    const { showNotification } = useNotification();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    if (!student) return null;

    const handleAddFunds = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            showNotification('Invalid Amount', 'Please enter a valid amount to add.');
            return;
        }
        
        setLoading(true);
        try {
            await addFundsToWallet(numericAmount);
            showNotification('Success', `₹${numericAmount.toFixed(2)} added to your wallet.`);
            setAmount('');
        } catch (error) {
            showNotification('Error', 'Failed to add funds. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addQuickAmount = (quickAmount: number) => {
        const currentAmount = parseFloat(amount) || 0;
        setAmount((currentAmount + quickAmount).toString());
    };

    return (
        <div className="app-card">
            <div className="text-center mb-4">
                <span className="text-muted">Current Balance</span>
                <div className="fare-amount" style={{ fontSize: '2.5rem' }}>₹{student.walletBalance.toFixed(2)}</div>
            </div>

            <div className="mb-3">
                <label htmlFor="amount-input" className="form-label">Amount to Add (₹)</label>
                <input
                    id="amount-input"
                    type="number"
                    className="form-control"
                    placeholder="e.g., 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                />
            </div>
            <div className="destination-chips mb-4">
                {[100, 200, 500].map(val => (
                    <button type="button" key={val} className="destination-chip" onClick={() => addQuickAmount(val)}>+ ₹{val}</button>
                ))}
            </div>

            <button onClick={handleAddFunds} disabled={loading || !amount} className="btn-book">
                {loading ? 'Processing...' : 'Add Funds'}
            </button>
            <p className="small text-center mt-3 text-white-50">Payments are securely processed (simulation).</p>
        </div>
    );
};

export default Wallet;