import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase, 
  Activity,
  DollarSign,
  PieChart as PieIcon,
  Layout,
  Filter,
  Download,
  Calendar,
  Layers,
  ShieldAlert,
  Plus,
  X,
  Save,
  Trash2,
  ChevronDown,
  Lock,
  Unlock,
  KeyRound,
  LayoutDashboard,
  Coins,
  Settings,
  FileText,
  LogOut,
  Menu,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
  Edit2,
  Copy,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

// --- CONFIGURATION ---

const LOGO_URL = "https://dexpay.io/src/assets/svg/logo.svg"; 
const APP_PIN = "2025"; 
const INACTIVITY_LIMIT_MS = 3 * 60 * 1000; 

// --- INITIAL DATA ---

const TREASURY_BREAKDOWN_INIT = [
  { 
    id: 'sol', 
    chain: 'Solana', 
    icon: '◎', 
    color: 'bg-purple-100 text-purple-600',
    assets: [
      { token: 'USDT', amount: 3200.00 },
      { token: 'USDC', amount: 4500.00 }
    ]
  },
  { 
    id: 'bsc', 
    chain: 'BSC (BNB Chain)', 
    icon: '🟡', 
    color: 'bg-yellow-100 text-yellow-600',
    assets: [
      { token: 'USDT', amount: 2800.00 },
      { token: 'USDC', amount: 1500.00 }
    ]
  },
  { 
    id: 'hedera', 
    chain: 'Hedera', 
    icon: 'ℏ', 
    color: 'bg-slate-200 text-slate-700',
    assets: [
      { token: 'USDC', amount: 3100.00 }
    ]
  },
  { 
    id: 'base', 
    chain: 'Base', 
    icon: '🔵', 
    color: 'bg-blue-100 text-blue-600',
    assets: [
      { token: 'USDC', amount: 2100.00 }
    ]
  },
  { 
    id: 'ape', 
    chain: 'ApeChain', 
    icon: '🦍', 
    color: 'bg-blue-600 text-white',
    assets: [
      { token: 'ApeUSD', amount: 1800.00 }
    ]
  },
  { 
    id: 'arb', 
    chain: 'Arbitrum', 
    icon: '🔷', 
    color: 'bg-indigo-100 text-indigo-600',
    assets: [
      { token: 'USDC', amount: 1095.00 }
    ]
  }
];

const COLD_WALLET_INIT = [
  {
    id: 'evm-grant',
    chain: 'DexPay EVM Grant Wallet',
    address: '0x07C61De233533c7cF0F6979608990f0EB9EE2FfF',
    icon: '🔷',
    color: 'bg-blue-100 text-blue-600',
    assets: [
      { token: 'ApeCoin', amount: 2500.00 },
      { token: 'ApeUSD', amount: 5000.00 },
      { token: 'USDT', amount: 1000.00 },
      { token: 'USDC', amount: 500.00 },
      { token: 'LSK', amount: 1000.00 }
    ]
  },
  {
    id: 'hbar-cold',
    chain: 'Hedera Wallet',
    address: '0.0.8672864',
    icon: 'ℏ',
    color: 'bg-slate-200 text-slate-700',
    assets: [
      { token: 'HBAR', amount: 1447.00 },
      { token: 'USDC', amount: 1000.00 }
    ]
  }
];

const FIAT_INIT = [
  {
    id: 'safe-haven',
    chain: 'Safe Haven MFB',
    icon: '🏦',
    color: 'bg-green-100 text-green-700',
    assets: [
      { token: 'NGN', amount: 7260.00, ngnValue: 12015300, rate: 1655 }
    ]
  }
];

const ASSET_ALLOCATION = [
  { name: 'Stablecoins', value: 20095, color: '#10B981' }, 
  { name: 'Volatile', value: 8947, color: '#8B5CF6' },    
  { name: 'Fiat', value: 7260, color: '#64748B' },           
];

