import { Card, Deal, Play, CompleteTrick, NextPlayResult } from './types';
import { parsePBN } from './pbn';
import { formatCard, rankToText, textToRank } from './utils';
import { Player, Suit, getNextPlayer, charToPlayer, getRankNumber } from './enums';
import { score } from './score';
import { Bot } from './bot';

// Export the class
// Input is a Board in PBN-format. Starting with the player to lead.
export class Board {
    private cards: Deal;
    private lastTrickPBN: string;
    private firstPlayer: Player;
    private contract: string;
    private strain: string;
    private bidding: string;
    private player: Player;
    private plays: Play[];
    private tricks: CompleteTrick[];
    private ew_tricks: number;
    private ns_tricks: number;
    private rules: string[];
    private vulnerability: string;
    private dealer: string;
    private boardNumber: any;
    private bot: Bot;

    /**
     * This is a constructor for a class.
     * @param pbn - Board in PBN-format .
     * @param Dealer - N, S, E or W.
     * @param vulnerability - None, All, NS or EW.
     * @param contract - 4SXN (Four Spades double by North).
     * @param bidding - Bidding as a string 1S-P-2S-P-4S-X-P-P-P.
     * @param plays - Play until now - Array of cards of the form 4S - Four of Spades
     * @param rules - Array of rules to follow when leading
     * @returns An instance of the class.
     */
    constructor(boardNumber: string, pbn: string, dealer: string, vulnerability: string, contract: string, bidding: string, plays: string[], rules: string[]) {
        this.bot = new Bot();
        this.boardNumber = boardNumber;
        this.dealer = dealer;
        this.vulnerability = vulnerability;
        this.cards = parsePBN(pbn);
        this.firstPlayer = this.getLeader(contract);
        this.contract = contract;
        this.strain = this.getStrain(this.contract);
        this.player = this.firstPlayer;
        this.bidding = bidding;
        this.plays = [];
        this.tricks = [];
        this.ew_tricks = 0;
        this.ns_tricks = 0;
        this.rules = rules;
        this.lastTrickPBN = this.toPBN();
    }
    
    async modelsLoaded() {
        await this.bot.initializeModels()
    }

    getScore() {
        let result = 0
        if ([Player.N, Player.S].indexOf(this.getDeclarer()) > -1) {
            let vul = ["NS", "All"].indexOf(this.vulnerability) > -1
            result = score(this.contract, vul, this.ns_tricks);
        }
        if ([Player.E, Player.W].indexOf(this.getDeclarer()) > -1) {
            let vul = ["EW", "All"].indexOf(this.vulnerability) > -1
            result = -score(this.contract, vul, this.ns_tricks);
        }
        return result
    }

    getBoardNumber() {
        return this.boardNumber;
    }

    getOpeningLeader() {
        return this.bot.openingleader;
    }

    getDealer() {
        return this.dealer;
    }

    getVulnerability() {
        return this.vulnerability;
    }

    cardsForPlayerAsPBN(player: Player) {
        let holdings = [];
        let hand = this.cards[player];
        holdings.push(['S', 'H', 'D', 'C'].map(suit => hand[suit].map(rankToText).join('')).join('.'));
        return holdings.join('.');
    }

    getTricksEW() {
        return this.ew_tricks;
    }

    getTricksNS() {
        return this.ns_tricks;
    }

    getBidding(): string {
        return this.bidding;
    }

    getContract(): string {
        return this.contract;
    }

    getStrain(contract: string): string {
        return contract[1]
    }

    getLeader(contract: string): Player {
        return getNextPlayer(charToPlayer(contract[contract.length - 1]))
    }

    leader(): Player {
        return this.plays.length ? this.plays[0].player : this.player;
    }

    isCompleted(): boolean {
        return this.ew_tricks + this.ns_tricks == 13;
    }

    claim(tricks: number): boolean {
        let played = this.playedCards()
        let position = (played.length % 4) + 1

        let result = (window as any).getNextPlay(this.lastTrickPBN, this.strain, played) as NextPlayResult;
        // Find the maximum score
        const maxScore1 = result.plays.reduce((max, current) => {
            return Math.max(max, current.score);
        }, -Infinity);

         result = (window as any).getNextPlay(this.toPBNReversed(position), this.strain, played) as NextPlayResult;
        // Find the maximum score
        const maxScore2 = result.plays.reduce((max, current) => {
            return Math.max(max, current.score);
        }, -Infinity);

        return tricks <= maxScore1 && tricks <= maxScore2
    }

