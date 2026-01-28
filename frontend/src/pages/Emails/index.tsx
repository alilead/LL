import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, RefreshCw, Mail, Inbox, Send, FileText, AlertCircle, Trash2, Archive, Star, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import EmailComposeModal from './EmailComposeModal';
import EmailDetailModal from './EmailDetailModal';
import emailAPI, { EmailMessage, EmailAccount } from '../../services/emailAPI';

const FOLDERS = [
  { name: 'inbox', label: 'Inbox', icon: Inbox },
  { name: 'sent', label: 'Sent', icon: Send },
  { name: 'drafts', label: 'Drafts', icon: FileText },
  { name: 'spam', label: 'Spam', icon: AlertCircle },
  { name: 'trash', label: 'Trash', icon: Trash2 },
];

export const EmailsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch email accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: emailAPI.getAccounts,
  });

  // Fetch emails for selected account and folder
  const { data: emailsData, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: ['emails', selectedAccount, selectedFolder],
    queryFn: () => selectedAccount ? emailAPI.getEmails(selectedAccount, selectedFolder) : Promise.resolve({ emails: [], total: 0, page: 1, total_pages: 1 }),
    enabled: !!selectedAccount,
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: ({ accountId, emailId }: { accountId: number; emailId: number }) =>
      emailAPI.markAsRead(accountId, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', selectedAccount, selectedFolder] });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: ({ accountId, emailId }: { accountId: number; emailId: number }) =>
      emailAPI.deleteEmail(accountId, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', selectedAccount, selectedFolder] });
      setSelectedEmail(null);
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: ({ accountId, emailId }: { accountId: number; emailId: number }) =>
      emailAPI.toggleStar(accountId, emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', selectedAccount, selectedFolder] });
    },
  });

  const syncCalendarMutation = useMutation({
    mutationFn: (accountId: number) => emailAPI.syncCalendar(accountId),
    onSuccess: () => {
      // Show success message
    },
  });

  // Set first account as selected when accounts load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  const handleEmailClick = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.is_read && selectedAccount) {
      markAsReadMutation.mutate({ accountId: selectedAccount, emailId: email.id });
    }
  };

  const handleRefresh = () => {
    refetchEmails();
  };

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM HH:mm');
  };

  const getSenderInitials = (name: string, email: string) => {
    const displayName = name || email;
    return displayName.charAt(0).toUpperCase();
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Email Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No email account has been added yet. You can add an email account from the settings page.
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-4rem)]">
      <div className="flex h-full gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow-sm border flex flex-col">
          <div className="p-4 border-b">
            <Button 
              onClick={() => setIsComposeOpen(true)} 
              className="w-full justify-start font-medium"
              disabled={!selectedAccount}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Email
            </Button>
          </div>

          {/* Account Selector */}
          <div className="p-4 border-b">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Account</Label>
            <Select
              value={selectedAccount?.toString()}
              onValueChange={(value) => setSelectedAccount(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folders */}
          <div className="p-4 flex-1">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Folders</Label>
            <div className="space-y-1">
              {FOLDERS.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.name}
                    onClick={() => setSelectedFolder(folder.name)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedFolder === folder.name
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{folder.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {FOLDERS.find(f => f.name === selectedFolder)?.label}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={emailsLoading}
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={`h-4 w-4 ${emailsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
            {emailsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : emailsData?.emails?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No emails</h3>
                <p className="text-sm text-gray-600">
                  Your {FOLDERS.find(f => f.name === selectedFolder)?.label.toLowerCase()} folder is empty.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {emailsData?.emails?.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !email.is_read ? 'bg-blue-50 hover:bg-blue-100' : ''
                    } ${
                      selectedEmail?.id === email.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {getSenderInitials(email.from_name, email.from_address)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                            {email.from_name || email.from_address}
                          </p>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              {formatEmailDate(email.received_date)}
                            </span>
                            {email.is_starred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate mb-1">
                          {email.subject || '(No Subject)'}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {email.body_text?.substring(0, 150)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isComposeOpen && selectedAccount && (
        <EmailComposeModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          accountId={selectedAccount.toString()}
          onEmailSent={() => {
            refetchEmails();
            setIsComposeOpen(false);
          }}
        />
      )}

      {selectedEmail && selectedAccount && (
        <EmailDetailModal
          email={selectedEmail}
          isOpen={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onDelete={(emailId) => {
            deleteEmailMutation.mutate({ accountId: selectedAccount, emailId });
          }}
          onReply={(email) => {
            setIsComposeOpen(true);
          }}
        />
      )}
    </div>
  );
};