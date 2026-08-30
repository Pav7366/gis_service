export interface LoginFormData {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
  username?: string;
  email?: string;
}
export interface FormErrors {
  emailOrUsername?: string;
  username?: string;
  email?: string;
  password?: string;
  general?: string;
}
export type AuthMode = 'login' | 'register' | 'forgot_password';
export interface BackgroundOption {
  id: string;
  name: string;
  url: string;
  description: string;
}