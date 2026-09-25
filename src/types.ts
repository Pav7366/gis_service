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
export interface HazardTypeMeta {
  type: string;
  label: string;
  color_rgb: [number, number, number];
  color_hex: string;
  radius: number;
}