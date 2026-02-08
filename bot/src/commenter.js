import axios from 'axios';
import dotenv from 'dotenv';
import { messages } from './messages.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';
const STATE_FILE = path.join(process.cwd(), 'bot-state.json');

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      processedPosts: [],
      commentedPosts: [],
      pendingResponses: {},
      commentsToday: 0,
      lastCommentTime: null
    };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Get post details
async function getPost(postId) {
  try {
    const response = await axios.get(`${MOLTBOOK_API}/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error.response?.data || error.message);
    return null;
  }
}

// Post comment on Moltbook
async function postComment(postId, text) {
  try {
    const response = await axios.post(
      `${MOLTBOOK_API}/posts/${postId}/comments`,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MOLTBOOK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error posting comment:', error.response?.data || error.message);
    return null;
  }
}

// Comment on a specific post
async function commentOnPost(postId) {
  console.log(`\n📝 Preparing to comment on post ${postId}...\n`);
  
  const state = loadState();
  
  // Check if already commented
  if (state.commentedPosts?.includes(postId)) {
    console.log('⚠️  Already commented on this post. Skipping.');
    return;
  }
  
  // Get post details
  const post = await getPost(postId);
  if (!post) {
    console.log('❌ Could not fetch post details.');
    return;
  }
  
  console.log(`Post: "${post.title}"`);
  console.log(`Author: ${post.author?.name || 'Unknown'}`);
  console.log(`Upvotes: ${post.upvotes}`);
  console.log(`Content length: ${post.content?.length || 0} chars\n`);
  
  // Generate message
  const message = messages.invitation(post);
  
  console.log('--- Message Preview ---');
  console.log(message);
  console.log('--- End Preview ---\n');
  
  // Require confirmation
  console.log('Review the message above.');
  console.log('\nTo post this comment, add --confirm flag:');
  console.log(`node src/commenter.js ${postId} --confirm\n`);
}

// Comment with confirmation
async function commentWithConfirmation(postId) {
  const post = await getPost(postId);
  if (!post) return;
  
  const message = messages.invitation(post);
  
  console.log('\n💬 Posting comment...\n');
  
  const result = await postComment(postId, message);
  
  if (result) {
    console.log('✓ Comment posted successfully!');
    console.log(`Comment ID: ${result.id || 'unknown'}\n`);
    
    // Update state
    const state = loadState();
    if (!state.commentedPosts) state.commentedPosts = [];
    if (!state.pendingResponses) state.pendingResponses = {};
    
    state.commentedPosts.push(postId);
    state.pendingResponses[postId] = {
      commentId: result.id,
      postTitle: post.title,
      postAuthor: post.author?.name,
      commentedAt: new Date().toISOString(),
      status: 'pending'
    };
    state.commentsToday = (state.commentsToday || 0) + 1;
    state.lastCommentTime = Date.now();
    
    saveState(state);
    
    console.log('📊 Stats:');
    console.log(`   Comments today: ${state.commentsToday}`);
    console.log(`   Total commented: ${state.commentedPosts.length}`);
    console.log(`   Pending responses: ${Object.keys(state.pendingResponses).length}\n`);
  } else {
    console.log('❌ Failed to post comment.');
  }
}

// Main
const postId = process.argv[2];
const confirm = process.argv.includes('--confirm');

if (!postId) {
  console.log('Usage: node src/commenter.js <post-id> [--confirm]');
  console.log('\nExample:');
  console.log('  node src/commenter.js abc123        # Preview');
  console.log('  node src/commenter.js abc123 --confirm  # Post comment');
  process.exit(1);
}

if (confirm) {
  commentWithConfirmation(postId).catch(console.error);
} else {
  commentOnPost(postId).catch(console.error);
}