    // Play a card
    play(player: Player, card: Card) {
        if (player !== this.player) {
            throw 'Played out of turn';
        }
        const holding = this.cards[player][card.suit];
        
        let rank: number = card.rank;

        let idx = holding.indexOf(rank);

        if (idx === -1) {
            throw `${player} tried to play ${formatCard(card)} which was not in hand.`;
        }
        let legalPlays = this.legalPlays();
        if (!legalPlays.find((play) => {
            return play.player === player && play.suit === card.suit && play.rank === card.rank
        })) {
            throw `${formatCard(card)} by ${player} does not follow suit.`;
        }

        this.cards[player][card.suit].splice(idx, 1);
        this.plays.push({ player, card });
        if (this.plays.length === 4) {
            this.sweep();
        } else {
            this.player = getNextPlayer(player);
        }
    }

    // A trick has been completed. Determine the winner and advance the state.
    sweep() {
        if (this.plays.length !== 4) {
            throw new Error('Tried to sweep incomplete trick');
        }

        let topCard = this.plays[0].card;
        let winner = this.plays[0].player;

        for (let i = 1; i < 4; i++) {
            let { card, player } = this.plays[i];
            if (
                (card.suit === topCard.suit && getRankNumber(card.rank) > getRankNumber(topCard.rank)) ||
                (card.suit === this.strain && topCard.suit !== this.strain)
            ) {
                topCard = card;
                winner = player;
            }
        }

        let trick = {
            plays: this.plays,
            leader: this.plays[0].player,
            winner
        };
        this.tricks.push(trick);
        this.plays = [];
        this.player = winner;
        if (winner == 'N' || winner == 'S') {
            this.ns_tricks++;
        } else {
            this.ew_tricks++;
        }
        console.log("Trick ",this.tricks.length, " won by: ",winner)
        this.lastTrickPBN = this.toPBN();
    }

    // Returns an array of { player, suit, rank } objects.
    legalPlays() {
        const player: Player = this.player;
        let followSuit = this.plays.length ? this.plays[0].card.suit : null;
        if (followSuit && this.cards[player][followSuit].length === 0) {
            followSuit = null;
        }

        let cards = this.cardsForPlayer(player);
        if (followSuit) {
            cards = cards.filter(({ card }) => card.suit === followSuit);
        }
        return cards.map(({ card }) => ({ player, suit: card.suit, rank: card.rank }));
    }

    // Returns an array of 2-character cards, e.g. ['5D', '2D', 'QD']
    playedCards(): string[] {
        return this.plays.map(({ card }) => `${formatCard(card)}`);
    }

    // Interface to dds.js
    async nextPlay(): Promise<Card> {
        let played = this.playedCards()
        let position = (played.length % 4) + 1
        let isDeclarer = (this.getDeclarer() == this.player) || (this.getDummy() == this.player)
        const result1 = (window as any).getNextPlay(this.lastTrickPBN, this.strain, played) as NextPlayResult;
        if (this.tricks.length > 10) {
            // No robot here just use DDS
            // Find all elements with the maximum score
            // Find the maximum score
            const maxScore = result1.plays.reduce((max, current) => {
                return Math.max(max, current.score);
            }, -Infinity);
            // Filter elements with the maximum score
            const maxScoreElements = result1.plays.filter((play) => play.score === maxScore);
            let rank = maxScoreElements[0].rank
            if (maxScoreElements[0].equals.length > 0) {
                rank = maxScoreElements[0].equals[maxScoreElements[0].equals.length - 1]
            }
            console.log("Playing: ", rank + maxScoreElements[0].suit, " Score: ", "DDS");
            const myCard = new Card(maxScoreElements[0].suit as Suit, textToRank(rank));
            return myCard;
        }

        let nnRes = await this.getRobotPlay();


        //Now find the card to this.play
        
        // Find all elements with the maximum score
        // Find the maximum score
        const maxScore = result1.plays.reduce((max, current) => {
            return Math.max(max, current.score);
        }, -Infinity);

        // Filter elements with the maximum score
        const maxScoreElements = result1.plays.filter((play) => play.score === maxScore);

        let newArray = this.mergeResults(maxScoreElements, nnRes[0]);

        const highestScoreItem = this.findItemWithHighestBScore(newArray);
        //console.log(highestScoreItem)
        console.log("Playing: ", highestScoreItem.rank + highestScoreItem.suit, " Score: ", highestScoreItem.B_Score.toFixed(3));
        // Different rules depending on suit or NT
        // Rules for partscore
        // Rules for game
        // Rules for slams
        // Partner opened
        // Parner overcalled
        // Now we need to find the suit to lead
        // As declarer draw trump

        // And then the right card in that suit, MUD, fourth, Thru declarer

        let rank = maxScoreElements[0].rank
        if (maxScoreElements[0].equals.length > 0) {
            rank = maxScoreElements[0].equals[maxScoreElements[0].equals.length - 1]
        }
        // 2. hand low
        if (position == 2) {
            // Play lowest if nothing else 
        }
        // 3. hand high
        //if (position == 3) {
        //}
        // 4. hand win cheapest af defence, and highes at declarer
        //if (position == 4) {
        //}

        // Rules for discarding
        // To cover or not to cover
        // Declarer play

        const myCard = new Card(maxScoreElements[0].suit as Suit, textToRank(rank));
        return myCard;
    }
 
