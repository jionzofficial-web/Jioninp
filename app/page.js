'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, LogIn, ShieldCheck, Cpu } from 'lucide-react';
import styles from './page.module.css';

function ProductCard({ product, index }) {
    const [selectedVariant, setSelectedVariant] = useState(null);

    useEffect(() => {
        if (product.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    const displayPrice = selectedVariant ? selectedVariant.sell_price : product.sell_price;
    const displayStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

    let displayImage = product.images?.[0];
    if (selectedVariant && typeof selectedVariant.image_index === 'number' && product.images?.[selectedVariant.image_index]) {
        displayImage = product.images[selectedVariant.image_index];
    }

    let stockColor = '#22c55e';
    let stockBg = 'rgba(34, 197, 94, 0.1)';
    let stockText = 'In Stock';

    if (displayStock === 0) {
        stockColor = '#ef4444';
        stockBg = 'rgba(239, 68, 68, 0.1)';
        stockText = 'Out of Stock';
    } else if (displayStock <= 3) {
        stockColor = '#f97316';
        stockBg = 'rgba(249, 115, 22, 0.1)';
        stockText = 'Low Stock';
    }

    return (
        <div
            className={styles.card}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <div className={styles.imageContainer}>
                {displayImage ? (
                    <img
                        src={displayImage.thumbnail_url || displayImage.url}
                        alt={product.name}
                        className={styles.productImage}
                    />
                ) : (
                    <Package size={64} color="#cbd5e1" strokeWidth={1} />
                )}

                <div
                    className={styles.stockBadge}
                    style={{ color: stockColor, backgroundColor: stockBg }}
                >
                    {stockText} ({displayStock})
                </div>
            </div>

            <div className={styles.cardContent}>
                <div>
                    <div className={styles.category}>
                        {product.category?.name || 'Uncategorized'}
                    </div>
                    <h3 className={styles.productName}>
                        {product.name}
                    </h3>
                </div>

                {product.variants && product.variants.length > 0 && (
                    <div className={styles.variantContainer}>
                        {product.variants.map((variant, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedVariant(variant)}
                                className={`${styles.variantBtn} ${selectedVariant === variant ? styles.variantBtnActive : ''}`}
                            >
                                {variant.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.footerRow}>
                    <div>
                        <div className={styles.priceLabel}>Price</div>
                        <div className={styles.price}>
                            ৳ {displayPrice?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LandingPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        fetchProducts();
        checkAuth();

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [search]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            setIsLoggedIn(data.authenticated);
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsLoggedIn(false);
        } finally {
            setAuthLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/products?limit=50&search=${search}`, { cache: 'no-store' });
            const data = await res.json();

            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.main}>
            {/* Header */}
            <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>
                        <Cpu size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className={styles.brandName}>
                        PrimeZone BD
                    </h1>
                </div>

                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search for premium gadgets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {!authLoading && (
                    isLoggedIn ? (
                        <Link href="/dashboard" className={`${styles.authButton} ${styles.adminBtn}`}>
                            <ShieldCheck size={20} strokeWidth={2.5} />
                            Admin Panel
                        </Link>
                    ) : (
                        <Link href="/login" className={`${styles.authButton} ${styles.loginBtn}`}>
                            <LogIn size={20} strokeWidth={2.5} />
                            Login
                        </Link>
                    )
                )}
            </header>

            {/* Main Content */}
            <main className={styles.container}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Curating collection...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Package size={64} className={styles.emptyIcon} strokeWidth={1} />
                        <h2>No products found</h2>
                        <p>Try adjusting your search terms</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {products.map((product, index) => (
                            <ProductCard key={product._id} product={product} index={index} />
                        ))}
                    </div>
                )}
            </main>

            <footer className={styles.footer}>
                <p className={styles.footerText}>&copy; {new Date().getFullYear()} PrimeZone BD. Premium Tech & Gadgets.</p>
            </footer>
        </div>
    );
}
