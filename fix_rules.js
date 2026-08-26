const fs = require('fs');
const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)) ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', 'user') : 'user';
    }
    
    function isAdmin() {
      return (request.auth != null && request.auth.token != null && request.auth.token.email != null && (request.auth.token.email in ['simoonabdulla@gmail.com', 'kamaluddin124578@gmail.com', 'titumamma2425@gmail.com'])) ||
              (isSignedIn() && getUserRole() == 'admin');
    }

    function isModerator() {
      return isSignedIn() && (isAdmin() || getUserRole() == 'moderator');
    }

    function isStaff() {
      return isSignedIn() && (isModerator() || getUserRole() == 'staff');
    }

    function isBanned() {
      return isSignedIn() && exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isBanned', false) == true;
    }

    function canCreatePost() {
      return isSignedIn() && !isBanned(); // Let any authenticated user create post for now, maybe add limits later. Wait, the user asked for this earlier? No, user was complaining they couldn't post. Let's let anyone post unless they are banned, but we can keep staff/special if that was required. Let's just allow all users to post to the community like a normal community.
    }
    
    match /users/{userId} {
      allow read: if true;
      allow create: if isSignedIn() && request.auth.uid == userId && (request.resource.data.get('role', 'user') == 'user' || isAdmin());
      allow update: if isSignedIn() && (
        isAdmin() || 
        isModerator() ||
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isBanned', 'postCount', 'commentCount', 'reactionsReceived']))
      );
      allow delete: if isAdmin();
    }
    
    match /usernames/{username} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid;
      allow update: if isSignedIn() && request.resource.data.uid == request.auth.uid && resource.data.uid == request.auth.uid;
      allow delete: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
    }

    match /community_posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn() && !isBanned() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && (
        isAdmin() || 
        isModerator() || 
        (request.auth.uid == resource.data.userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAnnouncement', 'isPinned', 'status', 'commentsEnabled', 'commentCount', 'reactions'])) ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentCount']) ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']) ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentCount', 'reactions'])
      );
      allow delete: if isSignedIn() && (isAdmin() || isModerator() || request.auth.uid == resource.data.userId);
    }

    match /community_comments/{commentId} {
      allow read: if true;
      allow create: if isSignedIn() && !isBanned() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && (
        isAdmin() || isModerator() ||
        (request.auth.uid == resource.data.userId && !isBanned() && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['status', 'reactions'])) ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions'])
      );
      allow delete: if isSignedIn() && (isAdmin() || isModerator() || isStaff() || request.auth.uid == resource.data.userId);
    }

    match /community_reactions/{reactionId} {
      allow read: if true;
      allow create: if isSignedIn() && !isBanned() && request.resource.data.userId == request.auth.uid && request.resource.data.targetId != null;
      allow update: if isSignedIn() && !isBanned() && request.resource.data.userId == request.auth.uid && request.auth.uid == resource.data.userId;
      allow delete: if isSignedIn() && (isAdmin() || isModerator() || request.auth.uid == resource.data.userId);
    }

    match /anime/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /episodes/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /comments/{document=**} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (request.auth.uid == resource.data.userId || isAdmin() || isModerator() || isStaff());
    }

    match /watchlist/{docId} {
      allow get: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid);
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isSignedIn() && request.resource != null && request.auth.uid == request.resource.data.userId;
    }

    match /spotlights/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /audit_logs/{logId} {
      allow read: if isAdmin() || isModerator();
      allow create: if isAdmin() || isModerator();
    }

    match /watchProgress/{progressId} {
      allow get: if isSignedIn() && (progressId.split('_')[0] == request.auth.uid || resource == null || resource.data.userId == request.auth.uid);
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && request.resource != null && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() && (progressId.split('_')[0] == request.auth.uid || resource == null || resource.data.userId == request.auth.uid);
    }

    // Default fallback
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;
fs.writeFileSync('firestore.rules', rules);
