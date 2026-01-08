import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, 
  AreaChart, Area, ReferenceLine 
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, AlertTriangle, TrendingUp, 
  Activity, DollarSign, LayoutDashboard, Coins, FileText, LogOut, 
  Menu, PanelLeftClose, PanelLeftOpen, Edit2, Plus, X, Save, 
  Trash2, ChevronDown, Lock, Unlock, Calendar, ArrowRight, CheckCircle2 
} from 'lucide-react';

// --- CONFIGURATION ---
const LOGO_URL = "https://dexpay.io/src/assets/svg/logo.svg"; 
const INACTIVITY_LIMIT_MS = 3 * 60 * 1000; 

// --- INITIAL DATA ---
const TREASURY_BREAKDOWN_INIT = [
  { id: 'sol', chain: 'Solana', icon: '◎', color: 'bg-purple-100 text-purple-600', assets: [{ token: 'USDT', amount: 3200.00 }, { token: 'USDC', amount: 4500.00 }] },
  { id: 'bsc', chain: 'BSC (BNB Chain)', icon: '🟡', color: 'bg-yellow-100 text-yellow-600', assets: [{ token: 'USDT', amount: 2800.00 }, { token: 'USDC', amount: 1500.00 }] },
  { id: 'hedera', chain: 'Hedera', icon: 'ℏ', color: 'bg-slate-200 text-slate-700', assets: [{ token: 'USDC', amount: 3100.00 }] },
  { id: 'base', chain: 'Base', icon: '🔵', color: 'bg-blue-100 text-blue-600', assets: [{ token: 'USDC', amount: 2100.00 }] },
  { id: 'ape', chain: 'ApeChain', icon: '🦍', color: 'bg-blue-600 text-white', assets: [{ token: 'ApeUSD', amount: 1800.00 }] },
  { id: 'arb', chain: 'Arbitrum', icon: '🔷', color: 'bg-indigo-100 text-indigo-600', assets: [{ token: 'USDC', amount: 1095.00 }] }
];

const COLD_WALLET_INIT = [
  { id: 'evm-grant', chain: 'DexPay EVM Grant Wallet', address: '0x07C61De233533c7cF0F6979608990f0EB9EE2FfF', icon: '🔷', color: 'bg-blue-100 text-blue-600', assets: [{ token: 'ApeCoin', amount: 2500.00 }, { token: 'ApeUSD', amount: 5000.00 }, { token: 'USDT', amount: 1000.00 }, { token: 'USDC', amount: 500.00 }, { token: 'LSK', amount: 1000.00 }] },
  { id: 'hbar-cold', chain: 'Hedera Wallet', address: '0.0.8672864', icon: 'ℏ', color: 'bg-slate-200 text-slate-700', assets: [{ token: 'HBAR', amount: 1447.00 }, { token: 'USDC', amount: 1000.00 }] }
];

const FIAT_INIT = [{ id: 'safe-haven', chain: 'Safe Haven MFB', icon: '🏦', color: 'bg-green-100 text-green-700', assets: [{ token: 'NGN', amount: 7260.00, ngnValue: 12015300, rate: 1655 }] }];

const ASSET_ALLOCATION = [{ name: 'Stablecoins', value: 20095, color: '#10B981' }, { name: 'Volatile', value: 8947, color: '#8B5CF6' }, { name: 'Fiat', value: 7260, color: '#64748B' }];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = ['2025', '2026', '2027'];

