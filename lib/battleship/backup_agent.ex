# Skeleton borrowed from Nat Tuck
# https://github.com/NatTuck/hangman-2019-01/tree/02-06-multiplayer

defmodule Battleship.BackupAgent do
  use Agent
  
  # This is basically just a global mutable map.
  
  def start_link(_args) do
    Agent.start_link(fn -> %{} end, name: __MODULE__)
  end
  
  def put(name, val) do
    Agent.update __MODULE__, fn state ->
      Map.put(state, name, val)
    end
  end
  
  def get(name) do
    Agent.get __MODULE__, fn state ->
      Map.get(state, name)
    end
  end
end