    // INterface for using the robot
    // 0: 32  player hand
    // 32: 64  seen hand(dummy, or declarer if we create data for dummy)
    // 64: 96  last trick card 0
    // 96: 128 last trick card 1
    // 128: 160 last trick card 2
    // 160: 192 last trick card 3
    // 192: 224 this trick lho card
    // 224: 256 this trick pard card
    // 256: 288 this trick rho card
    // 288: 292 last trick lead player index one - hot
    // 292 level
    // 293: 298 strain one hot N, S, H, D, C

    private async getRobotPlay() {
        const x: number[] = [];
        let hand = this.bot.parseHandF(32)(this.handToPBN(this.player));
        x.push(...hand);
        let ben = this.bot.declarer;
        if (this.getDeclarer() == this.player) {
            let dummyhand = this.bot.parseHandF(32)(this.handToPBN(this.getDummy()));
            x.push(...dummyhand);
            ben = this.bot.declarer;
        }
        if (this.getDummy() == this.player) {
            let declarerhand = this.bot.parseHandF(32)(this.handToPBN(this.getDeclarer()));
            x.push(...declarerhand);
            ben = this.bot.dummy;
        }
        if (this.getRighty() == this.player) {
            let dummyhand = this.bot.parseHandF(32)(this.handToPBN(this.getDummy()));
            x.push(...dummyhand);
            ben = this.bot.righty;
        }
        if (this.getLefty() == this.player) {
            let dummyhand = this.bot.parseHandF(32)(this.handToPBN(this.getDummy()));
            x.push(...dummyhand);
            ben = this.bot.lefty;
        }
        for (let i = 64; i < 298; i++) {
            x[i] = 0;
        }
        x[292] = this.bot.getLevelInt(this.contract);
        // Previous trick
        if (this.tricks.length > 0) {
            for (let i = 0; i < 4; i++) {
                let element = this.tricks[this.tricks.length - 1].plays[i];
                let index = this.bot.encodeCard(element.card.toString());
                x[192 + index + (i * 32)] = 1;
            }
        }
        // This trick
        if (this.plays.length > 0) {
            let startIndex = 192; // Initialize the starting index
            for (let i = this.plays.length - 1; i >= 0; i--) {
                x[startIndex + this.bot.card52to32(this.bot.encodeCard(this.plays[i].card.toString()))] = 1; // Set the value to 1
                startIndex += 32; // Increment the starting index for the next play
            }
            // if (this.plays.length == 3) {
            //     x[192 + this.bot.encodeCard(this.plays[2].card.toString())]
            //     x[192 + 32 + this.bot.encodeCard(this.plays[1].card.toString())]
            //     x[192 + 64 + this.bot.encodeCard(this.plays[0].card.toString())]
            // }
            // // RHO + Partner
            // if (this.plays.length == 2) {
            //     x[192 + 32 + this.bot.encodeCard(this.plays[1].card.toString())]
            //     x[192 + 64 + this.bot.encodeCard(this.plays[0].card.toString())]
            // }
            // // Only RHO
            // if (this.plays.length == 1) {
            //     x[192 + 64 +this.bot.encodeCard(this.plays[0].card.toString())]
            // }
        }
        // last trick lead player
        if (this.tricks.length > 0) {
            // The leader of each trick must be relative to the player, clockwise
            let lead = (4 - this.plays.length) % 4;
            x[288 + lead] = 1;
        }

        x[293 + this.bot.getStrainInt(this.contract)] = 1;
        ben.sequence.push(x);
        let nnRes = await ben.predict(ben.sequence);
        return nnRes[0];
    }

