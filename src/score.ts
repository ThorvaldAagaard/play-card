const TRICK_VAL: Record<string, number> = {
    'C': 20,
    'D': 20,
    'H': 30,
    'S': 30,
    'N': 30
};

function calculateBaseScore(level: number, strain: string): number {
    let baseScore: number = level * TRICK_VAL[strain];
    if (strain === 'N') {
        baseScore += 10;
    }
    return baseScore;
}

function calculateBonus(level: number, strain: string, doubled: boolean, redoubled: boolean, isVulnerable: boolean): number {
    let bonus: number = 0;

    if (redoubled) {
        bonus += 100;
    } else if (doubled) {
        bonus += 50;
    }

    if (calculateBaseScore(level, strain) < 100) {
        bonus += 50;
    } else {
        bonus += isVulnerable ? 500 : 300;
    }

    if (level === 6) {
        bonus += isVulnerable ? 750 : 500;
    } else if (level === 7) {
        bonus += isVulnerable ? 1500 : 1000;
    }

    return bonus;
}

function calculateOvertrickScore(level: number, strain: string, nTricks: number, target: number, doubled: boolean, redoubled: boolean, isVulnerable: boolean): number {
    const nOvertricks: number = nTricks - target;
    let overtrickScore: number = 0;

    if (redoubled) {
        overtrickScore = nOvertricks * (isVulnerable ? 400 : 200);
    } else if (doubled) {
        overtrickScore = nOvertricks * (isVulnerable ? 200 : 100);
    } else {
        overtrickScore = nOvertricks * TRICK_VAL[strain];
    }

    return overtrickScore;
}

function calculateUndertrickValues(isVulnerable: boolean, redoubled: boolean, doubled: boolean): number[] {
    let undertrickValues: number[] = [];

    if (isVulnerable) {
        undertrickValues = Array(13).fill(100);
        if (redoubled) {
            undertrickValues[0] = 400;
            undertrickValues.fill(600, 1);
        } else if (doubled) {
            undertrickValues[0] = 200;
            undertrickValues.fill(300, 1);
        }
    } else {
        undertrickValues = Array(13).fill(50);
        if (redoubled) {
            undertrickValues[0] = 200;
            undertrickValues[1] = 400;
            undertrickValues.fill(600, 2);
        } else if (doubled) {
            undertrickValues[0] = 100;
            undertrickValues[1] = 200;
            undertrickValues.fill(300, 2);
        }
    }

    return undertrickValues;
}

function calculateFinalScore(
    contract: string,
    isVulnerable: boolean,
    nTricks: number,
    target: number,
    doubled: boolean,
    redoubled: boolean
): number {
    if (nTricks >= target) {
        const baseScore: number = calculateBaseScore(parseInt(contract[0]), contract[1]);
        const bonus: number = calculateBonus(parseInt(contract[0]), contract[1], doubled, redoubled, isVulnerable);
        const overtrickScore: number = calculateOvertrickScore(
            parseInt(contract[0]),
            contract[1],
            nTricks,
            target,
            doubled,
            redoubled,
            isVulnerable
        );
        return baseScore + overtrickScore + bonus;
    } else {
        const nUndertricks: number = target - nTricks;
        const undertrickValues: number[] = calculateUndertrickValues(isVulnerable, redoubled, doubled);
        return -undertrickValues.slice(0, nUndertricks).reduce((acc, val) => acc + val, 0);
    }
}

export function score(contract: string, isVulnerable: boolean, nTricks: number): number {
    if (contract === "Pass") {
        return 0;
    }
    const level: number = parseInt(contract[0]);
    const doubled: boolean = contract.includes('X');
    const redoubled: boolean = contract.includes('XX');
    const target: number = 6 + level;

    return calculateFinalScore(contract, isVulnerable, nTricks, target, doubled, redoubled);
}
