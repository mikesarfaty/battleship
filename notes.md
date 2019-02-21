Implementation notes:

Client view:
    - hits/misses of other board
    - your own board

Game State
    - Both Players' Boards (piece placement)
    - Both Players' guesses


starting w/ random piece placement
REACT needs:
    - Display both boards
    - Pass guesses through the channel
    State:
{
    board[][] <"O", "H", "M">
}

Elixir needs:
    {
        player1_board: board[][] <"O", "S">
        player2_board: board[][] <"O", "S">
        player1_guesses: (x, y)[]
        player2_guesses: (x, y)[]
        playerOnesTurn: boolean
    }


Changes as of 2/17/19
    - Third player joining, block them for now?
    - refresh -- same state


Writeup Link for editing:
https://docs.google.com/document/d/15mwTUXZeLtApc923QxpxbT1_uEYVoObQ_SbU7QVxdjU/edit?usp=sharing

TODO: we should have a way of signalling when both players have submitted their board,
since otherwise the player can't tell when their guesses will actually be registered
TODO: maybe fix css backgrounds for spectator?
TODO: maybe hide p2 board until they join?
TODO: disable click/hovers for spectator? is necessary even? probs not