import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

// Mobile List / Mobile Leaderboard dùng lại code của List / Leaderboard.
// Mỗi bản là một component riêng (object khác nhau) để khi chuyển tab,
// Vue tạo lại trang và tải đúng dữ liệu của list tương ứng.
const MobileList = { ...List, name: 'MobileList' };
const MobileLeaderboard = { ...Leaderboard, name: 'MobileLeaderboard' };

export default [
    { path: '/', component: List, props: { mode: 'main' } },
    { path: '/leaderboard', component: Leaderboard, props: { mode: 'main' } },
    { path: '/mobile', component: MobileList, props: { mode: 'mobile' } },
    {
        path: '/mobile-leaderboard',
        component: MobileLeaderboard,
        props: { mode: 'mobile' },
    },
    { path: '/roulette', component: Roulette },
];
