import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Plus,
  ShieldCheck,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import { NotificationItem } from '../../types';

interface HeaderProps {
  setMobileOpen: (v: boolean) => void;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen, collapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await notificationsApi.getNotifications();
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch {
        // ignore
      }
    }
    loadNotifs();
  }, [location.pathname]);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Compute breadcrumb from path
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/requests') return 'Prior Authorization Requests';
    if (path === '/requests/new') return 'New Authorization Request';
    if (path.startsWith('/requests/')) return 'Request Clinical Packet';
    if (path === '/tracking') return 'Payer Gateway & Timeline';
    if (path === '/notifications') return 'Notifications';
    if (path === '/analytics') return 'Analytics & Reports';
    if (path === '/admin/users') return 'User & Role Management';
    if (path === '/admin/payers') return 'Payer Guidelines Configuration';
    if (path === '/admin/audit-logs') return 'Security & Audit Log';
    if (path === '/settings') return 'Settings & Profile';
    if (path === '/help') return 'Clinical Protocol & Help';
    return 'Portal';
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-0 lg:left-64'
      }`}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="text-slate-400 font-medium hidden sm:inline">PriorAuth</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <h2 className="font-semibold text-slate-800">{getBreadcrumb()}</h2>
        </div>
      </div>

      {/* Right: Demo Pill, New Request, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Demo Environment (Synthetic Data)</span>
        </div>

        {/* Quick Create CTA */}
        <Link
          to="/requests/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Request</span>
        </Link>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 py-1">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifMenu(false);
                        if (n.relatedRequestId) navigate(`/requests/${n.relatedRequestId}`);
                        else navigate('/notifications');
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition text-left ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
            {user?.fullName.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
