import { createRequire } from 'node:module';
import { PublicKey } from '@solana/web3.js';
import { USEPAID_VERIFIED_TREASURY } from './launchUtility.js';
const { PUMP_SDK, PUMP_FEE_PROGRAM_ID, socialFeePda } = createRequire(import.meta.url)('@pump-fun/pump-sdk');

// UsePaid publishes a Pump social fee PDA, NOT an ordinary on-curve wallet.
// Both the public setup screen and this exact on-chain account were checked.
export function verifyUsePaidRecipientAccount(accountInfo, address = USEPAID_VERIFIED_TREASURY) {
  if (address !== USEPAID_VERIFIED_TREASURY) throw new Error('The UsePaid fee recipient differs from the reviewed provider address.');
  if (!accountInfo || accountInfo.executable || !accountInfo.owner?.equals(PUMP_FEE_PROGRAM_ID)) throw new Error('UsePaid fee recipient could not be verified against the official Pump Fees program.');
  const decoded = PUMP_SDK.decodeSocialFeePda(accountInfo);
  if (decoded.userId !== '322216527' || decoded.platform !== 2 || !socialFeePda(decoded.userId, decoded.platform).equals(new PublicKey(address))) throw new Error('UsePaid social fee account does not match the reviewed provider identity.');
  return { verified: true, address, program: PUMP_FEE_PROGRAM_ID.toBase58(), kind: 'pump_social_fee_pda' };
}

export async function verifyUsePaidRecipient(connection, address = USEPAID_VERIFIED_TREASURY) {
  return verifyUsePaidRecipientAccount(await connection.getAccountInfo(new PublicKey(address), 'confirmed'), address);
}