const RUNWAY_PROJECTION = [
  { month: 'Oct', balance: 42500 },
  { month: 'Nov', balance: 39200 },
  { month: 'Dec', balance: 36302 },
  { month: 'Jan', balance: 27762 },
  { month: 'Feb', balance: 19222 },
  { month: 'Mar', balance: 10682 },
  { month: 'Apr', balance: 2142 },
  { month: 'May', balance: -6398 }, 
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = ['2025', '2026', '2027'];

// --- Components ---

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
        {trend === 'neutral' && <Activity className="w-4 h-4 text-slate-400 mr-1" />}
        <span className={`${alert ? 'text-red-600 font-medium' : 'text-slate-500'}`}>{subtext}</span>
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
    {action}
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

    // 1. Client-Side Validation (Save API calls)
    if (pin.length !== 4) {
      setErrorMsg("PIN must be 4 digits");
      setLoading(false);
      return;
    }

    try {
      // 2. Call Supabase (Removed console.log of PIN)
      const { data, error } = await supabase
        .rpc('verify_user_pin', { input_pin: pin });

      if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message || "Database connection failed");
      }

      if (data && data.success) {
        onUnlock(data.user);
      } else {
        throw new Error('Incorrect PIN');
      }

    } catch (err) {
      console.error("Login Error:", err.message); // Log error message only, not secrets
      setErrorMsg(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">DexPay Secure View</h2>
        <p className="text-slate-500 mb-4">Enter CFO PIN to access financial data</p>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-100 text-rose-700 text-sm rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="password" 
            value={pin}
            onChange={(e) => {
               // Optional: prevent typing more than 4 digits
               if (e.target.value.length <= 4) setPin(e.target.value);
            }}
            placeholder="Enter PIN"
            className="w-full text-center text-2xl tracking-widest py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-slate-900"
            maxLength={4}
            autoFocus
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Unlock Dashboard"}
          </button>
        </form>
         <p className="mt-6 text-xs text-slate-400">
          Auto-locks after 3 minutes of inactivity
        </p>
      </div>
    </div>
  );
};

