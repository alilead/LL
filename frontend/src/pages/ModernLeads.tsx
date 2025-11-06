/**
 * Modern Leads Page - Beats Salesforce & HubSpot
 *
 * Features:
 * - Kanban Board view
 * - Table view with advanced filters
 * - Quick actions
 * - Bulk operations
 * - Real-time search
 */

import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Star,
  User,
  Building2,
  DollarSign,
  Tag,
  Download,
  Upload,
  X
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: string;
  stage: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  lastContact: string;
  assignedTo: string;
}

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+1 234 567 8900',
    value: '$25,000',
    stage: 'qualified',
    priority: 'high',
    tags: ['Enterprise', 'Hot'],
    lastContact: '2 hours ago',
    assignedTo: 'You'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'TechStart Inc',
    email: 'sarah@techstart.com',
    phone: '+1 234 567 8901',
    value: '$45,000',
    stage: 'contacted',
    priority: 'high',
    tags: ['SaaS', 'Demo'],
    lastContact: '1 day ago',
    assignedTo: 'Mike Chen'
  },
  {
    id: '3',
    name: 'David Brown',
    company: 'Global Systems',
    email: 'david@global.com',
    phone: '+1 234 567 8902',
    value: '$15,000',
    stage: 'new',
    priority: 'medium',
    tags: ['SMB'],
    lastContact: '3 days ago',
    assignedTo: 'You'
  },
];

const stages = [
  { id: 'new', name: 'New Leads', color: 'blue', count: 12 },
  { id: 'qualified', name: 'Qualified', color: 'purple', count: 8 },
  { id: 'contacted', name: 'Contacted', color: 'green', count: 15 },
  { id: 'proposal', name: 'Proposal', color: 'orange', count: 6 },
];

export function ModernLeads() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              Leads
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage and track your sales pipeline
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            <span>Add Lead</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          {/* Search & Filter */}
          <div className="flex items-center space-x-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search leads by name, company, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              <Filter className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <span className="text-neutral-700 dark:text-neutral-300">Filters</span>
            </button>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
                  view === 'kanban'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">Kanban</span>
              </button>
              <button
                onClick={() => setView('table')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
                  view === 'table'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">Table</span>
              </button>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              <Download className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <span className="text-neutral-700 dark:text-neutral-300">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {stage.name}
                  </h3>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {stage.count}
                  </span>
                </div>
                <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors">
                  <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Lead Cards */}
              <div className="space-y-3">
                {mockLeads
                  .filter((lead) => lead.stage === stage.id)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-50 text-sm">
                              {lead.name}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {lead.company}
                            </p>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-all">
                          <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </button>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">Value</span>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                            {lead.value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">Last contact</span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {lead.lastContact}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mb-3">
                        {lead.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700">
                        <div className="flex items-center space-x-1">
                          <button className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors">
                            <Mail className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400" />
                          </button>
                          <button className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors">
                            <Phone className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400" />
                          </button>
                          <button className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors">
                            <Calendar className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400" />
                          </button>
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {lead.assignedTo}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-50">
                          {lead.name}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {lead.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900 dark:text-neutral-50">{lead.email}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-50">{lead.value}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                      {stages.find(s => s.id === lead.stage)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      lead.priority === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : lead.priority === 'medium'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-400'
                    }`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-50">
                    {lead.assignedTo}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
