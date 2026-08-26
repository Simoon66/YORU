import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { UserProfile, UserRole, RoleAuditLog } from '../../types';
import { 
  Shield, 
  Search, 
  Loader2, 
  Crown, 
  Users, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ArrowRight, 
  UserCheck, 
  UserX, 
  Sparkles, 
  Star, 
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  updateUserRole, 
  toggleUserBan, 
  getAuditLogs, 
  canActorManageTarget, 
  getAllowedRolesToAssign, 
  isSuperAdmin,
  ROLE_LABELS 
} from '../../lib/admin';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from '../../lib/utils';
import clsx from 'clsx';

export const CommunityManager: React.FC = () => {
  const { user, profile } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'members' | 'audit'>('members');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<RoleAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Modal State for Confirming Role Change
  const [roleModalTarget, setRoleModalTarget] = useState<{ user: UserProfile; newRole: UserRole } | null>(null);
  const [isProcessingRole, setIsProcessingRole] = useState(false);

  // Modal State for Confirming Ban Toggle
  const [banModalTarget, setBanModalTarget] = useState<{ user: UserProfile; newStatus: boolean } | null>(null);
  const [isProcessingBan, setIsProcessingBan] = useState(false);

  // Alert message
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const actorEmail = user?.email || profile?.email || null;
  const actorRole = profile?.role || 'user';
  const actorIsSuperAdmin = isSuperAdmin(actorEmail);
  const allowedRoles = getAllowedRolesToAssign(actorRole, actorEmail);

  useEffect(() => {
    loadUsers();
    loadLogs();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const userList: UserProfile[] = [];
      snap.forEach(docSnap => {
        userList.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      // Sort: Admins first, then mods, staff, special, users
      const order: Record<string, number> = { admin: 5, moderator: 4, staff: 3, special: 2, user: 1, guest: 0 };
      userList.sort((a, b) => (order[b.role || 'user'] || 0) - (order[a.role || 'user'] || 0));
      setUsers(userList);
    } catch (e) {
      console.error('Error loading users:', e);
      showFeedback('error', 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
    } catch (e) {
      console.error('Error loading audit logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Trigger Role Change Confirmation
  const promptRoleChange = (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.role === newRole) return;
    setRoleModalTarget({ user: targetUser, newRole });
  };

  // Confirm and Execute Role Change
  const confirmRoleChange = async () => {
    if (!roleModalTarget || !user) return;
    setIsProcessingRole(true);
    try {
      await updateUserRole(
        roleModalTarget.user.uid,
        roleModalTarget.newRole,
        {
          uid: user.uid,
          email: actorEmail,
          displayName: profile?.displayName || user.displayName,
          username: profile?.username,
          photoURL: profile?.photoURL || user.photoURL,
          role: actorRole
        }
      );

      // Update local users state
      setUsers(prev => prev.map(u => u.uid === roleModalTarget.user.uid ? { ...u, role: roleModalTarget.newRole } : u));
      
      showFeedback('success', `Role for ${roleModalTarget.user.username || roleModalTarget.user.displayName || 'user'} successfully changed to ${ROLE_LABELS[roleModalTarget.newRole]}.`);
      setRoleModalTarget(null);
      // Refresh audit logs
      loadLogs();
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Failed to update role.');
    } finally {
      setIsProcessingRole(false);
    }
  };

  // Trigger Ban Confirmation
  const promptBanToggle = (targetUser: UserProfile, newStatus: boolean) => {
    setBanModalTarget({ user: targetUser, newStatus });
  };

  // Confirm and Execute Ban Toggle
  const confirmBanToggle = async () => {
    if (!banModalTarget || !user) return;
    setIsProcessingBan(true);
    try {
      await toggleUserBan(
        banModalTarget.user.uid,
        banModalTarget.newStatus,
        {
          uid: user.uid,
          email: actorEmail,
          displayName: profile?.displayName || user.displayName,
          username: profile?.username,
          photoURL: profile?.photoURL || user.photoURL,
          role: actorRole
        }
      );

      // Update local state
      setUsers(prev => prev.map(u => u.uid === banModalTarget.user.uid ? { ...u, isBanned: banModalTarget.newStatus } : u));
      
      showFeedback('success', `User ${banModalTarget.user.username || banModalTarget.user.displayName || 'user'} has been ${banModalTarget.newStatus ? 'banned' : 'unbanned'}.`);
      setBanModalTarget(null);
      loadLogs();
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Failed to update user ban status.');
    } finally {
      setIsProcessingBan(false);
    }
  };

  // Stats calculation
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    moderators: users.filter(u => u.role === 'moderator').length,
    staff: users.filter(u => u.role === 'staff').length,
    special: users.filter(u => u.role === 'special').length,
    banned: users.filter(u => u.isBanned).length
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.username?.toLowerCase().includes(search.toLowerCase())) ||
      (u.displayName?.toLowerCase().includes(search.toLowerCase())) ||
      (u.email?.toLowerCase().includes(search.toLowerCase())) ||
      (u.uid.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (roleFilter === 'all') return true;
    if (roleFilter === 'banned') return u.isBanned === true;
    return u.role === roleFilter;
  });

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Shield className="w-3.5 h-3.5 text-sky-400" /> Moderator
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
            <Star className="w-3.5 h-3.5 text-yellow-400" /> Staff
          </span>
        );
      case 'special':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Special
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/70 border border-white/10">
            <UserIcon className="w-3.5 h-3.5 text-white/50" /> User
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-16">
      
      {/* Top Banner & Authority Level */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-yoru-surface via-[#12141D] to-yoru-surface border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yoru-accent/10 border border-yoru-accent/30 text-yoru-accent">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                Community & Role Management
              </h1>
              <p className="text-xs sm:text-sm text-yoru-text-muted mt-0.5">
                Manage user permissions, assign hierarchy roles, and audit role modifications.
              </p>
            </div>
          </div>
        </div>

        {/* Current User Role Scope Display */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-3 rounded-xl self-start lg:self-auto">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-yoru-text-muted">Your Authority</div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 justify-end mt-0.5">
              {actorIsSuperAdmin ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">Super Admin (Simoon)</span>
                </>
              ) : actorRole === 'admin' ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-white">Administrator</span>
                </>
              ) : actorRole === 'moderator' ? (
                <>
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span className="text-sky-400">Moderator</span>
                </>
              ) : (
                <span className="text-white/60">Member</span>
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-[11px] text-white/70 max-w-[200px] leading-tight">
            {actorIsSuperAdmin
              ? 'Unrestricted: Can assign Admin, Mod, Staff, Special, User'
              : actorRole === 'admin'
              ? 'Can assign: Moderator, Staff, Special, User'
              : actorRole === 'moderator'
              ? 'Can assign: Staff, Special, User'
              : 'View only'}
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
          feedbackMessage.type === 'success' 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        )}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-yoru-surface border border-white/5 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted">Total Members</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-yoru-surface border border-amber-500/15 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Admins
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.admins}</div>
        </div>
        <div className="bg-yoru-surface border border-sky-500/15 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Moderators
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1">{stats.moderators}</div>
        </div>
        <div className="bg-yoru-surface border border-yellow-500/15 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1">
            <Star className="w-3 h-3" /> Staff
          </div>
          <div className="text-2xl font-black text-yellow-400 mt-1">{stats.staff}</div>
        </div>
        <div className="bg-yoru-surface border border-rose-500/15 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Special
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">{stats.special}</div>
        </div>
        <div className="bg-yoru-surface border border-red-500/15 p-4 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
            <UserX className="w-3 h-3" /> Banned
          </div>
          <div className="text-2xl font-black text-red-400 mt-1">{stats.banned}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all",
              activeTab === 'members'
                ? "bg-yoru-accent text-black shadow-lg shadow-yoru-accent/20"
                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Members & Roles ({users.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              loadLogs();
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all",
              activeTab === 'audit'
                ? "bg-yoru-accent text-black shadow-lg shadow-yoru-accent/20"
                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <History className="w-4 h-4" />
            <span>Role Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        <button
          onClick={() => {
            loadUsers();
            loadLogs();
          }}
          disabled={loading || loadingLogs}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-yoru-text-muted hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", (loading || loadingLogs) && "animate-spin text-yoru-accent")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS DIRECTORY & ROLE MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search by username, name, email, or UID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-yoru-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yoru-accent transition-colors"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase text-yoru-text-muted mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { key: 'all', label: 'All' },
                { key: 'admin', label: 'Admin' },
                { key: 'moderator', label: 'Mod' },
                { key: 'staff', label: 'Staff' },
                { key: 'special', label: 'Special' },
                { key: 'user', label: 'User' },
                { key: 'banned', label: 'Banned' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    roleFilter === f.key
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-transparent"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-yoru-surface border border-white/5 rounded-2xl">
              <Loader2 className="w-8 h-8 text-yoru-accent animate-spin mb-3" />
              <div className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Loading Members Directory...</div>
            </div>
          ) : (
            <div className="bg-yoru-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-black/40 border-b border-white/10">
                    <tr>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted">Member</th>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted">Email</th>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted">Current Role</th>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted">Stats</th>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted">Status</th>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted">Assign Role</th>
                      <th className="px-5 py-4 font-bold uppercase tracking-wider text-[10px] text-yoru-text-muted text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => {
                      const canManageThisUser = canActorManageTarget(actorRole, actorEmail, u.role, u.email);
                      const isTargetSuperAdmin = isSuperAdmin(u.email);
                      const isSelf = user?.uid === u.uid;

                      return (
                        <tr key={u.uid} className={clsx("hover:bg-white/[0.02] transition-colors", u.isBanned && "bg-rose-500/[0.03]")}>
                          
                          {/* Member Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Link 
                                to={`/user/${u.username || u.uid}`}
                                className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-black/60 shrink-0 hover:border-yoru-accent transition-colors"
                              >
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-5 h-5 m-2.5 text-white/30" />
                                )}
                              </Link>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Link 
                                    to={`/user/${u.username || u.uid}`}
                                    className="font-bold text-white hover:text-yoru-accent transition-colors truncate max-w-[140px] sm:max-w-[180px]"
                                  >
                                    {u.displayName || u.username || 'Anonymous'}
                                  </Link>
                                  {isTargetSuperAdmin && (
                                    <span title="Super Admin (Simoon)" className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1 rounded font-bold">
                                      OWNER
                                    </span>
                                  )}
                                  {isSelf && (
                                    <span className="text-[9px] bg-white/10 text-white/70 px-1 rounded font-bold">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-yoru-text-muted flex items-center gap-1.5 mt-0.5">
                                  <span>@{u.username || 'no_handle'}</span>
                                  <span>•</span>
                                  <button
                                    onClick={() => handleCopyUid(u.uid)}
                                    className="text-[10px] text-white/40 hover:text-white inline-flex items-center gap-0.5"
                                    title="Copy User ID"
                                  >
                                    {copiedUid === u.uid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    <span className="font-mono">{u.uid.slice(0, 5)}...</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4">
                            <span className="text-xs text-white/60 font-mono select-all">
                              {u.email || 'No email registered'}
                            </span>
                          </td>

                          {/* Current Role */}
                          <td className="px-5 py-4">
                            {getRoleBadge(u.role)}
                          </td>

                          {/* Stats */}
                          <td className="px-5 py-4 text-xs text-yoru-text-muted space-y-0.5 whitespace-nowrap">
                            <div>Watched: <span className="font-bold text-white">{u.watchCount || 0}</span> eps</div>
                            <div>Posts: <span className="font-bold text-white">{u.postCount || 0}</span></div>
                            <div>Comments: <span className="font-bold text-white">{u.commentCount || 0}</span></div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {u.isBanned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <UserX className="w-3 h-3" /> Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <UserCheck className="w-3 h-3" /> Active
                              </span>
                            )}
                          </td>

                          {/* Assign Role Dropdown */}
                          <td className="px-5 py-4">
                            {canManageThisUser ? (
                              <div className="relative inline-block w-40">
                                <select
                                  value={u.role || 'user'}
                                  onChange={(e) => promptRoleChange(u, e.target.value as UserRole)}
                                  className="w-full bg-black/60 border border-white/15 hover:border-yoru-accent/50 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-yoru-accent transition-colors cursor-pointer"
                                >
                                  {allowedRoles.map(r => (
                                    <option key={r} value={r} className="bg-[#12141D] text-white">
                                      {ROLE_LABELS[r]}
                                    </option>
                                  ))}
                                  {/* If target has a role not in allowedRoles (e.g. self view), include it so select doesn't break */}
                                  {!allowedRoles.includes(u.role || 'user') && (
                                    <option value={u.role || 'user'} disabled className="bg-[#12141D] text-white/50">
                                      {ROLE_LABELS[u.role || 'user']} (Current)
                                    </option>
                                  )}
                                </select>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold" title="You do not have sufficient hierarchy permissions to alter this user's role">
                                <Lock className="w-3.5 h-3.5" />
                                <span>{isTargetSuperAdmin ? 'Protected Owner' : 'Higher Rank'}</span>
                              </div>
                            )}
                          </td>

                          {/* Moderation Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {canManageThisUser && !isSelf && (
                                <button
                                  onClick={() => promptBanToggle(u, !u.isBanned)}
                                  className={clsx(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors",
                                    u.isBanned
                                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                                      : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
                                  )}
                                >
                                  {u.isBanned ? 'Unban' : 'Ban User'}
                                </button>
                              )}

                              <Link
                                to={`/user/${u.username || u.uid}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                title="View Public Profile"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>

                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-yoru-text-muted">
                          <Users className="w-10 h-10 mx-auto text-white/20 mb-2" />
                          <div className="font-bold text-sm text-white/70">No members found matching your search.</div>
                          <div className="text-xs mt-1">Try clearing filters or checking spelling.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: ROLE AUDIT LOGS (HISTORY) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-yoru-surface border border-white/10 rounded-2xl p-5">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <History className="w-5 h-5 text-yoru-accent" /> Role Modification History
              </h2>
              <p className="text-xs text-yoru-text-muted mt-0.5">
                Full chronological audit trail documenting who changed whose role and when.
              </p>
            </div>

            <div className="text-xs text-yoru-text-muted">
              Displaying <span className="font-bold text-white">{auditLogs.length}</span> recorded administrative actions
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center py-20 bg-yoru-surface border border-white/5 rounded-2xl">
              <Loader2 className="w-8 h-8 text-yoru-accent animate-spin mb-3" />
              <div className="text-xs font-bold uppercase tracking-widest text-yoru-text-muted">Fetching Audit Logs...</div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="bg-yoru-surface border border-white/5 rounded-2xl py-16 text-center text-yoru-text-muted">
              <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <div className="font-bold text-white text-base">No Audit Logs Recorded Yet</div>
              <p className="text-xs text-yoru-text-muted max-w-sm mx-auto mt-1">
                Whenever a role is updated or a user status changes, it will be permanently recorded and displayed here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => {
                const isRoleChange = log.action === 'ROLE_CHANGE';

                return (
                  <div
                    key={log.id}
                    className="bg-yoru-surface border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 transition-colors shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Actor Details */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/60 border border-white/20 shrink-0">
                        {log.performedByPhotoURL ? (
                          <img src={log.performedByPhotoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Shield className="w-5 h-5 m-2.5 text-yoru-accent" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-yoru-text-muted font-bold uppercase tracking-wider">
                          Admin Actor
                        </div>
                        <div className="font-black text-sm text-white flex items-center gap-1.5">
                          <span>{log.performedByName || log.performedByEmail || 'Admin'}</span>
                          {isSuperAdmin(log.performedByEmail) && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1 rounded font-bold">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/50 font-mono">{log.performedByEmail}</div>
                      </div>
                    </div>

                    {/* Action & Transition Details */}
                    <div className="bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl flex items-center justify-center gap-3 self-stretch md:self-auto">
                      {isRoleChange ? (
                        <>
                          <div className="text-right">
                            <div className="text-[9px] font-bold uppercase text-yoru-text-muted">Previous</div>
                            <div className="text-xs font-bold text-white/70 line-through">
                              {ROLE_LABELS[(log.oldRole as UserRole) || 'user'] || log.oldRole}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-yoru-accent shrink-0" />

                          <div>
                            <div className="text-[9px] font-bold uppercase text-yoru-accent">New Role</div>
                            <div className="text-xs font-black text-white">
                              {getRoleBadge(log.newRole as UserRole)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Status Change:</span>
                          {log.isBanned ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              BANNED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              UNBANNED
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Target User & Timestamp */}
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <div className="text-[9px] font-bold uppercase text-yoru-text-muted">Target User</div>
                        <Link 
                          to={`/user/${log.targetUserName || log.targetUserId}`}
                          className="text-xs font-bold text-white hover:text-yoru-accent transition-colors"
                        >
                          {log.targetUserName || log.targetUserEmail || 'User'}
                        </Link>
                        <div className="text-[10px] text-white/40 font-mono truncate max-w-[160px]">
                          {log.targetUserEmail || log.targetUserId}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-yoru-accent">
                          {formatDistanceToNow(log.timestamp)} ago
                        </div>
                        <div className="text-[10px] text-white/40">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {roleModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D0F17] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">Confirm Role Assignment</h3>
                <p className="text-xs text-yoru-text-muted">This change will be permanently recorded in the audit log.</p>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="text-xs text-yoru-text-muted">
                Target User: <span className="font-bold text-white">{roleModalTarget.user.displayName || roleModalTarget.user.username || 'User'}</span> ({roleModalTarget.user.email})
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="text-center flex-1">
                  <div className="text-[9px] uppercase font-bold text-yoru-text-muted">Current Role</div>
                  <div className="mt-1">{getRoleBadge(roleModalTarget.user.role)}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-yoru-accent shrink-0" />
                <div className="text-center flex-1">
                  <div className="text-[9px] uppercase font-bold text-yoru-accent">Target Role</div>
                  <div className="mt-1">{getRoleBadge(roleModalTarget.newRole)}</div>
                </div>
              </div>
            </div>

            {roleModalTarget.newRole === 'admin' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>Assigning Administrator privileges grants wide access across the anime database and moderation system.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalTarget(null)}
                disabled={isProcessingRole}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-yoru-text-muted hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRoleChange}
                disabled={isProcessingRole}
                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-yoru-accent text-black hover:bg-yoru-accent/90 transition-all flex items-center gap-2"
              >
                {isProcessingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Apply Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BAN TOGGLE CONFIRMATION MODAL */}
      {banModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D0F17] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-white">
              <div className={clsx(
                "p-2.5 rounded-xl border",
                banModalTarget.newStatus 
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              )}>
                {banModalTarget.newStatus ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  {banModalTarget.newStatus ? 'Confirm Account Suspension' : 'Confirm Account Unban'}
                </h3>
                <p className="text-xs text-yoru-text-muted">Target User: {banModalTarget.user.username || banModalTarget.user.displayName}</p>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/10">
              {banModalTarget.newStatus 
                ? 'Banning this user will immediately restrict them from posting community messages, submitting comments, and reacting to content.'
                : 'Unbanning this user will restore their community permissions according to their assigned role.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBanModalTarget(null)}
                disabled={isProcessingBan}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-yoru-text-muted hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmBanToggle}
                disabled={isProcessingBan}
                className={clsx(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2",
                  banModalTarget.newStatus 
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-emerald-500 text-black hover:bg-emerald-400 font-black"
                )}
              >
                {isProcessingBan ? <Loader2 className="w-4 h-4 animate-spin" /> : (banModalTarget.newStatus ? 'Confirm Ban' : 'Confirm Unban')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
