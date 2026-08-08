import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";
 
import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";
 
const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};
 
export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list" :class="{ 'mobile-detail-open': mobileDetailOpen }">
            <div class="list-container">
                <input
                    type="text"
                    class="list-search"
                    v-model="search"
                    placeholder="Tìm level..."
                >
                <table class="list" v-if="list">
                    <tr
                        v-for="([level, err], i) in list"
                        v-show="matchesSearch(level, err)"
                    >
                        <td class="rank">
                            <p v-if="i + 1 <= 175" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selectLevel(i)">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 175"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 175"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>Đội ngũ quản lý</h3>
                        <ol class="editors">
                            <li v-for="(editor, index) in editors" :class="{ 'group-start': index > 0 && editors[index - 1].role !== editor.role }">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Chỉ những player ở Lạng Sơn hoặc có quê quán ở Lạng Sơn
                    </p>
                    <p>
                        Chỉ nhận record thông qua "Submit Record"
                    </p>
                    <p>
                        Từ Insane Demon trở lên cần video chứng minh
                    </p>
                    <p>
                        Từ Extreme Demon trở lên cần video chứng minh và video thô
                    </p>
                    <p>
                        Từ top 176 trở đi sẽ không được cộng điểm
                    </p>
                    <p>
                        Có thể sử dụng link xác nhận hoàn thành trong GDListHub (GDVN), ví dụ: https://www.gdlisthub.dev/vi/record/8fd1509d-fc0b-4771-8f66-0808d009af47/119829177?id=3142
                    </p>
                    <p>
                        Hard/Insane Demon chỉ 100% mới được chấp nhận, còn Extreme Demon sẽ có % cụ thể để được cộng điểm
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        search: "",
        errors: [],
        roleIconMap,
        store,
        mobileDetailOpen: false,
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }
 
            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();
 
        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }
 
        this.loading = false;
    },
    methods: {
        embed,
        score,
        matchesSearch(level, err) {
            if (!this.search.trim()) {
                return true;
            }
            const name = level?.name || err || "";
            return name.toLowerCase().includes(this.search.trim().toLowerCase());
        },
        selectLevel(i) {
            this.selected = i;
            if (window.matchMedia("(max-width: 860px)").matches) {
                this.mobileDetailOpen = true;
                this.$nextTick(() => window.scrollTo(0, 0));
            }
        },
        closeMobileDetail() {
            this.mobileDetailOpen = false;
            this.$nextTick(() => window.scrollTo(0, 0));
        },
    },
};
