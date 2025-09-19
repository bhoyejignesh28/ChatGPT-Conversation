export type UserStatus = 'active' | 'inactive';
export type UserRole = 'admin' | 'user';

export interface UserProfile {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  custom?: string;
  logoUrl?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SizeRecord {
  id: string;
  name: string;
  w: number;
  h: number;
  createdAt: string;
  updatedAt: string;
}

export type PlaceholderType = 'text' | 'logo';

export interface TemplatePlaceholder {
  id: string;
  type: PlaceholderType;
  key: 'name' | 'phone' | 'email' | 'address' | 'custom' | 'logo';
  x: number;
  y: number;
  w: number;
  h: number;
  fontGroup?: 'sans' | 'serif' | 'script';
  fontFamily?: string;
  fontWeight?: 400 | 500 | 600 | 700 | 800 | 900;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  scale?: number;
}

export interface TemplateRecord {
  id: string;
  name: string;
  categoryId: string;
  sizeId: string;
  baseImageUrl?: string;
  baseImageKey?: string;
  ownerAdminUid: string;
  placeholders: TemplatePlaceholder[];
  createdAt: string;
  updatedAt: string;
}

export interface RenderRecord {
  id: string;
  userId: string;
  templateId: string;
  overrides: Record<string, any>;
  width: number;
  height: number;
  exportUrl: string;
  createdAt: string;
}