export default function DexPayFinancialDashboard() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const timerRef = useRef(null);

  // --- Audit Log State (Moved Top & Consolidated) ---
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // --- Data State ---
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025'); // Added Year State
  const [txFilter, setTxFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [txError, setTxError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Treasury State
  const [treasuryWallets, setTreasuryWallets] = useState(TREASURY_BREAKDOWN_INIT);
  const [coldStorage, setColdStorage] = useState(COLD_WALLET_INIT);
  const [fiatTreasury, setFiatTreasury] = useState(FIAT_INIT);
  const [isEditingTreasury, setIsEditingTreasury] = useState(false);

  // Calculate Totals dynamically
  const totalAds = useMemo(() => treasuryWallets.reduce((acc, w) => acc + w.assets.reduce((sum, a) => sum + a.amount, 0), 0), [treasuryWallets]);
  const totalCold = useMemo(() => coldStorage.reduce((acc, w) => acc + w.assets.reduce((sum, a) => sum + a.amount, 0), 0), [coldStorage]);
  const totalFiat = useMemo(() => fiatTreasury.reduce((acc, w) => acc + w.assets.reduce((sum, a) => sum + a.amount, 0), 0), [fiatTreasury]);
  
  const globalBalance = totalAds + totalCold + totalFiat;

  // --- Audit Logger ---
  const addToLog = async (action, details) => {
    const logEntry = {
      timestamp: new Date().toLocaleString(),
      action,
      user_name: 'Treasury Finance', // or dynamic later
      details,
    };

    // save to Supabase
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(logEntry)
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    const saved = {
      id: data.id,
      timestamp: data.timestamp,
      action: data.action,
      user: data.user_name,
      details: data.details,
    };

    // Update the consolidated state
    setAuditLogs(prev => [saved, ...prev]);
  };

  // --- Inactivity Logic ---
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isAuthenticated) {
      timerRef.current = setTimeout(() => {
        setIsAuthenticated(false);
        addToLog('System Auto-Lock', 'Session timed out due to inactivity');
      }, INACTIVITY_LIMIT_MS);
    }
  };

  // --- Effect: Fetch Transactions ---
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        setTxError('Could not load transactions');
      } else {
        const mapped = (data || []).map((row) => ({
          id: row.id,
          date: row.date,
          category: row.category,
          type: row.type,
          desc: row.description,
          status: row.status,
          amount: Number(row.amount),
          source: row.source,
          dest: row.dest,
        }));
        setTransactions(mapped);
      }

      setLoadingTransactions(false);
    };

    fetchTransactions();
  }, []);

  // --- Effect: Inactivity Timer ---
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    if (isAuthenticated) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetTimer(); 
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated]);

  // --- Effect: Fetch Balances on Load ---
  useEffect(() => {
    const fetchBalances = async () => {
      const { data, error } = await supabase.from('asset_balances').select('*');
      
      if (!error && data) {
        // 1. Update Ads Wallets
        setTreasuryWallets(prev => prev.map(chain => ({
          ...chain,
          assets: chain.assets.map(asset => {
            const dbId = `ads-${chain.id}-${asset.token}`;
            const found = data.find(d => d.id === dbId);
            return found ? { ...asset, amount: Number(found.amount) } : asset;
          })
        })));

        // 2. Update Cold Storage
        setColdStorage(prev => prev.map(wallet => ({
          ...wallet,
          assets: wallet.assets.map(asset => {
            const dbId = `cold-${wallet.id}-${asset.token}`;
            const found = data.find(d => d.id === dbId);
            return found ? { ...asset, amount: Number(found.amount) } : asset;
          })
        })));

        // 3. Update Fiat
        setFiatTreasury(prev => prev.map(bank => ({
          ...bank,
          assets: bank.assets.map(asset => {
            const dbId = `fiat-${bank.id}-${asset.token}`;
            const found = data.find(d => d.id === dbId);
            if (found) {
              const newAmount = Number(found.amount);
              const newRate = found.rate ? Number(found.rate) : asset.rate;
              return { 
                ...asset, 
                amount: newAmount, 
                rate: newRate,
                ngnValue: newAmount * newRate 
              };
            }
            return asset;
          })
        })));
      }
    };

    fetchBalances();
  }, []);

  // --- Effect: Fetch Logs ---
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        const mapped = (data || []).map(row => ({
          id: row.id,
          timestamp: row.timestamp,
          action: row.action,
          user: row.user_name,
          details: row.details,
        }));
        setAuditLogs(mapped);
      }
      setLoadingLogs(false);
    };

    fetchLogs();
  }, []);

  // --- Data Helpers ---
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter by BOTH month and year
      return t.date.includes(selectedMonth) && t.date.includes(selectedYear);
    });
  }, [transactions, selectedMonth, selectedYear]);

  const displayedTransactions = useMemo(() => {
    if (txFilter === 'All') return monthlyTransactions;
    return monthlyTransactions.filter(t => t.category === txFilter);
  }, [monthlyTransactions, txFilter]);

  const monthlyMetrics = useMemo(() => {
    let revenue = 0;
    let burn = 0; 
    const expenseCategories = ['OpEx', 'Salary', 'Operations', 'Marketing', 'Legal', 'Tech', 'COGS'];

    monthlyTransactions.forEach(tx => {
      if (tx.status === 'Approved') {
        if (tx.category === 'Revenue') {
          revenue += tx.amount;
        } else if (expenseCategories.includes(tx.category)) {
          burn += Math.abs(tx.amount);
        }
      }
    });
    return { revenue, burn, runway: globalBalance / (burn || 1) };
  }, [monthlyTransactions, globalBalance]);

  // --- Account Selector Logic ---
  const allAccounts = useMemo(() => {
    const accounts = [];
    // Ads Wallets
    treasuryWallets.forEach((wallet, wIdx) => {
      wallet.assets.forEach((asset, aIdx) => {
        accounts.push({
          id: `ads-${wallet.id}-${asset.token}`,
          label: `Ads: ${wallet.chain} - ${asset.token} (Bal: $${asset.amount.toLocaleString()})`,
          type: 'ads',
          walletIndex: wIdx,
          assetIndex: aIdx,
          currentAmount: asset.amount
        });
      });
    });
    // Cold Storage
    coldStorage.forEach((wallet, wIdx) => {
      wallet.assets.forEach((asset, aIdx) => {
        accounts.push({
          id: `cold-${wallet.id}-${asset.token}`,
          label: `Cold: ${wallet.chain} - ${asset.token} (Bal: $${asset.amount.toLocaleString()})`,
          type: 'cold',
          walletIndex: wIdx,
          assetIndex: aIdx,
          currentAmount: asset.amount
        });
      });
    });
    // Fiat
    fiatTreasury.forEach((bank, wIdx) => {
      bank.assets.forEach((asset, aIdx) => {
        const balanceDisplay = asset.ngnValue 
          ? `₦${asset.ngnValue.toLocaleString()}` 
          : `$${asset.amount.toLocaleString()}`;
        accounts.push({
          id: `fiat-${bank.id}-${asset.token}`,
          label: `Fiat: ${bank.chain} - ${asset.token} (Bal: ${balanceDisplay})`,
          type: 'fiat',
          walletIndex: wIdx,
          assetIndex: aIdx,
          currentAmount: asset.amount
        });
      });
    });
    return accounts;
  }, [treasuryWallets, coldStorage, fiatTreasury]);

  // Form Handlers
  const [newTx, setNewTx] = useState({
    month: 'Jan', day: '08', year: '2026', category: 'Operations', type: '', desc: '', amount: '', status: 'Pending', sourceId: '', destId: ''
  });

  const isExpense = ['OpEx', 'Salary', 'Operations', 'Marketing', 'Legal', 'Tech', 'COGS'].includes(newTx.category);
  const isRevenue = newTx.category === 'Revenue';
  const isTransfer = newTx.category === 'Liquidity';

  // --- Balance Update Logic ---
  const applyBalanceChange = async (accountId, amountChange) => {
    const account = allAccounts.find(a => a.id === accountId);
    if (!account) return;

    const { type, walletIndex, assetIndex } = account;
    let newDbAmount = 0;
    let dbId = '';
    let dbRate = null;

    // 1. HANDLE ADS WALLETS
    if (type === 'ads') {
      const updated = [...treasuryWallets];
      const chain = updated[walletIndex];
      const newAssets = [...chain.assets];
      const asset = newAssets[assetIndex];
      
      // Calculate new amount
      newAssets[assetIndex] = { ...asset, amount: asset.amount + amountChange };
      updated[walletIndex] = { ...chain, assets: newAssets };
      
      // Update UI
      setTreasuryWallets(updated);
      
      // Prepare DB Data
      newDbAmount = newAssets[assetIndex].amount;
      dbId = `ads-${chain.id}-${asset.token}`;
    } 
    // 2. HANDLE COLD STORAGE
    else if (type === 'cold') {
      const updated = [...coldStorage];
      const wallet = updated[walletIndex];
      const newAssets = [...wallet.assets];
      const asset = newAssets[assetIndex];

      // Calculate new amount
      newAssets[assetIndex] = { ...asset, amount: asset.amount + amountChange };
      updated[walletIndex] = { ...wallet, assets: newAssets };
      
      // Update UI
      setColdStorage(updated);

      // Prepare DB Data
      newDbAmount = newAssets[assetIndex].amount;
      dbId = `cold-${wallet.id}-${asset.token}`;
    } 
    // 3. HANDLE FIAT
    else if (type === 'fiat') {
      const updated = [...fiatTreasury];
      const bank = updated[walletIndex];
      const newAssets = [...bank.assets];
      const asset = newAssets[assetIndex];

      // Calculate new amount
      const newAmount = asset.amount + amountChange;
      let newNgnValue = asset.ngnValue;
      if (asset.rate) {
        newNgnValue = newAmount * asset.rate;
      }

      newAssets[assetIndex] = { ...asset, amount: newAmount, ngnValue: newNgnValue };
      updated[walletIndex] = { ...bank, assets: newAssets };
      
      // Update UI
      setFiatTreasury(updated);

      // Prepare DB Data
      newDbAmount = newAmount;
      dbId = `fiat-${bank.id}-${asset.token}`;
      dbRate = asset.rate;
    }

    // 4. SEND TO DATABASE
    if (dbId) {
      const payload = { id: dbId, amount: newDbAmount };
      if (dbRate) payload.rate = dbRate; // Only include rate for Fiat if needed

      const { error } = await supabase
        .from('asset_balances')
        .upsert(payload);

      if (error) {
        console.error("Failed to sync auto-deduction to DB:", error);
      }
    }
  };

  const executeFundMovement = (tx, reverse = false) => {
    const multiplier = reverse ? -1 : 1;
    const amount = Math.abs(tx.amount);

    const isTxExpense = ['OpEx', 'Salary', 'Operations', 'Marketing', 'Legal', 'Tech', 'COGS'].includes(tx.category);
    const isTxRevenue = tx.category === 'Revenue';
    const isTxTransfer = tx.category === 'Liquidity';

    const findAccId = (labelStr) => {
        if(!labelStr) return null;
        const acc = allAccounts.find(a => a.label.startsWith(labelStr));
        return acc ? acc.id : null;
    }

    if (isTxExpense && tx.source) {
       const accId = findAccId(tx.source);
       if(accId) applyBalanceChange(accId, -amount * multiplier);
    }
    if (isTxRevenue && tx.dest) {
        const accId = findAccId(tx.dest);
        if(accId) applyBalanceChange(accId, amount * multiplier);
    }
    if (isTxTransfer && tx.source && tx.dest) {
        const srcId = findAccId(tx.source);
        const dstId = findAccId(tx.dest);
        if(srcId) applyBalanceChange(srcId, -amount * multiplier);
        if(dstId) applyBalanceChange(dstId, amount * multiplier);
    }
  };

  const handleAddTransaction = async (e) => {
  e.preventDefault();
  const amountVal = parseFloat(newTx.amount);
  if (!amountVal) return;

  const isExpense = newTx.category === 'Operations' || newTx.category === 'Legal';
  const isRevenue = newTx.category === 'Revenue';

  const sourceAcc = allAccounts.find(a => a.id === newTx.sourceId);
  const destAcc = allAccounts.find(a => a.id === newTx.destId);

  const sourceLabel = sourceAcc ? sourceAcc.label.split(' (Bal:')[0] : '';
  const destLabel = destAcc ? destAcc.label.split(' (Bal:')[0] : '';

  // Shape for the DB
  const txForDb = {
    date: `${newTx.month} ${newTx.day}, ${newTx.year}`,
    category: newTx.category,
    type: newTx.type || null,
    description: newTx.desc,
    status: 'Pending',
    amount: isExpense ? -amountVal : (isRevenue ? amountVal : -amountVal),
    source: sourceLabel || null,
    dest: destLabel || null,
  };

  // 1) Save to Supabase
  const { data, error } = await supabase
    .from('transactions')
    .insert(txForDb)
    .select()
    .single();

  if (error) {
    console.error(error);
    alert('Could not save transaction');
    return;
  }

  // 2) Map DB row back to UI shape
  const savedTx = {
    id: data.id,
    date: data.date,
    category: data.category,
    type: data.type,
    desc: data.description,
    status: data.status,
    amount: Number(data.amount),
    source: data.source,
    dest: data.dest,
  };

  // 3) Update React state
  setTransactions(prev => [savedTx, ...prev]);
  addToLog('Entry Added', `${newTx.category}: ${newTx.desc} (${amountVal})`);
  setIsModalOpen(false);

  // Reset form
  setNewTx({
    month: 'Dec',
    day: '05',
    year: '2025',
    category: 'Operations',
    type: '',
    desc: '',
    amount: '',
    status: 'Pending',
    sourceId: '',
    destId: '',
  });
};


  const handleStatusChange = async (newStatus) => {
    if (!selectedTransaction) return;
    const oldStatus = selectedTransaction.status;

    // 1. UPDATE SUPABASE (This was missing)
    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', selectedTransaction.id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status in database');
      return;
    }
    
    // 2. Update local logic if DB update succeeded
    if (newStatus === 'Approved' && oldStatus !== 'Approved') {
        executeFundMovement(selectedTransaction, false); 
        addToLog('Status Updated', `Approved: ${selectedTransaction.desc}`);
    } else if (oldStatus === 'Approved' && newStatus !== 'Approved') {
        executeFundMovement(selectedTransaction, true);
        addToLog('Status Reverted', `Reverted: ${selectedTransaction.desc}`);
    }

    const updatedTx = { ...selectedTransaction, status: newStatus };
    setTransactions(transactions.map(t => t.id === selectedTransaction.id ? updatedTx : t));
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = async (id) => {
    // 1. Find the transaction in local state
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    // 2. DELETE FROM SUPABASE (This was missing)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting from DB:', error);
      alert('Failed to delete transaction from database');
      return; 
    }

    // 3. If DB delete succeeded, update local state
    if(txToDelete.status === 'Approved') {
        executeFundMovement(txToDelete, true);
    }

    setTransactions(transactions.filter(t => t.id !== id));
    if (selectedTransaction && selectedTransaction.id === id) setSelectedTransaction(null);
    addToLog('Entry Deleted', `Removed transaction: ${txToDelete.desc}`);
  };

  // --- Treasury Edit Logic ---
  const updateAds = async (chainIndex, assetIndex, value) => {
    const numValue = parseFloat(value) || 0;
    
    // 1. Update Local State (Instant feedback)
    const updated = [...treasuryWallets];
    const chain = updated[chainIndex];
    const newAssets = [...chain.assets];
    const asset = newAssets[assetIndex];
    newAssets[assetIndex] = { ...asset, amount: numValue };
    updated[chainIndex] = { ...chain, assets: newAssets };
    setTreasuryWallets(updated);

    // 2. Save to Supabase
    const dbId = `ads-${chain.id}-${asset.token}`;
    await supabase.from('asset_balances').upsert({ id: dbId, amount: numValue });
  };
  
  const updateCold = async (chainIndex, assetIndex, value) => {
    const numValue = parseFloat(value) || 0;
    
    // 1. Update Local State
    const updated = [...coldStorage];
    const wallet = updated[chainIndex];
    const newAssets = [...wallet.assets];
    const asset = newAssets[assetIndex];
    newAssets[assetIndex] = { ...asset, amount: numValue };
    updated[chainIndex] = { ...wallet, assets: newAssets };
    setColdStorage(updated);

    // 2. Save to Supabase
    const dbId = `cold-${wallet.id}-${asset.token}`;
    await supabase.from('asset_balances').upsert({ id: dbId, amount: numValue });
  };
  
  const updateFiatManual = async (bankIndex, assetIndex, field, value) => {
    const numValue = parseFloat(value) || 0;
    
    // 1. Update Local State
    const updated = [...fiatTreasury];
    const bank = updated[bankIndex];
    const newAssets = [...bank.assets];
    const currentAsset = newAssets[assetIndex];
    
    let newAmount = currentAsset.amount;
    let newRate = currentAsset.rate;
    let newNgnValue = currentAsset.ngnValue;

    if (field === 'ngnValue') {
      newNgnValue = numValue;
      newAmount = newNgnValue / (currentAsset.rate || 1);
    } else if (field === 'rate') {
      newRate = numValue;
      newAmount = currentAsset.ngnValue / (newRate || 1);
    }
    
    newAssets[assetIndex] = { ...currentAsset, amount: newAmount, ngnValue: newNgnValue, rate: newRate };
    updated[bankIndex] = { ...bank, assets: newAssets };
    setFiatTreasury(updated);

    // 2. Save to Supabase
    const dbId = `fiat-${bank.id}-${currentAsset.token}`;
    await supabase.from('asset_balances').upsert({ 
      id: dbId, 
      amount: newAmount, 
      rate: newRate 
    });
  };

  // Helper for badge style
  const getBadgeStyle = (category) => {
    switch (category) {
      case 'Revenue': return 'bg-emerald-100 text-emerald-800';
      case 'Salary': return 'bg-blue-100 text-blue-800';
      case 'Marketing': return 'bg-indigo-100 text-indigo-800';
      case 'Operations': return 'bg-slate-100 text-slate-800';
      case 'Legal': return 'bg-amber-100 text-amber-800';
      case 'Tech': return 'bg-cyan-100 text-cyan-800';
      case 'COGS': return 'bg-rose-100 text-rose-800';
      case 'Liquidity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending Approval': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pending': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // --- Render Views ---
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Treasury" 
          value={`$${globalBalance.toLocaleString('en-US', {maximumFractionDigits: 0})}`} 
          subtext="Global Balance"
          icon={Wallet}
          colorClass="bg-slate-100 text-slate-700"
        />
        <MetricCard 
          title={`Burn Rate (${selectedMonth} ${selectedYear})`} 
          value={`$${monthlyMetrics.burn.toLocaleString()}`} 
          subtext={monthlyMetrics.burn > 0 ? "Expenses recorded" : "No expenses yet"}
          icon={Activity}
          trend="down"
          colorClass="bg-blue-100 text-blue-600"
        />
        <MetricCard 
          title="Runway Remaining" 
          value={`${monthlyMetrics.runway.toFixed(1)} Months`} 
          subtext={monthlyMetrics.runway > 12 ? "All systems operational" : "Critical: Raise Capital"}
          icon={monthlyMetrics.runway > 12 ? CheckCircle2 : AlertTriangle}
          colorClass={monthlyMetrics.runway > 12 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}
          alert={monthlyMetrics.runway <= 12}
        />
        <MetricCard 
          title={`Revenue (${selectedMonth} ${selectedYear})`} 
          value={`$${monthlyMetrics.revenue.toLocaleString()}`} 
          subtext={monthlyMetrics.revenue > 0 ? "Income recorded" : "No revenue yet"}
          icon={DollarSign}
          trend="up"
          colorClass="bg-emerald-100 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="Runway Projection" subtitle="Projected cash balance based on current burn" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RUNWAY_PROJECTION} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                <ReferenceLine x={selectedMonth} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: 'Selected', fill: '#10B981', fontSize: 10 }} />
                <Area type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <SectionHeader title="Treasury Allocation" subtitle="Asset risk distribution" />
          <div className="flex-1 min-h-[200px] relative">
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
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">General Ledger ({selectedMonth} {selectedYear})</h3>
            <p className="text-sm text-slate-500">Filtered view for selected period</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['All', 'Revenue', 'OpEx', 'Liquidity'].map((tab) => (
              <button key={tab} onClick={() => setTxFilter(tab)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${txFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab === 'OpEx' ? 'Expenses' : tab}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount (USD)</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((tx) => (
                  <tr key={tx.id} onClick={() => setSelectedTransaction(tx)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle(tx.category)}`}>{tx.category}</span></td>
                    <td className="px-6 py-4 text-slate-900">
                      <div className="flex flex-col">
                        <span>{tx.desc}</span>
                        <span className="text-xs text-slate-400">
                            {tx.source && `From: ${tx.source}`}
                            {tx.source && tx.dest && <ArrowRight className="w-3 h-3 inline mx-1" />}
                            {tx.dest && `To: ${tx.dest}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>{tx.status}</span></td>
                    <td className={`px-6 py-4 text-right font-medium ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id); }}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No transactions found for {selectedMonth} {selectedYear}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTreasury = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Treasury Allocation</h2>
          <p className="text-slate-500">Real-time Asset Distribution</p>
        </div>
        <button onClick={() => { if (isEditingTreasury) addToLog('Treasury Update', 'Manual edits saved'); setIsEditingTreasury(!isEditingTreasury); }} className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isEditingTreasury ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
          {isEditingTreasury ? <><Save className="w-4 h-4 mr-2" /> Save Changes</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit Balances</>}
        </button>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-lg font-bold text-slate-900">Ads Wallet Allocation</h2>
          <div className="text-right"><p className="text-sm text-slate-500">Total Ads Value</p><p className="text-3xl font-bold text-slate-900">${totalAds.toLocaleString()}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treasuryWallets.map((chain, chainIndex) => (
            <div key={chainIndex} className={`bg-white rounded-xl border ${isEditingTreasury ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'} p-6 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${chain.color}`}>{chain.icon}</div><h3 className="font-bold text-slate-900">{chain.chain}</h3></div>
                {isEditingTreasury && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">EDIT</span>}
              </div>
              <div className="space-y-3">
                {chain.assets.map((asset, assetIndex) => (
                  <div key={assetIndex} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-600">{asset.token}</span>
                    {isEditingTreasury ? <input type="number" value={asset.amount} onChange={(e) => updateAds(chainIndex, assetIndex, e.target.value)} className="w-24 text-right px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" /> : <span className="font-bold text-slate-900">${asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Cold Storage</h2>
          <div className="text-right"><p className="text-sm text-slate-500">Total Vault Value</p><p className="text-3xl font-bold text-slate-900">${totalCold.toLocaleString()}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coldStorage.map((wallet, chainIndex) => (
            <div key={chainIndex} className={`bg-white rounded-xl border ${isEditingTreasury ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'} p-6 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${wallet.color}`}>{wallet.icon}</div><div><h3 className="font-bold text-slate-900">{wallet.chain}</h3>{wallet.address && <p className="text-xs text-slate-400 font-mono mt-0.5">{wallet.address}</p>}</div></div>
                {isEditingTreasury && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">EDIT</span>}
              </div>
              <div className="space-y-3">
                {wallet.assets.map((asset, assetIndex) => (
                  <div key={assetIndex} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-600">{asset.token}</span>
                    {isEditingTreasury ? <input type="number" value={asset.amount} onChange={(e) => updateCold(chainIndex, assetIndex, e.target.value)} className="w-24 text-right px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" /> : <span className="font-bold text-slate-900">${asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
         <div className="flex justify-between items-end mb-6 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Fiat (NGN) Treasury</h2>
          <div className="text-right"><p className="text-sm text-slate-500">Total Fiat Value</p><p className="text-3xl font-bold text-slate-900">${totalFiat.toLocaleString('en-US', {maximumFractionDigits: 2})}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fiatTreasury.map((bank, bankIndex) => (
            <div key={bankIndex} className={`bg-white rounded-xl border ${isEditingTreasury ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'} p-6 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${bank.color}`}>{bank.icon}</div><h3 className="font-bold text-slate-900">{bank.chain}</h3></div>
                {isEditingTreasury && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">EDIT MODE</span>}
              </div>
              <div className="space-y-3">
                {bank.assets.map((asset, assetIndex) => (
                  <div key={assetIndex} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start w-full">
                        <span className="font-medium text-slate-600 mt-1">{asset.token}</span>
                        <div className="text-right">
                            <div className="font-bold text-slate-900 text-lg flex items-center justify-end"><span className="mr-1">₦</span>{isEditingTreasury ? <input type="number" value={asset.ngnValue} onChange={(e) => updateFiatManual(bankIndex, assetIndex, 'ngnValue', e.target.value)} className="w-32 text-right px-2 py-1 text-lg border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" /> : asset.ngnValue.toLocaleString()}</div>
                            <div className="text-sm font-medium text-emerald-600">${asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center justify-end"><span className="mr-1">@ ₦</span>{isEditingTreasury ? <input type="number" value={asset.rate} onChange={(e) => updateFiatManual(bankIndex, assetIndex, 'rate', e.target.value)} className="w-16 text-right px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" /> : asset.rate.toLocaleString()}<span className="ml-1">/$</span></div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div><h2 className="text-2xl font-bold text-slate-900">Audit Reports</h2><p className="text-slate-500">Full system activity log</p></div>
        <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm"><Download className="w-4 h-4 mr-2" /> Export Log</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.timestamp}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.action.includes('Delete') ? 'bg-rose-100 text-rose-800' : log.action.includes('Update') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{log.action}</span></td>
                  <td className="px-6 py-4 text-slate-900 font-medium">{log.user}</td>
                  <td className="px-6 py-4 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) return <AuthScreen onUnlock={() => setIsAuthenticated(true)} />;

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out transform ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} lg:static lg:inset-auto`}>
        <div className={`h-16 flex items-center bg-slate-950 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
           <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
               {LOGO_URL ? <img src={LOGO_URL} alt="DexPay Logo" className={`h-8 w-auto object-contain ${isSidebarCollapsed ? '' : 'mr-2'}`} /> : <div className="bg-blue-600 p-1.5 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>}
               {!isSidebarCollapsed && <span className="text-lg font-bold text-white tracking-tight">DexPay Finance</span>}
           </div>
           {!isMobileMenuOpen && <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`hidden lg:flex text-slate-500 hover:text-white transition-colors ${isSidebarCollapsed ? 'hidden' : ''}`} title="Collapse Sidebar"><PanelLeftClose className="w-5 h-5" /></button>}
        </div>
        {isSidebarCollapsed && <div className="hidden lg:flex justify-center py-2 border-b border-slate-800"><button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-500 hover:text-white transition-colors" title="Expand Sidebar"><PanelLeftOpen className="w-5 h-5" /></button></div>}
        <div className="p-4 space-y-2">
          {!isSidebarCollapsed && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>}
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`} title="Dashboard"><LayoutDashboard className="w-5 h-5" />{!isSidebarCollapsed && <span className="font-medium">Dashboard</span>}</button>
          <button onClick={() => { setActiveTab('treasury'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} ${activeTab === 'treasury' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`} title="Treasury Allocation"><Coins className="w-5 h-5" />{!isSidebarCollapsed && <span className="font-medium">Treasury Allocation</span>}</button>
          <button onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-slate-400 ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`} title="Reports"><FileText className="w-5 h-5" />{!isSidebarCollapsed && <span className="font-medium">Reports</span>}</button>
        </div>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900"><button onClick={() => { addToLog('System Logout', 'User manually locked dashboard'); setIsAuthenticated(false); }} className={`w-full flex items-center px-4 py-3 rounded-lg hover:bg-rose-900/20 hover:text-rose-400 transition-colors text-slate-400 ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`} title="Lock Dashboard"><LogOut className="w-5 h-5" />{!isSidebarCollapsed && <span className="font-medium">Lock Dashboard</span>}</button></div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center"><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden mr-4 text-slate-500"><Menu className="w-6 h-6" /></button><h1 className="text-xl font-bold text-slate-900 hidden sm:block">{activeTab === 'dashboard' ? 'Financial Overview' : activeTab === 'treasury' ? 'Treasury Management' : 'Audit Reports'}</h1></div>
          <div className="flex items-center space-x-4">
             {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2">
                    <div className="relative group flex items-center text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 hover:border-blue-500 transition-colors cursor-pointer">
                        <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="appearance-none bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-slate-700 outline-none">
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div className="relative group flex items-center text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 hover:border-blue-500 transition-colors cursor-pointer">
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="appearance-none bg-transparent border-none focus:ring-0 cursor-pointer pr-4 font-medium text-slate-700 outline-none">
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2 pointer-events-none text-slate-400" />
                    </div>
                </div>
             )}
             <button onClick={() => setIsModalOpen(true)} className="hidden sm:flex items-center text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Entry</button>
             <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">JS</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' ? renderDashboard() : activeTab === 'treasury' ? renderTreasury() : renderReports()}
        </main>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Transaction Details</h3>
                    <button onClick={() => setSelectedTransaction(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div><p className="text-sm text-slate-500 mb-1">Description</p><p className="font-medium text-slate-900 text-lg">{selectedTransaction.desc}</p><span className={`inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle(selectedTransaction.category)}`}>{selectedTransaction.category}</span></div>
                        <div className="text-right"><p className="text-sm text-slate-500 mb-1">Amount</p><p className={`text-xl font-bold ${selectedTransaction.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{selectedTransaction.amount > 0 ? '+' : ''}{selectedTransaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-900">{selectedTransaction.date}</span></div>
                        {selectedTransaction.source && <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-medium text-slate-900">{selectedTransaction.source}</span></div>}
                        {selectedTransaction.dest && <div className="flex justify-between"><span className="text-slate-500">Destination</span><span className="font-medium text-slate-900">{selectedTransaction.dest}</span></div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Pending', 'Pending Approval', 'Approved'].map((status) => (
                                <button key={status} onClick={() => handleStatusChange(status)} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${selectedTransaction.status === status ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{status}</button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">* Balances are only updated when status is set to <strong>Approved</strong>.</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <button 
                            onClick={() => {
                                handleDeleteTransaction(selectedTransaction.id);
                                setSelectedTransaction(null);
                            }}
                            className="flex items-center text-rose-600 hover:text-rose-700 font-medium text-sm"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Transaction
                        </button>
                        <button onClick={() => setSelectedTransaction(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Close</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-900">Add New Entry</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <div className="flex gap-2">
                    <select value={newTx.month} onChange={(e) => setNewTx({...newTx, month: e.target.value})} className="w-1/3 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <input type="text" placeholder="DD" value={newTx.day} onChange={(e) => setNewTx({...newTx, day: e.target.value})} className="w-1/4 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-center" />
                     <select value={newTx.year} onChange={(e) => setNewTx({...newTx, year: e.target.value})} className="w-1/3 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label><input type="number" placeholder="0.00" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value, sourceId: '', destId: ''})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="Operations">Operational Costs</option><option value="Salary">Salary & Wages</option><option value="Marketing">Marketing & Ads</option><option value="Legal">Legal & Compliance</option><option value="Tech">Software & Servers</option><option value="Revenue">Revenue (Income)</option><option value="COGS">COGS (Direct Cost)</option><option value="Liquidity">Treasury Transfer</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label><input type="text" placeholder="e.g. Gas, Server" value={newTx.type} onChange={(e) => setNewTx({...newTx, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              {(isExpense || isTransfer) && (<div><label className="block text-sm font-medium text-slate-700 mb-1">{isTransfer ? 'Transfer From' : 'Debited From'}</label><select value={newTx.sourceId} onChange={(e) => setNewTx({...newTx, sourceId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" required><option value="">Select Source Account</option>{allAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.label}</option>))}</select></div>)}
              {(isRevenue || isTransfer) && (<div><label className="block text-sm font-medium text-slate-700 mb-1">{isTransfer ? 'Transfer To' : 'Credited To'}</label><select value={newTx.destId} onChange={(e) => setNewTx({...newTx, destId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" required><option value="">Select Destination Account</option>{allAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.label}</option>))}</select></div>)}
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><input type="text" placeholder="e.g. Monthly Server Cost" value={newTx.desc} onChange={(e) => setNewTx({...newTx, desc: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" required /></div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center"><Save className="w-4 h-4 mr-2" /> Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
