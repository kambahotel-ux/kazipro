export interface AppUser {
  id: number | string;
  name: string;
  email: string;
  avatar: string | null;
  role: string | null;
  profil: unknown | null;
  google_id?: string | null;
  navigation?: unknown;
  access?: unknown;
}
