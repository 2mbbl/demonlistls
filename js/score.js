/**
 * Numbers of decimal digits to round to
 */
const scale = 3;
 
/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number}
 */
/**
 * Boomerang curve tuning constants.
 * Shape: dốc xuống nhanh ở đầu (top ranks) -> gần như phẳng ở giữa
 * (điểm giữa các rank không quá chênh nhau) -> dốc xuống nhanh ở cuối.
 *
 *   MAX_SCORE        điểm của rank #1
 *   TOP_ZONE_END     rank cuối cùng của "vùng dốc đầu" (rank 1..TOP_ZONE_END)
 *   PLATEAU_START    điểm ở đầu vùng phẳng (rank = TOP_ZONE_END)
 *   PLATEAU_END      điểm ở cuối vùng phẳng (rank = BOTTOM_ZONE_START)
 *   BOTTOM_ZONE_START rank đầu tiên của "vùng dốc cuối"
 *   MIN_SCORE        điểm ở rank cuối cùng (175)
 *   MAX_RANK         rank cuối cùng còn được tính điểm
 */
const MAX_SCORE = 500;
const TOP_ZONE_END = 50;
const PLATEAU_START = 150;
const PLATEAU_END = 90;
const BOTTOM_ZONE_START = 150;
const MIN_SCORE = 5;
const MAX_RANK = 175;

/**
 * Nội suy mượt (ease-in-out) từ 0 -> 1, dốc ở hai đầu, phẳng ở giữa
 * khi dùng lồng vào 3 vùng bên dưới.
 */
function smoothstep(t) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
}

/**
 * Điểm gốc (100%) theo rank, dạng đường cong "boomerang":
 * dốc - phẳng (điểm không quá chênh) - dốc.
 * @param {Number} rank
 * @returns {Number}
 */
function rankScore(rank) {
    if (rank <= 1) {
        return MAX_SCORE;
    }
    if (rank <= TOP_ZONE_END) {
        // Vùng dốc đầu: MAX_SCORE -> PLATEAU_START
        let t = (rank - 1) / (TOP_ZONE_END - 1);
        return MAX_SCORE - (MAX_SCORE - PLATEAU_START) * smoothstep(t);
    }
    if (rank <= BOTTOM_ZONE_START) {
        // Vùng phẳng ở giữa: giảm nhẹ, đều, không quá chênh nhau
        let t = (rank - TOP_ZONE_END) / (BOTTOM_ZONE_START - TOP_ZONE_END);
        return PLATEAU_START - (PLATEAU_START - PLATEAU_END) * t;
    }
    // Vùng dốc cuối: PLATEAU_END -> MIN_SCORE
    let t = (rank - BOTTOM_ZONE_START) / (MAX_RANK - BOTTOM_ZONE_START);
    return PLATEAU_END - (PLATEAU_END - MIN_SCORE) * smoothstep(t);
}

export function score(rank, percent, minPercent) {
    if (rank > MAX_RANK) {
        return 0;
    }
    if (rank > MAX_RANK && percent < 100) {
        return 0;
    }
 
    // Old formula (sqrt, giảm dần đều)
    /*
    let score = (100 / Math.sqrt((rank - 1) / 50 + 0.444444) - 50) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
    */
    // Old "new formula" (sqrt tuyến tính hơn)
    /*
    let score = (-22.543*Math.pow(rank-1, 0.5) + 500) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
    */
    // Boomerang formula: cao - trung bình (không quá chênh) - thấp
    let score = rankScore(rank) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
 
    score = Math.max(0, score);
 
    if (percent != 100) {
        return round(score - score / 3);
    }
 
    return Math.max(round(score), 0);
}

/**
 * Calculate the score awarded to a 100% record holder based on the order
 * in which they completed the level (position 1 = first person after the
 * verifier, 2 = second, etc). Uses a percentage of the level's base rating
 * for the first 15 spots, then flat point values afterwards.
 * @param {Number} baseRating The level's base 100% rating (verifier's score)
 * @param {Number} position 1-based position among the level's record holders
 * @returns {Number}
 */
export function recordScore(baseRating, position) {
    let percent;
    switch (true) {
        case position === 1:
            percent = 0.5;
            break;
        case position === 2:
            percent = 0.3;
            break;
        case position === 3:
            percent = 0.2;
            break;
        case position === 4:
            percent = 0.06;
            break;
        case position === 5:
            percent = 0.05;
            break;
        case position === 6:
            percent = 0.04;
            break;
        case position <= 8:
            percent = 0.03;
            break;
        case position <= 12:
            percent = 0.02;
            break;
        case position <= 15:
            percent = 0.01;
            break;
        case position <= 25:
            return round(5);
        default:
            return round(1);
    }
    return round(baseRating * percent);
}

/**
 * Calculate the score awarded to a progress (non-100%) record, based on
 * where it ranks among the user's own progress records (by score, highest
 * first) and whether the user has 15 or more 100%-completed levels.
 * @param {Number} baseScore The record's original score (from `score()`)
 * @param {Number} position 1-based rank among the user's progress records
 * @param {Boolean} has15Completions Whether the user has >= 15 100% completions
 * @returns {Number}
 */
export function progressScore(baseScore, position, has15Completions) {
    if (!has15Completions) {
        switch (true) {
            case position === 1:
                return round((baseScore / 4) * 0.5);
            case position === 2:
                return round((baseScore / 4) * 0.3);
            case position === 3:
                return round((baseScore / 4) * 0.2);
            case position === 4:
                return round((baseScore / 4) * 0.06);
            case position === 5:
                return round((baseScore / 4) * 0.03);
            case position <= 15:
                return round(5);
            default:
                return round(1);
        }
    }

    switch (true) {
        case position <= 5:
            return round(10);
        case position <= 15:
            return round(5);
        default:
            return round(1);
    }
}
 
export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}
