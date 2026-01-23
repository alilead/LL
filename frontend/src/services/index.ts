// Export all services for easy importing
export { default as authService } from './auth';
export { default as usersService } from './users';
export { default as organizationsService } from './organizations';
export { default as leadsService } from './leads';
export { default as tasksService } from './tasks';
export { default as stagesService } from './stages';
export { default as teamInvitationsService } from './teamInvitations';

// Export types for convenience
export type {
  LoginCredentials,
  RegisterData,
  UserInfo,
  TokenResponse,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
  RefreshTokenResponse,
} from './auth';

export type {
  User,
  UserUpdateInput,
  UserProfile,
  ChangePasswordInput,
} from './users';

export type {
  Organization,
  OrganizationCreateInput,
  OrganizationUpdateInput,
  OrganizationMember,
  OrganizationInvite,
  InviteCreateInput,
} from './organizations';

export type {
  Lead,
  LeadActivity,
  LeadCreateInput,
  LeadUpdateInput,
  LeadListResponse,
  LeadFilters,
  LeadStats,
} from './leads';

export type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskListResponse,
  TaskFilters,
  TaskStats,
} from './tasks';

export type {
  Stage,
  StageCreateInput,
  StageUpdateInput,
  StageListResponse,
} from './stages';

export type {
  TeamInvitation,
  InvitationCreateInput,
  InvitationListResponse,
  InvitationFilters,
  InvitationAcceptInput,
} from './teamInvitations';