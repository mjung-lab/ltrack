import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Link2,
  Smartphone,
  BarChart3,
  Brain,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tracking Codes', href: '/tracking', icon: Link2 },
    { name: 'LINE Accounts', href: '/line-accounts', icon: Smartphone },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'AI Insights', href: '/ai-insights', icon: Brain },
  ];

  return (
    <div className="app-layout">
      {/* Mobile header */}
      <div className="mobile-header">
        <h1 className="logo">L-TRACK®</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mobile-menu-btn"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">L-TRACK®</h1>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="nav-menu">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name} className="nav-item">
                  <NavLink
                    to={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="nav-icon" size={20} />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-details">
              <h4>{user?.name}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}