// --- Sub-Components ---
const MetricCard = ({ title, value, subtext, icon: Icon, trend, colorClass, alert }) => (
  <div className={`p-6 bg-white rounded-xl border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all duration-200`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {subtext && (
      <div className="mt-4 flex items-center text-sm">
        {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />}
        {trend === 'down' && <ArrowDownLeft className="w-4 h-4 text-rose-600 mr-1" />}
        <span className={`${alert ? 'text-red-600 font-medium' : 'text-slate-500'}`}>{subtext}</span>
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  </div>
);

// --- Auth Component ---
const AuthScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    if (pin.length !== 4) { setErrorMsg("PIN must be 4 digits"); setLoading(false); return; }
    try {
      const { data, error } = await supabase.rpc('verify_user_pin', { input_pin: pin });
      if (error) throw new Error(error.message || "Database connection failed");
      if (data && data.success) onUnlock(data.user);
      else throw new Error('Incorrect PIN');
    } catch (err) { setErrorMsg(err.message); setPin(''); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-blue-600" /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">DexPay Secure View</h2>
        <p className="text-slate-500 mb-6">Enter CFO PIN to access financial data</p>
        {errorMsg && <div className="mb-4 p-3 bg-rose-100 text-rose-700 text-sm rounded-lg border border-rose-200">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="password" value={pin} onChange={(e) => e.target.value.length <= 4 && setPin(e.target.value)} placeholder="Enter PIN" className="w-full text-center text-2xl tracking-widest py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none" maxLength={4} autoFocus disabled={loading} />
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 flex items-center justify-center disabled:opacity-50">{loading ? "Verifying..." : "Unlock Dashboard"}</button>
        </form>
      </div>
    </div>
  );
};

export default function DexPayFinancialDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('Jan');
  const [selectedYear, setSelectedYear] = useState('2026'); 
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [txFilter, setTxFilter] = useState('All');
  const [isEditingTreasury, setIsEditingTreasury] = useState(false);
  const [treasuryWallets, setTreasuryWallets] = useState(TREASURY_BREAKDOWN_INIT);
  const [coldStorage, setColdStorage] = useState(COLD_WALLET_INIT);
  const [fiatTreasury, setFiatTreasury] = useState(FIAT_INIT);
  const [newTx, setNewTx] = useState({ month: 'Jan', day: '08', year: '2026', category: 'Operations', type: '', desc: '', amount: '', status: 'Pending', sourceId: '', destId: '' });
  
  const timerRef = useRef(null);

  // --- Calculations ---
  const totalAds = useMemo(() => treasuryWallets.reduce((acc, w) => acc + w.assets.reduce((sum, a) => sum + a.amount, 0), 0), [treasuryWallets]);
  const totalCold = useMemo(() => coldStorage.reduce((acc, w) => acc + w.assets.reduce((sum, a) => sum + a.amount, 0), 0), [coldStorage]);
  const totalFiat = useMemo(() => fiatTreasury.reduce((acc, w) => acc + w.assets.reduce((sum, a) => sum + a.amount, 0), 0), [fiatTreasury]);
  const globalBalance = totalAds + totalCold + totalFiat;

  // --- Smart Filter Logic ---
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesMonth = t.date.includes(selectedMonth);
      const hasYearInDate = t.date.includes('2025') || t.date.includes('2026') || t.date.includes('2027');

      if (!hasYearInDate) {
        return matchesMonth && selectedYear === '2025';
      }
      return matchesMonth && t.date.includes(selectedYear);
    });
  }, [transactions, selectedMonth, selectedYear]);

  const displayedTransactions = useMemo(() => {
    if (txFilter === 'All') return monthlyTransactions;
    return monthlyTransactions.filter(t => t.category === txFilter);
  }, [monthlyTransactions, txFilter]);

  const monthlyMetrics = useMemo(() => {
    let revenue = 0; let burn = 0;
    const expenseCats = ['OpEx', 'Salary', 'Operations', 'Marketing', 'Legal', 'Tech', 'COGS'];
    monthlyTransactions.forEach(tx => {
      if (tx.status === 'Approved') {
        if (tx.category === 'Revenue') revenue += tx.amount;
        else if (expenseCats.includes(tx.category)) burn += Math.abs(tx.amount);
      }
    });
    return { revenue, burn, runway: globalBalance / (burn || 1) };
  }, [monthlyTransactions, globalBalance]);

  // --- DYNAMIC RUNWAY CHART LOGIC ---
  const runwayProjectionData = useMemo(() => {
    // 1. Group expenses by Month-Year
    const expensesByMonth = {};
    const expenseCats = ['OpEx', 'Salary', 'Operations', 'Marketing', 'Legal', 'Tech', 'COGS'];

    transactions.forEach(tx => {
      if (tx.status !== 'Approved' || !expenseCats.includes(tx.category)) return;
      
      // Normalize Date: if legacy (no year), treat as 2025
      let dateObj;
      const hasYear = tx.date.includes('202');
      if (hasYear) {
        dateObj = new Date(tx.date); // "Jan 08, 2026" works
      } else {
        dateObj = new Date(`${tx.date}, 2025`); // "Dec 05" -> "Dec 05, 2025"
      }
      
      // Key format: "YYYY-MM" for sorting
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      if (!expensesByMonth[key]) expensesByMonth[key] = 0;
      expensesByMonth[key] += Math.abs(tx.amount);
    });

    // 2. Get sorted keys (oldest to newest)
    const sortedKeys = Object.keys(expensesByMonth).sort();

    // 3. Calculate Average Burn (Last 3 months)
    let avgBurn = 0;
    if (sortedKeys.length > 0) {
      const recentKeys = sortedKeys.slice(-3); // Take last 3
      const sumRecent = recentKeys.reduce((sum, key) => sum + expensesByMonth[key], 0);
      avgBurn = sumRecent / recentKeys.length;
    }

    // Default fallback if no data: Assume $5k burn just to show a line
    if (avgBurn === 0) avgBurn = 5000; 

    // 4. Generate Projection for next 6 months
    const projection = [];
    let currentBal = globalBalance;
    const today = new Date(); // Start from current month

    for (let i = 0; i < 7; i++) {
      // Create label "Mon"
      const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = futureDate.toLocaleString('default', { month: 'short' });
      
      projection.push({
        month: monthName,
        balance: currentBal < 0 ? 0 : Math.round(currentBal)
      });

      // Subtract avg burn for next iteration
      currentBal -= avgBurn;
    }

    return projection;
  }, [transactions, globalBalance]);


  // --- Supabase Effects ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: txs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (txs) setTransactions(txs.map(r => ({ ...r, amount: Number(r.amount), desc: r.description })));
      
      const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (logs) setAuditLogs(logs.map(l => ({ ...l, user: l.user_name })));

      const { data: bals } = await supabase.from('asset_balances').select('*');
      if (bals) {
        // 1. Update Ads
        setTreasuryWallets(prev => prev.map(chain => ({
          ...chain,
          assets: chain.assets.map(asset => {
            const found = bals.find(d => d.id === `ads-${chain.id}-${asset.token}`);
            return found ? { ...asset, amount: Number(found.amount) } : asset;
          })
        })));
        // 2. Update Cold
        setColdStorage(prev => prev.map(w => ({
          ...w,
          assets: w.assets.map(asset => {
            const found = bals.find(d => d.id === `cold-${w.id}-${asset.token}`);
            return found ? { ...asset, amount: Number(found.amount) } : asset;
          })
        })));
        // 3. Update Fiat
        setFiatTreasury(prev => prev.map(b => ({
          ...b,
          assets: b.assets.map(asset => {
            const found = bals.find(d => d.id === `fiat-${b.id}-${asset.token}`);
            return found ? { ...asset, amount: Number(found.amount), rate: Number(found.rate || asset.rate), ngnValue: Number(found.amount) * Number(found.rate || asset.rate) } : asset;
          })
        })));
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(newTx.amount);
    if (!amountVal) return;

    const txForDb = {
      date: `${newTx.month} ${newTx.day}, ${newTx.year}`, 
      category: newTx.category,
      description: newTx.desc,
      amount: newTx.category === 'Revenue' ? amountVal : -amountVal,
      status: 'Pending',
      source: allAccounts.find(a => a.id === newTx.sourceId)?.label.split(' (Bal:')[0] || null,
      dest: allAccounts.find(a => a.id === newTx.destId)?.label.split(' (Bal:')[0] || null,
    };

    const { data, error } = await supabase.from('transactions').insert(txForDb).select().single();
    if (!error) {
      setTransactions(prev => [{ ...data, desc: data.description, amount: Number(data.amount) }, ...prev]);
      setIsModalOpen(false);
      setNewTx({ ...newTx, amount: '', desc: '' });
    }
  };

  const handleDeleteTransaction = async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      if (tx.status === 'Approved') executeFundMovement(tx, true);
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTransaction) return;
    const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', selectedTransaction.id);
    if (!error) {
      if (newStatus === 'Approved' && selectedTransaction.status !== 'Approved') executeFundMovement(selectedTransaction, false);
      else if (selectedTransaction.status === 'Approved' && newStatus !== 'Approved') executeFundMovement(selectedTransaction, true);
      
      setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? { ...t, status: newStatus } : t));
      setSelectedTransaction(null);
    }
  };

  const executeFundMovement = (tx, reverse) => {
    const multiplier = reverse ? -1 : 1;
    const amount = Math.abs(tx.amount);
    const isExpense = ['OpEx', 'Salary', 'Operations', 'Marketing', 'Legal', 'Tech', 'COGS'].includes(tx.category);
    
    if (isExpense && tx.source) applyBalanceChange(allAccounts.find(a => a.label.startsWith(tx.source))?.id, -amount * multiplier);
    else if (tx.category === 'Revenue' && tx.dest) applyBalanceChange(allAccounts.find(a => a.label.startsWith(tx.dest))?.id, amount * multiplier);
    else if (tx.category === 'Liquidity') {
        if (tx.source) applyBalanceChange(allAccounts.find(a => a.label.startsWith(tx.source))?.id, -amount * multiplier);
        if (tx.dest) applyBalanceChange(allAccounts.find(a => a.label.startsWith(tx.dest))?.id, amount * multiplier);
    }
  };

  const applyBalanceChange = async (accId, change) => {
    if (!accId) return;
    const acc = allAccounts.find(a => a.id === accId);
    if (!acc) return; 

    // Helper to find and update state deeply
    const updateState = (prev) => prev.map(w => w.id === accId.split('-')[1] ? { ...w, assets: w.assets.map(a => a.token === accId.split('-')[2] ? { ...a, amount: a.amount + change, ngnValue: (a.amount + change) * (a.rate || 1) } : a) } : w);

    if (acc.type === 'ads') setTreasuryWallets(updateState);
    else if (acc.type === 'cold') setColdStorage(updateState);
    else if (acc.type === 'fiat') setFiatTreasury(updateState);

    // Sync DB
    await supabase.from('asset_balances').upsert({ id: accId, amount: acc.currentAmount + change });
  };

  // Simplified update helpers for manual edits
  const updateAds = (idx, aIdx, val) => applyBalanceChange(`ads-${treasuryWallets[idx].id}-${treasuryWallets[idx].assets[aIdx].token}`, parseFloat(val) - treasuryWallets[idx].assets[aIdx].amount);
  const updateCold = (idx, aIdx, val) => applyBalanceChange(`cold-${coldStorage[idx].id}-${coldStorage[idx].assets[aIdx].token}`, parseFloat(val) - coldStorage[idx].assets[aIdx].amount);
  const updateFiatManual = (idx, aIdx, field, val) => {
    const bank = fiatTreasury[idx];
    const asset = bank.assets[aIdx];
    const num = parseFloat(val);
    let newAmt = asset.amount; let newRate = asset.rate;
    if (field === 'ngnValue') newAmt = num / asset.rate;
    else if (field === 'rate') { newRate = num; newAmt = asset.ngnValue / num; }
    
    // Update local state directly for manual edits to avoid complexity
    const updated = [...fiatTreasury];
    updated[idx].assets[aIdx] = { ...asset, amount: newAmt, rate: newRate, ngnValue: newAmt * newRate };
    setFiatTreasury(updated);
    supabase.from('asset_balances').upsert({ id: `fiat-${bank.id}-${asset.token}`, amount: newAmt, rate: newRate });
  };

  const allAccounts = useMemo(() => {
    const accs = [];
    treasuryWallets.forEach((w, i) => w.assets.forEach((a, j) => accs.push({ id: `ads-${w.id}-${a.token}`, label: `Ads: ${w.chain} - ${a.token} (Bal: $${a.amount})`, type: 'ads', walletIndex: i, assetIndex: j, currentAmount: a.amount })));
    coldStorage.forEach((w, i) => w.assets.forEach((a, j) => accs.push({ id: `cold-${w.id}-${a.token}`, label: `Cold: ${w.chain} - ${a.token} (Bal: $${a.amount})`, type: 'cold', walletIndex: i, assetIndex: j, currentAmount: a.amount })));
    fiatTreasury.forEach((w, i) => w.assets.forEach((a, j) => accs.push({ id: `fiat-${w.id}-${a.token}`, label: `Fiat: ${w.chain} - ${a.token} (Bal: ₦${a.ngnValue?.toLocaleString()})`, type: 'fiat', walletIndex: i, assetIndex: j, currentAmount: a.amount, rate: a.rate })));
    return accs;
  }, [treasuryWallets, coldStorage, fiatTreasury]);

  if (!isAuthenticated) return <AuthScreen onUnlock={() => setIsAuthenticated(true)} />;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white">DexPay Finance</div>
        <nav className="p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard className="w-5 h-5" /><span>Dashboard</span></button>
          <button onClick={() => setActiveTab('treasury')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'treasury' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}><Coins className="w-5 h-5" /><span>Treasury</span></button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Dual Filter */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold">Financial Overview</h1>
          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-50 border rounded-md px-2 py-1 gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-1" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-sm font-medium outline-none">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent text-sm font-medium outline-none border-l pl-2">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"><Plus className="w-4 h-4 mr-2" /> New Entry</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-4 gap-6">
                <MetricCard title="Total Treasury" value={`$${globalBalance.toLocaleString()}`} icon={Wallet} colorClass="bg-slate-100" />
                <MetricCard title={`Burn Rate (${selectedMonth} ${selectedYear})`} value={`$${monthlyMetrics.burn.toLocaleString()}`} icon={Activity} colorClass="bg-blue-50" />
                <MetricCard title="Runway" value={`${monthlyMetrics.runway.toFixed(1)} Mo`} icon={CheckCircle2} colorClass="bg-emerald-50" />
                <MetricCard title="Revenue" value={`$${monthlyMetrics.revenue.toLocaleString()}`} icon={DollarSign} colorClass="bg-emerald-50" />
              </div>

              {/* Dynamic Runway Chart */}
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-6 rounded-xl border shadow-sm">
                  <SectionHeader title="Runway Projection" subtitle="Projected balance based on 3-month average burn" />
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={runwayProjectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(val) => `$${val/1000}k`} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => [`$${val.toLocaleString()}`, 'Balance']} />
                        <Area type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <SectionHeader title="Treasury Allocation" subtitle="Asset risk distribution" />
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ASSET_ALLOCATION} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                          {ASSET_ALLOCATION.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-slate-800">${(globalBalance/1000).toFixed(0)}k</span>
                            <p className="text-xs text-slate-400">Total Assets</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ledger */}
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="p-4 border-b font-bold flex justify-between">
                    <span>General Ledger ({selectedMonth} {selectedYear})</span>
                    <div className="flex bg-slate-50 p-1 rounded-lg">
                        {['All', 'Revenue', 'OpEx', 'Liquidity'].map((tab) => (
                        <button key={tab} onClick={() => setTxFilter(tab)} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${txFilter === tab ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
                            {tab === 'OpEx' ? 'Expenses' : tab}
                        </button>
                        ))}
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b uppercase text-xs text-slate-500 font-bold">
                    <tr><th className="p-4">Date</th><th>Category</th><th>Description</th><th>Status</th><th className="text-right p-4">Amount</th><th></th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayedTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTransaction(tx)}>
                        <td className="p-4 text-slate-500">{tx.date}</td>
                        <td><span className={`px-2 py-1 rounded text-xs ${getBadgeStyle(tx.category)}`}>{tx.category}</span></td>
                        <td>{tx.desc}</td>
                        <td><span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(tx.status)}`}>{tx.status}</span></td>
                        <td className={`p-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-600' : ''}`}>${tx.amount.toLocaleString()}</td>
                        <td className="p-4 text-right">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id); }} className="text-slate-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {displayedTransactions.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-400">No data for this period.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'treasury' && renderTreasury()}
          {activeTab === 'reports' && renderReports()}
        </main>
      </div>

      {/* Modal - Updated with Year Select */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-4"><h3 className="font-bold">Add New Entry</h3><button onClick={() => setIsModalOpen(false)}><X /></button></div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <select value={newTx.month} onChange={(e) => setNewTx({ ...newTx, month: e.target.value })} className="border p-2 rounded-lg text-sm">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                <input type="text" placeholder="DD" value={newTx.day} onChange={(e) => setNewTx({ ...newTx, day: e.target.value })} className="border p-2 rounded-lg text-sm text-center" />
                <select value={newTx.year} onChange={(e) => setNewTx({ ...newTx, year: e.target.value })} className="border p-2 rounded-lg text-sm">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value, sourceId: '', destId: ''})} className="border p-2 rounded-lg text-sm">
                        <option value="Operations">Operational Costs</option><option value="Salary">Salary & Wages</option><option value="Marketing">Marketing & Ads</option><option value="Legal">Legal & Compliance</option><option value="Tech">Software & Servers</option><option value="Revenue">Revenue</option><option value="COGS">COGS</option><option value="Liquidity">Treasury Transfer</option>
                  </select>
                  <input type="text" placeholder="Type (e.g. Gas)" value={newTx.type} onChange={(e) => setNewTx({...newTx, type: e.target.value})} className="border p-2 rounded-lg text-sm" />
              </div>
              <input type="number" placeholder="Amount ($)" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} className="w-full border p-2 rounded-lg" required />
              {(isExpense || isTransfer) && <select value={newTx.sourceId} onChange={(e) => setNewTx({...newTx, sourceId: e.target.value})} className="w-full border p-2 rounded-lg text-sm" required><option value="">Debit From...</option>{allAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}</select>}
              {(isRevenue || isTransfer) && <select value={newTx.destId} onChange={(e) => setNewTx({...newTx, destId: e.target.value})} className="w-full border p-2 rounded-lg text-sm" required><option value="">Credit To...</option>{allAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}</select>}
              <input type="text" placeholder="Description" value={newTx.desc} onChange={(e) => setNewTx({ ...newTx, desc: e.target.value })} className="w-full border p-2 rounded-lg" required />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Save Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
