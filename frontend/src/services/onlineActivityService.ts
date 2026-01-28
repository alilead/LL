// Online Activity Tracking Service
interface OnlineUser {
  userId: number;
  lastActivity: number;
  sessionId: string;
}

class OnlineActivityService {
  private static instance: OnlineActivityService;
  private currentUserId: number | null = null;
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'leadlab_online_users';
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly ONLINE_THRESHOLD = 60000; // 1 minute

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeVisibilityListener();
    this.initializeBeforeUnloadListener();
  }

  static getInstance(): OnlineActivityService {
    if (!OnlineActivityService.instance) {
      OnlineActivityService.instance = new OnlineActivityService();
    }
    return OnlineActivityService.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Start tracking when user logs in
  startTracking(userId: number) {
    this.currentUserId = userId;
    this.updateActivity();
    this.startHeartbeat();
    console.log(`🟢 User ${userId} is now ONLINE`);
  }

  // Stop tracking when user logs out
  stopTracking() {
    if (this.currentUserId) {
      console.log(`🔴 User ${this.currentUserId} is now OFFLINE`);
      this.removeUserFromOnlineList(this.currentUserId);
      this.currentUserId = null;
    }
    this.stopHeartbeat();
  }

  // Update user's last activity
  updateActivity() {
    if (!this.currentUserId) return;

    const onlineUsers = this.getOnlineUsers();
    const existingUserIndex = onlineUsers.findIndex(
      user => user.userId === this.currentUserId && user.sessionId === this.sessionId
    );

    const userActivity: OnlineUser = {
      userId: this.currentUserId,
      lastActivity: Date.now(),
      sessionId: this.sessionId
    };

    if (existingUserIndex >= 0) {
      onlineUsers[existingUserIndex] = userActivity;
    } else {
      onlineUsers.push(userActivity);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(onlineUsers));
    window.dispatchEvent(new CustomEvent('onlineUsersUpdated'));
  }

  // Get all currently online users
  getOnlineUserIds(): Set<number> {
    const onlineUsers = this.getOnlineUsers();
    const currentTime = Date.now();
    const activeUsers = new Set<number>();

    // Filter out expired users
    const validUsers = onlineUsers.filter(user => {
      const isActive = (currentTime - user.lastActivity) < this.ONLINE_THRESHOLD;
      if (isActive) {
        activeUsers.add(user.userId);
      }
      return isActive;
    });

    // Update localStorage with only valid users
    if (validUsers.length !== onlineUsers.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validUsers));
    }

    return activeUsers;
  }

  private getOnlineUsers(): OnlineUser[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private removeUserFromOnlineList(userId: number) {
    const onlineUsers = this.getOnlineUsers();
    const filteredUsers = onlineUsers.filter(
      user => !(user.userId === userId && user.sessionId === this.sessionId)
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredUsers));
    window.dispatchEvent(new CustomEvent('onlineUsersUpdated'));
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.updateActivity();
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle page visibility changes
  private initializeVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.currentUserId) {
          this.updateActivity();
          this.startHeartbeat();
        }
      } else {
        this.stopHeartbeat();
      }
    });
  }

  // Handle browser close/refresh
  private initializeBeforeUnloadListener() {
    window.addEventListener('beforeunload', () => {
      this.stopTracking();
    });

    // Also handle page close
    window.addEventListener('pagehide', () => {
      this.stopTracking();
    });
  }

  // Manual activity update (call on user actions)
  recordActivity() {
    this.updateActivity();
  }
}

export const onlineActivityService = OnlineActivityService.getInstance(); 