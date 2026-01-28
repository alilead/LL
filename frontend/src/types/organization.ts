export interface Organization {
  id: number;
  name: string;
  description?: string;
  website?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  logo?: string;
  logo_filename?: string;
  logo_content_type?: string;
}

export interface OrganizationCreate {
  name: string;
  description?: string;
  website?: string;
  logo?: File;
}

export interface OrganizationUpdate extends Partial<OrganizationCreate> {
  is_active?: boolean;
}

export interface OrganizationSettings {
  id: number;
  organization_id: number;
  settings_key: string;
  settings_value: string;
  created_at: string;
  updated_at: string;
}
