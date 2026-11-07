import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { DatabaseStatus } from '../../server/db/types.ts';
import { Badge } from '../components/Common/Badge.tsx';
import { Modal } from '../components/Common/Modal.tsx';
import {
  Settings,
  Database,
  RefreshCw,
  FileCode,
  Shield,
  Layers,
  BookOpen,
  Copy,
  Check,
  CheckCircle,
  AlertTriangle,
  Server,
  Info
} from 'lucide-react';

interface Props {
  status: DatabaseStatus | null;
  onRefreshStatus: () => void;
  onReseed: () => void;
  currentRole: 'Administrator' | 'Faculty' | 'Student';
}

const ACADEMIC_ARTIFACTS = [
  { key: 'campuscore_schema.sql', title: '1. MySQL 8 Schema DDL Script', description: 'Table creation, constraints, foreign keys, indexes, and database views' },
  { key: 'campuscore_seed.sql', title: '2. Realistic Demo Seed Data', description: 'Comprehensive fictional records for all 15 relational tables' },
  { key: 'er_diagram.mermaid', title: '3. ER Diagram (Mermaid Notation)', description: 'Full Entity-Relationship model with cardinality relationships' },
  { key: 'NORMALIZATION.md', title: '4. Relational Normalization Report', description: 'Mathematical breakdown of 1NF, 2NF, and 3NF decompositions' },
  { key: 'DATA_DICTIONARY.md', title: '5. Database Data Dictionary', description: 'Field definitions, data types, nullability, and primary/foreign keys' },
  { key: 'transactions_demo.sql', title: '6. TCL Transactions Demo Script', description: 'COMMIT, ROLLBACK, and SAVEPOINT step-by-step transaction control' },
  { key: 'grant_revoke_security.sql', title: '7. DCL Security & Privilege Script', description: 'Role-based access control, CREATE USER, GRANT, and REVOKE examples' }
];

export const AdminSettingsPage: React.FC<Props> = ({
  status,
  onRefreshStatus,
  onReseed,
  currentRole
}) => {
  const [selectedScript, setSelectedScript] = useState<string>('campuscore_schema.sql');
  const [scriptContent, setScriptContent] = useState<string>('');
  const [loadingScript, setLoadingScript] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const loadScript = async (name: string) => {
    try {
      setLoadingScript(true);
      const res = await api.getSqlScript(name);
      setScriptContent(res.content);
    } catch (err: any) {
      setScriptContent(`-- Failed to load script: ${err.message}`);
    } finally {
      setLoadingScript(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadScript(selectedScript);
    loadUsers();
  }, [selectedScript]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteReset = async () => {
    setShowConfirmReset(false);
    try {
      await onReseed();
      setToast({ type: 'success', message: 'Database successfully reseeded with fresh relational demo tuples!' });
      onRefreshStatus();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`p-3 rounded-md flex items-center justify-between text-xs font-medium border ${
            toast.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="hover:opacity-75 text-sm px-1">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Administration, Schema Docs & DB Setup</h1>
            <Badge variant="teal">Academic Deliverables</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Database diagnostics, full exportable MySQL scripts, normalization theory, ER diagrams, and user security roles.
          </p>
        </div>

        <button
          onClick={() => setShowConfirmReset(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium cursor-pointer shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reseed Database
        </button>
      </div>

      {/* Live Database Diagnostics Card */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Relational Engine Connection Diagnostics</h2>
          </div>
          <Badge variant={status?.activeEngine === 'MySQL' ? 'emerald' : 'amber'}>
            Active: {status?.activeEngine || 'Checking...'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400">Configured MySQL Host</span>
            <div className="font-mono text-slate-200 mt-0.5">{status?.mysqlHost}:{status?.mysqlPort}</div>
          </div>
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400">Database Name</span>
            <div className="font-mono text-slate-200 mt-0.5">{status?.mysqlDatabase}</div>
          </div>
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400">Catalog Tables Count</span>
            <div className="font-semibold text-teal-400 mt-0.5">{status?.tablesCount} Tables Active</div>
          </div>
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400">Total Seeded Records</span>
            <div className="font-semibold text-teal-400 mt-0.5">{status?.totalRecordsCount} Tuples</div>
          </div>
        </div>

        {status?.mysqlError && (
          <div className="p-3 rounded bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Local Host Diagnostics:</strong> {status.mysqlError}
              <p className="text-slate-300 mt-1">
                CampusCore automatically initialized the built-in Relational SQL Engine (sql.js / SQLite ANSI SQL) so all 13 modules, transactions, and DBMS Lab queries run live in this environment without requiring an external MySQL process. You can also export the SQL scripts below directly into MySQL Workbench or MySQL CLI.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Academic Artifacts & SQL Script Viewer */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Academic Project Documentation & SQL Scripts</h2>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value)}
              className="p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 cursor-pointer focus:border-teal-500 focus:outline-hidden"
            >
              {ACADEMIC_ARTIFACTS.map((art) => (
                <option key={art.key} value={art.key}>
                  {art.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950">
          {loadingScript ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-400 mb-2" />
              Loading artifact contents...
            </div>
          ) : (
            <pre className="font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto leading-relaxed p-4 bg-slate-900/60 rounded border border-slate-800">
              {scriptContent}
            </pre>
          )}
        </div>
      </div>

      {/* Users & Authentication Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white">System Users & Access Roles (users table)</h3>
          </div>
          <Badge variant="teal">{users.length} Registered Accounts</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3">Username</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Access Role</th>
                <th className="p-3">Active Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-500">#{u.user_id}</td>
                  <td className="p-3 font-mono font-medium text-teal-400">{u.username}</td>
                  <td className="p-3 font-medium text-slate-200">{u.full_name}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">
                    <Badge variant={u.role === 'Administrator' ? 'rose' : u.role === 'Faculty' ? 'blue' : 'emerald'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={u.is_active ? 'emerald' : 'slate'}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM RESET MODAL */}
      <Modal
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        title="Confirm Database Reseed"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            This operation will drop and recreate all 15 relational tables, database views, and re-populate the official BCA Semester 3 fictional demo records.
          </p>
          <div className="p-3 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300">
            Any custom records added during testing will be reset to default seeded state.
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteReset}
              className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-medium"
            >
              Proceed with Reseed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
