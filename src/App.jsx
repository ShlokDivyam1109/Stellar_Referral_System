/**
 * App.jsx — Stellar Referral System Frontend
 *
 * Panels:
 *  1. Wallet Connection
 *  2. Register Referral
 *  3. Claim Reward
 *  4. View Referral by ID
 *  5. View My Balance
 *  6. View Global Stats
 */

import React, { useState } from "react";
import { useWallet } from "./useWallet.js";
import {
  registerReferral,
  claimReward,
  viewReferral,
  viewBalance,
  viewStats,
} from "./contractClient.js";
import { CONTRACT_ID } from "./constants.js";

// ─── tiny shared components ───────────────────────────────────────────────────

function StatusBox({ status }) {
  if (!status) return null;
  const isErr = status.type === "error";
  return (
    <div
      style={{
        marginTop: 10,
        padding: "8px 12px",
        background: isErr ? "#ffeaea" : "#eafff0",
        border: `1px solid ${isErr ? "#f88" : "#6c6"}`,
        borderRadius: 4,
        fontSize: 13,
        wordBreak: "break-all",
        color: isErr ? "#900" : "#050",
      }}
    >
      {isErr ? "❌ " : "✅ "}
      {status.msg}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: 20,
        marginBottom: 20,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 16, color: "#222" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, disabled }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "#444" }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "7px 10px",
          fontSize: 13,
          border: "1px solid #bbb",
          borderRadius: 4,
          boxSizing: "border-box",
          background: disabled ? "#f5f5f5" : "#fff",
        }}
      />
    </div>
  );
}

