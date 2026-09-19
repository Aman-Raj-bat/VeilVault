import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/veilcontract/contract/index.js';
import { Contract } from './managed/veilcontract/contract/index.js';

const currentDir = path.resolve(fileURLToPath(import.meta.url), '..');
export const zkConfigPath = path.resolve(currentDir, 'managed', 'veilcontract');

export const CompiledVeilContract = CompiledContract.make('VeilContract', Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
