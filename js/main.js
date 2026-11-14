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
        creators: '/challenge-creators',
    },
];

const app = Vue.createApp({
    data: () => ({ store, navGroups }),
    methods: {
        isGroupActive(group) {
            const path = this.$route.path;
            return (
                path === group.list ||
                path === group.board ||
                path === group.creators
            );
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
const isMobileView = () => window.matchMedia('(max-width: 768px)').matches;

// Giao diện điện thoại: cuộn thanh điều hướng để mục đang mở (List, Mobile List...)
// nằm ngay đầu thanh, đúng vào "nấc" tự dừng.
function scrollNavToActive() {
    if (!isMobileView()) return;
    const nav = document.querySelector('header .nav');
    const active =
        nav &&
        nav.querySelector(
            ':scope > .nav__group.active, :scope > .nav__tab.router-link-active'
        );
    if (!active) return;
    const left =
        nav.scrollLeft +
        active.getBoundingClientRect().left -
        nav.getBoundingClientRect().left;
    nav.scrollTo({ left, behavior: 'smooth' });
}

// Giao diện điện thoại: chọn level / người chơi thì tự vuốt sang khung chi tiết
document.addEventListener('click', (e) => {
    if (!isMobileView()) return;
    const btn = e.target.closest(
        '.page-list .list .level button, .page-leaderboard .board .user button'
    );
    if (!btn) return;
    const pane = btn.closest('.page-list, .page-leaderboard');
    requestAnimationFrame(() =>
        pane.scrollTo({ left: pane.clientWidth, behavior: 'smooth' })
    );
});

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

// Chuyển trang thì đóng menu
router.afterEach(() => {
    store.closeMenu();
    Vue.nextTick(scrollNavToActive);
});

app.use(router);

app.mount('#app');

// Mở thẳng một đường dẫn (vd. /#/challenge): đưa mục đó vào đúng nấc ngay khi tải xong
router.isReady().then(() => setTimeout(scrollNavToActive, 0));
