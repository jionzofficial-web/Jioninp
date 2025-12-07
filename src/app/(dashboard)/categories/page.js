'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', parent: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/categories');
            const data = await res.json();

            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = { ...formData };
            if (!payload.parent) delete payload.parent; // Remove empty parent

            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                setFormData({ name: '', description: '', parent: '' });
                setShowForm(false);
                fetchCategories();
            } else {
                alert(data.message || 'Failed to create category');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            alert('Failed to create category');
        }
    };

    const handleDelete = async (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log('Attempting to delete category:', id);

        if (!id) {
            alert('Error: Category ID is missing');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this category?')) return;

        const password = window.prompt('Please enter admin password to confirm deletion:');
        if (!password) return;

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (data.success) {
                alert('Category deleted successfully');
                fetchCategories();
            } else {
                alert('Failed to delete: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error deleting category: ' + error.message);
        }
    };

    // Organize categories into hierarchy
    const organizeHierarchy = () => {
        const parentCategories = categories.filter(cat => !cat.parent);
        const childCategories = categories.filter(cat => cat.parent);

        return parentCategories.map(parent => ({
            ...parent,
            children: childCategories.filter(child => child.parent?._id === parent._id),
        }));
    };

    const hierarchy = organizeHierarchy();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Categories</h1>
                    <p className={styles.subtitle}>Organize your products hierarchically</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            {showForm && (
                <div className={styles.formCard}>
                    <h3 className={styles.formTitle}>New Category</h3>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={styles.input}
                                placeholder="Enter category name"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Parent Category</label>
                            <select
                                value={formData.parent}
                                onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                                className={styles.input}
                            >
                                <option value="">None (Top Level)</option>
                                {categories.filter(cat => !cat.parent).map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={styles.textarea}
                                rows="3"
                                placeholder="Enter description"
                            />
                        </div>
                        <div className={styles.formActions}>
                            <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitButton}>
                                Create Category
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Loading categories...</div>
            ) : categories.length === 0 ? (
                <div className={styles.empty}>
                    <FolderTree size={48} />
                    <p>No categories found</p>
                    <p className={styles.emptyHint}>Create your first category to organize products</p>
                </div>
            ) : (
                <div className={styles.hierarchyContainer}>
                    {hierarchy.map((parent) => (
                        <div key={parent._id} className={styles.categoryGroup}>
                            <div className={styles.parentCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitleGroup}>
                                        <FolderTree size={20} className={styles.folderIcon} />
                                        <h3 className={styles.cardTitle}>{parent.name}</h3>
                                        {parent.children.length > 0 && (
                                            <span className={styles.childCount}>{parent.children.length} subcategories</span>
                                        )}
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            onClick={(e) => handleDelete(parent._id, e)}
                                            className={styles.deleteButton}
                                            title="Delete category"
                                        >
                                            <Trash2 size={16} style={{ pointerEvents: 'none' }} />
                                        </button>
                                    </div>
                                </div>
                                {parent.description && (
                                    <p className={styles.cardDescription}>{parent.description}</p>
                                )}
                            </div>

                            {parent.children.length > 0 && (
                                <div className={styles.childrenContainer}>
                                    {parent.children.map((child) => (
                                        <div key={child._id} className={styles.childCard}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.cardTitleGroup}>
                                                    <ChevronRight size={16} className={styles.chevronIcon} />
                                                    <h4 className={styles.childTitle}>{child.name}</h4>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(child._id, e)}
                                                    className={styles.deleteButton}
                                                    title="Delete subcategory"
                                                >
                                                    <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                                                </button>
                                            </div>
                                            {child.description && (
                                                <p className={styles.childDescription}>{child.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
