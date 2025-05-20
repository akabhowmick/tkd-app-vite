export interface School {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  established_at?: string;
  admin_id?: string;
  created_at: string;
}

export type SchoolInput = {
  name: string;
  address: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  established_at?: string;
};