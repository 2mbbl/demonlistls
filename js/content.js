import { round, score, recordScore, progressScore } from './score.js';
 
/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';
 
export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
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
 
export async function fetchLeaderboard() {
    const list = await fetchList();
 
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
            score: recordScore(baseRating, 1),
            link: level.verification,
        });
 
        // Records
        let completedPosition = 1;
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
                completedPosition += 1;
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: recordScore(baseRating, completedPosition),
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
                record.score = progressScore(
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
