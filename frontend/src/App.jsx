import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './index.css';

// ==========================================
// AUTH CONTEXT
// ==========================================
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');
    return token ? { token, role, name } : null;
  });

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userName', data.name);
    setAuth({ token: data.token, role: data.role, name: data.name });
  };

  const logout = () => {
    localStorage.clear();
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Axios interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==========================================
// NAVBAR
// ==========================================
const Navbar = () => {
  const { auth, logout } = useAuth();
  if (!auth) return null;

  return (
    <nav className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border-b border-indigo-700/50 px-6 py-4 flex justify-between items-center shadow-2xl backdrop-blur-lg">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-xl">🗳️</span>
        </div>
        <span className="font-bold text-xl bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          BlockVote
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-indigo-200 hover:text-white transition-colors text-sm font-medium">Dashboard</Link>
        <Link to="/results" className="text-indigo-200 hover:text-white transition-colors text-sm font-medium">Results</Link>
        {auth.role === 'admin' && (
          <Link to="/admin" className="text-indigo-200 hover:text-white transition-colors text-sm font-medium">Admin</Link>
        )}
        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-indigo-700/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
            {auth.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm text-indigo-200">{auth.name}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-800/60 text-indigo-300 border border-indigo-600/30">{auth.role}</span>
          <button onClick={logout} className="ml-2 px-4 py-2 text-sm bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/40 transition-all">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

// ==========================================
// LOGIN PAGE
// ==========================================
const LoginPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/login', { name, password });
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30 transform hover:rotate-6 transition-transform">
            <span className="text-4xl">🗳️</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            BlockVote
          </h1>
          <p className="text-slate-400 text-sm">Decentralized Blockchain Voting System</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Voter Name</label>
              <input
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg> Signing in...</>
              ) : '🔐 Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">Secured with JWT Authentication & Blockchain</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// VOTER DASHBOARD
// ==========================================
const VoterDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [votingId, setVotingId] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    fetchCandidates();
    checkVoteStatus();
  }, []);

  const fetchCandidates = async () => {
    const res = await axios.get('/api/candidates');
    setCandidates(res.data);
  };

  const checkVoteStatus = async () => {
    try {
      const res = await axios.get('/api/me');
      setHasVoted(res.data.hasVoted);
    } catch (e) { /* ignore */ }
  };

  const vote = async (candidateId) => {
    setVotingId(candidateId);
    try {
      const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const res = await axios.post('/api/vote', { candidateId, transactionHash: hash });
      setMessage({ type: 'success', text: res.data.message });
      setTxHash(hash);
      setHasVoted(true);
      fetchCandidates();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Voting failed' });
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Voter Dashboard</h1>
          <p className="text-slate-400">Welcome back, {auth?.name}. Cast your vote for your preferred candidate.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
            <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
            <div>
              <p className="font-medium">{message.text}</p>
              {txHash && (
                <p className="text-xs mt-2 font-mono opacity-75 break-all">
                  Transaction Hash: {txHash}
                </p>
              )}
            </div>
          </div>
        )}

        {hasVoted && !message && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <p>You have already voted. You can view results but cannot vote again.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((c, i) => (
            <div key={c._id}
              className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {c.name.charAt(0)}
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {c.vote_count} votes
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{c.name}</h3>
              <p className="text-sm text-slate-400 mb-5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                {c.party}
              </p>
              <button
                onClick={() => vote(c._id)}
                disabled={hasVoted || votingId === c._id}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${hasVoted
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
                  }`}
              >
                {votingId === c._id ? 'Casting Vote...' : hasVoted ? 'Already Voted' : '🗳️ Cast Vote'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// RESULTS PAGE
// ==========================================
const ResultsPage = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    axios.get('/api/results').then(res => setResults(res.data));
  }, []);

  const maxVotes = Math.max(...results.map(r => r.vote_count), 1);
  const colors = ['from-yellow-400 to-amber-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-amber-700', 'from-indigo-500 to-purple-500', 'from-emerald-500 to-cyan-500'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Live Results</h1>
        <p className="text-slate-400 mb-8">Real-time vote counts from the blockchain</p>

        <div className="space-y-4">
          {results.map((c, i) => (
            <div key={c._id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-500 w-8">#{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.party}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  {c.vote_count}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all duration-1000`}
                  style={{ width: `${(c.vote_count / maxVotes) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ADMIN DASHBOARD
// ==========================================
const AdminDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ name: '', party: '', vote_count: 0 });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    const res = await axios.get('/api/candidates');
    setCandidates(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`/api/candidates/${editing}`, form);
        setMsg('Candidate updated!');
      } else {
        await axios.post('/api/candidates', form);
        setMsg('Candidate added!');
      }
      setForm({ name: '', party: '', vote_count: 0 });
      setEditing(null);
      fetchCandidates();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await axios.delete(`/api/candidates/${id}`);
      setMsg('Candidate deleted!');
      fetchCandidates();
    }
  };

  const startEdit = (c) => {
    setEditing(c._id);
    setForm({ name: c.name, party: c.party, vote_count: c.vote_count });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400 mb-8">Manage candidates and monitor elections</p>

        {msg && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? '✏️ Edit Candidate' : '➕ Add Candidate'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400 block mb-1">Name</label>
              <input className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Candidate name" required />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400 block mb-1">Party</label>
              <input className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.party} onChange={e => setForm({ ...form, party: e.target.value })} placeholder="Party name" required />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg">
              {editing ? 'Update' : 'Add'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({ name: '', party: '', vote_count: 0 }); }}
                className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-sm">Cancel</button>
            )}
          </form>
        </div>

        {/* Candidates Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">#</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Party</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Votes</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr key={c._id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-400">{i + 1}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{c.party}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">{c.vote_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition">Edit</button>
                      <button onClick={() => handleDelete(c._id)} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// APP ROOT
// ==========================================
const ProtectedRoute = ({ children, adminOnly }) => {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" />;
  if (adminOnly && auth.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><VoterDashboard /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