    findItemWithHighestBScore(arr: any[]): any {
        let highestScore = -Infinity;
        let resultItem = null;

        for (const item of arr) {
            if (item.B_Score >= highestScore) {
                highestScore = item.B_Score;
                resultItem = item;
            }
        }
        return resultItem;
    }
    // Interface to dds.js
    async openingLead(): Promise<Card> {
        let played = this.playedCards()
        const result1 = (window as any).getNextPlay(this.lastTrickPBN, this.strain, played) as NextPlayResult;

        const maxScore = result1.plays.reduce((max, current) => {
            return Math.max(max, current.score);
        }, -Infinity);

        // Filter elements with the maximum score
        const maxScoreElements = result1.plays.filter((play) => play.score === maxScore);
        let nnRes = await this.getRobotOpeningLead(maxScoreElements);
        let xxx = await this.getRobotPlay();
        let newArray =this.mergeResults(maxScoreElements, nnRes);

        const highestScoreItem = this.findItemWithHighestBScore(newArray);
        //console.log(highestScoreItem)
        console.log("Playing: ", highestScoreItem.rank + highestScoreItem.suit, " Score: ", highestScoreItem.B_Score.toFixed(3));

        const myCard = new Card(highestScoreItem.suit as Suit, textToRank(highestScoreItem.rank));
        return myCard;
    }

    private async getRobotOpeningLead(maxScoreElements: { suit: string; rank: string; equals: string[]; score: number; }[]) {
        const x: number[] = new Array(42).fill(0);
        x[0] = parseInt(this.contract[0], 10);
        x[1 + this.bot.getStrainInt(this.contract)] = 1;
        x[6] = /^X(?!X)/.test(this.contract) ? 1 : 0;
        x[7] = /XX/.test(this.contract) ? 1 : 0;

        if (this.player == Player.N || this.player == Player.S) {
            x[8] = ["NS", "All"].indexOf(this.vulnerability) > -1 ? 1 : 0;
            x[9] = ["EW", "All"].indexOf(this.vulnerability) > -1 ? 1 : 0;
        } else {
            x[8] = ["EW", "All"].indexOf(this.vulnerability) > -1 ? 1 : 0;
            x[9] = ["NS", "All"].indexOf(this.vulnerability) > -1 ? 1 : 0;
        }

        let hand = this.bot.parseHandF(32)(this.handToPBN(this.player));
        x.splice(10, 32, ...hand);
        let dummyhand = this.handToPBN(this.getDummy());
        let rightyhand = this.handToPBN(this.getRighty());
        let declarerhand = this.handToPBN(this.getDeclarer());
        let B = this.bot.binary_hcp_shape([dummyhand, rightyhand, declarerhand]);

        let resultBen = await this.bot.openingleader.predict(x, B);
        let nnRes = resultBen[0];
        return nnRes;
    }

    private mergeResults(maxScoreElements: { suit: string; rank: string; equals: string[]; score: number; }[], rnn: number[]) {

        const newArray: { suit: string; rank: string; }[] = [];
        maxScoreElements.forEach(item => {
            const { equals, score, ...rest } = item;
            const newItem = { ...rest, B_Score: -1 };
            newItem.B_Score = rnn[this.bot.card52to32(this.bot.encodeCard(newItem.suit + newItem.rank))];
            newArray.push(newItem);

            if (item.equals.length > 0) {
                item.equals.forEach((equal, index) => {
                    const newItem = { ...rest, B_Score: -1 };
                    newItem.rank = (parseInt(newItem.rank) - 1).toString();
                    newItem.B_Score = rnn[this.bot.card52to32(this.bot.encodeCard(newItem.suit + newItem.rank))];
                    newArray.push(newItem);
                });
            }
        });

        return newArray;
    }

    // Returns an array of { card, player } objects.
    cardsForPlayer(player: Player): Play[] {
        const cards = this.cards[player];
        return Object.entries(cards).flatMap(([suit, ranks]) =>
            ranks.map(rank => ({
                card: { suit: suit as Suit, rank },
                player
            }))
        );
    }

