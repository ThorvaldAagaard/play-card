import { Board } from "./board";
import { Suit, CardRank, Player as PlayerEnum, getNextPlayer } from "./enums";
import { formatCard } from "./utils";


const myContent = "<h1>Playing a contract</h1><br>Version 0.02<br>";

// Select the HTML element with the id "content"
const contentElement = document.getElementById("content");

// Set the innerHTML of the selected element to the content
if (contentElement) {
    contentElement.innerHTML = myContent;
    const board = new Board("1", "N:AQ9.543.6.AKJ876 762.A96.KQJ42.Q2 KJ83.KJ2.T753.T5 T54.QT87.A98.943", "S", "All", "4SS", "1C-1D-1S-2D-X-P-2S-P-3C-P-3N-P-4S-P-P-P", [], []);
    await board.modelsLoaded()
    contentElement.innerHTML += "<br>Board: " + board.getBoardNumber()
    contentElement.innerHTML += "<br>Dealer: " + board.getDealer()
    contentElement.innerHTML += "<br>Vulnerability: " + board.getVulnerability()

    contentElement.innerHTML += "<br><br>North: " + board.cardsForPlayerAsString(PlayerEnum.N)
    contentElement.innerHTML += "<br>East : " + board.cardsForPlayerAsString(PlayerEnum.E)
    contentElement.innerHTML += "<br>South: " + board.cardsForPlayerAsString(PlayerEnum.S)
    contentElement.innerHTML += "<br>West : " + board.cardsForPlayerAsString(PlayerEnum.W)

    // Bidding can be included (Also actual play) but then it mnust be a .lin file as interface
    const solverContent = '<a href="https://dds.bridgewebs.com/bsol2/ddummy.htm?board=' + board.getBoardNumber() +
        '&dealer=' + board.getDealer() +
        '&vul=' + board.getVulnerability() + '&club=BEN' +
        '&North=' + board.cardsForPlayerAsPBN(PlayerEnum.N) +
        '&East=' + board.cardsForPlayerAsPBN(PlayerEnum.E) +
        '&South=' + board.cardsForPlayerAsPBN(PlayerEnum.S) +
        '&West=' + board.cardsForPlayerAsPBN(PlayerEnum.W) +
        '&optimumscore&title=Play%20Card"> Bridge Solver </a><br>';


    contentElement.innerHTML += "<br><br>Bidding : " + board.getBidding()

    contentElement.innerHTML += "<br><br>Contract : " + board.getContract()

    let lead = await board.openingLead()
    
    contentElement.innerHTML += "<br><br>Opening lead: " + formatCard(lead)

    contentElement.innerHTML += "<br><br>Suggested play : "

    let player = board.getLeader(board.getContract());
    for (let i = 0; i < 13; i++) {
        contentElement.innerHTML += `<br>Trick ${i + 1} : `
        for (let j = 0; j < 4; j++) {
            if (j== 0 && i == 0) {
                // Opening lead is scripted or out side loop
                contentElement.innerHTML += formatCard(lead) + " "
                board.play(player, lead )
                player = getNextPlayer(player)
            } else {
                let card = await board.nextPlay()
                contentElement.innerHTML += formatCard(card) + " "
                board.play(player, card)
                player = getNextPlayer(player)
            }
        }
        player = board.leader()
        contentElement.innerHTML += ` won by ${player} `
    }
    if (board.isCompleted()) {
        contentElement.innerHTML += "<br><br>Tricks NS:" + board.getTricksNS();
        contentElement.innerHTML += "<br>Tricks EW:" + board.getTricksEW();
        contentElement.innerHTML += "<br><b>Result:" + board.getScore() + "</b>";
    }
    contentElement.innerHTML += "<br><br>" + solverContent
}
