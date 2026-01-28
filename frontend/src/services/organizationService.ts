import axios from '@/lib/axios';

export const organizationService = {
  getStats: async () => {
    const { data } = await axios.get('/organizations/stats/');
    return data;
  },

  getSettings: async (organizationId: number) => {
    const { data } = await axios.get(`/organizations/${organizationId}/settings/`);
    return data;
  },

  updateSettings: async (organizationId: number, settings: any) => {
    const { data } = await axios.put(
      `/organizations/${organizationId}/settings/`,
      settings
    );
    return data;
  },

  getUsers: async (organizationId: number) => {
    const { data } = await axios.get(`/organizations/${organizationId}/users/`);
    return data;
  },

  createUser: async (organizationId: number, userData: any) => {
    const { data } = await axios.post(
      `/organizations/${organizationId}/users/`,
      userData
    );
    return data;
  },

  updateUser: async (organizationId: number, userId: number, userData: any) => {
    const { data } = await axios.put(
      `/organizations/${organizationId}/users/${userId}/`,
      userData
    );
    return data;
  },

  deleteUser: async (organizationId: number, userId: number) => {
    const { data } = await axios.delete(
      `/organizations/${organizationId}/users/${userId}/`
    );
    return data;
  },

  getRoles: async (organizationId: number) => {
    const { data } = await axios.get(`/organizations/${organizationId}/roles/`);
    return data;
  },

  createRole: async (organizationId: number, roleData: any) => {
    const { data } = await axios.post(
      `/organizations/${organizationId}/roles/`,
      roleData
    );
    return data;
  },

  assignRole: async (organizationId: number, userId: number, roleId: number) => {
    const { data } = await axios.post(
      `/organizations/${organizationId}/users/${userId}/roles/${roleId}/`
    );
    return data;
  },

  removeRole: async (organizationId: number, userId: number, roleId: number) => {
    const { data } = await axios.delete(
      `/organizations/${organizationId}/users/${userId}/roles/${roleId}/`
    );
    return data;
  }
};