function Btn({ onClick, disabled, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        marginTop: 4,
        padding: "8px 18px",
        fontSize: 13,
        background: disabled || loading ? "#aaa" : "#1a73e8",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Processing…" : children}
    </button>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: "#555", fontWeight: 600 }}>{k}: </span>
      <span style={{ wordBreak: "break-all" }}>{String(v)}</span>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { address, connected, connecting, error: walletError, connect, disconnect } =
    useWallet();

  // ── Register Referral ──
  const [regReferrer, setRegReferrer] = useState("");
  const [regStatus, setRegStatus] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  async function handleRegister() {
    setRegStatus(null);
    setRegLoading(true);
    try {
      const referrerAddr = regReferrer.trim() || address;
      const result = await registerReferral(referrerAddr, address);
      const idDisplay = result.referralId ? `#${result.referralId}` : "(check tx)";
      setRegStatus({
        type: "ok",
        msg: `Referral registered! ID: ${idDisplay} | Tx: ${result.hash}`,
      });
    } catch (e) {
      setRegStatus({ type: "error", msg: e.message });
    } finally {
      setRegLoading(false);
    }
  }  // ── Claim Reward ──
  const [claimId, setClaimId] = useState("");
  const [claimStatus, setClaimStatus] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);

  async function handleClaim() {
    setClaimStatus(null);
    setClaimLoading(true);
    try {
        const result = await claimReward(claimId, address);
        setClaimStatus({ type: "ok", msg: `Reward claimed! Tx hash: ${result.hash}` });
    } catch (e) {
        setClaimStatus({ type: "error", msg: e.message });
    } finally {
        setClaimLoading(false);
    }
  }

  // ── View Referral ──
  const [viewId, setViewId] = useState("");
  const [viewResult, setViewResult] = useState(null);
  const [viewStatus, setViewStatus] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function handleViewReferral() {
    setViewStatus(null);
    setViewResult(null);
    setViewLoading(true);
    try {
      const data = await viewReferral(viewId, address);
      if (!data || data.referral_id === 0n || data.referral_id === 0) {
        setViewStatus({ type: "error", msg: "Referral not found." });
      } else {
        setViewResult(data);
      }
    } catch (e) {
      setViewStatus({ type: "error", msg: e.message });
    } finally {
      setViewLoading(false);
    }
  }

  // ── View Balance ──
  const [balAddr, setBalAddr] = useState("");
  const [balResult, setBalResult] = useState(null);
  const [balStatus, setBalStatus] = useState(null);
  const [balLoading, setBalLoading] = useState(false);

  async function handleViewBalance() {
    setBalStatus(null);
    setBalResult(null);
    setBalLoading(true);
    try {
      const addr = balAddr.trim() || address;
      const pts = await viewBalance(addr, address);
      setBalResult({ address: addr, points: pts });
    } catch (e) {
      setBalStatus({ type: "error", msg: e.message });
    } finally {
      setBalLoading(false);
    }
  }

  // ── View Stats ──
  const [statsResult, setStatsResult] = useState(null);
  const [statsStatus, setStatsStatus] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  async function handleViewStats() {
    setStatsStatus(null);
    setStatsResult(null);
    setStatsLoading(true);
    try {
      const data = await viewStats(address);
      setStatsResult(data);
    } catch (e) {
      setStatsStatus({ type: "error", msg: e.message });
    } finally {
      setStatsLoading(false);
    }
  }

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6fa",
        fontFamily: "monospace",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, margin: 0, color: "#111" }}>
            🌟 Stellar Referral System
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
            Contract:{" "}
            <span style={{ color: "#1a73e8" }}>{CONTRACT_ID}</span>
          </p>
        </div>

        {/* ── 1. Wallet ── */}
        <Card title="1. Wallet Connection">
          {!connected ? (
            <>
              <Btn onClick={connect} loading={connecting}>
                Connect Freighter Wallet
              </Btn>
              {walletError && (
                <StatusBox status={{ type: "error", msg: walletError }} />
              )}
              <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
                Make sure the{" "}
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Freighter
                </a>{" "}
                extension is installed and set to <strong>Testnet</strong>.
              </p>
            </>
          ) : (
            <div>
              <KV k="Connected Address" v={address} />
              <Btn onClick={disconnect} style={{ marginTop: 8 }}>
                Disconnect
              </Btn>
            </div>
          )}
        </Card>

        {/* ── 2. Register Referral ── */}
        <Card title="2. Register Referral">
          <p style={{ fontSize: 12, color: "#666", marginTop: 0 }}>
            You (the referred user) joined via someone's referral. Paste the
            referrer's address below and submit.
          </p>
          <Input
            label="Referrer Address (who referred you)"
            value={regReferrer}
            onChange={setRegReferrer}
            placeholder="GABC... (leave blank to use your own for testing)"
            disabled={!connected}
          />
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            Referred (you): <strong>{address || "—"}</strong>
          </div>
          <Btn
            onClick={handleRegister}
            disabled={!connected || !regReferrer.trim()}
            loading={regLoading}
          >
            Register Referral
          </Btn>
          <StatusBox status={regStatus} />
        </Card>

        {/* ── 3. Claim Reward ── */}
        <Card title="3. Claim Reward">
          <p style={{ fontSize: 12, color: "#666", marginTop: 0 }}>
            Enter the referral ID you received when you registered a referral.
            You must be the referrer to claim.
          </p>
          <Input
            label="Referral ID"
            value={claimId}
            onChange={setClaimId}
            placeholder="e.g. 1"
            disabled={!connected}
          />
          <Btn
            onClick={handleClaim}
            disabled={!connected || !claimId.trim()}
            loading={claimLoading}
          >
            Claim Reward
          </Btn>
          <StatusBox status={claimStatus} />
        </Card>

        {/* ── 4. View Referral ── */}
        <Card title="4. View Referral by ID (Read-only)">
          <Input
            label="Referral ID"
            value={viewId}
            onChange={setViewId}
            placeholder="e.g. 1"
          />
          <Btn
            onClick={handleViewReferral}
            disabled={!viewId.trim()}
            loading={viewLoading}
          >
            Fetch Referral
          </Btn>
          <StatusBox status={viewStatus} />
          {viewResult && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            >
              <KV k="Referral ID" v={String(viewResult.referral_id)} />
              <KV k="Referrer" v={viewResult.referrer} />
              <KV k="Referred" v={viewResult.referred} />
              <KV k="Reward Points" v={String(viewResult.reward_points)} />
              <KV k="Timestamp" v={new Date(Number(viewResult.timestamp) * 1000).toLocaleString()} />
              <KV k="Is Rewarded" v={viewResult.is_rewarded ? "Yes" : "No"} />
            </div>
          )}
        </Card>

        {/* ── 5. View Balance ── */}
        <Card title="5. View Reward Balance (Read-only)">
          <Input
            label="Wallet Address (blank = your connected wallet)"
            value={balAddr}
            onChange={setBalAddr}
            placeholder="GABC... (optional)"
          />
          <Btn
            onClick={handleViewBalance}
            disabled={!connected && !balAddr.trim()}
            loading={balLoading}
          >
            Check Balance
          </Btn>
          <StatusBox status={balStatus} />
          {balResult && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            >
              <KV k="Address" v={balResult.address} />
              <KV k="Reward Points" v={String(balResult.points)} />
            </div>
          )}
        </Card>

        {/* ── 6. Global Stats ── */}
        <Card title="6. Global Referral Stats (Read-only)">
          <Btn onClick={handleViewStats} loading={statsLoading}>
            Fetch Stats
          </Btn>
          <StatusBox status={statsStatus} />
          {statsResult && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            >
              <KV k="Total Referrals" v={String(statsResult.total_referrals)} />
              <KV k="Total Referred Users" v={String(statsResult.total_referred)} />
              <KV k="Total Rewards Distributed" v={String(statsResult.total_rewards)} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}