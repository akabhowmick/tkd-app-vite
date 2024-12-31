export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: BaseUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
