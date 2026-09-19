// AUTO-GENERATED — DO NOT EDIT
// This file is a stub for the VeilVault frontend build.
// Run `yarn compile` from the root to regenerate from veilcontract.compact

export type Ledger = {
  admin: Uint8Array;
  is_active: boolean;
  deadline: bigint;
  total_votes: bigint;
  votes_for: bigint;
  votes_against: bigint;
  votes_abstain: bigint;
  max_voters: bigint;
  nullifiers: { member: (v: Uint8Array) => boolean; insert: (v: Uint8Array) => void };
};

export type ImpureCircuits = {
  cast_vote: () => Promise<void>;
  update_session: (deadline: bigint, max: bigint, active: boolean) => Promise<void>;
};

export type PureCircuits = {
  vault_admin_key: (sk: Uint8Array) => Uint8Array;
  make_voter_nullifier: (id: Uint8Array) => Uint8Array;
};

export declare function ledger(data: Uint8Array): Ledger;
export declare const pureCircuits: PureCircuits;
export declare class Contract {}
