import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

export default function game_init(root) {
  ReactDOM.render(<Battleship />, root);
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
            playerOneName: this.userName,
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
    }

    initBoard() {
        initBoard = [];
        for (let i = 0; i < rows * cols; i++) {
            initBoard.push("O");
        }
        for (let i = 0; i < 5; i ++) {
            initBoard[i] = "S";
        }
        for (let i = 4; i < 7; i++) {
            initBoard[(cols * i) + 2] = "S";
        }
        console.log(initBoard);
        return initBoard;
    }
        
    gotView(view) {
        let player1Skel = [];
        let player2Skel = [];
        for (let i = 0; i < rows * cols; i++) {
            player1skel.push({
                index: i,
                view: view.player1board[i]
            });
            player2skel.push({
                index: i,
                view: view.player2board[i]
            });
        }

        this.setState({
            playerOneSkel: playerOneSkel,
            playerTwoSkep: playerTwoSkel,
            playerOneName: this.userName,
            playerTwoName: this.state.playerTwoName
        });
    }

    onClick(clickedIndex, _ev) {
        this.channel.push("fire", {
            idx: clickedIndex,
            name: this.userName
        });
    }

    renderRow(rowNum, myBoard) {
        row = [];
        for (let i = 0; i < cols; i++) {
            if (myBoard) {
                sq = this.state.playerOneSkel[(rowNum * cols) + i];
                row.push(
                    <div className="column" key={i}>
                        <p>{sq.view}</p>
                    </div>);
            }
            else {
                sq = this.state.playerTwoSkel[(rowNum * cols) + i];
                row.push(
                    <div className="column" key={i} onClick={this.onClick.bind(this, sq.index)}>
                        <p>{sq.view}</p>
                    </div>);
            }
        }
        return row;
    }

    renderBoard(myBoard) {
        board = [];
        for (let i = 0; i < rows; i++) {
            board.push(
                <div className="row" key={i}>
                  {this.renderRow(i, myBoard)}
                </div>);
        }
        return board;
    }


    render() {
        return (
            <div id="page">
                <div className="column">
                    {this.renderBoard(true)} // our board
                </div>
                <div className="column">
                    {this.renderBoard(false)} // player two's board
                </div>
            </div>);
    }
}
