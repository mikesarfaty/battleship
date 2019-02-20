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
      playerOneActive: nil,
      gameWinner: nil
    }
  end

  ################################################################################
  # GAME LOGIC
  ################################################################################

  def is_game_full(game, newName) do
    # if theres an open slot, allow a join
    # if the new user join already has their name in the game, let them re-join
    if String.equivalent?(game.player1_name, "") or String.equivalent?(game.player2_name, "") do
      false
    else
      if String.equivalent?(game.player1_name, newName) or String.equivalent?(game.player2_name, newName) do
        false
      else
        true
      end
    end
  end

  def check_game_over(losersBoard, potentialWinner) do
    # if (potential) losersBoard contains no (S)hip elements, they lost
    #   so potentialWinner has won at this point
    shipList = Enum.filter(losersBoard, fn x ->
      String.equivalent?("S", String.slice(x, 0..0))
    end)
    if length(shipList) > 0 do
      nil
    else
      potentialWinner
    end
  end

  def validate_board(board) do
    # iteratate thru board (single-depth list, len 100)
    # once we encounter an S#, check if it continues to the right
    # if it does for # elements, it's a valid ship
    # if it doesn't, check downards
    # repeat for all ship types (S3, S4, S5)
    # if any ship test fails, the board is invalid
    validate_ship(board, "S3", Enum.find_index(board, fn x -> String.equivalent?(x, "S3") end), 1, 1)
      and validate_ship(board, "S4", Enum.find_index(board, fn x -> String.equivalent?(x, "S4") end), 1, 1)
      and validate_ship(board, "S5", Enum.find_index(board, fn x -> String.equivalent?(x, "S5") end), 1, 1)
  end

  def validate_ship(board, shipType, startIndex, increment, offset) do
    # increment is what controls what direction we seek in
    # seek using increment
    {currentCell, _} = List.pop_at(board, startIndex + offset)
    if String.equivalent?(currentCell, shipType) do
      # if the current directional seek generates a positive result
      if String.to_integer(String.slice(shipType, 1..1)) == (offset + increment) do
        # if we've finished counting all cells of a ship
        true
      else
        if increment == 10 and String.to_integer(String.slice(shipType, 1..1)) == div((offset + increment), 10) do
          true
        else
          # if we haven't discovered the end of the ship, continue recursion
          validate_ship(board, shipType, startIndex, increment, offset + increment)
        end
      end
    else
      if increment == 10 do
        # if we've already tried to switch directions, and we try again, it means
        #   that the board is invalid
        false
      else
        # if the horizontal check fails, seek downwards
        validate_ship(board, shipType, startIndex, 10, 10)
      end
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
        if String.equivalent?("S", String.slice(x, 0..0)) do
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
        game
      else
        if String.equivalent?(game.player2_name, "") do
          Map.put(game, :player2_name, name)
        else
          game
        end
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

  
  def fire(game, idx, name) do
    # using a users name and guess coordinate, if it is their turn, apply a guess
    # correct guess replaces (S)hip w/ (H)it
    # bad guess repalces (O)bfuscated w/ (M)iss
    if game.gameWinner != nil do
      game
    else
      cond do
        String.equivalent?(game.player1_name, name) ->
          if game.playerOneActive do
            {target, _} = List.pop_at(game.player2_board, idx, 0)
            game = Map.put(game, :playerOneActive, false)
            if String.equivalent?(String.slice(target, 0..0), "S") do
              game = Map.put(game, :player2_board, List.replace_at(game.player2_board, idx, "H"))
              Map.put(game, :gameWinner, check_game_over(game.player2_board, game.player1_name))
            else
              Map.put(game, :player2_board, List.replace_at(game.player2_board, idx, "M"))
            end
          else
            game
          end
        String.equivalent?(game.player2_name, name) -> 
          if not game.playerOneActive do
            {target, _} = List.pop_at(game.player1_board, idx, 0)
            game = Map.put(game, :playerOneActive, true)
            if String.equivalent?(String.slice(target, 0..0), "S") do
              game = Map.put(game, :player1_board, List.replace_at(game.player1_board, idx, "H"))
              Map.put(game, :gameWinner, check_game_over(game.player1_board, game.player2_name))
            else
              Map.put(game, :player1_board, List.replace_at(game.player1_board, idx, "M"))
            end
          else
            game
          end
      end
    end
  end
end
