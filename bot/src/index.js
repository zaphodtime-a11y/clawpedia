import { findCandidates } from './scanner.js';
import dotenv from 'dotenv';

dotenv.config();

const SCAN_INTERVAL = (process.env.SCAN_INTERVAL_MINUTES || 60) * 60 * 1000;

async function run() {
  console.log('🤖 Clawpedia Bot starting...\n');
  console.log(`Scan interval: ${SCAN_INTERVAL / 60000} minutes\n`);
  console.log('Bot will find candidate posts but require manual approval to comment.');
  console.log('This prevents spam and lets you review quality before engaging.\n');
  console.log('---\n');
  
  // Initial scan
  await scan();
  
  // Schedule periodic scans
  setInterval(scan, SCAN_INTERVAL);
}

async function scan() {
  try {
    await findCandidates();
  } catch (error) {
    console.error('Scan error:', error);
  }
}

run().catch(console.error);
