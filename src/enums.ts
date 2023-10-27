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

enum Player {
    N = 'N',
    S = 'S',
    E = 'E',
    W = 'W'
}

function charToPlayer(char: string): Player {
    switch (char) {
        case 'N':
            return Player.N;
        case 'S':
            return Player.S;
        case 'E':
            return Player.E;
        case 'W':
            return Player.W;
        default:
            throw new Error(`Invalid player: ${char}`);
    }
}

function getNextPlayer(currentPlayer: Player): Player {
    switch (currentPlayer) {
        case Player.N:
            return Player.E;
        case Player.E:
            return Player.S;
        case Player.S:
            return Player.W;
        case Player.W:
            return Player.N;
        default:
            throw new Error('Invalid player');
    }
}

export { Suit, CardRank, Player, getNextPlayer, charToPlayer };
