'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, User, Building2, FileText } from 'lucide-react';
import styles from './page.module.css';

export default function SalesPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/sales');
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.company_name && order.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sales Orders</h1>
                <Link href="/sales/new" className={styles.addButton}>
                    <Plus size={20} />
                    New Sale
                </Link>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by customer or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading sales...</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Company</th>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className={styles.emptyState}>No sales found</td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td>
                                            <div className={styles.dateCell}>
                                                <Calendar size={16} />
                                                {(() => {
                                                    const d = new Date(order.order_date);
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const year = String(d.getFullYear()).slice(-2);
                                                    return `${day}-${month}-${year}`;
                                                })()}
                                            </div>
                                            <div className={styles.timeSubtext}>
                                                {new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.userCell}>
                                                <User size={16} />
                                                {order.customer_name}
                                            </div>
                                        </td>
                                        <td>
                                            {order.company_name ? (
                                                <div className={styles.companyCell}>
                                                    <Building2 size={16} />
                                                    {order.company_name}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div className={styles.itemsList}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className={styles.itemRow}>
                                                        {item.quantity}x {item.product_name}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={styles.amount}>
                                            ৳ {order.total_amount.toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${styles[order.payment_status]}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${styles[order.status]}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/sales/${order._id}/invoice`} target="_blank" className={styles.actionButton} title="Print Invoice">
                                                <FileText size={18} />
                                            </Link>
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
