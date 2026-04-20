import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  teamInvitationsAPI,
  getInvitationByToken,
  acceptInvitation,
  createInvitation,
  resendInvitation,
  cancelInvitation,
} from './teamInvitations';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('teamInvitations service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches invitation token details from backend token route', async () => {
    (api.get as any).mockResolvedValue({ data: { id: 1, email: 'a@b.com', role: 'member', status: 'pending', organization_id: 1, expires_at: '', created_at: '', updated_at: '' } });
    await getInvitationByToken('abc-token');
    expect(api.get).toHaveBeenCalledWith('/team-invitations/token/abc-token');
  });

  it('accepts invitation with tokenized endpoint', async () => {
    (api.post as any).mockResolvedValue({ data: { message: 'ok', user_id: 2 } });
    await acceptInvitation('abc-token', { password: 'password123', first_name: 'Ali', last_name: 'A' });
    expect(api.post).toHaveBeenCalledWith('/team-invitations/accept/abc-token', {
      password: 'password123',
      first_name: 'Ali',
      last_name: 'A',
    });
  });

  it('exposes CRUD invitation helpers', async () => {
    (api.post as any).mockResolvedValue({ data: {} });
    (api.delete as any).mockResolvedValue({ data: {} });

    await createInvitation({ email: 'new@user.com', role: 'member' });
    await resendInvitation(12);
    await cancelInvitation(12);

    expect(api.post).toHaveBeenCalledWith('/team-invitations', { email: 'new@user.com', role: 'member' });
    expect(api.post).toHaveBeenCalledWith('/team-invitations/12/resend');
    expect(api.delete).toHaveBeenCalledWith('/team-invitations/12');
    expect(teamInvitationsAPI.getStats).toBeTypeOf('function');
  });
});
