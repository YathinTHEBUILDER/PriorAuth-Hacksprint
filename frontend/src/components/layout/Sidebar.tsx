import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Clock,
  Send,
  Bell,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  ShieldAlert,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout, isAdmin, isDoctor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    } ${collapsed ? 'justify-center px-2' : ''}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight">
                  PriorAuth Assistant
                </h1>
                <p className="text-[10px] text-cyan-700 font-semibold uppercase tracking-wider">
                  Clinical Intelligence
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg border border-slate-200 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Clinical Workflow */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Clinical Workflow
              </p>
            )}
            <NavLink to="/dashboard" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to="/requests" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <FileText className="w-5 h-5 shrink-0" />
              {!collapsed && <span>All Requests</span>}
            </NavLink>
            <NavLink to="/requests/new" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <PlusCircle className="w-5 h-5 shrink-0 text-cyan-600" />
              {!collapsed && <span className="text-cyan-700 font-medium">New Request</span>}
            </NavLink>
            <NavLink to="/tracking" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <Send className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Payer Gateway</span>}
            </NavLink>
          </div>

          {/* Operational Tools */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Operations & Insights
              </p>
            )}
            <NavLink to="/notifications" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <Bell className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Notifications</span>}
            </NavLink>
            <NavLink to="/analytics" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <BarChart3 className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Analytics & Reports</span>}
            </NavLink>
          </div>

          {/* Administration (Admin only) */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                  Administration
                </p>
              )}
              <NavLink to="/admin/users" className={navItemClass} onClick={() => setMobileOpen(false)}>
                <Users className="w-5 h-5 shrink-0" />
                {!collapsed && <span>User Management</span>}
              </NavLink>
              <NavLink to="/admin/payers" className={navItemClass} onClick={() => setMobileOpen(false)}>
                <Sliders className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Payer Guidelines</span>}
              </NavLink>
              <NavLink to="/admin/audit-logs" className={navItemClass} onClick={() => setMobileOpen(false)}>
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Security & Audit</span>}
              </NavLink>
            </div>
          )}

          {/* System & Support */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <NavLink to="/settings" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <Settings className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
            <NavLink to="/help" className={navItemClass} onClick={() => setMobileOpen(false)}>
              <HelpCircle className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Help & Protocol</span>}
            </NavLink>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && user && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user.fullName}</p>
                  <span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
