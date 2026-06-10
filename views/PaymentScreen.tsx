

import React from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import Wallet from '../components/Wallet';
import { Transaction } from '../types';

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const isCredit = transaction.type === 'credit';
    const amountClass = isCredit ? 'text-credit' : 'text-debit';
    const iconClass = isCredit ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger';
    const amountPrefix = isCredit ? '+' : '-';

    return (
        <div className="ride-item">
            <div className="ride-destination">
                <i className={`fas ${iconClass} me-3`}></i>
                {transaction.description}
            </div>
            <div className="ride-date">{new Date(transaction.date).toLocaleDateString()}</div>
            <div className={`ride-fare ${amountClass}`}>
                {amountPrefix} ₹{transaction.amount.toFixed(2)}
            </div>
        </div>
    );
};

const PaymentScreen: React.FC = () => {
    const { setView, transactionHistory } = useFirebase();

    return (
        <div className="row gy-4">
            <div className="col-12">
                <button onClick={() => setView('dashboard')} className="btn-action">
                    <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
                </button>
            </div>
            <div className="col-lg-5">
                <Wallet />
            </div>
            <div className="col-lg-7">
                <div className="app-card">
                    <div className="section-header">
                        <h3 className="section-title">Transaction History</h3>
                    </div>
                    {transactionHistory.length > 0 ? (
                        transactionHistory.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
                    ) : (
                        <p>No transactions yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentScreen;
