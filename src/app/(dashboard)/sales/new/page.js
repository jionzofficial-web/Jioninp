'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Save } from 'lucide-react';
import styles from './page.module.css';

export default function NewSalePage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Helper to get current local ISO string for datetime-local input
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        customer_name: '',
        company_name: '',
        order_date: getCurrentDateTime(),
        payment_status: 'paid',
        payment_method: 'cash',
        items: [
            { product: '', variant_id: '', quantity: 1, unit_price: 0, total_price: 0, max_stock: 0 }
        ],
        total_amount: 0
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        calculateTotal();
    }, [formData.items]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=1000');
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index] };

        if (field === 'product') {
            const selectedProduct = products.find(p => p._id === value);
            if (selectedProduct) {
                item.product = value;
                item.product_name = selectedProduct.name;
                item.variant_id = ''; // Reset variant
                item.variant_name = '';

                // If no variants, use product details
                if (!selectedProduct.variants || selectedProduct.variants.length === 0) {
                    item.unit_price = selectedProduct.sell_price;
                    item.max_stock = selectedProduct.stock_quantity;
                } else {
                    item.unit_price = 0; // Will be set when variant selected
                    item.max_stock = 0;
                }

                item.quantity = 1;
            } else {
                item.product = '';
                item.variant_id = '';
                item.unit_price = 0;
                item.max_stock = 0;
            }
        } else if (field === 'variant_id') {
            const selectedProduct = products.find(p => p._id === item.product);
            if (selectedProduct) {
                const selectedVariant = selectedProduct.variants.find(v => v._id === value);
                if (selectedVariant) {
                    item.variant_id = value;
                    item.variant_name = selectedVariant.name;
                    item.unit_price = selectedVariant.sell_price;
                    item.max_stock = selectedVariant.stock_quantity;
                    item.quantity = 1;
                }
            }
        } else if (field === 'quantity') {
            let qty = parseInt(value) || 0;
            if (qty < 1) qty = 1;
            if (item.max_stock > 0 && qty > item.max_stock) {
                qty = item.max_stock;
                alert(`Only ${item.max_stock} items in stock!`);
            }
            item.quantity = qty;
        }

        item.total_price = item.quantity * item.unit_price;
        newItems[index] = item;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product: '', variant_id: '', quantity: 1, unit_price: 0, total_price: 0, max_stock: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const calculateTotal = () => {
        const total = formData.items.reduce((sum, item) => sum + item.total_price, 0);
        setFormData(prev => ({ ...prev, total_amount: total }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (!formData.customer_name) {
            setError('Customer name is required');
            setSubmitting(false);
            return;
        }

        const invalidItems = formData.items.some(item => {
            if (!item.product || item.quantity < 1) return true;
            const product = products.find(p => p._id === item.product);
            if (product && product.variants && product.variants.length > 0 && !item.variant_id) {
                return true;
            }
            return false;
        });

        if (invalidItems) {
            setError('Please select valid products, variants (if applicable), and quantities');
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                router.push('/sales');
                router.refresh();
            } else {
                setError(data.message || 'Failed to create sale');
            }
        } catch (error) {
            setError('An error occurred while creating the sale');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>New Sale</h1>
                <p className={styles.subtitle}>Create a new sales order</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Order Details</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Customer Name *</label>
                            <input
                                type="text"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="Enter customer name"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="Enter company name (optional)"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Date & Time</label>
                            <input
                                type="datetime-local"
                                name="order_date"
                                value={formData.order_date}
                                onChange={handleInputChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Payment Status</label>
                            <select
                                name="payment_status"
                                value={formData.payment_status}
                                onChange={handleInputChange}
                                className={styles.select}
                            >
                                <option value="paid">Paid</option>
                                <option value="due">Due</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Payment Method</label>
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleInputChange}
                                className={styles.select}
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile_banking">Mobile Banking</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Order Items</h2>
                    <div className={styles.itemsSection}>
                        {formData.items.map((item, index) => {
                            const selectedProduct = products.find(p => p._id === item.product);
                            const hasVariants = selectedProduct?.variants?.length > 0;

                            return (
                                <div key={index} className={styles.itemRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Product</label>
                                        <select
                                            value={item.product}
                                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                            className={styles.select}
                                            required
                                        >
                                            <option value="">Select Product</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id} disabled={p.stock_quantity === 0 && (!p.variants || p.variants.length === 0)}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {hasVariants && (
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Variant</label>
                                            <select
                                                value={item.variant_id}
                                                onChange={(e) => handleItemChange(index, 'variant_id', e.target.value)}
                                                className={styles.select}
                                                required
                                            >
                                                <option value="">Select Variant</option>
                                                {selectedProduct.variants.map(v => (
                                                    <option key={v._id} value={v._id} disabled={v.stock_quantity === 0}>
                                                        {v.name} (Stock: {v.stock_quantity}) - ৳{v.sell_price}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.max_stock}
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            className={styles.input}
                                            disabled={!item.product || (hasVariants && !item.variant_id)}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Unit Price</label>
                                        <input
                                            type="text"
                                            value={`৳ ${item.unit_price}`}
                                            className={`${styles.input} ${styles.readOnlyInput}`}
                                            readOnly
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Total</label>
                                        <input
                                            type="text"
                                            value={`৳ ${item.total_price.toFixed(2)}`}
                                            className={`${styles.input} ${styles.readOnlyInput}`}
                                            readOnly
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className={styles.removeButton}
                                        title="Remove Item"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <button type="button" onClick={addItem} className={styles.addItemButton}>
                        <Plus size={18} />
                        Add Another Item
                    </button>

                    <div className={styles.summary}>
                        <div className={styles.totalRow}>
                            <span>Total Amount:</span>
                            <span>৳ {formData.total_amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/sales" className={styles.cancelButton}>
                        Cancel
                    </Link>
                    <button type="submit" className={styles.submitButton} disabled={submitting}>
                        {submitting ? 'Creating Sale...' : 'Create Sale'}
                    </button>
                </div>
            </form>
        </div>
    );
}
