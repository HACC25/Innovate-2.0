
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Briefcase, BarChart3, LogOut, Menu, X, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      // Always allow Home page
      if (location.pathname === createPageUrl("Home") || location.pathname === '/' || location.pathname === '') {
        setLoading(false);
        setUser(null);
        return;
      }

      // For all other pages, require authentication
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.replace(createPageUrl("Home"));
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
        setLoading(false);
      } catch (error) {
        window.location.replace(createPageUrl("Home"));
      }
    };
    checkAuth();
  }, [location.pathname]);

  React.useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleLogout = () => {
    window.location.replace(createPageUrl("Home"));
  };

  const navItems = [
    { name: "Applications", path: createPageUrl("Applications"), icon: FileText },
    { name: "Upload Applications", path: createPageUrl("BulkUpload"), icon: Upload },
    { name: "Job Management", path: createPageUrl("JobManagement"), icon: Briefcase },
    { name: "Analytics", path: createPageUrl("Analytics"), icon: BarChart3 },
  ];

  const isActive = (path) => location.pathname === path;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (location.pathname === createPageUrl("Home") || location.pathname === '/' || location.pathname === '' || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }

        .sidebar-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(148, 163, 184, 0.1);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 50;
        }

        .glass-button {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transform: translateX(4px);
        }

        .glass-button-active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 0 2px 12px rgba(99, 102, 241, 0.2);
        }

        .clay-card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.04),
            0 1px 2px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .clay-card:hover {
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.08),
            0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .clay-button {
          background: white;
          border-radius: 10px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .clay-button:hover:not(:disabled) {
          background: rgba(248, 250, 252, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }

        .clay-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .clay-input {
          background: white;
          border-radius: 10px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }

        .clay-input:focus {
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 
            inset 0 1px 2px rgba(0, 0, 0, 0.04),
            0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .clay-badge {
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.025em;
        }

        @media (max-width: 768px) {
          .sidebar-card {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'};
          }
        }
      `}</style>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar-card ${sidebarOpen ? 'w-72' : 'w-20'} flex flex-col`}>
        <div className={`p-6 border-b border-white/10 ${!sidebarOpen && 'flex justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">DHRD Screener</h1>
                  <p className="text-xs text-slate-400">AI-Powered</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Hawaii State Government</p>
            </>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-xs font-semibold text-slate-500 px-4 mb-3 uppercase tracking-wider">
              Navigation
            </p>
          )}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`glass-button px-4 py-3 flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} text-white font-medium text-sm ${
                isActive(item.path) ? 'glass-button-active' : ''
              }`}
              title={!sidebarOpen ? item.name : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {user && sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="glass-button p-4">
              <p className="font-semibold text-white text-sm truncate mb-1">{user.full_name}</p>
              <p className="text-xs text-slate-400 mb-3">{user.role === 'admin' ? 'Administrator' : 'HR Examiner'}</p>
              <button 
                onClick={handleLogout}
                className="w-full px-3 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 hover:text-white transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className={`flex-1 w-full ${sidebarOpen ? 'md:ml-72' : 'md:ml-20'} min-h-screen flex flex-col transition-all duration-300`}>
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30">
          <div className="px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSidebarOpen(!sidebarOpen);
                    setMobileMenuOpen(!mobileMenuOpen);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {sidebarOpen || mobileMenuOpen ? (
                    <X className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-slate-600" />
                  )}
                </button>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">
                    {navItems.find(item => isActive(item.path))?.name || 'Dashboard'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                    AI-powered qualification screening
                  </p>
                </div>
              </div>
              <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-100 hidden sm:block">
                <span className="text-xs font-semibold text-slate-700">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

        <footer className="px-4 md:px-8 py-4 bg-white/50 border-t border-slate-200/50">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <p className="text-slate-600">
              © 2025 Hawaii DHRD
            </p>
            <p className="text-slate-500">
              HACC 2025 • AI-Powered
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
