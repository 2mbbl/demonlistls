import { fetchCreators } from '../content.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    props: {
        mode: {
            type: String,
            default: 'challenge',
        },
    },
    data: () => ({
        creators: [],
        loading: true,
        selected: 0,
        err: [],
        search: '',
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Bảng xếp hạng có thể sai, vì không tải được các level sau: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <input
                        type="text"
                        class="board-search"
                        v-model="search"
                        placeholder="Tìm creator..."
                    >
                    <p class="board-empty" v-if="creators.length === 0">
                        Chưa có creator nào trong Challenge List.
                    </p>
                    <p class="board-empty" v-else-if="filteredCreators.length === 0">
                        Không tìm thấy creator nào.
                    </p>
                    <table class="board">
                        <tr v-for="{ ientry, i } in filteredCreators" :key="i">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ ientry.total }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player" v-if="entry">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }} level</h3>
                        <h2>Levels đã tạo ({{ entry.levels.length }})</h2>
                        <table class="table">
                            <tr v-for="lvl in entry.levels">
                                <td class="rank">
                                    <p>#{{ lvl.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="lvl.link">{{ lvl.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+1</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.creators[this.selected];
        },
        // Giữ nguyên thứ hạng thật (i) khi lọc
        filteredCreators() {
            const q = this.search.trim().toLowerCase();
            return this.creators
                .map((ientry, i) => ({ ientry, i }))
                .filter(({ ientry }) => ientry.user.toLowerCase().includes(q));
        },
    },
    async mounted() {
        const [creators, err] = await fetchCreators(this.mode);
        this.creators = creators;
        this.err = err;
        this.loading = false;
    },
};
