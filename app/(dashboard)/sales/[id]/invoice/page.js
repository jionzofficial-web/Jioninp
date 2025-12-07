'use client';

import { useState, useEffect, use } from 'react';
import { Printer } from 'lucide-react';
import styles from './page.module.css';

export default function InvoicePage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            fetchOrder();
        }
    }, []);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/sales/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoice...</div>;
    if (!order) return <div style={{ padding: '2rem', textAlign: 'center' }}>Order not found</div>;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', { // DD/MM/YYYY format
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <h1>Prime Zone</h1>
                    <p>A premium Tech Solution</p>
                </div>
                <div className={styles.invoiceLabel}>
                    INVOICE
                </div>
            </header>

            {/* Info Section */}
            <div className={styles.infoSection}>
                <div className={styles.billTo}>
                    <h3>Invoice To:</h3>
                    <div className={styles.customerDetails}>
                        <strong>{order.customer_name}</strong>
                        {order.company_name && <div>{order.company_name}</div>}
                        {order.customer_address && <div>{order.customer_address}</div>}
                        {/* <div>client@email.com</div> */}
                        {order.customer_phone && <div>{order.customer_phone}</div>}
                    </div>
                </div>
                <div className={styles.invoiceMeta}>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Invoice Number :</span>
                        <span className={styles.metaValue}>#{order._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Invoice Date :</span>
                        <span className={styles.metaValue}>{formatDate(order.order_date)}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.product_name}</td>
                                <td>{item.quantity}</td>
                                <td>৳ {item.unit_price.toFixed(2)}</td>
                                <td>৳ {item.total_price.toFixed(2)}</td>
                            </tr>
                        ))}
                        {/* Fill empty rows if needed to look like the image, but dynamic is better */}
                    </tbody>
                </table>
            </div>

            {/* Grand Total */}
            <div className={styles.grandTotalContainer}>
                <div className={styles.grandTotalBox}>
                    <span className={styles.grandTotalLabel}>Grand Total:</span>
                    <span className={styles.grandTotalValue}>৳ {order.total_amount.toFixed(2)}</span>
                </div>
            </div>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
                <div className={styles.leftBottom}>
                    <div className={styles.paymentInfo}>
                        <h3>Payment Information</h3>
                        {/* Add payment details if available, e.g. Bank Info */}
                    </div>
                    <div className={styles.thanks}>
                        Thank's For Your Business
                    </div>
                </div>
                <div className={styles.signatory}>
                    <div className={styles.signatureSpace}></div>
                    <div className={styles.signatoryTitle}>Authorised Signatory</div>
                </div>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerTitle}>More information</div>
                <div className={styles.footerContent}>
                    <div>primezonebd.vercel.app</div>
                    <div>Dhaka, Bangladesh</div>
                    <div>01860897434</div>
                </div>
            </footer>

            <button onClick={() => window.print()} className={styles.printButton}>
                <Printer size={20} />
                Print Invoice
            </button>
        </div>
    );
}
