defmodule Battleship.Game do

  ################################################################################
  # CONSTRUCTION
  ################################################################################

  # ?TODO: might need a board parser for receiving from clients?

  def new do
    # init everything empty
    %{
      player1_board: [], # { (S)hip | (H)it | (M)iss | (O)bfuscated }
      player2_board: [],
      player1_name: "",
      player2_name: "",
      playerOneActive: false,
      gameWinner: nil
    }
  end

  ################################################################################
  # GAME LOGIC
  ################################################################################

  def checkGameOver(game, potentialWinner, losersBoard) do
    # if (potential) losersBoard contains no (S)hip elements, they lost
    #   so potentialWinner has won at this point
    if Enum.member?(losersBoard, "S") do
      Map.put(game, :gameWinner, potentialWinner)
    else
      game
    end
  end
  
  ################################################################################
  # VIEW MANIPULATORS
  ################################################################################
  
  def client_view(game, name) do
    # Return the game state, but obfuscate the player whose name is NOT
    #   the input (aka the opponent of the user calling this function)
    if String.equivalent?(game.player1_name, name) do
      # get player 1's view, return their ENTIRE board & obfuscated player 2 board
      Map.put(game, :player2_board, strip(game.player2_board))
    else
      Map.put(game, :player1_board, strip(game.player1_board))
    end
  end
  
  def strip(toStrip) do
    # for hiding the opponents unsunk ships
    # toStrip is {:player1_board | :player2_board}
    # use that to hide ships and set them as obfuscated
    Enum.map(
      toStrip, fn x ->
        if String.equivalent?("S", x) do
          "O"
        else
          x
        end
      end
    )
  end

  ################################################################################
  # REQUESTS
  ################################################################################
  
  def set_name(game, name) do
    # set names for identifying users. first player to join is player 1
    # in the event of identical names, append an underscore to player 2
    if String.equivalent?(game.player1_name, "") do
      Map.put(game, :player1_name, name)
    else
      if String.equivalent?(Map.get(game, :player1_name), name) do
        # handle duplicate names
        Map.put(game, :player2_name, name <> "_")
      else
        Map.put(game, :player2_name, name)
      end
    end
  end
  
  def board_init(game, board, name) do
    # apply an input board to the game state for the matching player
    if String.equivalent?(name, game.player1_name) do
      Map.put(game, :player1_board, board)
    else
      Map.put(game, :player2_board, board)
      |> Map.put(:playerOneActive, true)
    end
  end

  def checkWinner(game, _name, _player_board) do
    game
  end
  
  def fire(game, idx, name) do
    # ?TODO: currently if the non-active user guesses, there's no route
    #   might need to be addressed?
    # using a users name and guess coordinate, if it is their turn, apply a guess
    # correct guess replaces (S)hip w/ (H)it
    # bad guess repalces (O)bfuscated w/ (M)iss
    if String.equivalent?(name, game.player1_name) and game.playerOneActive do
      # take a shot at player 2's board
      {target, _} = List.pop_at(game.player2_board, idx, 0)
      if String.equivalent?(target, "S") do
        Map.put(game, :player2_board, List.replace_at(game.player2_board, idx, "H"))
      else
        Map.put(game, :player2_board, List.replace_at(game.player2_board, idx, "M"))
      end
      Map.put(game, :playerOneActive, false)
      |> checkWinner(name, game.player2_board)
    end
    if String.equivalent?(name, game.player2_name) and not game.playerOneActive do
      # take a shot at player 1's board
      {target, _} = List.pop_at(game.player1_board, idx, 0)
      if String.equivalent?(target, "S") do
        Map.put(game, :player1_board, List.replace_at(game.player1_board, idx, "H"))
      else
        Map.put(game, :player1_board, List.replace_at(game.player1_board, idx, "M"))
      end
      Map.put(game, :playerOneActive, true)
      |> checkWinner(name, game.player1_board)
    end
  end
end
