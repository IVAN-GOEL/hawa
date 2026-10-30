import React, { useState, useEffect } from 'react';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { Market, Proposal, AuditLog, Prediction } from '../types';
import { calculateMarketPayouts } from '../utils/payout';
import { formatISTTime } from '../utils/referral';
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  AlertCircle,
  Eye,
  Edit2,
  X,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { currentUser, switchRole, refreshMarkets } = useHawaStore();

  const [activeTab, setActiveTab] = useState<
    'proposals' | 'live' | 'resolve' | 'reports' | 'stats' | 'audit'
  >('proposals');

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Proposal modal states
  const [selectedProp, setSelectedProp] = useState<Proposal | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editClosing, setEditClosing] = useState('');
  const [editSource, setEditSource] = useState('');

  // Resolution modal state
  const [resolveMarketData, setResolveMarketData] = useState<Market | null>(null);
  const [selectedWinningOptionId, setSelectedWinningOptionId] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [payoutPreview, setPayoutPreview] = useState<any>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const loadData = async () => {
    const props = await api.getProposals();
    const mkts = await api.getMarkets();
    const logs = await api.getAuditLogs();
    const st = await api.getStats();
    setProposals(props);
    setMarkets(mkts);
    setAuditLogs(logs);
    setStats(st);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-baby-pink flex items-center justify-center mx-auto text-black-cherry">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-black-cherry">
          Admin Access Required
        </h2>
        <p className="text-xs text-black-cherry/70">
          This panel is for campus moderators. You can switch your role to Admin in one click below for demonstration.
        </p>
        <button
          onClick={() => switchRole('admin')}
          className="px-5 py-2.5 rounded-pill bg-petrol text-linen font-bold text-xs hover:bg-petrol/90 transition-all shadow-subtle"
        >
          Switch to Admin Role
        </button>
      </div>
    );
  }

  // --- Handlers ---

  const handleApproveProposal = async (prop: Proposal) => {
    await api.approveProposal(prop.id, {
      title: editTitle || prop.title,
      closingTime: editClosing || prop.closingTime,
      resolutionSource: editSource || prop.resolutionSource,
    });
    setSelectedProp(null);
    await refreshMarkets();
    await loadData();
  };

  const handleRejectProposal = async () => {
    if (!selectedProp || !rejectReason.trim()) return;
    await api.rejectProposal(selectedProp.id, rejectReason.trim());
    setShowRejectModal(false);
    setSelectedProp(null);
    setRejectReason('');
    await loadData();
  };

  const handleCloseEarly = async (marketId: string) => {
    if (window.confirm('Close this market early now? No more predictions will be accepted.')) {
      await api.closeMarketEarly(marketId);
      await refreshMarkets();
      await loadData();
    }
  };

  const handleCancelMarket = async (marketId: string) => {
    const reason = window.prompt('Reason for cancelling this market (all stakes will be refunded):');
    if (reason !== null) {
      await api.cancelMarket(marketId, reason);
      await refreshMarkets();
      await loadData();
    }
  };

  const openResolutionModal = async (m: Market) => {
    setResolveMarketData(m);
    setSelectedWinningOptionId(m.options[0]?.id || '');
    setResolutionNote('');

    // Compute payout preview
    const preds = await api.getPredictions(m.id);
    const preview = calculateMarketPayouts(m, preds, m.options[0]?.id, false);
    setPayoutPreview({ preview, count: preds.length });
    setShowResolveModal(true);
  };

  const handleWinningOptionChange = async (optionId: string) => {
    setSelectedWinningOptionId(optionId);
    if (resolveMarketData) {
      const preds = await api.getPredictions(resolveMarketData.id);
      const preview = calculateMarketPayouts(resolveMarketData, preds, optionId, false);
      setPayoutPreview({ preview, count: preds.length });
    }
  };

  const confirmResolution = async () => {
    if (!resolveMarketData || !selectedWinningOptionId) return;
    await api.resolveMarket(
      resolveMarketData.id,
      selectedWinningOptionId,
      resolutionNote.trim() || 'Market resolved according to verified campus outcome.'
    );
    setShowResolveModal(false);
    setResolveMarketData(null);
    await refreshMarkets();
    await loadData();
  };

  // Pending proposals list
  const pendingProps = proposals.filter((p) => p.status === 'pending');
  // Live markets
  const liveMarkets = markets.filter((m) => m.status === 'open');
  // Markets past closing that need resolution
  const toResolveMarkets = markets.filter(
    (m) =>
      m.status !== 'resolved' &&
      m.status !== 'cancelled' &&
      new Date(m.closingTime).getTime() <= Date.now()
  );
  // Reported markets
  const reportedMarkets = markets.filter((m) => (m.reportsCount || 0) > 0);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-linen-deep">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-petrol text-linen rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-black-cherry">
              Campus Admin & Moderation
            </h1>
            <p className="text-xs text-black-cherry/60">
              Logged in as {currentUser.displayName} &bull; Parimutuel resolution controls
            </p>
          </div>
        </div>

        <button
          onClick={() => switchRole('student')}
          className="text-xs px-3 py-1.5 rounded-pill bg-linen-deep text-black-cherry font-semibold hover:bg-linen-deep/80"
        >
          Exit to Student View
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-linen-deep/60">
        {[
          { id: 'proposals', label: `Pending (${pendingProps.length})` },
          { id: 'live', label: `Live Markets (${liveMarkets.length})` },
          { id: 'resolve', label: `To Resolve (${toResolveMarkets.length})` },
          { id: 'reports', label: `Reports (${reportedMarkets.length})` },
          { id: 'stats', label: 'Stats' },
          { id: 'audit', label: 'Audit Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-petrol text-linen shadow-sm'
                : 'bg-linen-deep/50 text-black-cherry/75 hover:bg-linen-deep'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Pending Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {pendingProps.length > 0 ? (
            pendingProps.map((prop) => (
              <div
                key={prop.id}
                className="bg-linen border border-linen-deep rounded-card p-5 shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-black-cherry/60 uppercase">
                    {prop.category} &bull; By {prop.creatorName} ({prop.creatorHostel})
                  </span>
                  <span className="text-[11px] text-black-cherry/50">
                    Proposed {formatISTTime(prop.createdAt)}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-black-cherry">
                  {prop.title}
                </h3>
                {prop.description && (
                  <p className="text-xs text-black-cherry/80">{prop.description}</p>
                )}

                <div className="text-xs bg-linen-deep/40 p-2.5 rounded-lg space-y-1">
                  <div>
                    <strong>Resolution Source:</strong> {prop.resolutionSource}
                  </div>
                  <div>
                    <strong>Close Time:</strong> {formatISTTime(prop.closingTime)}
                  </div>
                  <div>
                    <strong>Options:</strong> {prop.options.join(', ')}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApproveProposal(prop)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-petrol text-linen text-xs font-bold rounded-pill hover:bg-petrol/90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Launch</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProp(prop);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-black-cherry/10 text-black-cherry text-xs font-bold rounded-pill hover:bg-black-cherry/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-linen-deep/20 rounded-card border border-dashed border-linen-deep text-xs text-black-cherry/60">
              No proposals pending review.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Markets Management */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {liveMarkets.map((m) => (
            <div
              key={m.id}
              className="bg-linen border border-linen-deep rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-linen-deep uppercase">
                    {m.category}
                  </span>
                  <span className="text-xs text-black-cherry/60">
                    Closes {formatISTTime(m.closingTime)}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-black-cherry line-clamp-1">
                  {m.title}
                </h4>
                <div className="text-xs text-black-cherry/60">
                  Pool: {m.totalPool} coins &bull; User stakes: {m.totalUserPool} coins
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCloseEarly(m.id)}
                  className="px-3 py-1.5 rounded-pill bg-linen-deep hover:bg-linen-deep/80 text-black-cherry text-xs font-semibold"
                >
                  Close Early
                </button>
                <button
                  onClick={() => handleCancelMarket(m.id)}
                  className="px-3 py-1.5 rounded-pill bg-black-cherry/10 hover:bg-black-cherry/20 text-black-cherry text-xs font-semibold"
                >
                  Cancel & Refund
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Markets to Resolve */}
      {activeTab === 'resolve' && (
        <div className="space-y-4">
          {toResolveMarkets.length > 0 ? (
            toResolveMarkets.map((m) => (
              <div
                key={m.id}
                className="bg-linen border-2 border-tangerine/50 rounded-card p-5 shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-pill bg-tangerine/20 text-black-cherry font-bold text-[10px] uppercase">
                    Past Closing &bull; Ready for Resolution
                  </span>
                  <span className="text-[11px] text-black-cherry/60">
                    Closed {formatISTTime(m.closingTime)}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-black-cherry">
                  {m.title}
                </h3>

                <div className="text-xs bg-linen-deep/30 p-3 rounded-lg space-y-1">
                  <div>
                    <strong>Resolution Source:</strong> {m.resolutionSource}
                  </div>
                  <div>
                    <strong>Options:</strong>
                    {m.options.map((o) => ` ${o.label} (${o.userPool} user coins)`).join(' | ')}
                  </div>
                </div>

                <button
                  onClick={() => openResolutionModal(m)}
                  className="px-5 py-2.5 bg-tangerine text-black-cherry font-display font-black text-xs rounded-pill hover:brightness-105 transition-all shadow-subtle"
                >
                  Resolve & Settle Payouts
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-linen-deep/20 rounded-card border border-dashed border-linen-deep text-xs text-black-cherry/60">
              No closed markets currently waiting for resolution.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reportedMarkets.length > 0 ? (
            reportedMarkets.map((m) => (
              <div
                key={m.id}
                className="bg-linen border border-black-cherry/30 rounded-card p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-black-cherry font-bold">
                    <AlertTriangle className="w-4 h-4 text-black-cherry" />
                    <span>{m.reportsCount} User Reports</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-black-cherry mt-1">
                    {m.title}
                  </h4>
                </div>
                <button
                  onClick={() => handleCancelMarket(m.id)}
                  className="px-3 py-1.5 rounded-pill bg-black-cherry text-linen text-xs font-bold"
                >
                  Remove & Refund
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-linen-deep/20 rounded-card border border-dashed border-linen-deep text-xs text-black-cherry/60">
              Zero community reports. Campus feed is clean.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Stats */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-linen border border-linen-deep rounded-card p-4">
            <span className="text-xs text-black-cherry/60 font-semibold">Total Students</span>
            <div className="font-display font-black text-2xl text-black-cherry mt-1">
              {stats.totalUsers}
            </div>
          </div>
          <div className="bg-linen border border-linen-deep rounded-card p-4">
            <span className="text-xs text-black-cherry/60 font-semibold">Active Markets</span>
            <div className="font-display font-black text-2xl text-petrol mt-1">
              {stats.activeMarkets}
            </div>
          </div>
          <div className="bg-linen border border-linen-deep rounded-card p-4">
            <span className="text-xs text-black-cherry/60 font-semibold">Coins in Play</span>
            <div className="font-display font-black text-2xl text-petrol mt-1">
              {stats.coinsInPlay}
            </div>
          </div>
          <div className="bg-linen border border-linen-deep rounded-card p-4">
            <span className="text-xs text-black-cherry/60 font-semibold">Top Category</span>
            <div className="font-display font-black text-2xl text-cool-blue mt-1">
              {stats.mostActiveCategory}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-linen border border-linen-deep rounded-card p-5 shadow-subtle space-y-3">
          <h3 className="font-display font-bold text-sm text-black-cherry">
            Tamper-Evident Moderator Audit Log
          </h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-linen-deep/30 rounded-lg text-xs space-y-1 border border-linen-deep/40"
              >
                <div className="flex items-center justify-between text-black-cherry/60">
                  <span className="font-bold text-petrol uppercase tracking-wider text-[10px]">
                    {log.action.replace('_', ' ')} &bull; By {log.adminName}
                  </span>
                  <span className="text-[10px]">{formatISTTime(log.timestamp)}</span>
                </div>
                <p className="text-black-cherry/85">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-cherry/40 backdrop-blur-sm">
          <div className="bg-linen border border-linen-deep rounded-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-display font-bold text-base text-black-cherry">
              Reject Proposal
            </h3>
            <p className="text-xs text-black-cherry/70">
              Provide a clear reason for rejecting "{selectedProp.title}". The student will see this note.
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Violates guidelines regarding private student grades / Duplicate market already live..."
              className="w-full px-3 py-2 bg-linen border border-linen-deep rounded-input text-xs text-black-cherry focus:ring-2 focus:ring-petrol"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 rounded-pill bg-linen-deep text-black-cherry text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProposal}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2 rounded-pill bg-black-cherry text-linen text-xs font-bold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {showResolveModal && resolveMarketData && payoutPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-cherry/50 backdrop-blur-sm">
          <div className="bg-linen border border-linen-deep rounded-card p-6 max-w-lg w-full space-y-4 shadow-float">
            <div className="flex items-center justify-between pb-2 border-b border-linen-deep">
              <h3 className="font-display font-bold text-base text-black-cherry">
                Confirm Market Resolution
              </h3>
              <button onClick={() => setShowResolveModal(false)}>
                <X className="w-5 h-5 text-black-cherry/60" />
              </button>
            </div>

            <p className="font-semibold text-sm text-black-cherry">
              {resolveMarketData.title}
            </p>

            <div>
              <label className="block text-xs font-bold text-black-cherry mb-1.5">
                Select Winning Outcome *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {resolveMarketData.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleWinningOptionChange(opt.id)}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedWinningOptionId === opt.id
                        ? 'bg-petrol text-linen border-petrol ring-2 ring-petrol'
                        : 'bg-linen-deep/40 text-black-cherry border-linen-deep'
                    }`}
                  >
                    {opt.label} ({opt.userPool} user coins)
                  </button>
                ))}
              </div>
            </div>

            {/* Payout distribution preview */}
            <div className="p-3 bg-linen-deep/40 rounded-lg text-xs space-y-1.5 border border-linen-deep">
              <div className="font-bold text-black-cherry">
                Parimutuel Settlement Distribution Preview:
              </div>
              <div className="flex justify-between text-black-cherry/75">
                <span>Total User Pool:</span>
                <span className="font-bold">{resolveMarketData.totalUserPool} coins</span>
              </div>
              <div className="flex justify-between text-black-cherry/75">
                <span>Total Coins to Disburse:</span>
                <span className="font-bold text-petrol">
                  {payoutPreview.preview.totalPaidOut} coins
                </span>
              </div>
              <div className="flex justify-between text-black-cherry/75">
                <span>Predictions Settled:</span>
                <span>{payoutPreview.count} calls</span>
              </div>
              {payoutPreview.preview.isRefund && (
                <div className="text-[11px] text-black-cherry font-bold">
                  Note: Winning option had zero user predictions. 100% stakes will be refunded!
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-black-cherry mb-1">
                Resolution Note (Shown to participants)
              </label>
              <input
                type="text"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Hostel A won 2-1 as per match referee scoresheet."
                className="w-full px-3 py-2 bg-linen border border-linen-deep rounded-input text-xs text-black-cherry focus:ring-2 focus:ring-petrol"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="flex-1 py-2.5 rounded-pill bg-linen-deep text-black-cherry text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResolution}
                className="flex-1 py-2.5 rounded-pill bg-tangerine text-black-cherry font-display font-bold text-xs hover:brightness-105 shadow-subtle"
              >
                Confirm & Disburse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
