import { Leader } from "./leader";

export class Bot {
    openingleader: any;

    constructor() {
        this.openingleader = new Leader('../models/model.json');
    }

    getStrainInt(contract: string) {
        return 'NSHDC'.indexOf(contract[1]);
    }

    card32to52(c32: number): number {
        const suit: number = Math.floor(c32 / 8);
        const rank: number = c32 % 8;
        return suit * 13 + rank;
    }

    card52to32(c52: number): number {
        const suit: number = Math.floor(c52 / 13);
        const rank: number = c52 % 13;
        return suit * 8 + Math.min(7, rank);
    }

    encodeCard(cardStr: string): number {
        const suitI: number = 'SHDC'.indexOf(cardStr[0]);
        const cardI: number = 'AKQJT98765432'.indexOf(cardStr[1]);
        return suitI * 13 + cardI;
}

    decodeCard(card52: number): string {
        const suitIndex: number = Math.floor(card52 / 13);
        const cardIndex: number = card52 % 13;
        const suits: string = 'SHDC';
        const cards: string = 'AKQJT98765432';
        return suits[suitIndex] + cards[cardIndex];
    }

    parseHandF(nCards: number) {
        return  (handStr: string): number[] => {
            const x: number[] =  new Array(nCards).fill(0);
            const suits: string[] = handStr.split('.');

            if (suits.length !== 4) {
                throw new Error('Invalid hand string. Expected 4 suits.');
            }

            for (let suitIndex = 0; suitIndex < 4; suitIndex++) {
                for (let card of suits[suitIndex]) {
                    const cardIndex: number = this.getCardIndex(card, nCards);
                    x[suitIndex * (nCards / 4) + cardIndex]++;
                }
            }
            return x;
        };
    }


    getCardIndex(card: string, nCards: number): number {
        if (nCards % 4 !== 0) {
            throw new Error('Invalid number of cards. Expected a multiple of 4.');
        }

        const xCardIndex: number = nCards / 4 - 1;

        const cardIndexLookup: { [key: string]: number } = {
            'A': 0,
            'K': 1,
            'Q': 2,
            'J': 3,
            'T': 4,
            '9': 5,
            '8': 6,
            '7': 7,
            '6': 8,
            '5': 9,
            '4': 10,
            '3': 11,
            '2': 12,
        };
        if (!(card in cardIndexLookup)) {
            return xCardIndex;
        }
        return Math.min(cardIndexLookup[card], xCardIndex);
    }
    
    getShape(hand: string): number[] {
        const suits: string[] = hand.split('.');
        return suits.map(suit => suit.length).slice(0, 4);
    }

    getHcp(hand: string): number {
        const hcp: { [key: string]: number } = { 'A': 4, 'K': 3, 'Q': 2, 'J': 1 };
        return Array.from(hand).reduce((hcpSum, card) => hcpSum + (hcp[card] || 0), 0);
    }

    // Calculate shapes and hcp
    binary_hcp_shape( hands: string[]) {
        // Calculate HCP and shape for each hand
        const hcpValues: number[] = hands.map(hand => (this.getHcp(hand) - 10) / 4);
        const shapeValues: number[] = hands.flatMap(hand => this.getShape(hand));

        const result: number[] = [...hcpValues, ...shapeValues];
        return result
    }
}