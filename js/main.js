import routes from './routes.js';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
    // key của nhóm nav đang mở menu Leaderboard (null = đều đóng)
    openMenu: null,
    toggleMenu(key) {
        this.openMenu = this.openMenu === key ? null : key;
    },
    closeMenu() {
        this.openMenu = null;
    },
});

// 3 list chính, mỗi list có 1 mũi tên mở ra Leaderboard của list đó
const navGroups = [
    { key: 'main', label: 'List', list: '/', board: '/leaderboard' },
    {
        key: 'mobile',
        label: 'Mobile List',
        list: '/mobile',
        board: '/mobile-leaderboard',
    },
    {
        key: 'challenge',
        label: 'Challenge List',
        list: '/challenge',
        board: '/challenge-leaderboard',
    },
];

const app = Vue.createApp({
    data: () => ({ store, navGroups }),
    methods: {
        isGroupActive(group) {
            const path = this.$route.path;
            return path === group.list || path === group.board;
        },
    },
    mounted() {
        // Bấm ra ngoài menu hoặc nhấn Esc thì đóng menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav__group')) store.closeMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') store.closeMenu();
        });
    },
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

// Chuyển trang thì đóng menu
router.afterEach(() => {
    store.closeMenu();
});

app.use(router);

app.mount('#app');
