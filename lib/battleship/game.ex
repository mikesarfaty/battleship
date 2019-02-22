"""
Game state contains:

player#_board: single-depth, 100-length list
  Each cell can be either {S3, S4, S5, H, M}
player#_ready: boolean, has the player submitted their ship layout
player#_name: string, users chosen username
playerOneActive: is it player 1's turn?
gameWinner: nil, becomes the winner's username upon victory
chat: 10-length list, containing 10 most recent chat messages
  Each message contains the author, and the message contents

"""

defmodule Battleship.Game do

  ################################################################################
  # CONSTRUCTION
  ################################################################################

  def new do
    # init everything empty
    %{
      player1_board: [], # { (S)hip | (H)it | (M)iss | (O)bfuscated }
      player2_board: [],
      player1_ready: false,
      player2_ready: false,
      player1_name: "",
      player2_name: "",
      playerOneActive: nil,
      gameWinner: nil,
      chat: [] # we limit the chat log (a stack essentially) @ 10 items
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
    # recursive search to validate a single ship type
    # after finding an S# element in validate_board, iterate horizontally
    #   thru the board until we find all elements of the ship, or encounter
    #   an empty space or a different ship type.
    #   if we find all elements, return true and resume checking other ship types
    #   in parent function. if we don't, try again w/ the increment = 10,
    #   which essentially searches vertically rather than horizontally.
    #   if we still can't validate the current ship, then the board is invalid.
    {currentCell, _} = List.pop_at(board, startIndex + offset)
    if String.equivalent?(currentCell, shipType) do
      # if the current directional seek generates a positive result
      if (increment == 1 and (div(startIndex, 10) != div((startIndex + offset), 10))) do
        # make sure that a ship doesn't extend beyond a row into the next row, since
        #   our client can theoretically submit boards that do this
        false
      else
        if String.to_integer(String.slice(shipType, 1..1)) == (offset + increment) do
          # if we've finished counting all cells of a ship (horizontal search case)
          true
        else
          if increment == 10 and String.to_integer(String.slice(shipType, 1..1)) == div((offset + increment), 10) do
            # if we've finished counting all cells of a ship (vertical search case)
            true
          else
            # if we haven't discovered the end of the ship, continue recursion
            validate_ship(board, shipType, startIndex, increment, offset + increment)
          end
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
    # spectators get both views obfuscated
    if String.equivalent?(game.player1_name, name) do
      # get player 1's view, return their ENTIRE board & obfuscated player 2 board
      Map.put(game, :player2_board, strip(game.player2_board))
    else
      if String.equivalent?(game.player2_name, name) do
        Map.put(game, :player1_board, strip(game.player1_board))
      else
        # generate spectator view
        Map.put(Map.put(game, :player2_board, strip(game.player2_board)),
                :player1_board, strip(game.player1_board))
      end
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
    # using a name already registered ni the game table is a reconnect
    # spectators won't have their name added to the game table
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
    # also set that player as ready
    # once both players are init'ed, start the game by making playerOneActive = true
    if String.equivalent?(name, game.player1_name) do
      Map.put(Map.put(game, :player1_board, board), :player1_ready, true)
    else
      Map.put(Map.put(game, :player2_board, board), :player2_ready, true)
      |> Map.put(:playerOneActive, true)
    end
  end

  
  def fire(game, idx, name) do
    # using a users name and guess coordinate, if it is their turn, apply a guess
    # correct guess replaces (S)hip w/ (H)it
    # bad guess repalces (O)bfuscated w/ (M)iss
    # don't fire if someone already won
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

  def get_chat(game) do
    # getting chat makes no changes to server, just respond with the chat contents
    game.chat
  end

  def put_chat(game, uName, message) do
    # only keep 10 messages, should allow new users to hop into the convo!
    Map.put(game, :chat, (Enum.slice(([%{"user": uName, "msg": message}] ++ game.chat), 0, 9)))
  end
end
