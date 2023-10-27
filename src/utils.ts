import { SUIT_RANKS } from './constants';
import { Card } from './types';

export function textToRank(txt: string): number {
    if (txt.length != 1) {
        throw new Error('Invalid card symbol: ' + txt);
    }
    if (txt >= '2' && txt <= '9') return Number(txt);
    if (txt == 'T') return 10;
    if (txt == 'J') return 11;
    if (txt == 'Q') return 12;
    if (txt == 'K') return 13;
    if (txt == 'A') return 14;
    throw new Error('Invalid card symbol: ' + txt);
}

export function rankToText(rank: number): string {
    if (rank < 10) return String(rank);
    else if (rank == 10) return 'T';
    else if (rank == 11) return 'J';
    else if (rank == 12) return 'Q';
    else if (rank == 13) return 'K';
    else if (rank == 14) return 'A';
    throw new Error('Invalid card rank: ' + rank);
}

export function formatCard(card: Card): string {
    return rankToText(card.rank) + card.suit;
}

export function compareCards(a: { suit: string, rank: number }, b: { suit: string, rank: number }): number {
    if (a.suit != b.suit) {
        return SUIT_RANKS[a.suit as keyof typeof SUIT_RANKS] - SUIT_RANKS[b.suit as keyof typeof SUIT_RANKS];
    } else {
        return a.rank - b.rank;
    }
}
