import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { readJSON, writeJSON, listKeys, deleteBlob } from './store.js';
import type { UserRecord, UserRole, UserStatus, UserProfile } from './types';

const USERS_PREFIX = 'users/';

export async function listUsers(): Promise<UserRecord[]> {
  const keys = await listKeys(USERS_PREFIX);
  const users: UserRecord[] = [];
  for (const key of keys) {
    const user = await readJSON<UserRecord>(key);
    if (user) users.push(user);
  }
  return users;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  return readJSON<UserRecord>(`${USERS_PREFIX}${id}.json`);
}

export async function getUserByEmailOrUsername(identity: string): Promise<UserRecord | null> {
  const users = await listUsers();
  return (
    users.find((user) => user.email.toLowerCase() === identity.toLowerCase()) ||
    users.find((user) => user.username.toLowerCase() === identity.toLowerCase()) ||
    null
  );
}

export async function countAdmins(): Promise<number> {
  const users = await listUsers();
  return users.filter((user) => user.role === 'admin').length;
}

export async function createUser(params: {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
}): Promise<UserRecord> {
  const now = new Date().toISOString();
  const id = nanoid();
  const passwordHash = await bcrypt.hash(params.password, 10);
  const user: UserRecord = {
    id,
    email: params.email,
    username: params.username,
    passwordHash,
    role: params.role ?? 'user',
    status: params.status ?? 'active',
    profile: {},
    createdAt: now,
    updatedAt: now
  };
  await writeJSON(`${USERS_PREFIX}${id}.json`, user);
  return user;
}

export async function updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
  const user = await getUserById(id);
  if (!user) return null;
  const next: UserRecord = {
    ...user,
    ...updates,
    profile: updates.profile ? { ...user.profile, ...updates.profile } : user.profile,
    updatedAt: new Date().toISOString()
  };
  await writeJSON(`${USERS_PREFIX}${id}.json`, next);
  return next;
}

export async function deleteUser(id: string) {
  await deleteBlob(`${USERS_PREFIX}${id}.json`);
}

export async function verifyPassword(user: UserRecord, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function updateUserProfile(id: string, profile: Partial<UserProfile>) {
  const user = await getUserById(id);
  if (!user) return null;
  user.profile = { ...user.profile, ...profile };
  user.updatedAt = new Date().toISOString();
  await writeJSON(`${USERS_PREFIX}${id}.json`, user);
  return user;
}

