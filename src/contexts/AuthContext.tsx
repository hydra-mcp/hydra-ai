import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, refreshTokenRequest } from '@/lib/api';

// 定义API响应类型
interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user_info: UserInfo;
}

interface UserInfo {
    id: string;
    username: string;
    // 添加其他用户信息字段
    [key: string]: any;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserInfo | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    getToken: () => string | null;
    getCurrentUser: () => Promise<UserInfo | null>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Time window in milliseconds for caching user info to prevent frequent API calls
const USER_INFO_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUserFetch, setLastUserFetch] = useState<number>(0);

    // 获取当前用户信息 with caching
    const getCurrentUser = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return null;
        }

        // Check if we already have user info and if it's recent
        const now = Date.now();
        if (user && isAuthenticated && (now - lastUserFetch < USER_INFO_CACHE_DURATION)) {
            setLoading(false);
            return user;
        }

        try {
            const userInfo = await apiRequest<UserInfo>('/auth/me', {
                method: 'GET',
            });

            // 验证用户信息的有效性
            if (!userInfo || !userInfo.id || !userInfo.username) {
                console.error('Invalid user data received from /auth/me');
                throw new Error('Invalid user data received');
            }

            setUser(userInfo);
            setIsAuthenticated(true);
            setLastUserFetch(now);
            return userInfo;
        } catch (error) {
            console.error('Failed to get current user:', error);
            // 如果获取用户信息失败，清除认证状态
            logout();

            // 获取详细错误信息
            const errorMessage = error instanceof Error
                ? error.message
                : 'Authentication failed, please login again';

            throw new Error(`User session invalid: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // 检查用户是否已登录 - 仅在初始化时执行一次
    useEffect(() => {
        const checkAuth = async () => {
            // First try to use cached user info from localStorage
            const token = localStorage.getItem('access_token');
            const userInfoStr = localStorage.getItem('user_info');

            if (token && userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);

                    // 验证本地存储的用户信息是否包含必要字段
                    if (!userInfo || !userInfo.id || !userInfo.username) {
                        console.warn('Invalid user info in local storage');
                        throw new Error('Invalid user info');
                    }

                    setUser(userInfo);
                    setIsAuthenticated(true);
                    setLoading(false);

                    // In the background, verify token validity without blocking UI
                    getCurrentUser().catch(err => {
                        console.warn('Background token validation failed:', err);
                        // 验证失败时自动注销
                        logout();
                    });
                    return;
                } catch (e) {
                    console.error('Error parsing cached user info:', e);
                    // 清除无效的用户信息
                    logout();
                }
            }

            // If no cached info, do a full auth check
            try {
                await getCurrentUser();
            } catch (error) {
                console.log('Authentication check failed:', error);
                setLoading(false);
            }
        };

        checkAuth();
        // This effect should only run once on component mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setLoading(true);
            const data = await apiRequest<AuthResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            // 存储令牌到本地存储
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user_info', JSON.stringify(data.user_info));

            setIsAuthenticated(true);
            setUser(data.user_info);
            setLastUserFetch(Date.now());
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        try {
            await refreshTokenRequest();

            // After token refresh, use cached user info if available
            const userInfoStr = localStorage.getItem('user_info');
            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    setUser(userInfo);
                    setIsAuthenticated(true);
                    setLastUserFetch(Date.now());
                    return;
                } catch (e) {
                    console.error('Error parsing user info after token refresh:', e);
                }
            }

            // If no cached info or parsing failed, get fresh user info
            await getCurrentUser();
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            throw error;
        }
    };

    const logout = () => {
        // 清除所有本地存储的令牌和用户信息
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');

        setIsAuthenticated(false);
        setUser(null);
        setLastUserFetch(0);

        // 不在此处重定向，让应用程序根据路由保护处理重定向
    };

    const getToken = () => {
        return localStorage.getItem('access_token');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            refreshToken,
            getToken,
            getCurrentUser,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 