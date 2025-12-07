'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import styles from '../new/page.module.css';

export default function EditProductPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: '',
        description: '',
        sell_price: 0,
        manufacturer: '',
        unit: 'piece',
        stock_quantity: 0,
        reorder_point: 10,
    });

    useEffect(() => {
        fetchCategories();
        if (params?.id) {
            fetchProduct();
        } else {
            console.error('No product ID in params!');
            setFetching(false);
        }
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProduct = async () => {
        if (!params?.id) {
            setFetching(false);
            return;
        }

        try {
            const res = await fetch(`/api/products/${params.id}`);
            const data = await res.json();

            if (data.success && data.data) {
                const product = data.data;

                const newFormData = {
                    sku: product.sku || '',
                    name: product.name || '',
                    category: product.category?._id || '',
                    description: product.description || '',
                    sell_price: product.sell_price || 0,
                    manufacturer: product.manufacturer || '',
                    unit: product.unit || 'piece',
                    stock_quantity: product.stock_quantity || 0,
                    reorder_point: product.reorder_point || 10,
                };

                setFormData(newFormData);

                if (product.images && product.images.length > 0) {
                    setImages(product.images);
                }
            } else {
                alert('Product not found: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Failed to load product data: ' + error.message);
        } finally {
            setFetching(false);
        }
    };

    const organizeHierarchy = () => {
        const parentCategories = categories.filter(cat => !cat.parent);
        const childCategories = categories.filter(cat => cat.parent);

        return parentCategories.map(parent => ({
            ...parent,
            children: childCategories.filter(child => child.parent?._id === parent._id),
        }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileName', file.name);
                formData.append('folder', '/products');

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                if (data.success) {
                    setImages(prev => [...prev, { ...data.data, is_primary: prev.length === 0 }]);
                }
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const productData = {
                ...formData,
                sell_price: parseFloat(formData.sell_price),
                // stock_quantity and buy_price are NOT updated here
                images,
            };

            const res = await fetch(`/api/products/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/products');
            } else {
                alert(data.message || 'Failed to update product');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    const hierarchy = organizeHierarchy();

    if (fetching) {
        return <div className={styles.container}><div className={styles.loading}>Loading product...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/products" className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Back to Products
                </Link>
                <h1 className={styles.title}>Edit Product</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Basic Information</h2>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>SKU *</label>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className={styles.input}
                                placeholder="e.g., PROD-001"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Product Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={styles.input}
                                placeholder="Enter product name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category *</label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className={styles.input}
                            >
                                <option value="">Select category</option>
                                {hierarchy.map(parent => (
                                    <optgroup key={parent._id} label={parent.name}>
                                        <option value={parent._id}>{parent.name}</option>
                                        {parent.children.map(child => (
                                            <option key={child._id} value={child._id}>
                                                &nbsp;&nbsp;{child.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}>Manufacturer</label>
                            <input
                                type="text"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                className={styles.input}
                                placeholder="Enter manufacturer"
                            />
                        </div>

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={styles.textarea}
                                placeholder="Enter product description"
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Pricing (BDT ৳)</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Sell Price (৳) *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.sell_price}
                                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                                className={styles.input}
                            />
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>Selling price to customers</small>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Inventory</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Unit</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className={styles.input}
                                placeholder="e.g., piece, kg, box"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Current Stock</label>
                            <div className={styles.input} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                {formData.stock_quantity}
                            </div>
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>Managed via Purchases</small>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Reorder Point</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.reorder_point}
                                onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Product Images</h2>
                    <div className={styles.imageUpload}>
                        <div className={styles.uploadBox}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className={styles.fileInput}
                                id="image-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="image-upload" className={styles.uploadLabel}>
                                {uploading ? <Loader2 className={styles.spinner} /> : <Upload size={24} />}
                                <span>{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                            </label>
                        </div>

                        <div className={styles.imageGrid}>
                            {images.map((img, index) => (
                                <div key={index} className={styles.imageCard}>
                                    <img src={img.thumbnail_url || img.url} alt="Product" className={styles.previewImage} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className={styles.removeImage}
                                    >
                                        <X size={16} />
                                    </button>
                                    {img.is_primary && <span className={styles.primaryBadge}>Primary</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/products" className={styles.cancelButton}>
                        Cancel
                    </Link>
                    <button type="submit" className={styles.submitButton} disabled={loading || uploading}>
                        {loading ? (
                            <>
                                <Loader2 className={styles.spinner} size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Update Product
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
