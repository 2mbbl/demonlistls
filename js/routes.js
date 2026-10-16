import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

export default [
    { path: '/', component: List, props: { mode: 'main' } },
    { path: '/leaderboard', component: Leaderboard, props: { mode: 'main' } },
    { path: '/mobile', component: List, props: { mode: 'mobile' } },
    {
        path: '/mobile-leaderboard',
        component: Leaderboard,
        props: { mode: 'mobile' },
    },
    { path: '/roulette', component: Roulette },
];
