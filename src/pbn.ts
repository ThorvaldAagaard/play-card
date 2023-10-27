import { textToRank } from './utils';
import { Player, getNextPlayer, Suit } from './enums';
import { Deal} from './types';

// Given a PBN string, return a player -> string holding mapping, e.g.
// { N: 'AKQJ.984...', ... }
export function parsePBNStrings(pbn: string): { [key: string]: string } {
    const parts = pbn.split(' ');
    if (parts.length !== 4) {
        throw new Error(`PBN must have four hands (got ${parts.length})`);
    }

    const m = RegExp(/^([NSEW]):/).exec(parts[0]);
    if (!m) {
        throw new Error('PBN must start with either "N:", "S:", "E:", or "W:"');
    }
    parts[0] = parts[0].slice(2);
    let player = m[1] as Player;
    const hands: { [key: string]: string } = {};
    let currentPlayer = player;
    parts.forEach((txt, i) => {
        hands[currentPlayer] = txt;
        currentPlayer = getNextPlayer(currentPlayer);
    });
    return hands;
}

export function parsePBN(pbn: string) {
    const textHands = parsePBNStrings(pbn);

    const deal = {} as Deal;
    Object.entries(textHands).forEach(([player, txt]) => {
        deal[player] = {};
        const suits = txt.split('.');
        if (suits.length !== 4) {
            throw new Error(`${player} must have four suits, got ${suits.length}: ${txt}`);
        }
        suits.forEach((holding, idx) => {
            const suit = Object.values(Suit)[idx]; // Get the Suit value from the enum
            deal[player][suit] = [...holding].map((char) => textToRank(char));
        });
    });
    return deal;
}

// Rotate the PBN string so that firstPlayer is first.
export function rotatePBN(pbn: string, firstPlayer: Player) {
    if (firstPlayer.length !== 1 || 'NSEW'.indexOf(firstPlayer) === -1) {
        throw new Error(`Invalid player: ${firstPlayer}`);
    }
    const textHands = parsePBNStrings(pbn);
    let player = firstPlayer;
    const hands: string[] = [];
    let currentPlayer = player;    do {
        hands.push(textHands[currentPlayer]);
        currentPlayer = getNextPlayer(currentPlayer);
    } while (player !== firstPlayer);
    return `${firstPlayer}:${hands.join(' ')}`;
}
