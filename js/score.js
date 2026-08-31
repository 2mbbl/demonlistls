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
export function score(rank, percent, minPercent) {
    if (rank > 175) {
        return 0;
    }
    if (rank > 175 && percent < 100) {
        return 0;
    }
 
    // Old formula
    /*
    let score = (100 / Math.sqrt((rank - 1) / 50 + 0.444444) - 50) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
    */
    // New formula
    let score = (-22.543*Math.pow(rank-1, 0.6) + 500) *
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
            // Positions 16-25 always award at least 5 points
            return round(5);
        default:
            return round(1);
    }
    // Positions 1-15 also never fall below 5 points
    return Math.max(round(baseRating * percent), 5);
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
