'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, Building2, Package } from 'lucide-react';
import styles from './page.module.css';

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            const res = await fetch('/api/purchases');
            const data = await res.json();
            if (data.success) {
                setPurchases(data.data);
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPurchases = purchases.filter(purchase =>
        purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Purchases</h1>
                <Link href="/purchases/new" className={styles.addButton}>
                    <Plus size={20} />
                    New Purchase
                </Link>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading purchases...</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Items</th>
                                <th>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className={styles.emptyState}>No purchases found</td>
                                </tr>
                            ) : (
                                filteredPurchases.map((purchase) => (
                                    <tr key={purchase._id}>
                                        <td>
                                            <div className={styles.dateCell}>
                                                <Calendar size={16} />
                                                {(() => {
                                                    const d = new Date(purchase.purchase_date);
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const year = String(d.getFullYear()).slice(-2);
                                                    return `${day}-${month}-${year}`;
                                                })()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.companyCell}>
                                                <Building2 size={16} />
                                                {purchase.supplier_name}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.itemsList}>
                                                {purchase.items.map((item, idx) => (
                                                    <div key={idx} className={styles.itemRow}>
                                                        {item.quantity}x {item.product_name} (@ ৳{item.buy_price})
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={styles.amount}>
                                            ৳ {purchase.total_amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
