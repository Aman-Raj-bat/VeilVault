import { useState, useCallback, useEffect } from 'react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract } from '../managed/contract/index.js';
import { useWallet } from '../contexts/WalletContext';
import WalletButton from '../components/WalletButton';

type VoteChoice = 0 | 1 | 2; // 0=for, 1=against, 2=abstain

function getCompiledContract() {
  const dummyWitnesses = {
    voter_credential: () => [{}, { voter_id: new Uint8Array(32), eligibility_key: new Uint8Array(32) }],
    admin_secret: () => [{}, new Uint8Array(32)],
    vote_choice: () => [{}, 0n],
  } as any;

  const contractInstance = new Contract(dummyWitnesses);

  return CompiledContract.make('VeilContract', contractInstance).pipe(
    CompiledContract.withWitnesses(dummyWitnesses),
    CompiledContract.withCompiledFileAssets(
      new URL('/managed', window.location.origin).toString(),
    ),
  ) as any;
}

const voteOptions = [
  {
    value: 0 as VoteChoice,
    emoji: '✅',
    label: 'Vote For',
    description: 'I support this proposal',
    className: 'selected--for',
  },
  {
    value: 1 as VoteChoice,
    emoji: '❌',
    label: 'Vote Against',
    description: 'I oppose this proposal',
    className: 'selected--against',
  },
  {
    value: 2 as VoteChoice,
    emoji: '⬜',
    label: 'Abstain',
    description: 'I choose to abstain',
    className: 'selected--abstain',
  },
];

export default function VotePage() {
  const { session, isConnected } = useWallet();
  const [contractAddress, setContractAddress] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<VoteChoice | null>(null);
  const [status, setStatus] = useState<'idle' | 'voting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [voterSeed, setVoterSeed] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('VEILVAUL_CONTRACT_ADDRESS') ?? '';
    setContractAddress(saved);
    // Generate a random voter seed on page load (in production this would be derived from wallet)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    setVoterSeed(hex);
  }, []);

  const handleVote = useCallback(async () => {
    if (!session || !isConnected || selectedChoice === null || !contractAddress) return;
    setStatus('voting');
    setErrorMsg(null);
    try {
      // Derive voter ID from seed (in production: from wallet signing key)
      const voterId = new Uint8Array(
        voterSeed.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
      );
      const eligibilityKey = new Uint8Array(32).fill(1); // Simplified for demo

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract: getCompiledContract(),
        contractAddress,
        circuitId: 'cast_vote',
        witnesses: {
          voter_credential: () => ({
            voter_id: voterId,
            eligibility_key: eligibilityKey,
          }),
          vote_choice: () => BigInt(selectedChoice),
          admin_secret: () => new Uint8Array(32) as any,
        },
        args: [],
      });

      await submitTxAsync(session.providers as any, {
        unprovenTx: callTxData.private.unprovenTx,
      });

      setTxId(callTxData.public?.txId ?? 'submitted');
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? String(e));
    }
  }, [session, isConnected, selectedChoice, contractAddress, voterSeed]);

  const reset = () => {
    setStatus('idle');
    setErrorMsg(null);
    setTxId(null);
    setSelectedChoice(null);
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: '2rem', animation: 'fadeInDown 0.5s ease both' }}>
          <p className="section-header__eyebrow">Private Voting</p>
          <h1>Cast Your Ballot</h1>
          <p>
            Your vote is proven via a zero-knowledge circuit. Only an anonymous nullifier
            is recorded on-chain — your choice and identity remain private.
          </p>
        </div>

        {/* Privacy shield notice */}
        <div className="privacy-shield mb-6 animate-fade-up">
          <span className="privacy-shield__icon">🔒</span>
          <div>
            <p className="privacy-shield__title">Your Privacy is Mathematically Guaranteed</p>
            <p className="privacy-shield__body">
              The ZK circuit runs locally in your browser. Your voter ID, eligibility key,
              and ballot choice never leave your device — only a cryptographic proof is submitted.
            </p>
          </div>
        </div>

        {!isConnected ? (
          <div className="card text-center" style={{ padding: '3rem 2rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</p>
            <h3 style={{ marginBottom: '0.75rem' }}>Connect Your Wallet</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              You need a 1AM wallet connected to Preprod to cast a vote.
            </p>
            <WalletButton />
          </div>
        ) : status === 'success' ? (
          <div className="card animate-fade-up">
            <div className="status-message status-message--success" style={{ marginBottom: '1.5rem' }}>
              <span>✅</span>
              <div>
                <strong>Vote cast successfully!</strong>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Your anonymous ballot has been recorded on-chain.
                </p>
              </div>
            </div>
            {txId && (
              <div className="address-box mb-6">
                <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem' }}>TX</span>
                <span style={{ flex: 1 }}>{txId}</span>
              </div>
            )}
            <div className="privacy-shield mb-4">
              <span className="privacy-shield__icon">🛡️</span>
              <div>
                <p className="privacy-shield__title">What was recorded</p>
                <p className="privacy-shield__body">
                  Only your nullifier (an anonymous commitment) and the updated tally were written
                  to the ledger. Your choice and identity remain private.
                </p>
              </div>
            </div>
            <button id="vote-again-btn" onClick={reset} className="btn btn-ghost w-full">
              Cast Another Vote
            </button>
          </div>
        ) : (
          <div className="card animate-fade-up">
            {/* Contract address input */}
            <div className="field">
              <label className="label" htmlFor="contract-address-input">
                Contract Address
              </label>
              <input
                id="contract-address-input"
                type="text"
                className="input"
                placeholder="Enter the VeilVault contract address (64 hex chars)"
                value={contractAddress}
                onChange={(e) => {
                  setContractAddress(e.target.value);
                  localStorage.setItem('VEILVAUL_CONTRACT_ADDRESS', e.target.value);
                }}
              />
              <p className="text-muted mt-1" style={{ fontSize: '0.8125rem' }}>
                Get the address from the Admin page or the README.
              </p>
            </div>

            <hr className="divider" />

            {/* Vote options */}
            <h3 style={{ marginBottom: '1rem' }}>Your Ballot</h3>
            <div className="vote-options">
              {voteOptions.map((opt) => (
                <button
                  key={opt.value}
                  id={`vote-option-${opt.label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setSelectedChoice(opt.value)}
                  className={`vote-option${selectedChoice === opt.value ? ` ${opt.className}` : ''}`}
                >
                  <span className="vote-option__emoji">{opt.emoji}</span>
                  <span className="vote-option__label">{opt.label}</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', margin: '0.25rem 0 0' }}>
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            {status === 'error' && errorMsg && (
              <div className="status-message status-message--error">
                <span>⚠️</span>
                <div>
                  <strong>Transaction failed</strong>
                  <pre style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    {errorMsg}
                  </pre>
                </div>
              </div>
            )}

            <button
              id="cast-vote-btn"
              onClick={handleVote}
              disabled={selectedChoice === null || !contractAddress || status === 'voting'}
              className="btn btn-primary btn-lg w-full mt-4"
            >
              {status === 'voting' ? (
                <>
                  <span className="spinner" />
                  Generating ZK Proof… Check your 1AM popup
                </>
              ) : (
                '🗳️ Submit Anonymous Ballot'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
