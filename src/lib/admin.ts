import { db } from './firebase';
import { doc, collection, runTransaction, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { UserProfile, UserRole, RoleAuditLog } from '../types';

export const SUPER_ADMIN_EMAILS = [
  'simoonabdulla@gmail.com',
  'kamaluddin124578@gmail.com',
  'titumamma2425@gmail.com'
];

export const isSuperAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  special: 1,
  staff: 2,
  moderator: 3,
  admin: 4,
  guest: 0
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  staff: 'Staff',
  special: 'Special Member',
  user: 'User',
  guest: 'Guest'
};

/**
 * Validates whether the actor is authorized to modify the target user
 */
export const canActorManageTarget = (
  actorRole: UserRole | undefined,
  actorEmail: string | null | undefined,
  targetRole: UserRole | undefined,
  targetEmail: string | null | undefined
): boolean => {
  if (!actorRole && !actorEmail) return false;

  // Super Admin can manage anyone
  if (isSuperAdmin(actorEmail)) return true;

  // No regular admin or moderator can manage a Super Admin
  if (isSuperAdmin(targetEmail)) return false;

  const actorLevel = actorRole ? (ROLE_HIERARCHY[actorRole] ?? 0) : 0;
  const targetLevel = targetRole ? (ROLE_HIERARCHY[targetRole] ?? 0) : 0;

  // Regular Admin can only manage users with role strictly lower than Admin (< 4)
  if (actorRole === 'admin') {
    return targetLevel < ROLE_HIERARCHY.admin;
  }

  // Moderator can only manage users with role strictly lower than Moderator (< 3)
  if (actorRole === 'moderator') {
    return targetLevel < ROLE_HIERARCHY.moderator;
  }

  return false;
};

/**
 * Returns the list of roles that this actor is permitted to assign to others
 */
export const getAllowedRolesToAssign = (
  actorRole: UserRole | undefined,
  actorEmail: string | null | undefined
): UserRole[] => {
  // Super Admin (Simoon) has unrestricted authority to assign any role, including Admin
  if (isSuperAdmin(actorEmail)) {
    return ['admin', 'moderator', 'staff', 'special', 'user'];
  }

  // Regular Admin has access to assign roles strictly below Admin (cannot create Admins)
  if (actorRole === 'admin') {
    return ['moderator', 'staff', 'special', 'user'];
  }

  // Moderator cannot make anyone a moderator or admin; can only assign roles strictly below Moderator
  if (actorRole === 'moderator') {
    return ['staff', 'special', 'user'];
  }

  return [];
};

export interface ActorInfo {
  uid: string;
  email: string | null;
  displayName?: string | null;
  username?: string | null;
  photoURL?: string | null;
  role?: UserRole;
}

/**
 * Atomically updates a user's role and logs the audit event with complete actor and target metadata
 */
