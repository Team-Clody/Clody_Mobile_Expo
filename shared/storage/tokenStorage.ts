import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

class TokenStorage {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  }

  async getTokens(): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
    ]);
  }

  async updateAccessToken(accessToken: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  }
}

export const tokenStorage = new TokenStorage();
