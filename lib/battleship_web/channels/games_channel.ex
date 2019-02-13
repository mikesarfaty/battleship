defmodule BattleshipWeb.GamesChannel do
  use BattleshipWeb, :channel
  
  alias Battleship.Game
  alias Battleship.BackupAgent
  
  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end