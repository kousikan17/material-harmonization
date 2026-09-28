import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  Landmark,
  LogOut,
  Search,
  UserCircle,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { useAccessibilitySettings } from "@/hooks/useAccessibilitySettings";
import { useTheme } from "@/components/ThemeProvider";
import { GovLogos } from "@/components/GovLogos";
import { listNotifications } from "@/services/notifications";
import type { RoleName } from "@/types";

interface NavItem {
  to: string;
  label: string;
  roles?: RoleName[];
  end?: boolean;
}

interface NavGroup {
  label: string;
  to?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home",
    to: "/dashboard",
    items: [],
  },
  {
    label: "Material Master",
    items: [
      { to: "/materials", label: "All Materials" },
      { to: "/common-material-master", label: "Common Materials" },
      { to: "/materials/cpse", label: "CPSE Materials" },
      { to: "/legacy-codes", label: "Legacy Codes" },
      { to: "/material-upload", label: "Upload Materials", roles: ["ADMIN", "MATERIAL_EXPERT", "REVIEWER"] },
      { to: "/materials/upload/history", label: "Import History", roles: ["ADMIN", "MATERIAL_EXPERT", "REVIEWER", "VIEWER"] },
      { to: "/precheck", label: "ERP Precheck", roles: ["ADMIN", "MATERIAL_EXPERT"] },
    ],
  },
  {
    label: "Harmonization",
    items: [
      { to: "/harmonization/recommendations", label: "AI Recommendations" },
      { to: "/harmonization/duplicates", label: "Duplicate Materials" },
      { to: "/harmonization/near-duplicates", label: "Near Duplicates" },
      { to: "/harmonization/functional-equivalence", label: "Functional Equivalence" },
      { to: "/harmonization/technical-conflicts", label: "Technical Conflicts" },
    ],
  },
  {
    label: "CPSE Network",
    items: [
      { to: "/cpse/sectors", label: "CPSE Sectors" },
      { to: "/cpse", label: "All CPSEs" },
    ],
  },
  {
    label: "Approvals",
    items: [
      { to: "/approvals/pending", label: "Pending Validation", roles: ["ADMIN", "MATERIAL_EXPERT", "REVIEWER", "VIEWER"] },
      { to: "/approvals/approved", label: "Approved", roles: ["ADMIN", "MATERIAL_EXPERT", "REVIEWER", "VIEWER"] },
      { to: "/approvals/rejected", label: "Rejected", roles: ["ADMIN", "MATERIAL_EXPERT", "REVIEWER", "VIEWER"] },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/analytics", label: "Material Master Analytics", end: true },
      { to: "/analytics/procurement", label: "Procurement Analytics" },
      { to: "/analytics/classification", label: "Classification Distribution" },
      { to: "/analytics/trends", label: "Harmonization Trends" },
      { to: "/analytics/data-readiness", label: "Data Readiness" },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/audit-log", label: "Audit Trail", roles: ["ADMIN", "MATERIAL_EXPERT", "REVIEWER", "VIEWER"] },
      { to: "/governance/rules", label: "Rules & Policies", roles: ["ADMIN"] },
      { to: "/governance/taxonomy", label: "Taxonomy & Hierarchy", roles: ["ADMIN", "MATERIAL_EXPERT"] },
      { to: "/governance/ai-evaluation", label: "AI Evaluation & Tuning", roles: ["ADMIN"] },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/notifications", label: "Notifications" },
      { to: "/settings", label: "Settings", roles: ["ADMIN"] },
    ],
  },
];

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { decreaseFont, resetFont, increaseFont, language, setLanguage } = useAccessibilitySettings();
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: listNotifications,
    refetchInterval: 20000,
  });
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (user && item.roles.includes(user.role.name))),
  })).filter((group) => group.items.length > 0 || group.to);

  return (
    <header className="shrink-0 bg-white dark:bg-navy-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-brand-900 focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-white"
      >
        Skip to Main Content
      </a>

      {/* Main Header Row */}
      <div className="flex min-h-[110px] items-center justify-between px-4 py-2 md:px-8 lg:px-12 xl:px-24">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <GovLogos />
        </div>

        {/* Center: Search */}
        <div className="hidden flex-1 justify-center lg:flex px-8">
          <div className="flex w-full max-w-md items-stretch rounded-t-[10px] border border-slate-200 dark:border-navy-700 border-b-[4px] border-b-brand-900 bg-white dark:bg-navy-950 shadow-sm dark:shadow-none">
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent px-4 py-2 text-[15px] text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:outline-none"
            />
            <div className="w-[1px] bg-slate-200 dark:bg-navy-700" />
            <button className="flex items-center justify-center px-4 transition-colors hover:bg-slate-50 dark:bg-navy-900 rounded-tr-[10px]" title="Search">
              <Search className="h-5 w-5 text-brand-900" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Right: Accessibility & Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-3 sm:flex">
            {/* Skip to Main Content */}
            <a href="#main-content" className="text-brand-900 hover:text-brand-700" title="Skip to main content">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
                <line x1="15" y1="8" x2="19" y2="8" />
                <line x1="15" y1="16" x2="19" y2="16" />
              </svg>
            </a>

            <div className="h-6 w-[2px] bg-brand-900" />

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
              className="flex flex-col items-center justify-center text-brand-900 hover:text-brand-700 font-bold leading-none dark:text-slate-200"
              title="Toggle Language"
            >
              <span className="text-[16px] leading-[1]">अ</span>
              <span className="text-[13px] leading-[1] ml-2 -mt-0.5">A</span>
            </button>

            <div className="h-6 w-[2px] bg-brand-900 dark:bg-slate-700" />

            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-brand-900 hover:text-brand-700 dark:text-slate-200 dark:hover:text-white"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>

            <div className="h-6 w-[2px] bg-brand-900 dark:bg-slate-700" />

            {/* Accessibility Options */}
            <button className="text-brand-900 hover:text-brand-700 dark:text-slate-200" title="Accessibility Options">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2" />
                <path d="m3 11 8-2 8 2" />
                <path d="m12 9 0 7" />
                <path d="m9 21 3-5 3 5" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 dark:border-navy-700 pl-6">
            <Link to="/notifications" className="relative text-brand-900 hover:text-brand-600" title="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold text-white shadow-sm dark:shadow-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            
            <div className="group relative flex cursor-pointer items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</p>
                <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400">{user?.role.name.replace("_", " ")}</p>
              </div>
              <UserCircle className="h-8 w-8 text-slate-400" />
              
              <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                 <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-navy-900 hover:text-danger-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Row */}
      <div className="border-y border-brand-900 bg-white dark:bg-navy-950 px-4 md:px-8 lg:px-12 xl:px-24">
        <nav className="flex flex-wrap items-center">
          {visibleGroups.map((group) => (
            <div key={group.label} className="group relative">
              {group.to ? (
                <NavLink
                  to={group.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1 px-4 py-3.5 text-[15px] transition-colors ${
                      isActive
                        ? "border-b-[3px] border-brand-900 font-bold text-slate-900 dark:text-slate-100 bg-blue-100/50"
                        : "border-b-[3px] border-transparent font-medium text-slate-900 dark:text-slate-100 hover:bg-[#dbe8fc]"
                    }`
                  }
                >
                  {group.label}
                </NavLink>
              ) : (
                <button className="flex items-center gap-1 border-b-[3px] border-transparent px-4 py-3.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 transition-colors hover:bg-[#dbe8fc] focus:outline-none">
                  {group.label}
                  <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform group-hover:rotate-180" />
                </button>
              )}

              {/* Dropdown Menu */}
              {group.items.length > 0 && (
                <div className="invisible absolute left-1/2 top-full z-50 mt-0 w-56 -translate-x-1/2 rounded-b-md bg-slate-950/90 py-3 opacity-0 shadow-2xl backdrop-blur-sm transition-all group-hover:visible group-hover:opacity-100">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 text-center text-[15px] transition-colors ${
                          isActive
                            ? "bg-white/10 font-bold text-white"
                            : "text-slate-200 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
