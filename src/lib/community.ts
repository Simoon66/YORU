import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, updateDoc, deleteDoc, increment, runTransaction, startAfter } from 'firebase/firestore';
import { db } from './firebase';
import { CommunityPost, CommunityComment, UserProfile } from '../types';

/**
 * Strips all undefined fields recursively from an object to ensure Firestore compatibility.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = sanitizeFirestoreData(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned as T;
}

export const getCommunityPosts = async (lastDoc?: any, maxLimit = 20) => {
  let q = query(
    collection(db, 'community_posts'),
    orderBy('createdAt', 'desc'),
    limit(maxLimit)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const posts: CommunityPost[] = [];
  snapshot.forEach(doc => {
    posts.push({ id: doc.id, ...doc.data() } as CommunityPost);
  });
  return { posts, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
};

export const getPinnedPosts = async () => {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('isPinned', '==', true)
    );
    const snapshot = await getDocs(q);
    const posts: CommunityPost[] = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() } as CommunityPost);
    });
    return posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error("Error getting pinned posts:", err);
    return [];
  }
};

export const createCommunityPost = async (post: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'commentCount'>) => {
  const newRef = doc(collection(db, 'community_posts'));
  const newPost: CommunityPost = {
    ...post,
    id: newRef.id,
    commentCount: 0,
    reactions: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const cleanedPost = sanitizeFirestoreData(newPost);
  await setDoc(newRef, cleanedPost);
  
  // Safely increment user's post count
  try {
    const userRef = doc(db, 'users', post.userId);
    await updateDoc(userRef, { postCount: increment(1) });
  } catch (err) {
    console.warn("Could not increment user postCount:", err);
  }
  
  return newPost;
};

export const deleteCommunityPost = async (postId: string, userId: string) => {
  await deleteDoc(doc(db, 'community_posts', postId));
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { postCount: increment(-1) });
  } catch (err) {
    console.warn("Could not decrement user postCount:", err);
  }
};

export const getCommunityComments = async (postId: string) => {
  const q = query(
    collection(db, 'community_comments'),
    where('postId', '==', postId)
  );
  const snapshot = await getDocs(q);
  const comments: CommunityComment[] = [];
  snapshot.forEach(doc => {
    comments.push({ id: doc.id, ...doc.data() } as CommunityComment);
  });
  return comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
};

export const createCommunityComment = async (comment: Omit<CommunityComment, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newRef = doc(collection(db, 'community_comments'));
  const newComment: CommunityComment = {
    ...comment,
    id: newRef.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const cleanedComment = sanitizeFirestoreData(newComment);
  await setDoc(newRef, cleanedComment);
  
  try {
    const postRef = doc(db, 'community_posts', comment.postId);
    await updateDoc(postRef, { commentCount: increment(1) });
  } catch (err) {
    console.warn("Could not increment post commentCount:", err);
  }

  try {
    const userRef = doc(db, 'users', comment.userId);
    await updateDoc(userRef, { commentCount: increment(1) });
  } catch (err) {
    console.warn("Could not increment user commentCount:", err);
  }
  
  return newComment;
};

export const getUserProfileByUsername = async (username: string): Promise<UserProfile | null> => {
  // username is case-insensitive, we can use the usernames collection
  const usernameRef = doc(db, 'usernames', username.toLowerCase());
  const usernameSnap = await getDoc(usernameRef);
  if (usernameSnap.exists()) {
    const uid = usernameSnap.data().uid;
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
  }
  
  // fallback search by username field
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data() as UserProfile;
  }
  return null;
};

export const reserveUsername = async (uid: string, username: string) => {
  const lowerName = username.toLowerCase();
  if (lowerName.length < 3 || lowerName.length > 20 || !/^[a-z0-9_]+$/.test(lowerName)) {
    throw new Error("Invalid username format. Must be 3-20 characters, letters, numbers, or underscores.");
  }

  const usernameRef = doc(db, 'usernames', lowerName);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const usernameDoc = await transaction.get(usernameRef);
    if (usernameDoc.exists() && usernameDoc.data().uid !== uid) {
      throw new Error("Username already taken.");
    }
    transaction.set(usernameRef, { uid });
    transaction.update(userRef, { username });
  });
};

export const getTopWatchers = async (limitCount = 10) => {
  const q = query(collection(db, 'users'), orderBy('watchCount', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile).filter(u => u.watchCount && u.watchCount > 0);
};

export const getTopCommentators = async (limitCount = 10) => {
  const q = query(collection(db, 'users'), orderBy('commentCount', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile).filter(u => u.commentCount && u.commentCount > 0);
};

export const toggleReaction = async (postId: string, userId: string) => {
  const postRef = doc(db, 'community_posts', postId);
  
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error("Post not found");
    
    const data = postDoc.data();
    const reactions = data.reactions || {};
    
    if (reactions[userId]) {
      // Remove reaction
      const newReactions = { ...reactions };
      delete newReactions[userId];
      transaction.update(postRef, { reactions: newReactions });
    } else {
      // Add reaction
      transaction.update(postRef, { 
        reactions: { ...reactions, [userId]: Date.now() } 
      });
    }
  });
};

export const deleteCommunityComment = async (commentId: string, postId: string) => {
  await deleteDoc(doc(db, 'community_comments', commentId));
  try {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(-1)
    });
  } catch (err) {
    console.warn("Could not decrement post commentCount:", err);
  }
};

