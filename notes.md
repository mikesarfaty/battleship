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



