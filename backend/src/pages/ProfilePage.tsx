import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/auth';
import { Header } from '../components/layout/Header';
import { toast } from 'react-hot-toast';
import { updateProfile, changePassword, User as UserType } from '../services/users';
import { linkedinAPI } from '@/services/linkedin';
import axios from '@/services/axios';
import { Globe, Loader2, CreditCard, Shield, User, Mail, Key, ExternalLink, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { useLocation } from 'react-router-dom';

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

// TokenPurchaseModal component'i
const TokenPurchaseModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const tokenPackages = [
    { id: 1, tokens: 50, price: 50, name: 'Basic', color: 'bg-blue-50 border-blue-200' },
    { id: 2, tokens: 100, price: 100, name: 'Pro', color: 'bg-purple-50 border-purple-200' },
    { id: 3, tokens: 500, price: 500, name: 'Enterprise', color: 'bg-orange-50 border-orange-200' }
  ];

  const handlePurchase = async (packageId: number) => {
    try {
      const response = await axios.post('/tokens/create-checkout-session', {
        package_id: packageId
      });
      
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Failed to initiate purchase');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <DialogTitle className="text-2xl font-bold mb-2">Purchase Tokens</DialogTitle>
          <DialogDescription className="text-white/90 text-base">
            Select a token package to purchase. Each token allows you to retrieve valuable lead information.
          </DialogDescription>
        </div>
        <div className="p-6">
          <div className="grid gap-4 py-2">
            {tokenPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`flex items-center justify-between p-5 rounded-lg border-2 hover:border-blue-500 transition-all duration-200 hover:shadow-md ${pkg.color}`}
              >
                <div>
                  <h4 className="font-semibold text-lg">{pkg.name}</h4>
                  <div className="flex items-center mt-1">
                    <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                    <p className="text-sm font-medium text-blue-700">{pkg.tokens} Tokens</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">${pkg.price} USD</p>
                </div>
                <Button 
                  variant="default"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-5 py-2 shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => handlePurchase(pkg.id)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-6 text-center">
            Payments are securely processed via Stripe. Your tokens will be immediately available after purchase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function ProfilePage() {
  const { user, token, fetchUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [tokenPurchaseModalOpen, setTokenPurchaseModalOpen] = useState(false)
  const location = useLocation()

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<ProfileForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  // İlk yükleme ve kullanıcı verisi çekme
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        await fetchUser()
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        setError('Failed to load profile data')
      }
    }

    initializeProfile()
  }, [fetchUser])

  // Form verilerini güncelleme
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
      })
    }
  }, [user, reset])

  // Stripe checkout session kontrolü
  useEffect(() => {
    const checkStripeSession = async () => {
      const queryParams = new URLSearchParams(location.search);
      const sessionId = queryParams.get('session_id');
      
      if (sessionId) {
        try {
          // Önce kısa bir bekleme süresi ekleyelim - webhook işlemlerinin tamamlanması için
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Stripe session ID'si var, token bakiyesini yenileyelim
          // Birkaç kez deneme yapalım - bazen webhook işlemi gecikebilir
          let attempts = 0;
          let maxAttempts = 3;
          let success = false;
          
          while (attempts < maxAttempts && !success) {
            try {
              const response = await axios.get('/tokens/balance');
              
              if (response.data.balance) {
                setTokenBalance(response.data.balance);
                success = true;
                
                // Başarılı ödeme bildirimi
                toast.success('Token purchase successful! Your balance has been updated.');
              } else {
                // Yeni bakiye alınamadı, bekleyelim ve tekrar deneyelim
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            } catch (error) {
              console.error(`Error on attempt ${attempts + 1}:`, error);
              // Hata durumunda da bekleyelim
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            attempts++;
          }
          
          if (!success) {
            // Son bir kez daha deneyelim
            try {
              const response = await axios.get('/tokens/balance');
              setTokenBalance(response.data.balance);
              toast.success('Token purchase successful! Your balance has been updated.');
            } catch (error) {
              console.error('Final error checking token balance:', error);
              toast.error('Failed to update token balance. Please refresh the page.');
            }
          }
          
          // Kullanıcı bilgilerini de yenileyelim
          try {
            await fetchUser();
          } catch (userRefreshError) {
            console.error("Error refreshing user information:", userRefreshError);
          }
          
          // URL'den session_id parametresini temizleyelim
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          // Session ID'yi localStorage'a kaydedelim - manuel doğrulama için kullanılabilir
          if (sessionId) {
            localStorage.setItem('lastStripeSessionId', sessionId);
            setLastSessionId(sessionId);
          }
        } catch (error) {
          console.error('Error checking token balance:', error);
          toast.error('Failed to update token balance. Please refresh the page.');
        }
      }
    };
    
    checkStripeSession();
  }, [location.search, fetchUser]);
  
  // Session ID state'i ve manuel token doğrulama fonksiyonu
  const [lastSessionId, setLastSessionId] = useState<string | null>(
    localStorage.getItem('lastStripeSessionId')
  );
  
  const handleManualConfirmation = async () => {
    if (!lastSessionId) {
      toast.error('No recent token purchase session found');
      return;
    }
    
    try {
      toast.loading('Manually confirming your token purchase...');
      
      // Önce token bakiyesini alalım
      const balanceResponse = await axios.get('/tokens/balance');
      const initialBalance = balanceResponse.data.balance;
      
      // Manuel token doğrulama endpoint'ini çağır
      const response = await axios.post('/tokens/confirm-session', {
        session_id: lastSessionId
      });
      
      if (response.data.success) {
        // Başarıyla doğrulandı, yeni bakiyeyi alalım
        const newBalanceResponse = await axios.get('/tokens/balance');
        setTokenBalance(newBalanceResponse.data.balance);
        
        // Ne kadar token eklendiğini hesapla
        const addedTokens = newBalanceResponse.data.balance - initialBalance;
        
        toast.dismiss();
        toast.success(`Token purchase confirmed! ${addedTokens} tokens added to your account.`);
        
        // Session ID'yi temizle
        localStorage.removeItem('lastStripeSessionId');
        setLastSessionId(null);
        
        // Kullanıcı bilgilerini güncelle
        await fetchUser();
      } else {
        toast.dismiss();
        toast.error('Failed to confirm token purchase. Please contact support.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error confirming token purchase:', error);
      toast.error('Error confirming token purchase. Please try again later.');
    }
  };

  // Token bakiyesini getir
  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        const response = await axios.get('/tokens/balance');
        setTokenBalance(response.data.balance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
      }
    };
    
    fetchTokenBalance();
  }, []);

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    setError(null)

    try {
      // Profile update
      if (data.firstName || data.lastName || data.email !== user?.email) {
        await updateProfile({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
        })
      }

      // Password change
      if (data.currentPassword && data.newPassword) {
        await changePassword(data.currentPassword, data.newPassword)
      }

      await fetchUser()
      toast.success('Profile updated successfully')
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      setError(err.response?.data?.message || 'Failed to update profile')
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  };

  // LinkedIn bağlantı durumunu kontrol et
  const { data: linkedinStatus } = useQuery({
    queryKey: ['linkedin-status'],
    queryFn: async () => {
      const response = await axios.get('/linkedin/status');
      return response.data;
    }
  });

  // LinkedIn bağlantısını kaldır
  const disconnectLinkedInMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/linkedin/disconnect');
      return response.data;
    },
    onSuccess: () => {
      toast.success('LinkedIn disconnected successfully');
      queryClient.invalidateQueries({ queryKey: ['linkedin-status'] });
    },
    onError: () => {
      toast.error('Failed to disconnect LinkedIn');
    }
  });

  const handleConnectLinkedIn = () => {
    linkedinAPI.authorize();
  };

  const handleDisconnectLinkedIn = () => {
    if (window.confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      disconnectLinkedInMutation.mutate();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center space-x-6">
                <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
                <div className="space-y-3 flex-1">
                  <div className="h-7 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="h-7 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <div className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</div>
              <div className="text-base text-red-600 mb-6">{error}</div>
              <Button 
                onClick={() => fetchUser()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
        
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32"></div>
            <div className="px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 mb-6">
                <div className="relative rounded-full border-4 border-white bg-white shadow-lg h-32 w-32 overflow-hidden">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user ? `${user.first_name} ${user.last_name}` : 'User'}&background=0D8ABC&color=fff&size=128`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user ? `${user.first_name} ${user.last_name}` : 'User'}
                  </h1>
                  <p className="mt-1 text-gray-500 flex items-center justify-center sm:justify-start">
                    <Mail className="w-4 h-4 mr-2" /> {user?.email}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                  {user?.is_admin && (
                    <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                      <Shield className="w-4 h-4 mr-1" /> Admin
                    </div>
                  )}
                  <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    <User className="w-4 h-4 mr-1" /> Active
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-col sm:flex-row">
                  <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    <Zap className="w-4 h-4 mr-1" /> 
                    {tokenBalance !== null ? tokenBalance : (user as any)?.tokens || 0} Tokens
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-sm"
                    onClick={() => setTokenPurchaseModalOpen(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy Tokens
                  </Button>
                  
                  {/* Manuel token doğrulama butonu */}
                  {lastSessionId && (
                    <Button 
                      onClick={handleManualConfirmation}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-amber-500 text-amber-700 hover:bg-amber-50 w-full flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Confirm Recent Purchase
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" /> Personal Information
                  </h2>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            {...register('firstName', { required: 'First name is required' })}
                            type="text"
                            className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors placeholder:text-gray-400"
                            placeholder="Enter your first name"
                          />
                          {errors.firstName ? (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : null}
                        </div>
                        {errors.firstName && (
                          <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            {...register('lastName', { required: 'Last name is required' })}
                            type="text"
                            className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors placeholder:text-gray-400"
                            placeholder="Enter your last name"
                          />
                          {errors.lastName ? (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : null}
                        </div>
                        {errors.lastName && (
                          <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="email"
                            value={user?.email}
                            disabled
                            className="block w-full rounded-md border-gray-300 bg-gray-50 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Change Section */}
                    <div className="pt-6">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-3 text-sm text-gray-500 flex items-center">
                            <Key className="w-4 h-4 mr-2 text-gray-400" />
                            Change Password
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Current Password
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                              {...register('currentPassword')}
                              type="password"
                              className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                              placeholder="Enter current password"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Key className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            New Password
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                              {...register('newPassword', {
                                minLength: {
                                  value: 8,
                                  message: 'Password must be at least 8 characters'
                                }
                              })}
                              type="password"
                              className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                              placeholder="Enter new password"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Key className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          {errors.newPassword && (
                            <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                              {...register('confirmPassword', {
                                validate: value => !watch('newPassword') || value === watch('newPassword') || 'Passwords do not match'
                              })}
                              type="password"
                              className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                              placeholder="Confirm new password"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Key className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column - Account Settings */}
            <div className="lg:col-span-1">
              {/* Token Management Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" /> Tokens
                  </h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Tokens are used to retrieve lead information and perform actions
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {tokenBalance !== null ? tokenBalance : (user as any)?.tokens || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Tokens</p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => setTokenPurchaseModalOpen(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-sm"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase Tokens
                  </Button>
                </div>
              </div>
              
              {/* LinkedIn Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2 text-blue-600" /> LinkedIn Connection
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-center text-amber-700 font-medium">
                      To be available soon
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    LinkedIn connection feature is currently under development. You will be able to connect your account in the near future.
                  </p>
                  <Button 
                    variant="default" 
                    disabled
                    className="w-full bg-[#0077B5] hover:bg-[#005885] text-white shadow-sm opacity-60 cursor-not-allowed"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Connect LinkedIn
                  </Button>
                </div>
              </div>
              
              {/* Account Status Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" /> Account Status
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Status</h4>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Account Type</h4>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user?.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.is_admin ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TokenPurchaseModal 
        open={tokenPurchaseModalOpen} 
        onOpenChange={setTokenPurchaseModalOpen}
      />
    </div>
  );
}
