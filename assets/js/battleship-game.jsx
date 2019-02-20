import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

export default function game_init(root, channel, uName) {
  ReactDOM.render(<Battleship channel={channel} userName={uName}/>, root);
}

const rows = 10;
const cols = 10;

class Battleship extends React.Component {
    constructor (props) {
        super(props);
        this.channel = props.channel;
        this.userName = props.userName;
        this.state = {
            playerOneSkel: [],
            playerTwoSkel: [],
            playerOneName: "",
            playerTwoName: []
        };
        this.dragging = ""; // If we're placing ships, which one are we placing?
        // ex: 5 means a 5 length ship
        this.gameStart = false;

        this.channel
            .join()
            .receive("ok", this.gotJoinView.bind(this))

        this.channel.push("set_name", {
            name: this.userName
        })
            .receive("ok", this.gotNameView.bind(this));

        setTimeout(this.initBoardThenUpdate.bind(this), 100);
        /*
        this.channel.push("board_init", {
            board: this.initBoard(),
            name: this.userName
        })
            .receive("ok", this.gotView.bind(this));
        */
    }

    /*
     * We have just joined the game, so we get an initial empty view
     */
    gotJoinView(view) {
        let game = view.game;
        let playerOneSkel = [];
        let playerTwoSkel = [];

        if (game.player1_board.length == 0) {
            for (let i = 0; i < rows * cols; i++) {
                playerOneSkel.push({
                    index: i,
                    view: "O",
                    ishovered: false
                });
            }
        }
        else {
            playerOneSkel = game.player1_board;
        }

        if (game.player2_board.length == 0) {
            for (let i = 0; i < rows * cols; i++) {
                playerTwoSkel.push({
                    index: i,
                    view: "O",
                    ishovered: false
                });
            }
        }
        else {
            player2_board = game.player2_board;
        }

        this.setState({
            playerOneSkel: playerOneSkel,
            playerTwoSkel: playerTwoSkel,
            playerOneName: game.player1_name,
            playerTwoName: game.player2_name
        });
    }

    /*
     * We set our name and got he view back
     */
    gotNameView(view) {
        let game = view.game;
        let newState = this.state;
        newState.playerOneName = game.player1_name;
        newState.playerTwoName = game.player2_name;
        this.setState(newState)
    }

    /*
     * We are ready to start moving pieces around
     */
    initBoardThenUpdate() {
        let newState = this.state;
        newState.playerOneSkel = this.emptySkel(true);
        newState.playerTwoSkel = this.emptySkel(false);
        this.setState(newState);
        this.update(); // poll for updates from server
    }

    update() {
        this.channel.push("update", {
            name: this.userName
        })
            .receive("ok", this.gotView.bind(this));

        setTimeout(this.update.bind(this), 250);
    }

    randIdx() {
        return Math.floor(Math.random() * Math.floor(rows * cols));
    }

    placeShip(board, shipView) {
        let length = 0;
        let start = 0;
        let view = shipView;
        if (shipView == "S5") {
            start = 0;
            length = 5;
        }
        else if (shipView == "S4") {
            start = (cols * 2);
            length = 4;
        }
        else {
            start = (cols * 4);
            length = 3;
        }
        for (let i = start; i < start + length; i++) {
            board[i].view = shipView;
        }
    }

    emptySkel(forPlayerOne) {
        let board = [];
        for (let i = 0; i < rows * cols; i++) {
            board.push({
                index: i,
                isHovered: false,
                view: "O"
            });
        }
        if (forPlayerOne && this.isPlayerOne()) {
            this.placeShip(board, "S5");
            this.placeShip(board, "S4");
            this.placeShip(board, "S3");
        }
        else if (!forPlayerOne && !this.isPlayerOne()) {
            this.placeShip(board, "S5");
            this.placeShip(board, "S4");
            this.placeShip(board, "S3");
        }
        return board;
    }

    initBoard() {
        let initBoard = [];
        for (let i = 0; i < rows * cols; i++) {
            initBoard.push("O");
        }
        for (let i = 0; i < 10; i++) {
            initBoard[this.randIdx()] = "S";
        }
        return initBoard;
    }

    gotView(view) {
        let game = view.game;
        let playerOneSkel = [];
        let playerTwoSkel = [];
        for (let i = 0; i < rows * cols; i++) {
            playerOneSkel.push({
                index: i,
                view: game.player1_board[i],
                isHovered: this.state.playerOneSkel[i].isHovered
            });
            playerTwoSkel.push({
                index: i,
                view: game.player2_board[i],
                isHovered: this.state.playerTwoSkel[i].isHovered
            });
        }

        if (game.player1_board.length == 0) {
            playerOneSkel = this.state.playerOneSkel;
        }
        if (game.player2_board.length == 0) {
            playerTwoSkel = this.state.playerTwoSkel;
        }
        this.setState({
            playerOneSkel: playerOneSkel,
            playerTwoSkel: playerTwoSkel,
            playerOneName: game.player1_name,
            playerTwoName: game.player2_name
        });
    }

