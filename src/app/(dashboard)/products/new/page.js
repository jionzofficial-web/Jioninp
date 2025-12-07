'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: '',
        description: '',
        sell_price: '',
        manufacturer: '',
        unit: 'piece',
        reorder_point: 10,
    });

    const [variants, setVariants] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchNextSku();
    }, []);

    const fetchNextSku = async () => {
        try {
            const res = await fetch('/api/products/next-sku');
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, sku: data.sku }));
            }
        } catch (error) {
            console.error('Error fetching next SKU:', error);
        }
    };

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
        // Also update variants that might be using this image index
        setVariants(prev => prev.map(v => {
            if (v.image_index === index) return { ...v, image_index: 0 };
            if (v.image_index > index) return { ...v, image_index: v.image_index - 1 };
            return v;
        }));
    };

    const addVariant = () => {
        // Find max suffix to avoid duplicates if variants are removed
        let maxSuffix = 0;
        variants.forEach(v => {
            if (v.sku && v.sku.includes('-V')) {
                const parts = v.sku.split('-V');
                const num = parseInt(parts[parts.length - 1]);
                if (!isNaN(num) && num > maxSuffix) maxSuffix = num;
            }
        });

        setVariants(prev => [...prev, {
            name: '',
            sku: `${formData.sku}-V${maxSuffix + 1}`,
            sell_price: formData.sell_price || 0,
            image_index: 0,
            attributes: { Color: '', Storage: '' } // Default attributes
        }]);
    };

    const removeVariant = (index) => {
        setVariants(prev => prev.filter((_, i) => i !== index));
    };

    const updateVariant = (index, field, value) => {
        setVariants(prev => {
            const newVariants = [...prev];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return newVariants;
        });
    };

    const updateVariantAttribute = (index, key, value) => {
        setVariants(prev => {
            const newVariants = [...prev];
            newVariants[index].attributes = { ...newVariants[index].attributes, [key]: value };
            return newVariants;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const productData = {
                ...formData,
                sell_price: parseFloat(formData.sell_price) || 0,
                stock_quantity: 0,
                buy_price: 0,
                images,
                variants: variants.map(v => ({
                    ...v,
                    sell_price: parseFloat(v.sell_price) || 0,
                    buy_price: 0, // Managed via purchases
                    stock_quantity: 0 // Managed via purchases
                }))
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/products');
            } else {
                console.error('Server validation errors:', data.errors);
                alert('Failed to create product: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const hierarchy = organizeHierarchy();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/products" className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Back to Products
                </Link>
                <h1 className={styles.title}>Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Basic Info Section */}
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
                                {hierarchy.map((parent) => (
                                    <optgroup key={parent._id} label={parent.name}>
                                        <option value={parent._id}>{parent.name}</option>
                                        {parent.children.map((child) => (
                                            <option key={child._id} value={child._id}>
                                                └─ {child.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Manufacturer</label>
                            <input
                                type="text"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                className={styles.input}
                                placeholder="Enter manufacturer"
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={styles.textarea}
                            rows="4"
                            placeholder="Enter product description"
                        />
                    </div>
                </div>

                {/* Pricing Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Base Pricing (BDT ৳)</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Sell Price (৳) *</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={formData.sell_price}
                                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                                className={styles.input}
                                placeholder="0.00"
                            />
                            <span className={styles.hint}>Base selling price</span>
                        </div>
                    </div>
                </div>

                {/* Images Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Product Images</h2>
                    <div className={styles.imageUpload}>
                        <input
                            type="file"
                            id="imageUpload"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className={styles.fileInput}
                        />
                        <label htmlFor="imageUpload" className={styles.uploadButton}>
                            <Upload size={20} />
                            {uploading ? 'Uploading...' : 'Upload Images'}
                        </label>
                    </div>
                    {images.length > 0 && (
                        <div className={styles.imageGrid}>
                            {images.map((image, index) => (
                                <div key={index} className={styles.imageCard}>
                                    <img src={image.thumbnail_url || image.url} alt={image.name} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className={styles.removeImage}
                                    >
                                        <X size={16} />
                                    </button>
                                    {image.is_primary && <span className={styles.primaryBadge}>Primary</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Variations Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Variations (Optional)</h2>
                    <div className={styles.variantList}>
                        {variants.map((variant, index) => (
                            <div key={index} className={styles.variantCard}>
                                <div className={styles.variantHeader}>
                                    <span className={styles.variantTitle}>Variant #{index + 1}</span>
                                    <button type="button" onClick={() => removeVariant(index)} className={styles.removeVariantButton}>
                                        <Trash2 size={16} /> Remove
                                    </button>
                                </div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Variant Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                            className={styles.input}
                                            placeholder="e.g., Midnight Green - 256GB"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>SKU *</label>
                                        <input
                                            type="text"
                                            required
                                            value={variant.sku}
                                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Sell Price (৳) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={variant.sell_price}
                                            onChange={(e) => updateVariant(index, 'sell_price', e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Attributes</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Color"
                                                value={variant.attributes.Color || ''}
                                                onChange={(e) => updateVariantAttribute(index, 'Color', e.target.value)}
                                                className={styles.input}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Storage"
                                                value={variant.attributes.Storage || ''}
                                                onChange={(e) => updateVariantAttribute(index, 'Storage', e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                    <label className={styles.label}>Variant Image</label>
                                    {images.length === 0 ? (
                                        <div className={styles.hint}>Upload images above to select one for this variant.</div>
                                    ) : (
                                        <div className={styles.variantImageSelect}>
                                            {images.map((img, imgIdx) => (
                                                <div
                                                    key={imgIdx}
                                                    className={`${styles.variantImageOption} ${variant.image_index === imgIdx ? styles.selected : ''}`}
                                                    onClick={() => updateVariant(index, 'image_index', imgIdx)}
                                                >
                                                    <img src={img.thumbnail_url || img.url} alt="Variant" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addVariant} className={styles.addVariantButton}>
                        <Plus size={18} /> Add Variant
                    </button>
                </div>

                {/* Inventory Settings */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Inventory Settings</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Unit</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className={styles.input}
                                placeholder="e.g., piece, box, kg"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Reorder Point</label>
                            <input
                                type="number"
                                value={formData.reorder_point}
                                onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
                                className={styles.input}
                                min="0"
                            />
                            <span className={styles.hint}>Alert when stock falls below this</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        Note: Stock quantity and buy price are managed through the Purchases section.
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/products" className={styles.cancelButton}>
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
