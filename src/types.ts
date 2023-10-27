import { Player, Suit, CardRank } from './enums';

export interface NextPlayResult {
  player: Player
  plays: {
    suit: string;
    rank: string;
    equals: string[]; // You can replace any[] with a more specific type if needed
    score: number;
  }[];
  tricks: {
    ew: number;
    ns: number;
  };
}

export interface Deal {
  [player: string]: {
    [suit: string]: number[];
  };
}

export class Card {
  constructor(public suit: Suit, public rank: CardRank) { }

  toString(): string {
    return `${this.rank}${this.suit}`;
  }
}

export type Play = {
    card: Card;
    player: Player;
};

export type CompleteTrick = {
    leader: Player;
    winner?: Player; 
    plays: Play[];
};

