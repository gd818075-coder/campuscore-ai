import React, { useState } from 'react';
import { DatabaseStatus } from '../../../server/db/types.ts';
import { Database, AlertTriangle, CheckCircle, Server, Info, RefreshCw } from 'lucide-react';

interface Props {
  status: DatabaseStatus | null;
  onRefresh: () => void;
  onReseed: () => void;
  loading?: boolean;
}

export const DatabaseStatusBadge: React.FC<Props> = ({ status, onRefresh, onReseed, loading }) => {
  const [showModal, setShowModal] = useState(false);

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 text-xs text-slate-300 animate-pulse border border-slate-700">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Probing DB...</span>
      </div>
    );
  }

  const isMySQL = status.activeEngine === 'MySQL';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
          isMySQL
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/50'
            : 'bg-amber-950/30 text-amber-300 border-amber-700/60 hover:bg-amber-900/40'
        }`}
        title="Click to view Database connection & engine details"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isMySQL ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isMySQL ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="font-semibold">{status.activeEngine}</span>
        <span className="text-slate-400 hidden sm:inline">({status.tablesCount} tables, {status.totalRecordsCount} tuples)</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-lg w-full text-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400" />
                <h3 className="font-semibold text-slate-100">Database Engine & Connection Info</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded bg-slate-800/80 border border-slate-700">
                {isMySQL ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-sm text-slate-100">
                    Active Relational Engine: {status.activeEngine}
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {isMySQL
                      ? `Successfully connected to MySQL 8 server at ${status.mysqlHost}:${status.mysqlPort}/${status.mysqlDatabase} with connection pool.`
                      : `The backend initialized the In-Process Relational SQL Engine (sql.js / SQLite ANSI SQL) because no MySQL 8 daemon is currently listening on ${status.mysqlHost}:${status.mysqlPort}. All relational schemas, 15 tables, foreign keys, views, transactions, and queries are active and fully testable!`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <div className="text-slate-400">MySQL Host & Port</div>
                  <div className="font-mono text-slate-200 mt-0.5">
                    {status.mysqlHost}:{status.mysqlPort}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <div className="text-slate-400">Target Database</div>
                  <div className="font-mono text-slate-200 mt-0.5">{status.mysqlDatabase}</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <div className="text-slate-400">Relational Tables</div>
                  <div className="font-semibold text-teal-400 mt-0.5">{status.tablesCount} Tables Active</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <div className="text-slate-400">Stored Tuples</div>
                  <div className="font-semibold text-teal-400 mt-0.5">{status.totalRecordsCount} Records Seeded</div>
                </div>
              </div>

              {status.mysqlError && (
                <div className="p-3 rounded bg-amber-950/30 border border-amber-800/50 text-amber-300">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    MySQL Status Diagnostic
                  </div>
                  <div className="font-mono text-[11px] mt-1 text-amber-300/90 break-all">
                    {status.mysqlError}
                  </div>
                  <div className="mt-2 text-slate-300 text-[11px]">
                    Note: To connect to an external MySQL server, set <code className="bg-slate-800 px-1 py-0.5 rounded">DB_HOST</code>, <code className="bg-slate-800 px-1 py-0.5 rounded">DB_USER</code>, and <code className="bg-slate-800 px-1 py-0.5 rounded">DB_PASSWORD</code> in your local <code className="bg-slate-800 px-1 py-0.5 rounded">.env</code>.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={onReseed}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reseed Demo Data
                </button>
                <button
                  onClick={() => {
                    onRefresh();
                    setShowModal(false);
                  }}
                  className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors"
                >
                  Close & Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
