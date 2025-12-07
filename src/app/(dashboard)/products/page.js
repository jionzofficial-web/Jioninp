'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import styles from './page.module.css';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [showBuyPrice, setShowBuyPrice] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const [debugInfo, setDebugInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [page, search]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/products?page=${page}&limit=10&search=${search}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.data);
                setPagination(data.pagination);
                setDebugInfo(data.debug);
            } else {
                setError(data.message || 'Failed to fetch products');
                setDebugInfo(data.debug);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const initiateDelete = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
        setDeletePassword('');
        setDeleteError('');
    };

    const executeDelete = async (e) => {
        e.preventDefault();

        if (deletePassword !== 'admin008') {
            setDeleteError('Incorrect password');
            return;
        }

        if (!productToDelete) return;

        try {
            const res = await fetch(`/api/products/${productToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });
            const data = await res.json();

            if (data.success) {
                setDeleteModalOpen(false);
                setProductToDelete(null);
                fetchProducts();
            } else {
                setDeleteError(data.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            setDeleteError('Failed to delete product');
        }
    };

    const handleToggleBuyPrice = () => {
        if (showBuyPrice) {
            setShowBuyPrice(false);
        } else {
            setShowPasswordModal(true);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === 'admin007') {
            setShowBuyPrice(true);
            setShowPasswordModal(false);
            setPassword('');
            setPasswordError('');
        } else {
            setPasswordError('Incorrect password');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Products</h1>
                    <p className={styles.subtitle}>Manage your product inventory</p>
                </div>
                <Link href="/products/new" className={styles.addButton}>
                    <Plus size={20} />
                    Add Product
                </Link>
            </div>

            <div className={styles.searchBar}>
                <Search size={20} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {loading ? (
                <div className={styles.loading}>Loading products...</div>
            ) : products.length === 0 ? (
                <div className={styles.empty}>
                    <Package size={48} />
                    <p>No products found</p>
                    <Link href="/products/new" className={styles.emptyButton}>
                        Create your first product
                    </Link>
                </div>
            ) : (
                <>
                    <div className={styles.table}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>SKU</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>
                                        <div className={styles.priceHeader}>
                                            Buy Price (৳)
                                            <button
                                                onClick={handleToggleBuyPrice}
                                                className={styles.eyeButton}
                                                title={showBuyPrice ? 'Hide buy price' : 'Show buy price'}
                                            >
                                                {showBuyPrice ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </th>
                                    <th>Sell Price (৳)</th>
                                    <th>Profit</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const profit = product.sell_price - product.buy_price;
                                    const profitPercent = product.buy_price > 0 ? (profit / product.buy_price * 100).toFixed(1) : '0.0';
                                    const stock = product.stock_quantity || 0;

                                    let stockColor = '#22c55e'; // Green (4+)
                                    let stockText = `${stock} ${product.unit}`;

                                    if (stock === 0) {
                                        stockColor = '#ef4444'; // Red
                                        stockText = 'Out of Stock';
                                    } else if (stock <= 3) {
                                        stockColor = '#f97316'; // Dark Orange
                                    }

                                    return (
                                        <tr key={product._id}>
                                            <td>
                                                {product.images?.[0] ? (
                                                    <img
                                                        src={product.images[0].thumbnail_url || product.images[0].url}
                                                        alt={product.name}
                                                        className={styles.productImage}
                                                    />
                                                ) : (
                                                    <div className={styles.noImage}>
                                                        <Package size={24} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className={styles.sku}>{product.sku}</td>
                                            <td className={styles.name}>{product.name}</td>
                                            <td>{product.category?.name || 'N/A'}</td>
                                            <td style={{ color: stockColor, fontWeight: 'bold' }}>
                                                {stockText}
                                            </td>
                                            <td className={styles.price}>
                                                {showBuyPrice ? (
                                                    `৳ ${product.buy_price?.toFixed(2) || '0.00'}`
                                                ) : (
                                                    <span className={styles.hiddenPrice}>••••••</span>
                                                )}
                                            </td>
                                            <td className={styles.price}>৳ {product.sell_price?.toFixed(2) || '0.00'}</td>
                                            <td>
                                                {showBuyPrice && (
                                                    <div className={styles.profit}>
                                                        <span className={styles.profitAmount}>৳ {profit.toFixed(2)}</span>
                                                        <span className={styles.profitPercent}>({profitPercent}%)</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <Link href={`/products/${product._id}`} className={styles.actionButton}>
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => initiateDelete(product)}
                                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {pagination.pages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className={styles.pageButton}
                            >
                                Previous
                            </button>
                            <span className={styles.pageInfo}>
                                Page {page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page === pagination.pages}
                                className={styles.pageButton}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Password Modal for Buy Price */}
            {showPasswordModal && (
                <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Enter Password</h3>
                        <p className={styles.modalSubtitle}>Enter password to reveal buy prices</p>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError('');
                                }}
                                className={styles.passwordInput}
                                placeholder="Enter password"
                                autoFocus
                            />
                            {passwordError && <p className={styles.error}>{passwordError}</p>}
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPassword('');
                                        setPasswordError('');
                                    }}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitButton}>
                                    Unlock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className={styles.modal} onClick={() => setDeleteModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete Product</h3>
                        <p className={styles.modalSubtitle}>
                            Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
                            <br />
                            This action cannot be undone and will delete all associated images.
                        </p>
                        <form onSubmit={executeDelete}>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => {
                                    setDeletePassword(e.target.value);
                                    setDeleteError('');
                                }}
                                className={styles.passwordInput}
                                placeholder="Enter admin password to confirm"
                                autoFocus
                            />
                            {deleteError && <p className={styles.error}>{deleteError}</p>}
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setProductToDelete(null);
                                        setDeletePassword('');
                                        setDeleteError('');
                                    }}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    style={{ backgroundColor: '#ef4444' }}
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
