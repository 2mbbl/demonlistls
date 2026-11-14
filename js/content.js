import {
    round,
    score,
    recordScore,
    progressScore,
    RANKED_LIMIT,
} from './score.js';
 
/**
 * Path to the directory containing `_editors.json` and the main list
 */
const dir = '/data';

/**
 * Directory containing `_list.json` and all levels of each list.
 * - main:   /data         -> the regular list
 * - mobile: /data/mobile  -> the mobile list (own levels/records)
 * - challenge: /data/challenge -> the challenge list (own levels/records)
 */
const listDirs = {
    main: dir,
    mobile: `${dir}/mobile`,
    challenge: `${dir}/challenge`,
};

export async function fetchList(mode = 'main') {
    const base = listDirs[mode] ?? listDirs.main;
    try {
        const listResult = await fetch(`${base}/_list.json`);
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${base}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}
 
export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}
 
export async function fetchLeaderboard(mode = 'main') {
    const list = await fetchList(mode);
    if (!list) {
        return [[], ['_list']];
    }
 
    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }
 
        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        const baseRating = score(rank + 1, 100, level.percentToQualify);
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: baseRating,
            link: level.verification,
        });
 
        // Records
        level.records.forEach((record) => {
            // Skip the verifier's own 100% record, since it's already
            // counted above in the "Verified" section. Without this,
            // the verifier would be scored twice for the same level.
            if (
                record.percent === 100 &&
                record.user.toLowerCase() === level.verifier.toLowerCase()
            ) {
                return;
            }
 
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: baseRating,
                    link: record.link,
                });
                return;
            }
 
            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });
 
    // Tier each user's own 100% records (verified + completed combined)
    // by their own rating, highest first — position 1 = their single
    // highest-rated 100% completion, regardless of whether it was as
    // verifier or as a regular record holder.
    Object.values(scoreMap).forEach((scores) => {
        const { verified, completed } = scores;
        // Only levels in the top RANKED_LIMIT are tiered. Levels below that
        // keep their flat points (see legacyPoints) and don't take up a tier slot.
        [...verified, ...completed]
            .filter((record) => record.rank <= RANKED_LIMIT)
            .sort((a, b) => b.score - a.score)
            .forEach((record, index) => {
                record.score = recordScore(record.score, index + 1);
            });
    });
 
    // Second pass: tier each user's progress record scores based on how
    // many 100% completions they have, and where each progress record
    // ranks among their own progress records (highest score first).
    Object.values(scoreMap).forEach((scores) => {
        const { verified, completed, progressed } = scores;
        const totalCompletions = verified.length + completed.length;
        const has15Completions = totalCompletions >= 15;
 
        progressed
            .sort((a, b) => b.score - a.score)
            .forEach((record, index) => {
                record.score =
                    record.rank > RANKED_LIMIT
                        ? 0
                        : progressScore(
                              record.score,
                              index + 1,
                              has15Completions,
                          );
            });
    });
 
    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);
 
        return {
            user,
            total: round(total),
            ...scores,
        };
    });
 
    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}

/**
 * Bảng xếp hạng Creators: mỗi level nằm trong list tính 1 điểm cho mỗi creator của level đó.
 * Trả về [danh sách creators đã sắp xếp, danh sách level lỗi].
 */
export async function fetchCreators(mode = 'challenge') {
    const list = await fetchList(mode);
    if (!list) {
        return [[], ['_list']];
    }

    const creatorMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Level có thể có nhiều creator; nếu để trống thì dùng `author`
        let names = Array.isArray(level.creators) ? level.creators : [];
        if (names.length === 0 && level.author) names = [level.author];

        // Tránh tính trùng nếu 1 creator bị ghi 2 lần trong cùng 1 level
        const seen = new Set();
        names.forEach((name) => {
            const lower = String(name).trim().toLowerCase();
            if (!lower || seen.has(lower)) return;
            seen.add(lower);

            // Gộp tên không phân biệt hoa/thường
            const creator =
                Object.keys(creatorMap).find((u) => u.toLowerCase() === lower) ||
                String(name).trim();
            creatorMap[creator] ??= [];
            creatorMap[creator].push({
                rank: rank + 1,
                level: level.name,
                link: level.verification,
            });
        });
    });

    const res = Object.entries(creatorMap).map(([user, levels]) => ({
        user,
        total: levels.length,
        levels,
    }));

    // Nhiều level nhất lên trước; bằng điểm thì ai có level xếp cao hơn trong list đứng trước
    return [
        res.sort(
            (a, b) =>
                b.total - a.total ||
                a.levels[0].rank - b.levels[0].rank ||
                a.user.localeCompare(b.user),
        ),
        errs,
    ];
}
