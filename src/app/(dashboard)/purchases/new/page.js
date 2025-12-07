'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Save } from 'lucide-react';
import styles from './page.module.css';

export default function NewPurchasePage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        supplier_name: '',
        purchase_date: getCurrentDateTime(),
        items: [
            { product: '', variant_id: '', quantity: 1, buy_price: 0, total_cost: 0 }
        ],
        total_amount: 0,
        notes: ''
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
                item.variant_id = ''; // Reset variant when product changes
                item.variant_name = '';

                // If product has no variants, use default buy price
                if (!selectedProduct.variants || selectedProduct.variants.length === 0) {
                    item.buy_price = selectedProduct.buy_price || 0;
                } else {
                    item.buy_price = 0; // Will be set when variant is selected
                }
            } else {
                item.product = '';
                item.variant_id = '';
                item.buy_price = 0;
            }
        } else if (field === 'variant_id') {
            const selectedProduct = products.find(p => p._id === item.product);
            if (selectedProduct) {
                const selectedVariant = selectedProduct.variants.find(v => v._id === value);
                if (selectedVariant) {
                    item.variant_id = value;
                    item.variant_name = selectedVariant.name;
                    item.buy_price = selectedVariant.buy_price || 0;
                }
            }
        } else if (field === 'quantity') {
            let qty = parseInt(value) || 0;
            if (qty < 1) qty = 1;
            item.quantity = qty;
        } else if (field === 'buy_price') {
            let price = parseFloat(value) || 0;
            if (price < 0) price = 0;
            item.buy_price = price;
        }

        item.total_cost = item.quantity * item.buy_price;
        newItems[index] = item;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product: '', variant_id: '', quantity: 1, buy_price: 0, total_cost: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const calculateTotal = () => {
        const total = formData.items.reduce((sum, item) => sum + item.total_cost, 0);
        setFormData(prev => ({ ...prev, total_amount: total }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (!formData.supplier_name) {
            setError('Supplier name is required');
            setSubmitting(false);
            return;
        }

        // Validation: Ensure product is selected, and if it has variants, a variant is selected
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
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                router.push('/purchases');
                router.refresh();
            } else {
                setError(data.message || 'Failed to create purchase');
            }
        } catch (error) {
            setError('An error occurred while creating the purchase');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>New Purchase</h1>
                <p className={styles.subtitle}>Record a new stock purchase</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Purchase Details</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Supplier Name *</label>
                            <input
                                type="text"
                                name="supplier_name"
                                value={formData.supplier_name}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="Enter supplier name"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Date & Time</label>
                            <input
                                type="datetime-local"
                                name="purchase_date"
                                value={formData.purchase_date}
                                onChange={handleInputChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}>Notes</label>
                            <input
                                type="text"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Items</h2>
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
                                                <option key={p._id} value={p._id}>
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
                                                    <option key={v._id} value={v._id}>
                                                        {v.name} (Stock: {v.stock_quantity})
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
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            className={styles.input}
                                            disabled={!item.product}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Buy Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.buy_price}
                                            onChange={(e) => handleItemChange(index, 'buy_price', e.target.value)}
                                            className={styles.input}
                                            disabled={!item.product}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Total</label>
                                        <input
                                            type="text"
                                            value={`৳ ${item.total_cost.toFixed(2)}`}
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
                            <span>Total Cost:</span>
                            <span>৳ {formData.total_amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/purchases" className={styles.cancelButton}>
                        Cancel
                    </Link>
                    <button type="submit" className={styles.submitButton} disabled={submitting}>
                        {submitting ? 'Record Purchase' : 'Record Purchase'}
                    </button>
                </div>
            </form>
        </div>
    );
}
