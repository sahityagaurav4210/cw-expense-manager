export enum RedisConstants {
  LOGIN_NOTIFICATION_CHANNEL_NAME = "login_updates",
  FAILED_LOGIN_NOTIFICATION_CHANNEL_NAME = "failed_login_updates",
  PROFILE_UPDATE_CHANNEL_NAME = "profile_updates",
  SKILL_ADDITION_CHANNEL_NAME = "skill_additions",
  SKILL_UPDATE_CHANNEL_NAME = "skill_updates",
  REQUEST_KEY_PREFIX = "cw-pbb-worker",
  WELCOME_EMAIL_CHANNEL_NAME = "welcome-alerts",
  OTP_EMAIL_CHANNEL_NAME = "otp-alerts",
}

export enum AppLoggerColors {
  error = "red",
  warn = "yellow",
  info = "green",
  http = "magenta",
  debug = "cyan",
}

export const AppLoggerLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

export enum AppEnvironments {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
  LOCAL = "local",
}

export enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  INTERNAL_SERVER_ERROR = 500,
}

export enum ApiStatus {
  SUCCESS = "success",
  ERROR = "error",
  BAD_REQUEST = "bad_request",
}
