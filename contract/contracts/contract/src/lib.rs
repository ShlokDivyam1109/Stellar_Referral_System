#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, Address, symbol_short};

// Tracks overall referral system statistics
#[contracttype]
#[derive(Clone)]
pub struct ReferralStats {
    pub total_referrals: u64,   // Total referral links created
    pub total_rewards: u64,     // Total reward points distributed
    pub total_referred: u64,    // Total users who joined via referral
}

// Symbol for accessing global referral stats
const ALL_STATS: Symbol = symbol_short!("ALL_STATS");

// Counter for unique referral IDs
const COUNT_REF: Symbol = symbol_short!("C_REF");

// Mapping referral_id -> Referral struct
#[contracttype]
pub enum Refbook {
    Referral(u64),
}

// Mapping referrer address -> reward balance
#[contracttype]
pub enum RewardLedger {
    Balance(Address),
}

// Core referral record
#[contracttype]
#[derive(Clone)]
pub struct Referral {
    pub referral_id: u64,          // Unique ID for this referral
    pub referrer: Address,         // Who created/shared the referral
    pub referred: Address,         // Who used the referral to join
    pub reward_points: u64,        // Points awarded to referrer
    pub timestamp: u64,            // When the referral was registered
    pub is_rewarded: bool,         // Whether reward has been claimed
}

#[contract]
pub struct ReferralContract;

#[contractimpl]
impl ReferralContract {

    /// Called when a new user joins using a referrer's address.
    /// Registers the referral and queues a reward for the referrer.
    pub fn register_referral(env: Env, referrer: Address, referred: Address) -> u64 {
        // Prevent self-referral
        if referrer == referred {
            log!(&env, "Self-referral is not allowed.");
            panic!("Self-referral is not allowed.");
        }

        let mut count: u64 = env.storage().instance().get(&COUNT_REF).unwrap_or(0);
        count += 1;

        let time = env.ledger().timestamp();

        let referral = Referral {
            referral_id: count,
            referrer: referrer.clone(),
            referred: referred.clone(),
            reward_points: 100,  // Fixed reward: 100 points per successful referral
            timestamp: time,
            is_rewarded: false,
        };

        let mut stats = Self::view_stats(env.clone());
        stats.total_referrals += 1;
        stats.total_referred += 1;

        env.storage().instance().set(&Refbook::Referral(count), &referral);
        env.storage().instance().set(&ALL_STATS, &stats);
        env.storage().instance().set(&COUNT_REF, &count);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Referral registered. ID: {}", count);
        count
    }

    /// Called by the referrer to claim their reward for a given referral ID.
    /// Marks the referral as rewarded and adds points to the referrer's balance.
    pub fn claim_reward(env: Env, referral_id: u64) {
        let mut referral = Self::view_referral(env.clone(), referral_id.clone());

        if referral.referral_id == 0 {
            log!(&env, "Referral not found.");
            panic!("Referral not found.");
        }

        if referral.is_rewarded {
            log!(&env, "Reward already claimed for referral ID: {}", referral_id);
            panic!("Reward already claimed.");
        }

        // Credit points to the referrer's balance
        let mut balance: u64 = env
            .storage()
            .instance()
            .get(&RewardLedger::Balance(referral.referrer.clone()))
            .unwrap_or(0);

        balance += referral.reward_points;
        referral.is_rewarded = true;

        let mut stats = Self::view_stats(env.clone());
        stats.total_rewards += referral.reward_points;

        env.storage().instance().set(&RewardLedger::Balance(referral.referrer.clone()), &balance);
        env.storage().instance().set(&Refbook::Referral(referral_id), &referral);
        env.storage().instance().set(&ALL_STATS, &stats);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Reward of {} points claimed for referral ID: {}", referral.reward_points, referral_id);
    }

    /// Returns a referral record by its unique ID.
    pub fn view_referral(env: Env, referral_id: u64) -> Referral {
        env.storage()
            .instance()
            .get(&Refbook::Referral(referral_id))
            .unwrap_or(Referral {
                referral_id: 0,
                referrer: Address::from_str(&env, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"),
                referred: Address::from_str(&env, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"),
                reward_points: 0,
                timestamp: 0,
                is_rewarded: false,
            })
    }

    /// Returns the reward point balance of a given address.
    pub fn view_balance(env: Env, user: Address) -> u64 {
        env.storage()
            .instance()
            .get(&RewardLedger::Balance(user))
            .unwrap_or(0)
    }

    /// Returns global referral system statistics.
    pub fn view_stats(env: Env) -> ReferralStats {
        env.storage().instance().get(&ALL_STATS).unwrap_or(ReferralStats {
            total_referrals: 0,
            total_rewards: 0,
            total_referred: 0,
        })
    }
}