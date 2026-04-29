import React, { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  Trash2,
  BrainCircuit,
  MessageSquare,
  Activity,
  Send,
  Loader2,
  Search,
  Bot
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Transaction,
  ParsedTransaction
} from "./types";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  parseTransaction,
  streamFinancialAdvice
} from "./services/api";

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiInput, setAiInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  
  const [adviceActive, setAdviceActive] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAdvising, setIsAdvising] = useState(false);
  
  const adviceEndRef = useRef<HTMLDivElement>(null);

  const [manualForm, setManualForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (adviceEndRef.current) {
      adviceEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adviceContent]);

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    
    setIsParsing(true);
    try {
      const parsed = await parseTransaction(aiInput);
      setManualForm(prev => ({
        ...prev,
        type: parsed.type || 'expense',
        amount: parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, '') : '',
        category: parsed.category || 'General',
        description: parsed.description || aiInput,
      }));
      setAiInput("");
    } catch (err) {
      console.error("AI parse error:", err);
      alert("Failed to parse transaction. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.amount || !manualForm.category || !manualForm.description || !manualForm.date) return;
    
    try {
      const newTx = await addTransaction({
        type: manualForm.type,
        amount: parseFloat(manualForm.amount),
        category: manualForm.category,
        description: manualForm.description,
        date: new Date(manualForm.date).getTime()
      });
      setTransactions(prev => [newTx, ...prev].sort((a,b) => b.date - a.date));
      setManualForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add transaction");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const loadDummyData = async () => {
    const dummyTransactions = [
      { type: 'income', amount: 5200, category: 'Salary', description: 'Monthly Tech Salary', date: Date.now() - 86400000 * 10 },
      { type: 'expense', amount: 1500, category: 'Rent', description: 'Downtown Apartment', date: Date.now() - 86400000 * 9 },
      { type: 'expense', amount: 125.5, category: 'Food', description: 'Whole Foods Groceries', date: Date.now() - 86400000 * 7 },
      { type: 'expense', amount: 45.0, category: 'Entertainment', description: 'Movie Tickets', date: Date.now() - 86400000 * 5 },
      { type: 'expense', amount: 18.0, category: 'Transport', description: 'Uber Ride', date: Date.now() - 86400000 * 4 },
      { type: 'expense', amount: 120.0, category: 'Utilities', description: 'Electric Bill', date: Date.now() - 86400000 * 3 },
      { type: 'expense', amount: 4.5, category: 'Food', description: 'Morning Coffee', date: Date.now() - 86400000 * 1 },
      { type: 'income', amount: 450, category: 'Freelance', description: 'UI Design Gig', date: Date.now() }
    ];
    
    setLoading(true);
    try {
      for (const t of dummyTransactions) {
        await addTransaction(t as any);
      }
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to load dummy data");
    }
  };

  const generateAdvice = async () => {
    if (transactions.length === 0) {
      alert("Add some transactions first!");
      return;
    }
    setAdviceActive(true);
    setIsAdvising(true);
    setAdviceContent("");
    try {
      const stream = streamFinancialAdvice(transactions);
      for await (const chunk of stream) {
        setAdviceContent(prev => prev + chunk);
      }
    } catch (err) {
      console.error(err);
      setAdviceContent("Failed to generate advice. Please try again.");
    } finally {
      setIsAdvising(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-sky-500/30">
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl shadow-lg shadow-sky-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
              Nexus Finance AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={loadDummyData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all text-sm font-medium focus:ring-2 focus:ring-emerald-500/50"
            >
              Load Dummy Data
            </button>
            <button 
              onClick={generateAdvice}
              disabled={isAdvising}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-sm font-medium focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
            >
              {isAdvising ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Bot className="w-4 h-4 text-sky-400" />}
              AI Advisor
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Dashboard & Forms */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-400 text-sm font-medium">Net Balance</h3>
                  <p className="text-3xl font-bold tracking-tight text-white">${netBalance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/5">
                <div className="flex gap-2 items-center text-emerald-400 mb-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Income</span>
                </div>
                <p className="text-xl font-bold">${totalIncome.toFixed(2)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/5">
                <div className="flex gap-2 items-center text-rose-400 mb-2">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Expenses</span>
                </div>
                <p className="text-xl font-bold">${totalExpense.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* AI Quick Add */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Magic Add
            </h3>
            <form onSubmit={handleAiParse} className="relative">
              <input
                type="text"
                placeholder="e.g. Bought a coffee for $4.50"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all placeholder:text-slate-500"
                disabled={isParsing}
              />
              <button 
                type="submit" 
                disabled={isParsing || !aiInput.trim()}
                className="absolute right-2 top-2 p-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition-colors disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Manual Form */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-300">
              <Plus className="w-5 h-5" />
              Add Detail
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg">
                <button
                  type="button"
                  onClick={() => setManualForm(f => ({ ...f, type: 'expense' }))}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    manualForm.type === 'expense' 
                      ? 'bg-white/10 text-rose-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setManualForm(f => ({ ...f, type: 'income' }))}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    manualForm.type === 'income' 
                      ? 'bg-white/10 text-emerald-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Income
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                  <input required type="number" step="0.01" value={manualForm.amount} onChange={e => setManualForm(f => ({...f, amount: e.target.value}))} className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input required type="date" value={manualForm.date} onChange={e => setManualForm(f => ({...f, date: e.target.value}))} className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm flex-1 text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <input required type="text" value={manualForm.category} onChange={e => setManualForm(f => ({...f, category: e.target.value}))} className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="Groceries, Salary, etc." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input required type="text" value={manualForm.description} onChange={e => setManualForm(f => ({...f, description: e.target.value}))} className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="More details..." />
              </div>

              <button type="submit" className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm mt-2">
                Save Transaction
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: List & AI Advice */}
        <div className="lg:col-span-8 space-y-6 flex flex-col min-h-0 h-full">
          
          {adviceActive && (
            <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-2xl shadow-sky-900/20 relative overflow-hidden flex-shrink-0 animate-in fade-in slide-in-from-top-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
              <div className="flex items-center gap-3 mb-4 text-sky-400 border-b border-white/5 pb-4">
                <BrainCircuit className="w-6 h-6" />
                <h2 className="text-lg font-semibold text-white">AI Financial Insights</h2>
                {isAdvising && <span className="ml-auto flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>}
              </div>
              <div className="prose prose-invert prose-slate max-w-none 
                prose-h3:text-sky-300 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                prose-p:text-slate-300 prose-p:leading-relaxed text-sm
                prose-li:text-slate-300 prose-strong:text-white
                max-h-[300px] overflow-y-auto pr-4 custom-scrollbar"
              >
                {adviceContent ? (
                  <ReactMarkdown>{adviceContent}</ReactMarkdown>
                ) : (
                  <p className="text-slate-500 animate-pulse">Analyzing your financial patterns...</p>
                )}
                <div ref={adviceEndRef} />
              </div>
            </div>
          )}

          <div className="bg-slate-900/80 border border-white/5 rounded-2xl flex-1 flex flex-col overflow-hidden backdrop-blur-md">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                Recent History
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-10">
                  <Search className="w-10 h-10 opacity-20" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                            <span className="bg-white/5 px-2 py-0.5 rounded-md">{tx.category}</span>
                            <span>•</span>
                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
