import { defineStore } from 'pinia';

interface LayoutState {
    sidebarOpen: boolean;
}

export const useLayoutStore = defineStore('layout', {
    state: (): LayoutState => ({
        sidebarOpen: true
    }),
    actions: {
        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
            this.applyBodyClass();
        },
        applyBodyClass() {
            if (this.sidebarOpen) {
                document.body.classList.add('sidebar-open');
                document.body.classList.remove('sidebar-collapse');
            } else {
                document.body.classList.add('sidebar-collapse');
                document.body.classList.remove('sidebar-open');
            }
        },
        init() {
            this.applyBodyClass();
        }
    }
});
