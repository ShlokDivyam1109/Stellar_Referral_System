# Referral System Smart Contract

---

## Table of Contents

- [Project Title](#project-title)
- [Project Description](#project-description)
- [Project Vision](#project-vision)
- [Key Features](#key-features)
- [Future Scope](#future-scope)
- [Contract Functions](#contract-functions)
- [Data Structures](#data-structures)

---

## Project Title

**Referral System** — A decentralized on-chain referral and reward management smart contract built on the **Stellar blockchain** using the **Soroban SDK**.

---

## Project Description

The Referral System is a blockchain-based smart contract that enables decentralized tracking and rewarding of user referrals. When an existing user refers a new user to a platform, the referral is permanently recorded on-chain, and the referrer is automatically queued to receive reward points upon successful claim.

This removes the need for any centralized authority to manage referral records or handle reward distribution. Every referral event, reward credit, and balance update is fully transparent and tamper-proof on the Stellar ledger.

The contract is written in **Rust** using the **Soroban SDK** and is designed to be lightweight, gas-efficient, and easily integrable into any dApp or platform that wishes to run a referral incentive program.

---

## Project Vision

The vision of this project is to bring **trust, transparency, and automation** to referral programs that have historically been managed by centralized intermediaries prone to manipulation, delays, and fraud.

By putting referral logic on-chain:

- Referrers are guaranteed their rewards without relying on a company's goodwill.
- Referred users are verifiably onboarded in an immutable record.
- Platforms can reduce referral fraud through deterministic smart contract rules.
- The entire incentive system is auditable by anyone, at any time.

This contract lays the foundation for a **Web3-native growth engine** — where community-driven referrals become a core, trustless mechanism for platform expansion.

---

## Key Features

| Feature | Description |
|---|---|
| **On-Chain Referral Registration** | Every referral is stored permanently on the Stellar ledger with a unique ID, referrer address, referred address, and timestamp. |
| **Anti-Self-Referral Guard** | The contract enforces that a user cannot refer themselves, preventing abuse of the reward system. |
| **Automated Reward Points** | Upon a successful referral, 100 reward points are automatically queued for the referrer. |
| **Claim-Based Reward Distribution** | Referrers explicitly call `claim_reward` to receive their points, ensuring controlled and intentional reward collection. |
| **Referrer Balance Tracking** | Each referrer's cumulative reward point balance is tracked on-chain and can be queried at any time. |
| **Global Stats Dashboard** | A `view_stats` function provides a real-time overview of total referrals, total referred users, and total rewards distributed. |
| **Duplicate Reward Prevention** | Once a reward is claimed for a referral ID, it cannot be claimed again — enforced at the contract level. |

---

## Future Scope

The current implementation is a foundational version. The following enhancements are planned for future iterations:

1. **Tiered Reward System** — Introduce reward multipliers based on the number of successful referrals a user has made (e.g., Bronze, Silver, Gold tiers).

2. **Token-Based Rewards** — Replace point-based rewards with actual on-chain token transfers using Stellar's native asset support via Soroban token interfaces.

3. **Referral Expiry** — Add time-bound referral links that expire after a configurable number of ledger timestamps, encouraging timely onboarding.

4. **Multi-Level Referrals** — Support referral chains (e.g., A refers B who refers C), distributing a percentage of rewards up the chain to encourage viral growth.

5. **Admin Controls** — Add role-based access for platform admins to configure reward amounts, pause/resume the referral program, or blacklist addresses.

6. **Frontend dApp Integration** — Build a user-facing dashboard using React + Stellar Wallets Kit that lets users generate referral links, track their referred users, and claim rewards with one click.

7. **Event Emissions** — Emit structured contract events for referral registration and reward claims, enabling real-time off-chain indexing and analytics.

8. **Cross-Contract Composability** — Allow other Soroban contracts (e.g., loyalty programs, NFT minters) to read referral data and trigger additional on-chain incentives.

---

## Contract Functions

### `register_referral(env, referrer, referred) -> u64`
Registers a new referral on-chain. Takes the referrer's address and the newly joined user's address. Returns the unique referral ID. Panics if a user tries to refer themselves.

### `claim_reward(env, referral_id)`
Allows the referrer to claim their reward points for a given referral ID. Updates the referrer's on-chain balance and marks the referral as rewarded. Panics if already claimed or if the referral does not exist.

### `view_referral(env, referral_id) -> Referral`
Returns the full details of a referral record by its unique ID. Returns a default empty record if the ID does not exist.

### `view_balance(env, user) -> u64`
Returns the total accumulated reward points for a given wallet address.

### `view_stats(env) -> ReferralStats`
Returns the global statistics of the referral system — total referrals created, total users referred, and total reward points distributed.

---

## Data Structures

### `Referral`
| Field | Type | Description |
|---|---|---|
| `referral_id` | `u64` | Unique identifier for the referral |
| `referrer` | `Address` | Wallet address of the user who made the referral |
| `referred` | `Address` | Wallet address of the newly joined user |
| `reward_points` | `u64` | Points awarded to the referrer (default: 100) |
| `timestamp` | `u64` | Ledger timestamp at the time of registration |
| `is_rewarded` | `bool` | Whether the reward has been claimed |

### `ReferralStats`
| Field | Type | Description |
|---|---|---|
| `total_referrals` | `u64` | Total referral records created |
| `total_rewards` | `u64` | Total reward points distributed |
| `total_referred` | `u64` | Total users who joined via referral |

---

> Built with ❤️ on **Stellar** using **Soroban SDK** | Language: **Rust**