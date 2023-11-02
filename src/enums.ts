enum CardRank {
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    Jack = 11,
    Queen = 12,
    King = 13,
    Ace = 14,
}

// Mapping function
export function getRankNumber(rank: CardRank): number {
    if (typeof rank === 'string') {
        switch (rank) {
            case 'T':
                return 10; // Map "T" to 10
            case 'J':
                return 11; // Map "J" to 11
            case 'Q':
                return 12; // Map "Q" to 12
            case 'K':
                return 13; // Map "K" to 13
            case 'A':
                return 14; // Map "A" to 14
            default:
                return parseInt(rank, 10); // Parse other strings as numbers
        }
    } else {
        return rank; // If it's already a number, return it as is
    }
}

enum Suit {
    S = 'S',
    H = 'H',
    D = 'D',
    C = 'C'
};

enum PlayerEnum {
    N = 'N',
    S = 'S',
    E = 'E',
    W = 'W'
}

function charToPlayer(char: string): PlayerEnum {
    switch (char) {
        case 'N':
            return PlayerEnum.N;
        case 'S':
            return PlayerEnum.S;
        case 'E':
            return PlayerEnum.E;
        case 'W':
            return PlayerEnum.W;
        default:
            throw new Error(`Invalid player: ${char}`);
    }
}

function getNextPlayer(currentPlayer: PlayerEnum): PlayerEnum {
    switch (currentPlayer) {
        case PlayerEnum.N:
            return PlayerEnum.E;
        case PlayerEnum.E:
            return PlayerEnum.S;
        case PlayerEnum.S:
            return PlayerEnum.W;
        case PlayerEnum.W:
            return PlayerEnum.N;
        default:
            throw new Error('Invalid player');
    }
}

export { Suit, CardRank, PlayerEnum as Player, getNextPlayer, charToPlayer };
