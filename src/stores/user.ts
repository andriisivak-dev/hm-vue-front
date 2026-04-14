import { defineStore } from 'pinia';

interface UserProfile {
    id: number;
    name: string;
    email: string;
    avatar: string;
    memberSince: string;
    role: string;
    permissions: Record<string, boolean>;
}

interface UserState {
    user: UserProfile | null;
    isLoggedIn: boolean;
    logoutUrl: string;
    siteUrl: string;
}

export const useUserStore = defineStore('user', {
    state: (): UserState => {
        // Read initial data from the global HM_API object injected by WordPress
        const apiData = window.HM_API;

        return {
            user: apiData?.user || null,
            isLoggedIn: apiData?.isLoggedIn || false,
            logoutUrl: apiData?.logoutUrl || '/logout',
            siteUrl: apiData?.siteUrl || '/'
        };
    },
    actions: {
        updateAvatar(newAvatarUrl: string) {
            if (this.user) {
                this.user.avatar = newAvatarUrl;
            }
        }
    }
});
