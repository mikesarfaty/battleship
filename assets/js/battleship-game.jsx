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
            playerOneSkel: this.emptySkel(),
            playerTwoSkel: this.emptySkel(),
            playerOneName: "",
            playerTwoName: ""
        }

        this.channel
            .join()
            .receive("ok", this.gotView.bind(this))
            .receive("error", resp => { console.log("Unable to join", resp); });

        this.channel.push("set_name", {
            name: this.userName
        })
            .receive("ok", this.gotView.bind(this));

        this.channel.push("board_init", {
            board: this.initBoard(),
            name: this.userName
        })
            .receive("ok", this.gotView.bind(this));


        this.update()
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

    emptySkel() {
        let board = [];
        for (let i = 0; i < rows * cols; i++) {
            board.push({
                index: i,
                isHovered: false,
                view: "O"
            });
        }
        return board;
    }

    initBoard() {
        let initBoard = [];
        for (let i = 0; i < rows * cols; i++) {
            initBoard.push("O");
        }
        // for (let i = 0; i < 10; i++) {
        //     initBoard[this.randIdx()] = "S";
        // } // replaced w/ different temporary fixed init for server-side board validation tests
        let s3Start = 12;
        for (let i = 0; i < 3; i++) {
            initBoard[s3Start + i] = "S3";
        }
        let s4Start = 0;
        for (let i = 0; i < 4; i++) {
            initBoard[s4Start + i] = "S4";
        }
        let s5Start = 50;
        for (let i = 0; i < 5; i++) {
            initBoard[s5Start + (10 * i)] = "S5";
        }
        console.log(initBoard);
        return initBoard;
    }
        
    gotView(view) {
        console.log(view.game);
        let game = view.game;
        let playerOneSkel = [];
        let playerTwoSkel = [];
        for (let i = 0; i < rows * cols; i++) {
            playerOneSkel.push({
                index: i,
                view: game.player1_board[i],
                hover: this.state.playerOneSkel[i].isHovered
            });
            playerTwoSkel.push({
                index: i,
                view: game.player2_board[i],
                hover: this.state.playerTwoSkel[i].isHovered
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

    isPlayerOne() {
        return this.userName == this.playerOneName;
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
        console.log("new state is", newState);
        this.setState(newState);
    }

    renderSquare(i, isMyBoard, sq) {
        let classNames = "column tile";
        if (sq.isHovered) {
            classNames += " hover"
        }
        if (isMyBoard) { // only put onClick events on other board
            return(
                <div className={classNames} key={i}>
                    <p>{sq.view}</p>
                </div>);
        }
        else {
            return(
                <div className={classNames}
                     key={i}
                     onClick={this.onClick.bind(this, sq.index)}
                     onMouseEnter={this.onMouseEvent.bind(this, sq.index, true)}
                     onMouseLeave={this.onMouseEvent.bind(this, sq.index, false)}> 
                    <p>{sq.view}</p>
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

    getPlayerColor(slot) {
        if (slot == 0) {
            if (this.userName == this.state.playerOneName) {
                return "opponent";
            } else {
                return "thisplayer";
            }
        } else if (slot == 1) {
            if (this.userName == this.state.playerOneName) {
                return "thisplayer";
            } else {
                return "opponent";
            }
        }
    }

    /*
     * Display the static sidebar for the game (key, tips, etc)
     */
    sideBar() {
        let sendButton = (
            <button className="row"
            onClick={this.submitBoard.bind(this)}>
                Confirm Board
            </button>);
        let explanation = (
            <div id="explanation">
                <p className="row">Welcome to Battleship. When the game</p>
                <p className="row">is ready, you can click your opponents</p>
                <p className="row">square to fire at their ships. First</p>
                <p className="row">person to sink all their opponents</p>
                <p className="row">ships wins the entire game. Good luck!</p>
            </div>);
        let key = (
            <div id="key">
                <div id="keyHit" className="row">
                    <p className="column">
                        HIT:
                    </p>
                    <div className="column tile H">
                    </div>
                    <div className="column" id={this.getPlayerColor(1)}>
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
