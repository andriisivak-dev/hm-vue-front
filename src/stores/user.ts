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
}

export const useUserStore = defineStore('user', {
    state: (): UserState => {
        // Read initial data from the global HM_API object injected by WordPress
        const apiData = window.HM_API;

        return {
            // @ts-ignore
            user: apiData?.user || null,
            // @ts-ignore
            isLoggedIn: apiData?.isLoggedIn || false,
            // @ts-ignore
            logoutUrl: apiData?.logoutUrl || '/logout'
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
