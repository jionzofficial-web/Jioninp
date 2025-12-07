'use client';

import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import { DollarSign, Package, ShoppingCart, Users, ShoppingBag } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalPurchases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Overview of your inventory and sales</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Total Sales</span>
            <DollarSign className={styles.icon} size={20} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.value}>
              {loading ? '...' : `৳ ${stats.totalSales.toLocaleString()}`}
            </div>
            <p className={styles.description}>Lifetime sales</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Total Purchases</span>
            <ShoppingBag className={styles.icon} size={20} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.value}>
              {loading ? '...' : `৳ ${stats.totalPurchases.toLocaleString()}`}
            </div>
            <p className={styles.description}>Total inventory cost</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Active Orders</span>
            <ShoppingCart className={styles.icon} size={20} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.value}>
              {loading ? '...' : stats.activeOrders}
            </div>
            <p className={styles.description}>Pending orders</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Total Products</span>
            <Package className={styles.icon} size={20} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.value}>
              {loading ? '...' : stats.totalProducts}
            </div>
            <p className={styles.description}>In inventory</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Total Customers</span>
            <Users className={styles.icon} size={20} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.value}>
              {loading ? '...' : stats.totalCustomers}
            </div>
            <p className={styles.description}>Unique customers</p>
          </div>
        </div>
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.placeholderBox}>
          <p>Recent transactions and stock movements will appear here.</p>
        </div>
      </div>
    </div>
  );
}
