# Battleship

Battleship is a 2-player game emulating the classic board game. In this implementation,
each player must place 3 ships (1 length=3, 1 length=4, 1 lenght=5). Once both
players have submitted their arrangements, the server will being accepting guesses,
alternating between player 1 and player 2. The game will continue until
one player has sunk all of their opponent's ships, at which point they are declared
the winner.

## Installation

If [available in Hex](https://hex.pm/docs/publish), the package can be installed
by adding `battleship` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:battleship, "~> 0.1.0"}
  ]
end
```

Documentation can be generated with [ExDoc](https://github.com/elixir-lang/ex_doc)
and published on [HexDocs](https://hexdocs.pm). Once published, the docs can
be found at [https://hexdocs.pm/battleship](https://hexdocs.pm/battleship).

Writeup Link for editing:  
https://docs.google.com/document/d/15mwTUXZeLtApc923QxpxbT1_uEYVoObQ_SbU7QVxdjU/edit?usp=sharing