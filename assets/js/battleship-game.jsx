import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';

export default function game_init(root, channel, uName) {
  ReactDOM.render(<Battleship channel={channel} userName={uName}/>, root);
}

const rows = 10;
const cols = 10;

class Battleship extends React.Component {

    /*
     * Constructor Steps:
     * 1. Initialize
     * 2. Join the game channel, get whatever view and fill in gaps
     * 3. Set our name in the channel, we can initialize our board now
     *      that we know which player we were assigned to
     */
    constructor (props) {
        super(props);
        this.channel = props.channel;
        this.userName = props.userName;
        this.dragging = ""; // If we're placing ships, which one are we placing?
        this.gameStart = false;
        this.shipsAreHorizontal = {
            "S3": false,
            "S4": true,
            "S5": true
        }
        this.state = {
            playerOneSkel: [],
            playerTwoSkel: [],
            playerOneName: "",
            playerTwoName: "",
            chatLog: ""
        };
        this.channel // join
            .join()
            .receive("ok", this.gotJoinView.bind(this))

        this.channel.push("set_name", { // set name
            name: this.userName
        })
            .receive("ok", this.gotNameView.bind(this));

        // XXX: componentDidMount() ????
        setTimeout(this.initBoardThenUpdate.bind(this), 100); // start ship placement
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
    
    /********************* VIEW RECEIVERS **********************/

    /*
     * Received a generic game view. Draw it, only changing the properties
     * of state that need to be changed on view updates. For example, we want
     * to still be hovering the same tile. If we don't receive boards from the
     * server, keep the dummy boards.
     */
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
        if (game.player1_name == "") {
            game.player1_name = "Waiting for player 1..."
        }
        if (game.player2_name == "") {
            game.player2_name = "Waiting for player 2..."
        }
        this.setState({
            playerOneSkel: playerOneSkel,
            playerTwoSkel: playerTwoSkel,
            playerOneName: game.player1_name,
            playerTwoName: game.player2_name,
            player1_ready: game.player1_ready,
            player2_ready: game.player2_ready
        });
    }

    gotChat(view) {
        this.state.chatLog = "";
        for (let i = 0; i < view.chat.length; i++) {
            this.state.chatLog  += (view.chat[i].user + ": " + view.chat[i].msg + "\n");
        }
    }

    putChat(ev) {
        let message = "";
        if (ev.key === "Enter") {
            // get chat box and submit
            message = ev.target.value;
            
        } else if (ev.key == null) {
            // ev.target.value contains chat content
            message = $("#chatEntry")[0].value;
        }
        if (message != "") {
            this.channel.push("put_chat", {
                name: this.userName,
                message: message
            });
            $("#chatEntry")[0].value = "";
        }
    }

    /*
     * We have just joined the game, so we get an initial empty view
     */
    gotJoinView(view) {
        let game = view.game;
        let playerOneSkel = [];
        let playerOneName = "";
        let playerTwoSkel = [];
        let playerTwoName = "";

        if (game.player1_name != this.userName & game.player2_name != this.userName) {
            this.isSpectator = true;
        } else {
            this.isSpectator = false;
        }

        if (game.player1_board.length == 0) {
            for (let i = 0; i < rows * cols; i++) {
                playerOneSkel.push({
                    index: i,
                    view: "O",
                    ishovered: false
                });
            }
            playerOneName = ""
        }
        else {
            playerOneSkel = game.player1_board;
            playerOneName = game.player1_name;
        }

        if (game.player2_board.length == 0) {
            for (let i = 0; i < rows * cols; i++) {
                playerTwoSkel.push({
                    index: i,
                    view: "O",
                    ishovered: false
                });
            }
            playerTwoName = ""
        }
        else {
            playerTwoSkel = game.player2_board;
            playerTwoName = game.player2_name;
        }

        this.setState({
            playerOneSkel: playerOneSkel,
            playerTwoSkel: playerTwoSkel,
            playerOneName: playerOneName,
            playerTwoName: playerTwoName,
            player1_ready: view.game.player1_ready,
            player2_ready: view.game.player2_ready
        });
    }

