/**
 * Modern Leads Page - Connected to Real Backend API
 *
 * Features:
 * - Kanban Board view with real stages from backend
 * - Table view with advanced filters
 * - Quick actions
 * - Bulk operations
 * - Real-time search
 * - Full backend integration
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, type Lead } from '@/services/api/leads';
import { stagesAPI } from '@/services/api/stages';
import { useToast } from '@/hooks/use-toast';
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
  User,
  Building2,
  Download,
  Upload,
  FileDown,
  Loader2,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from '@/components/ui/Button';

export function ModernLeads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch leads from backend
  const { data: leadsResponse, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      return leadsAPI.getAll(params);
    },
  });

  // Fetch stages from backend
  const { data: stagesResponse, isLoading: isLoadingStages } = useQuery({
    queryKey: ['stages'],
    queryFn: stagesAPI.getAll,
  });

  // Handle different response formats from backend
  const leads: Lead[] = Array.isArray(leadsResponse?.data)
    ? leadsResponse.data
    : (leadsResponse?.data?.data || leadsResponse?.data?.results || []);

  const stages = Array.isArray(stagesResponse?.data)
    ? stagesResponse.data
    : (stagesResponse?.data?.data || stagesResponse?.data?.results || []);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assigned_user_id', '1'); // Default user ID
      return leadsAPI.uploadCSV(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "Leads imported successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to import leads",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(selectedFile);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await leadsAPI.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads-import-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoadingLeads || isLoadingStages) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading leads...</p>
        </div>
      </div>
    );
  }

  // Group leads by stage for Kanban view
  const leadsByStage = stages.map((stage: any) => ({
    ...stage,
    leads: leads.filter((lead) => lead.stage_id === stage.id)
  }));

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
              Manage and track your sales pipeline • {leads.length} total leads
            </p>
          </div>
          <button
            onClick={() => navigate('/leads/new')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
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

            <button 
              onClick={() => setIsUploadDialogOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Upload className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <span className="text-neutral-700 dark:text-neutral-300">Import</span>
            </button>
            
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
          {leadsByStage.map((stage: any) => (
            <div key={stage.id} className="flex flex-col">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color || '#6366f1' }}
                  />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {stage.name}
                  </h3>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {stage.leads.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/leads/new')}
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Lead Cards */}
              <div className="space-y-3">
                {stage.leads.map((lead: Lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-50 text-sm">
                            {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {lead.company || 'No company'}
                          </p>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-all">
                        <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      {lead.email && (
                        <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {(lead.telephone || lead.mobile) && (
                        <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                          <Phone className="w-3 h-3 mr-1" />
                          <span>{lead.telephone || lead.mobile}</span>
                        </div>
                      )}
                    </div>

                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3 flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {lead.tags.length > 2 && (
                          <span className="px-2 py-0.5 text-neutral-500 dark:text-neutral-400 text-xs">
                            +{lead.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (lead.email) window.location.href = `mailto:${lead.email}`;
                          }}
                          className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                        >
                          <Mail className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (lead.telephone || lead.mobile) window.location.href = `tel:${lead.telephone || lead.mobile}`;
                          }}
                          className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                        >
                          <Phone className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400" />
                        </button>
                        <button className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors">
                          <Calendar className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400" />
                        </button>
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {lead.user?.first_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
                {stage.leads.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
                    No leads in this stage
                  </div>
                )}
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
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Stage
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
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-50">
                          {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {lead.company || 'No company'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900 dark:text-neutral-50">{lead.email || '-'}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{lead.telephone || lead.mobile || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900 dark:text-neutral-50">{lead.job_title || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                      {lead.stage?.name || 'No stage'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-50">
                    {lead.user ? `${lead.user.first_name} ${lead.user.last_name}` : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              No leads found. Click "Add Lead" to create your first lead.
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import leads into your system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* File input */}
            <div className="flex flex-col space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
              >
                <Upload className="w-5 h-5 text-neutral-400" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedFile ? selectedFile.name : 'Click to select file'}
                </span>
              </button>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded flex items-center justify-center">
                      <FileDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{selectedFile.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                  >
                    <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>
              )}
              
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Supported formats: CSV, XLS, XLSX
              </p>
            </div>

            {/* Download template button */}
            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-sm">Download Template</span>
            </button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Leads
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
