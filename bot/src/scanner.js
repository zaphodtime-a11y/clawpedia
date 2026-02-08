import axios from 'axios';
import dotenv from 'dotenv';
import { shouldComment, calculateQualityScore, rateLimits } from './messages.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';
const STATE_FILE = path.join(process.cwd(), 'bot-state.json');

// Load/save state (which posts we've processed)
function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      processedPosts: [],
      lastScan: null,
      commentsToday: 0,
      lastCommentTime: null
    };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Fetch recent Moltbook posts
async function fetchRecentPosts(limit = 50) {
  try {
    const response = await axios.get(`${MOLTBOOK_API}/posts`, {
      params: {
        submolt: 'general',
        limit
      },
      headers: {
        'Authorization': `Bearer ${process.env.MOLTBOOK_API_KEY}`
      }
    });
    
    return response.data.posts || [];
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    return [];
  }
}

// Find candidate posts worth commenting on
export async function findCandidates() {
  console.log('🔍 Scanning Moltbook for valuable posts...\n');
  
  const state = loadState();
  const posts = await fetchRecentPosts(50);
  
  if (!posts.length) {
    console.log('No posts found.');
    return [];
  }
  
  const candidates = [];
  
  for (const post of posts) {
    const score = calculateQualityScore(post);
    const shouldEngage = shouldComment(post, state.processedPosts);
    
    if (shouldEngage) {
      candidates.push({
        ...post,
        qualityScore: score
      });
    }
  }
  
  // Sort by quality score (best first)
  candidates.sort((a, b) => b.qualityScore - a.qualityScore);
  
  console.log(`Found ${candidates.length} candidate posts:\n`);
  
  candidates.slice(0, 10).forEach(post => {
    console.log(`📝 "${post.title}" by ${post.author.name}`);
    console.log(`   Score: ${post.qualityScore} | Upvotes: ${post.upvotes} | Length: ${post.content.length} chars`);
    console.log(`   URL: https://moltbook.com/post/${post.id}\n`);
  });
  
  return candidates;
}

// Check rate limits before commenting
function canComment(state) {
  const now = Date.now();
  
  // Reset daily counter if new day
  const lastCommentDate = state.lastCommentTime ? 
    new Date(state.lastCommentTime).toDateString() : null;
  const todayDate = new Date().toDateString();
  
  if (lastCommentDate !== todayDate) {
    state.commentsToday = 0;
  }
  
  // Check daily limit
  if (state.commentsToday >= rateLimits.maxCommentsPerDay) {
    console.log('⚠️  Daily comment limit reached. Waiting for tomorrow.');
    return false;
  }
  
  // Check minimum time between comments
  if (state.lastCommentTime) {
    const timeSince = now - state.lastCommentTime;
    if (timeSince < rateLimits.minTimeBetweenComments) {
      const waitMinutes = Math.ceil((rateLimits.minTimeBetweenComments - timeSince) / 60000);
      console.log(`⏳ Waiting ${waitMinutes} more minutes before next comment...`);
      return false;
    }
  }
  
  return true;
}

// Main scan function
async function scan() {
  const candidates = await findCandidates();
  
  if (!candidates.length) {
    console.log('✓ No new valuable posts to process right now.');
    return;
  }
  
  const state = loadState();
  
  // Process top candidates (respecting rate limits)
  for (const post of candidates.slice(0, 5)) {
    if (!canComment(state)) {
      console.log('Rate limit reached. Stopping for now.');
      break;
    }
    
    console.log(`\n💬 Ready to comment on: "${post.title}"`);
    console.log(`   Quality score: ${post.qualityScore}`);
    console.log(`   Author: ${post.author.name}`);
    console.log(`   URL: https://moltbook.com/post/${post.id}`);
    console.log('\n   To comment on this post, run:');
    console.log(`   node src/commenter.js ${post.id}\n`);
    
    // Mark as processed (so we don't spam check it again)
    state.processedPosts.push(post.id);
    
    // Don't auto-comment yet - require manual approval
    // (Remove this when we're confident in the quality filter)
  }
  
  saveState(state);
  console.log('\n✓ Scan complete.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scan().catch(console.error);
}
