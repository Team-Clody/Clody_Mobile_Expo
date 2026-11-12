import axios, {
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import { ReissueTokenResponseDTO } from '@/api/dto/response/reissueTokenResponseDTO';
import { tokenStorage } from '@/shared/storage/tokenStorage';
import { getDeviceTimeZone } from '@/shared/utils/timezone';
import { getDeviceLocale } from '@/shared/utils/locale';
import { useAppStore } from '@/store/useAppStore';

export const BASE_URL = 'https://test.clodycorp.com';

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  data?: any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export enum HeaderType {
  AUTH_CODE = 'AUTH_CODE',
  NON_AUTH = 'NON_AUTH',
  PLATFORM_TOKEN = 'PLATFORM_TOKEN',
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  POST_DIARY = 'POST_DIARY',
  TIME_ZONE = 'TIME_ZONE',
  TIME_ZONE_LANGUAGE = 'TIME_ZONE_LANGUAGE',
}

export const APIConstants = {
  contentType: 'Content-Type',
  applicationJSON: 'application/json',
  auth: 'Authorization',
  access: 'accessToken',
  refresh: 'refreshToken',
  Bearer: 'Bearer ',
  timeZone: 'Time-Zone',
  acceptLanguage: 'Accept-Language',
};

export const getHeaders = async (
  type: HeaderType,
  platformToken?: string,
): Promise<Record<string, string>> => {
  const {
    contentType,
    applicationJSON,
    auth,
    Bearer,
    timeZone,
    acceptLanguage,
  } = APIConstants;

  const timeZoneCode = getDeviceTimeZone();
  const localeCode = getDeviceLocale();

  switch (type) {
    case HeaderType.AUTH_CODE: {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        throw new Error('accessToken이 없습니다.');
      }
      return {
        [contentType]: applicationJSON,
        [auth]: Bearer + accessToken,
      };
    }

    case HeaderType.NON_AUTH: {
      return {
        [contentType]: applicationJSON,
      };
    }

    case HeaderType.PLATFORM_TOKEN: {
      return {
        [contentType]: applicationJSON,
        [auth]: Bearer + (platformToken || ''),
      };
    }

    case HeaderType.ACCESS_TOKEN: {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        throw new Error('accessToken이 없습니다.');
      }
      return {
        [contentType]: applicationJSON,
        [auth]: Bearer + accessToken,
      };
    }

    case HeaderType.REFRESH_TOKEN: {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('refreshToken이 없습니다.');
      }
      return {
        [auth]: Bearer + refreshToken,
      };
    }

    case HeaderType.POST_DIARY: {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        throw new Error('accessToken이 없습니다.');
      }
      return {
        [contentType]: applicationJSON,
        [auth]: Bearer + accessToken,
        [timeZone]: timeZoneCode,
        [acceptLanguage]: localeCode,
      };
    }

    case HeaderType.TIME_ZONE: {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        throw new Error('accessToken이 없습니다.');
      }
      return {
        [contentType]: applicationJSON,
        [auth]: Bearer + accessToken,
        [timeZone]: timeZoneCode,
      };
    }

    case HeaderType.TIME_ZONE_LANGUAGE: {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        throw new Error('accessToken이 없습니다.');
      }
      return {
        [contentType]: applicationJSON,
        [auth]: Bearer + accessToken,
        [timeZone]: timeZoneCode,
        [acceptLanguage]: localeCode,
      };
    }

    default:
      return {
        [contentType]: applicationJSON,
      };
  }
};

export const APIKit = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  timeoutErrorMessage: 'timeout',
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const operation = (async () => {
    const expectedRefreshToken = await tokenStorage.getRefreshToken();
    try {
      if (!expectedRefreshToken) {
        throw new ApiError(401, 'refreshToken이 없습니다.');
      }
      const resp = await APIKit.get<ApiResponse<ReissueTokenResponseDTO>>(
        '/api/v1/auth/reissue',
        { headers: { Authorization: `Bearer ${expectedRefreshToken}` } },
      );
      const { accessToken, refreshToken } = resp.data.data;

      if (await tokenStorage.getRefreshToken() !== expectedRefreshToken) {
        throw new ApiError(409, '로그인 상태가 변경되어 이전 재발급 결과를 무시했습니다.');
      }
      await tokenStorage.saveTokens(accessToken, refreshToken);
      return accessToken;
    } catch (error) {
      const expired = !expectedRefreshToken ||
        (isAxiosError(error) && error.response?.status === 401);
      const sameSession = await tokenStorage.getRefreshToken() === expectedRefreshToken;
      if (expired && sameSession) {
        await tokenStorage.clearTokens();
        useAppStore.getState().setIsLoggedIn(false);
        throw new ApiError(401, '토큰 재발급에 실패했습니다. 다시 로그인해주세요.');
      }
      // A temporary outage must not clear authentication or delete the FCM token.
      // Likewise, an older request cannot invalidate a newer login session.
      throw error;
    }
  })();
  refreshPromise = operation;
  try {
    return await operation;
  } finally {
    if (refreshPromise === operation) refreshPromise = null;
  }
};

export const createAPIRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  headerType: HeaderType,
  data?: any,
  config?: AxiosRequestConfig,
  platformToken?: string,
) => {
  const headers = await getHeaders(headerType, platformToken);

  return APIKit.request<ApiResponse<T>>({
    ...config,
    method,
    url,
    data,
    headers: {
      ...headers,
      ...config?.headers,
    },
  });
};

APIKit.interceptors.request.use(config => {
  if (!config.headers.get('Content-Type')) {
    config.headers.set('Content-Type', 'application/json');
  }
  return config;
});

APIKit.interceptors.response.use(
  res => res,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 500;

    const originalRequest = {
      ...error.config,
      headers: {
        ...(error.config?.headers || {}),
      },
    } as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/api/v1/auth/reissue')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return APIKit.request(originalRequest);
    }

    return Promise.reject(error);
  },
);