    onClick(clickedIndex, _ev) {
        if (!this.gameStart) {
            return;
        }
        this.channel.push("fire", {
            idx: clickedIndex,
            name: this.userName
        });
    }

    getOtherBoard() {
        if (this.userName == this.state.playerOneName) {
            return this.state.playerTwoSkel;
        }
        else {
            return this.state.playerOneSkel;
        }
    }

    getMyBoard() {
        if (this.isPlayerOne()) {
            return this.state.playerOneSkel;
        }
        else {
            return this.state.playerTwoSkel;
        }
    }

    isPlayerOne() {
        return this.userName == this.state.playerOneName;
    }

    onMouseEvent(clickedIndex, isMouseEnter, _ev) {
        let newState = this.state;
        let newOtherBoard = this.getOtherBoard();
        if (isMouseEnter) {
            newOtherBoard[clickedIndex].isHovered = true; 
        }
        else {
            newOtherBoard[clickedIndex].isHovered = false;
        }
        this.setState(newState);
    }

    onDragStart(draggedSquare, _ev) {
        if (["S3", "S4", "S5"].includes(draggedSquare.view)) {
            this.dragging = draggedSquare.view;
            let board = this.getMyBoard();
            this.setState(this.state);
        }
    }

    /*
     * removes all squares with the given view from the given board
     */
    removeAll(view, board) {
        for (let i = 0; i < rows * cols; i++) {
            if (board[i].view == view) {
                board[i].view = "O";
            }
        }
    }

    getShipLength(view) {
        if (view == "S3") {
            return 3
        }
        else if (view == "S4") {
            return 4
        }
        else if (view == "S5") {
            return 5
        }
    }

    myOnDragOver(sq, _ev) {
        if (this.dragging != "") {
            let board = this.getMyBoard();
            let shipLength = this.getShipLength(this.dragging);
            this.removeAll(this.dragging, board);
            for (let i = sq.index; i < sq.index + shipLength; i++) {
                if (board[i].view == "O") {
                    board[i].view = this.dragging;
                }
            }
            this.setState(this.state);
        }
        else {
            return;
        }
    }

    renderSquare(i, isMyBoard, sq) {
        let classNames = "column tile";
        classNames += " " + sq.view;
        if (sq.isHovered) {
            classNames += " hover"
        }
        if (isMyBoard) { // only put onClick events on other board
            return(
                <div className={classNames} key={i}
                     onDragStart={this.onDragStart.bind(this, sq)}
                     onDragOver={this.myOnDragOver.bind(this, sq)}>
                </div>);
        }
        else {
            return(
                <div className={classNames}
                     key={i}
                     onClick={this.onClick.bind(this, sq.index)}
                     onMouseEnter={this.onMouseEvent.bind(this, sq.index, true)}
                     onMouseLeave={this.onMouseEvent.bind(this, sq.index, false)}> 
                </div>);
        }
    }

    renderRow(rowNum, isMyBoard, isPlayerOneBoard) {
        let row = [];
        let actingBoard = [] // the board we are currently drawing
        if (isPlayerOneBoard) {
            actingBoard = this.state.playerOneSkel;
        }
        else {
            actingBoard = this.state.playerTwoSkel;
        }
        for (let i = 0; i < cols; i++) {
            let sq = actingBoard[(rowNum * cols) + i];
            row.push(this.renderSquare(i, isMyBoard, sq));
        }
        return row;
    }

    renderBoard(isMyBoard, isPlayerOneBoard) {
        if (isMyBoard && this.state.playerOneSkel.length == 0) {
            return (<p> Waiting for Player 1 </p>)
        }
        if (!isMyBoard && this.state.playerTwoSkel.length == 0) {
            return (<p> Waiting for Player 2 </p>)
        }
        let board = [];
        for (let i = 0; i < rows; i++) {
            board.push(
                <div className="row" key={i}>
                  {this.renderRow(i, isMyBoard, isPlayerOneBoard)}
                </div>);
        }
        return board;
    }


    render() {
        let playerOneName = this.state.playerOneName;
        let playerTwoName = this.state.playerTwoName;
        if (this.userName == playerOneName) {
            playerOneName += " (you)"
        }
        else {
            playerTwoName += " (you)"
        }
        if (this.state.playerOneSkel.length > 0) {
            return (
                <div id="page" className="row">
                    <div className="column" id="p1">
                        <p>{playerOneName}</p>
                        {this.renderBoard(
                            this.userName == this.state.playerOneName, true)}
                    </div>
                    <div className="column" id="p2">
                        <p>{playerTwoName}</p>
                        {this.renderBoard(
                            this.userName == this.state.playerTwoName, false)}
                    </div>
                </div>);
        }
        else {
            return (
                <div>
                    <p> Hello </p>
                </div>);
        }
    }
}
