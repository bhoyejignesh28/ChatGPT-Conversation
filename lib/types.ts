export type Role = "admin" | "user";
export type UserStatus = "active" | "inactive";

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string | null;
}

export interface User {
  uid: string;
  email: string;
  username: string;
  role: Role;
  status: UserStatus;
  profile: UserProfile;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Size {
  id: string;
  name: string;
  w: number;
  h: number;
  createdAt: number;
  updatedAt: number;
}

export type PlaceholderType = "text" | "logo" | "icon";
export type PlaceholderKey =
  | "name"
  | "phone"
  | "email"
  | "address"
  | "custom"
  | "logo"
  | "icon:phone"
  | "icon:email"
  | "icon:address";

export type FontGroup = "sans" | "serif" | "script";

export interface Placeholder {
  id: string;
  type: PlaceholderType;
  key: PlaceholderKey;
  x: number;
  y: number;
  w: number;
  h: number;
  fontGroup?: FontGroup;
  fontFamily?: string;
  fontWeight?: 400 | 500 | 600 | 700 | 800 | 900;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  textAlign?: "left" | "center" | "right";
}

export interface Template {
  id: string;
  name: string;
  categoryId: string;
  sizeId: string;
  baseImageUrl: string;
  ownerAdminUid: string;
  placeholders: Placeholder[];
  createdAt: number;
  updatedAt: number;
}

export interface RenderOverride {
  value?: string;
  fontGroup?: FontGroup;
  fontFamily?: string;
  fontWeight?: 400 | 500 | 600 | 700 | 800 | 900;
  italic?: boolean;
  fontSize?: number;
  color?: string;
  textAlign?: "left" | "center" | "right";
  logoScale?: number;
  logoX?: number;
  logoY?: number;
}

export interface Render {
  id: string;
  userId: string;
  templateId: string;
  overrides: Record<string, RenderOverride>;
  exportUrl: string | null;
  createdAt: number;
  updatedAt: number;
}
