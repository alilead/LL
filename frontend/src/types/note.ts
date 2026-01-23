export interface Note {
  id: number;
  content: string;
  lead_id: number;
  organization_id: number;
  created_by_id: number;
  deal_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface NoteCreate {
  content: string;
  lead_id: number;
  organization_id: number;
  deal_id?: number;
}

export interface NoteUpdate {
  content: string;
}

export interface NoteList {
  items: Note[];
  total: number;
}