    /*
     * We set our name and got he view back
     */
    gotNameView(view) {
        let playerOneName = "";
        let playerTwoName = "";
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

    /*
     * Poll the server for an updated game state periodically
     */
    update() {
        this.channel.push("update", {
            name: this.userName
        })
            .receive("ok", this.gotView.bind(this));
        
        this.channel.push("get_chat", {})
            .receive("ok", this.gotChat.bind(this));

        setTimeout(this.update.bind(this), 250);
    }

    /****************** COMPONENT HELPERS ********************/

    /* 
     * Getter for a board that doesn't belong to this user
     */
    getOtherBoard() {
        if (this.userName == this.state.playerOneName) {
            return this.state.playerTwoSkel;
        }
        else {
            return this.state.playerOneSkel;
        }
    }

    /*
     * Getter for board that belongs to this user
     */
    getMyBoard() {
        if (this.isPlayerOne()) {
            return this.state.playerOneSkel;
        }
        else {
            return this.state.playerTwoSkel;
        }
    }

    /*
     * Am I player one?
     */
    isPlayerOne() {
        return this.userName == this.state.playerOneName;
    }

    /*
     * Based on a view, what's the length of the corresponding ship?
     */
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

    /* ******************* TILE ACTION EVENTS **********************/

    /*
     * If the game started and we clicked the opponent's board,
     * tell the server that we're firing upon that target
     */
    onClick(clickedIndex, _ev) {
        if (!this.gameStart) {
            return;
        }
        this.channel.push("fire", {
            idx: clickedIndex,
            name: this.userName
        });
    }
    
    /*
     * Allow "Hovering" of the other player's board.
     */
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

    /*
     * Pick up a ship to move it during placement
     */
    onDragStart(draggedSquare, _ev) {
        if (this.gameStart) {
            return;
        }
        if (["S3", "S4", "S5"].includes(draggedSquare.view)) {
            this.dragging = draggedSquare.view;
            let board = this.getMyBoard();
            this.setState(this.state);
        }
    }

    /*
     * When the dragging ends just make it so we show via
     * this component that we're no longer dragging anything
     */
    onDragEnd(_ev) {
        this.dragging = "";
    }

    /*
     * When we drag over a tile, if we're dragging something, show the drag
     * Note: The dragging limitations (such as not being able to drag
     * over invalid placements) are handled in the helper functions.
     */
    onDragOver(sq, _ev) {
        if (this.gameStart) {
            return;
        }
        if (this.dragging != "") {
            if (this.shipsAreHorizontal[this.dragging]) {
                this.onDragOverHorizontal(sq);
            }
            else {
                this.onDragOverVertical(sq);
            }
        }
    }

    /*
     * Handle ship dragging vertically for ship placement and
     * ensure that we're able to move the ship being dragged
     * to the desired location
     */
    onDragOverVertical(sq) {
        let board = this.getMyBoard();
        let shipLength = this.getShipLength(this.dragging);
        if (!this.canMoveTo(sq.index, shipLength, false)) {
            return;
        }
        this.removeAll(this.dragging, board);
        for (let i = 0; i < shipLength; i++) {
            if (board[sq.index + (cols * i)].view == "O") {
                board[sq.index + (cols * i)].view = this.dragging;
            }
        }
        this.setState(this.state);
    }

    /*
     * Handle ship horizontally vertically for ship placement
     * and ensure that we're able to move the ship being dragged
     * to the desired location
     */
    onDragOverHorizontal(sq) {
        let board = this.getMyBoard();
        let shipLength = this.getShipLength(this.dragging);
        if (!this.canMoveTo(sq.index, shipLength, true)) {
            return;
        }
        this.removeAll(this.dragging, board);
        for (let i = sq.index; i < sq.index + shipLength; i++) {
            if (board[i].view == "O") {
                board[i].view = this.dragging;
            }
        }
        this.setState(this.state);
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

    /*
     * Rotate our ships when they're double clicked, assuming that
     * they have enough space to be rotated in their current position.
     */
    onDoubleClick(sq, _ev) {
        if (this.gameStart) {
            return;
        }
        if (["S3", "S4", "S5"].includes(sq.view)) {
            this.dragging = sq.view;
            let canRotate = this.canMoveTo(
                sq.index,
                this.getShipLength(sq.view),
                !this.shipsAreHorizontal[sq.view])
            if (!canRotate) {
                this.dragging = ""
                return;
            }
            this.shipsAreHorizontal[sq.view] = !this.shipsAreHorizontal[sq.view];
            this.dragging = sq.view;
            this.onDragOver(sq, _ev);
            this.dragging = "";
        }
    }

    /*
     * Given a start position, amount of space needed, and whether
     * or not the needed free space should be horizontal, are we able
     * to have that much free space?
     */
    canMoveTo(startPos, neededFreeSpace, isHorizontal) {
        let increment = 1;
        if (!isHorizontal) {
            increment = cols
        }
        for (let i = 0; i < neededFreeSpace; i++) {
            let indexInQuestion = startPos + (i * increment);
            if (indexInQuestion > (rows * cols) - 1) {
                return false;
            }
            if (!["O", this.dragging]
                 .includes(this.getMyBoard()[indexInQuestion].view)){
                return false;
            }
        }
        if (isHorizontal &&
            ((startPos + neededFreeSpace) % 10 == 0)) {
            return true;
        }
        if (isHorizontal &&
            ((startPos + neededFreeSpace) % 10 < neededFreeSpace)) {
            return false;
        }
        return true;
    }

    /* ************* RENDERING FUNCTIONS ***************/
    render() {
        let playerOneName = this.state.playerOneName;
        let playerTwoName = this.state.playerTwoName;
        if (this.userName == playerOneName) {
            playerOneName += " (you)"
        }
        else if (this.userName == playerTwoName) {
            playerTwoName += " (you)"
        }
        if (this.state.playerOneSkel.length > 0) {
            return (
                <div>
                    <div id="page" className="row">
                        <div className="column" id={this.getPlayerColor(0)}>
                            <p>{playerOneName}</p>
                            {this.renderBoard(
                                this.userName == this.state.playerOneName, true)}
                        </div>
                        <div className="column" id={this.getPlayerColor(1)}>
                            <p>{playerTwoName}</p>
                            {this.renderBoard(
                                this.userName == this.state.playerTwoName, false)}
                        </div>
                        <div className="column" id="sidebar">
                            {this.sideBar()}
                        </div>
                    </div>
                    <div id="chatContainer" className="column">
                        <div className="row" onSubmit={() => this.putChat}>
                            <input className="column" id="chatEntry" type="text" onKeyUp={this.putChat.bind(this)}></input>
                            <button className="column" className="row" id="chatSubmit" onClick={this.putChat.bind(this)}>Send</button>
                        </div>
                        <textarea className="row" id="chatLog" type="text" rows="10" disabled readOnly value={this.state.chatLog}></textarea>
                    </div>
                </div>);
        }
        else {
            return (
                <div>
                    <p> Loading . . . </p>
                </div>);
        }
    }

    /*
     * Render the entirety of the board
     */
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
                <div className="row gameRow" key={i}>
                  {this.renderRow(i, isMyBoard, isPlayerOneBoard)}
                </div>);
        }
        return board;
    }

    /*
     * Render one row at a time
     * Args:
     *      rowNum - The row to render
     *      isMyBoard - Whether or not we're rendering the component
     *                  owner's board
     *      isPlayerOneBoard - If the board belongs to player one
     */
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

    /*
     * Render an individual battleship tile. Add the tile view to the CSS
     * class so that we can change how the tile looks according to the
     * tile view. Add all the necessary drag/onClick/mouse event handlers.
     * We can later disable these based on game state (gameStarted vs !gameStarted
     */
    renderSquare(i, isMyBoard, sq) {
        let classNames = "column tile";
        classNames += " " + sq.view;
        if (sq.isHovered) {
            classNames += " hover"
        }
        if (isMyBoard & !this.isSpectator) { // only put onClick events on other board
            return(
                <div className={classNames}
                     key={i}
                     onDragStart={this.onDragStart.bind(this, sq)}
                     onDragOver={this.onDragOver.bind(this, sq)}
                     onDoubleClick={this.onDoubleClick.bind(this, sq)}
                     onDragEnd={this.onDragEnd.bind(this)}>
                </div>);
        }
        else if (!isMyBoard & !this.isSpectator) { 
            return(
                <div className={classNames}
                     key={i}
                     onClick={this.onClick.bind(this, sq.index)}
                     onMouseEnter={this.onMouseEvent.bind(this, sq.index, true)}
                     onMouseLeave={this.onMouseEvent.bind(this, sq.index, false)}> 
                </div>);
        } else {
            return(
                <div className={classNames}
                     key={i}> 
                </div>);
        }
    }

    /*
     * Gets the player's color for their board. Returns a CSS id
     * that is used in app.css to identify the correct color
     * for a player's board
     */
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
            <button className="row" id="sendButton"
            onClick={this.submitBoard.bind(this)}>
                Confirm Board
            </button>);
        let explanation = (
            <div id="explanation">
                <p className="row">Welcome to Battleship!</p>
                <p className="row">When the game is ready, you can click your
                    opponents square to fire at their ships. First person to
                    sink all their opponent's ships wins the entire game.
                    Good luck!</p>
            </div>);
        let key = (
            <div id="key">
                <div id="keyHit" className="row">
                    <p className="column">
                        HIT:
                    </p>
                    <div className="column tile H">
                    </div>
                </div>
                <div id="keyShip" className="row">
                    <p className="column">
                        SHIP:
                    </p>
                    <div className="column tile S5">
                    </div>
                </div>
                <div id="keyMiss" className="row">
                    <p className="column">
                        MISS:
                    </p>
                    <div className="column tile M">
                    </div>
                </div>
            </div>);
        if ((this.state.player1_ready && this.state.playerOneName == this.userName)
            || (this.state.player2_ready && this.state.playerTwoName == this.userName)) {
            return (<div>
                        {explanation}
                        {key}
                    </div>);
        } else {
            return (<div>
                        {explanation}
                        {key}
                        <br></br>
                        {sendButton}
                    </div>);
        }
    }

    /*
     * Submits the board to the game. This will always be a legal
     * board unless someone cheats so we can wait for an "ok" message
     * and throw out error messages. If there's an error, you cheated.
     * I don't care about cheaters.
     * Disable submitting after first submit
     */
    submitBoard(_ev) {
        if ((!this.state.player1_ready && this.state.playerOneName == this.userName)
            || (!this.state.player2_ready && this.state.playerTwoName == this.userName)) {
            let boardToSend = [];
            for (let i = 0; i < rows * cols; i++) {
                boardToSend.push(this.getMyBoard()[i].view);
            }
            this.gameStart = true;
            this.channel.push("board_init", {
                board: boardToSend,
                name: this.userName
            })
                .receive("ok", this.gotView.bind(this));
        }
    }
}
