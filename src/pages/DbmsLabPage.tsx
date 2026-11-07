import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Badge } from '../components/Common/Badge.tsx';
import {
  Terminal,
  Play,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Database,
  ShieldCheck,
  RotateCcw,
  Save,
  Layers,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

export const DbmsLabPage: React.FC = () => {
  const [examples, setExamples] = useState<any[]>([]);
  const [selectedExample, setSelectedExample] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [customSql, setCustomSql] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // TCL simulation state
  const [tclMessage, setTclMessage] = useState<string | null>(null);
  const [tclData, setTclData] = useState<any | null>(null);

  const categories = ['ALL', 'DQL', 'JOINS', 'AGGREGATES', 'SUBQUERIES', 'VIEWS', 'TCL', 'DCL', 'DDL', 'DML'];

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    try {
      const data = await api.getLabExamples();
      setExamples(data);
      if (data.length > 0) {
        setSelectedExample(data[0]);
        setCustomSql(data[0].sql);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSelectExample = (ex: any) => {
    setSelectedExample(ex);
    setCustomSql(ex.sql);
    setQueryResult(null);
    setQueryError(null);
    setTclMessage(null);
  };

  const handleCopy = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunQuery = async () => {
    setIsRunning(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await api.executeLabQuery(customSql);
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSimulateTransaction = async (action: 'commit' | 'rollback' | 'savepoint') => {
    try {
      setIsRunning(true);
      const res = await api.simulateTransaction(action);
      setTclMessage(`[${res.action}] ${res.message}`);
      setTclData(res.data);
    } catch (err: any) {
      setQueryError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const filteredExamples = activeCategory === 'ALL'
    ? examples
    : examples.filter(ex => ex.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">DBMS Lab & SQL Laboratory</h1>
            <Badge variant="teal">BCA Semester 3 Syllabus Demonstration</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Runnable academic queries mapped to CampusCore schema: DDL, DML, DQL, Joins, Aggregates, Subqueries, Views, DCL, and TCL.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === cat
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main 2-Column Split: Query Catalog on Left, Live Runner on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Curated Syllabus Query Catalog */}
        <div className="lg:col-span-5 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 uppercase tracking-wider">Curated Academic Queries</span>
            <span className="text-slate-500 font-mono">{filteredExamples.length} Selected</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[620px] overflow-y-auto">
            {filteredExamples.map((ex) => {
              const isSelected = selectedExample?.id === ex.id;
              return (
                <div
                  key={ex.id}
                  onClick={() => handleSelectExample(ex)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-teal-950/30 border-l-4 border-l-teal-500'
                      : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-200">{ex.title}</span>
                    <Badge variant={ex.category === 'TCL' || ex.category === 'DCL' ? 'amber' : 'teal'}>
                      {ex.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: SQL Editor, Runner & Explanation Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Query Details */}
          {selectedExample && (
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-teal-400 font-semibold tracking-wide uppercase text-[10px]">
                    Concept: {selectedExample.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedExample.title}</h3>
                </div>
                <button
                  onClick={() => handleCopy(selectedExample.sql, selectedExample.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                >
                  {copiedId === selectedExample.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === selectedExample.id ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300 leading-relaxed">
                <strong className="text-white block mb-1">Academic Rationale & Theory:</strong>
                {selectedExample.explanation}
              </div>

              {/* TCL Live Simulation Controls */}
              {selectedExample.category === 'TCL' && (
                <div className="p-3 rounded bg-amber-950/20 border border-amber-800/40 text-amber-200 space-y-2">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    ACID Transaction Simulator (Live In-Database Test)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Execute and test real transactions with atomic commit, complete rollback, or savepoint rollback:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleSimulateTransaction('commit')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Test COMMIT
                    </button>
                    <button
                      onClick={() => handleSimulateTransaction('rollback')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Test ROLLBACK
                    </button>
                    <button
                      onClick={() => handleSimulateTransaction('savepoint')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-white font-medium text-xs cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Test SAVEPOINT
                    </button>
                  </div>

                  {tclMessage && (
                    <div className="mt-2 p-2 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-teal-300">
                      {tclMessage}
                      {tclData && (
                        <pre className="mt-1 text-[10px] text-slate-400 overflow-x-auto">
                          {JSON.stringify(tclData, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DCL Instructions */}
              {selectedExample.category === 'DCL' && (
                <div className="p-3 rounded bg-blue-950/20 border border-blue-800/40 text-blue-200 space-y-1">
                  <strong className="block text-white">Database Security Note:</strong>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    GRANT and REVOKE require administrative privileges (<code className="bg-slate-800 px-1 py-0.5 rounded font-mono">root</code> or DBA account) and cannot be executed by ordinary application service accounts. Use the dedicated script <code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-teal-400">database/grant_revoke_security.sql</code> in MySQL Workbench.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Interactive SQL Editor */}
          <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-white">SQL Query Runner (SELECT & Analytical DQL)</span>
              </div>
              <button
                onClick={handleRunQuery}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium cursor-pointer transition-colors shadow-xs"
              >
                {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>Execute Query</span>
              </button>
            </div>

            <textarea
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              rows={6}
              className="w-full p-4 bg-slate-950 text-slate-200 font-mono text-xs focus:outline-hidden leading-relaxed resize-y border-b border-slate-800"
              placeholder="Enter valid SQL query (e.g. SELECT * FROM students;)..."
            />

            {/* Execution Result Area */}
            <div className="p-4 bg-slate-900">
              {queryError && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                  {queryError}
                </div>
              )}

              {queryResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Execution Time: <strong className="text-teal-400 font-mono">{queryResult.executionTimeMs} ms</strong>
                    </span>
                    <span>
                      Returned Tuples: <strong className="text-white font-mono">{queryResult.rowCount}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto rounded border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          {queryResult.columns.map((col: string, idx: number) => (
                            <th key={idx} className="p-2.5 whitespace-nowrap font-mono">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {queryResult.rows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40">
                            {queryResult.columns.map((col: string, cIdx: number) => (
                              <td key={cIdx} className="p-2.5 text-slate-300 whitespace-nowrap">
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
