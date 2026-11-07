import React from 'react';
import { DatabaseStatus } from '../../../server/db/types.ts';
import { DatabaseStatusBadge } from './DatabaseStatusBadge.tsx';
import { GraduationCap, Shield, User, Menu } from 'lucide-react';

interface NavbarProps {
  status: DatabaseStatus | null;
  onRefreshStatus: () => void;
  onReseed: () => void;
  currentRole: 'Administrator' | 'Faculty' | 'Student';
  onChangeRole: (role: 'Administrator' | 'Faculty' | 'Student') => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  onRefreshStatus,
  onReseed,
  currentRole,
  onChangeRole,
  onToggleSidebar
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wider">
            CC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">CampusCore</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-400 font-mono hidden sm:inline">
                DBMS BCA-3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              One Campus. Connected Data. Smarter Decisions.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Database Engine Status */}
        <DatabaseStatusBadge status={status} onRefresh={onRefreshStatus} onReseed={onReseed} />

        {/* User / Persona Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-md px-2 py-1">
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-xs text-slate-400 hidden sm:inline">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => onChangeRole(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="Administrator" className="bg-slate-900 text-white">Administrator</option>
            <option value="Faculty" className="bg-slate-900 text-white">Faculty (Prof. Anand)</option>
            <option value="Student" className="bg-slate-900 text-white">Student (Aarav Patel)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