export const updateUserRole = async (
  targetUserId: string,
  newRole: UserRole,
  actor: ActorInfo
) => {
  await runTransaction(db, async (transaction) => {
    // 1. Fetch and validate actor document in database
    const actorRef = doc(db, 'users', actor.uid);
    const actorSnap = await transaction.get(actorRef);
    
    const actorDbData = actorSnap.exists() ? (actorSnap.data() as UserProfile) : null;
    const actorRole = actorDbData?.role || actor.role || 'user';
    const actorEmail = actor.email || actorDbData?.email || null;
    const actorIsSuperAdmin = isSuperAdmin(actorEmail);

    // 2. Fetch target user document
    const targetRef = doc(db, 'users', targetUserId);
    const targetSnap = await transaction.get(targetRef);

    if (!targetSnap.exists()) {
      throw new Error('Target user not found in database.');
    }

    const targetData = targetSnap.data() as UserProfile;
    const oldRole = targetData.role || 'user';
    const targetEmail = targetData.email || null;

    // 3. Security checks: Check if actor is allowed to manage this target
    const canManage = canActorManageTarget(actorRole, actorEmail, oldRole, targetEmail);
    if (!canManage) {
      throw new Error(`Permission Denied: You are not authorized to modify users with role '${oldRole}'.`);
    }

    // 4. Security checks: Check if actor is allowed to assign the new role
    const allowedRoles = getAllowedRolesToAssign(actorRole, actorEmail);
    if (!allowedRoles.includes(newRole)) {
      if (newRole === 'admin' && !actorIsSuperAdmin) {
        throw new Error('Permission Denied: Only Super Admin (Simoon) can promote users to Admin.');
      }
      if (newRole === 'moderator' && actorRole === 'moderator') {
        throw new Error('Permission Denied: Moderators cannot assign the Moderator role.');
      }
      throw new Error(`Permission Denied: You cannot assign the '${newRole}' role.`);
    }

    // 5. Update target role
    transaction.update(targetRef, { 
      role: newRole,
      updatedAt: Date.now()
    });

    // 6. Record audit log
    const auditLogRef = doc(collection(db, 'audit_logs'));
    const auditLogData: RoleAuditLog = {
      id: auditLogRef.id,
      action: 'ROLE_CHANGE',
      targetUserId,
      targetUserEmail: targetData.email || null,
      targetUserName: targetData.username || targetData.displayName || 'Unknown',
      targetUserPhotoURL: targetData.photoURL || null,
      oldRole,
      newRole,
      performedByUid: actor.uid,
      performedByEmail: actorEmail,
      performedByName: actor.username || actor.displayName || actorDbData?.username || actorDbData?.displayName || 'Admin',
      performedByPhotoURL: actor.photoURL || actorDbData?.photoURL || null,
      timestamp: Date.now()
    };

    transaction.set(auditLogRef, auditLogData);
  });
};

/**
 * Toggles a user's banned status and records an audit log
 */
export const toggleUserBan = async (
  targetUserId: string,
  newBanStatus: boolean,
  actor: ActorInfo
) => {
  await runTransaction(db, async (transaction) => {
    // 1. Fetch actor document
    const actorRef = doc(db, 'users', actor.uid);
    const actorSnap = await transaction.get(actorRef);
    const actorDbData = actorSnap.exists() ? (actorSnap.data() as UserProfile) : null;
    const actorRole = actorDbData?.role || actor.role || 'user';
    const actorEmail = actor.email || actorDbData?.email || null;

    // 2. Fetch target document
    const targetRef = doc(db, 'users', targetUserId);
    const targetSnap = await transaction.get(targetRef);

    if (!targetSnap.exists()) {
      throw new Error('Target user not found.');
    }

    const targetData = targetSnap.data() as UserProfile;
    const targetRole = targetData.role || 'user';
    const targetEmail = targetData.email || null;

    // 3. Verify actor can manage this target
    if (!canActorManageTarget(actorRole, actorEmail, targetRole, targetEmail)) {
      throw new Error(`Permission Denied: You cannot modify ban status for users with role '${targetRole}'.`);
    }

    // 4. Update ban status
    transaction.update(targetRef, {
      isBanned: newBanStatus,
      updatedAt: Date.now()
    });

    // 5. Record audit log
    const auditLogRef = doc(collection(db, 'audit_logs'));
    const auditLogData: RoleAuditLog = {
      id: auditLogRef.id,
      action: 'BAN_TOGGLE',
      targetUserId,
      targetUserEmail: targetData.email || null,
      targetUserName: targetData.username || targetData.displayName || 'Unknown',
      targetUserPhotoURL: targetData.photoURL || null,
      oldRole: targetRole,
      newRole: targetRole,
      isBanned: newBanStatus,
      performedByUid: actor.uid,
      performedByEmail: actorEmail,
      performedByName: actor.username || actor.displayName || actorDbData?.username || actorDbData?.displayName || 'Admin',
      performedByPhotoURL: actor.photoURL || actorDbData?.photoURL || null,
      timestamp: Date.now()
    };

    transaction.set(auditLogRef, auditLogData);
  });
};

/**
 * Fetches recent audit logs ordered by timestamp descending
 */
export const getAuditLogs = async (limitCount = 100): Promise<RoleAuditLog[]> => {
  try {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const logs: RoleAuditLog[] = [];
    snapshot.forEach(docSnap => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as RoleAuditLog);
    });
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

