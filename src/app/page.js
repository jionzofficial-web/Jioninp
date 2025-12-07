'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, LogIn, ShieldCheck } from 'lucide-react';

function ProductCard({ product }) {
    const [selectedVariant, setSelectedVariant] = useState(null);

    useEffect(() => {
        if (product.variants && product.variants.length > 0) {
            // Select the first variant by default
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    // Determine display values based on selection
    const displayPrice = selectedVariant ? selectedVariant.sell_price : product.sell_price;
    const displayStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

    // Determine image
    let displayImage = product.images?.[0];
    if (selectedVariant && typeof selectedVariant.image_index === 'number' && product.images?.[selectedVariant.image_index]) {
        displayImage = product.images[selectedVariant.image_index];
    }

    // Stock Status Logic
    let stockColor = '#22c55e'; // Green
    let stockText = 'In Stock';
    if (displayStock === 0) {
        stockColor = '#ef4444'; // Red
        stockText = 'Out of Stock';
    } else if (displayStock <= 3) {
        stockColor = '#f97316'; // Orange
        stockText = 'Low Stock';
    }

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            {/* Image Area */}
            <div style={{
                height: '250px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {displayImage ? (
                    <img
                        src={displayImage.thumbnail_url || displayImage.url}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
                    />
                ) : (
                    <Package size={48} color="#cbd5e1" />
                )}

                {/* Stock Badge Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: stockColor,
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {stockText} ({displayStock})
                </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                }}>
                    {product.category?.name || 'Uncategorized'}
                </div>

                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    marginBottom: '0.5rem',
                    lineHeight: '1.4'
                }}>
                    {product.name}
                </h3>

                {/* Variants Selector */}
                {product.variants && product.variants.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Select Option:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {product.variants.map((variant, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedVariant(variant)}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: `1px solid ${selectedVariant === variant ? '#3b82f6' : '#e2e8f0'}`,
                                        backgroundColor: selectedVariant === variant ? '#eff6ff' : 'white',
                                        color: selectedVariant === variant ? '#3b82f6' : '#64748b',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {variant.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Price</span>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#2563eb'
                        }}>
                            ৳ {displayPrice?.toFixed(2)}
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

    useEffect(() => {
        fetchProducts();
        checkAuth();
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
            const res = await fetch(`/api/products?limit=50&search=${search}`);
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
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'rgba(231, 209, 255, 0.8)', // Light purple glass
                backdropFilter: 'blur(12px)',
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                gap: '2rem',
                boxShadow: '0 4px 20px -2px rgba(147, 51, 234, 0.1)', // Purple tinted shadow
                borderBottom: '1px solid rgba(216, 180, 254, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                    }}>
                        <Package size={28} strokeWidth={2} />
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        margin: 0,
                        letterSpacing: '-0.03em'
                    }}>
                        Jion Inventory
                    </h1>
                </div>

                <div style={{
                    flex: 1,
                    maxWidth: '600px',
                    position: 'relative'
                }}>
                    <Search size={20} style={{
                        position: 'absolute',
                        left: '1.25rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8'
                    }} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1.5rem 1rem 3.5rem',
                            borderRadius: '1.5rem',
                            border: '2px solid transparent',
                            backgroundColor: '#ffffff',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            color: '#334155',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#9333ea';
                            e.target.style.boxShadow = '0 10px 15px -3px rgba(147, 51, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)';
                        }}
                    />
                </div>

                {!authLoading && (
                    isLoggedIn ? (
                        <Link href="/dashboard" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)', // Metallic Gold
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '1rem',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            boxShadow: '0 4px 15px -3px rgba(184, 134, 11, 0.4)',
                            border: '1px solid #b8860b',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(184, 134, 11, 0.5)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(184, 134, 11, 0.4)';
                                e.currentTarget.style.filter = 'brightness(1)';
                            }}
                        >
                            <ShieldCheck size={20} strokeWidth={2.5} />
                            Admin
                        </Link>
                    ) : (
                        <Link href="/login" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'white',
                            color: '#0f172a',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '1rem',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <LogIn size={20} strokeWidth={2.5} color="#2563eb" />
                            Login
                        </Link>
                    )
                )}
            </header>

            {/* Product Grid */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', width: '100%', flex: 1 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>No products found matching your search.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </main>

            <footer style={{
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                padding: '2rem',
                textAlign: 'center',
                marginTop: 'auto'
            }}>
                <p>&copy; {new Date().getFullYear()} Jion Inventory System. All rights reserved.</p>
            </footer>
        </div>
    );
}