    cardsForPlayerAsString(player: Player): string {
        let currentSuit: Suit | undefined;
        let cards = this.cardsForPlayer(player);
        let result = ""
        cards.forEach(play => {
            const { card } = play;
            if (currentSuit !== undefined && currentSuit !== card.suit) {
                // Add a space when the suit changes
                result += ' ';
            }
            result += `${rankToText(card.rank)}`;
            currentSuit = card.suit;
        });
        return result
    }

    getDeclarer(): Player {
        return getNextPlayer(getNextPlayer(getNextPlayer(this.firstPlayer)));
    }

    getRighty(): Player {
        return getNextPlayer(getNextPlayer(this.firstPlayer));
    }

    getDummy(): Player {
        return getNextPlayer(this.firstPlayer);
    }

    getLefty(): Player {
        return this.firstPlayer;
    }

    // Undo the last play
    undo() {
        // Need to remove sequences from the robot
        let prevTricks = this.tricks.length,
            plays = this.plays.length;

        if (plays == 0) {
            if (prevTricks == 0) {
                throw 'Cannot undo play when no plays have occurred.';
            } else {
                prevTricks -= 1;
                plays = 3;
            }
        } else {
            plays--;
        }
        this.undoToPlay(prevTricks, plays);
    }

    // Undo to a previous position.
    // trickNum \in 0..12
    // playNum \in 0..3
    undoToPlay(trickNum: number, playNum: number) {
        // Gather all the cards that have been played, including those in the current trick
        let plays = this.tricks.flatMap(trick => trick.plays).concat(this.plays);

        // restore cards to hands
        for (let { card, player } of plays) {
            this.cards[player][card.suit].push(card.rank);
        }
        this.sortHands();

        // reset tricks & player
        this.player = this.firstPlayer;
        this.tricks = [];
        this.plays = [];
        this.ew_tricks = 0;
        this.ns_tricks = 0;
        this.lastTrickPBN = this.toPBN();

        // Replay until the appropriate point
        for (let { card, player } of plays) {
            if (this.tricks.length === trickNum && this.plays.length === playNum) {
                break;
            }
            this.play(player, card);
        }
    }

    indexForCard(suit: string, rank: number): [number, number] {
        for (let i = 0; i < this.tricks.length; i++) {
            let plays = this.tricks[i].plays;
            for (let j = 0; j < plays.length; j++) {
                let card: Card = plays[j].card;
                if (card.suit == suit && card.rank == rank) {
                    return [i, j];
                }
            }
        }

        throw `Couldn't find played card ${rank} ${suit}`;
    }

    undoToCard(suit: string, rank: number) {
        let [trickNum, playNum] = this.indexForCard(suit, rank);
        this.undoToPlay(trickNum, playNum);
    }

    // Sort all holdings from highest to lowest rank
    sortHands() {
        for (const player of Object.keys(this.cards)) {
            for (const suit of Object.keys(this.cards[player])) {
                const hand = this.cards[player][suit];
                hand.sort((a, b) => b - a);
            }
        }
    }

    toPBN() {
        let player = this.player;
        let holdings = [];
        for (let i = 0; i < 4; i++) {
            let hand = this.cards[player];
            holdings.push(['S', 'H', 'D', 'C'].map(suit => hand[suit].map(rankToText).join('')).join('.'));
            player = getNextPlayer(player);
        }
        return this.player + ':' + holdings.join(' ');
    }

    handToPBN(player : Player) {
        let holdings = [];
        let hand = this.cards[player];
        holdings.push(['S', 'H', 'D', 'C'].map(suit => hand[suit].map(rankToText).join('')).join('.'));
        return holdings.join(' ');
    }

    swapSubstring(input: string, start1: number, end1: number, start2: number, end2: number): string {
        const firstPart = input.substring(0, start1) + input.substring(start2, end2) + input.substring(end1, start2);
        const secondPart = input.substring(start1, end1) + input.substring(end2);
        return firstPart + secondPart;
}    
    toPBNReversed(position: number) {
        // We need to handle if a card is played allready
        if (position == 2 || position == 4) {
            const resultString = this.swapSubstring(this.lastTrickPBN, 2, 19, 36, 53);
            return resultString
        } else {
            const resultString = this.swapSubstring(this.lastTrickPBN+" ", 19, 36, 53, 70);
            return resultString.trim()
        }
    }

}

