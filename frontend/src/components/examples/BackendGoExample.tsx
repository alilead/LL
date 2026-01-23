import React, { useEffect, useState } from 'react';
import { useLeads, useDeals, useUsers } from '../../hooks/useBackendGoAPI';
import type { Lead, Deal, User } from '../../types/backend-go';

// Example component demonstrating backend-go API integration
export const BackendGoExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'deals' | 'users'>('leads');
  
  const {
    getLeads,
    createLead,
    loading: leadsLoading,
    error: leadsError
  } = useLeads();
  
  const {
    getDeals,
    createDeal,
    loading: dealsLoading,
    error: dealsError
  } = useDeals();
  
  const {
    getUsers,
    getProfile,
    loading: usersLoading,
    error: usersError
  } = useUsers();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load leads
      const leadsResponse = await getLeads({ page: 1, limit: 10 });
      if (leadsResponse?.data) {
        setLeads(leadsResponse.data);
      }

      // Load deals
      const dealsResponse = await getDeals({ page: 1, limit: 10 });
      if (dealsResponse?.data) {
        setDeals(dealsResponse.data);
      }

      // Load users
      const usersResponse = await getUsers({ page: 1, limit: 10 });
      if (usersResponse?.data) {
        setUsers(usersResponse.data);
      }

      // Load current user profile
      const profileResponse = await getProfile();
      if (profileResponse?.data) {
        setCurrentUser(profileResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateLead = async () => {
    const newLead = {
      name: 'Test Lead',
      email: 'test@example.com',
      company: 'Test Company',
      status: 'new' as const
    };

    const result = await createLead(newLead);
    if (result?.data) {
      setLeads(prev => [result.data, ...prev]);
    }
  };

  const handleCreateDeal = async () => {
    const newDeal = {
      title: 'Test Deal',
      amount: 10000,
      currency: 'USD',
      stage: 'Lead' as const,
      probability: 25
    };

    const result = await createDeal(newDeal);
    if (result?.data) {
      setDeals(prev => [result.data, ...prev]);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leads':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Leads</h3>
              <button
                onClick={handleCreateLead}
                disabled={leadsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {leadsLoading ? 'Creating...' : 'Create Test Lead'}
              </button>
            </div>
            
            {leadsError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {leadsError.message}
              </div>
            )}
            
            <div className="grid gap-4">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{lead.name}</h4>
                  <p className="text-gray-600">{lead.email}</p>
                  <p className="text-sm text-gray-500">{lead.company}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'deals':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Deals</h3>
              <button
                onClick={handleCreateDeal}
                disabled={dealsLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {dealsLoading ? 'Creating...' : 'Create Test Deal'}
              </button>
            </div>
            
            {dealsError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {dealsError.message}
              </div>
            )}
            
            <div className="grid gap-4">
              {deals.map((deal) => (
                <div key={deal.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{deal.title}</h4>
                  <p className="text-gray-600">
                    {deal.amount} {deal.currency}
                  </p>
                  <p className="text-sm text-gray-500">Stage: {deal.stage}</p>
                  <p className="text-sm text-gray-500">Probability: {deal.probability}%</p>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'users':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Users</h3>
            
            {usersError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {usersError.message}
              </div>
            )}
            
            {currentUser && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold">Current User</h4>
                <p>{currentUser.name}</p>
                <p className="text-gray-600">{currentUser.email}</p>
                <p className="text-sm text-gray-500">Role: {currentUser.role}</p>
              </div>
            )}
            
            <div className="grid gap-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{user.name}</h4>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">Role: {user.role}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Backend-Go API Integration Example</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {(['leads', 'deals', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {renderTabContent()}
      </div>
      
      {/* Loading Indicator */}
      {(leadsLoading || dealsLoading || usersLoading) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
          Loading...
        </div>
      )}
    </div>
  );
};

export default BackendGoExample;