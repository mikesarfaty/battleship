defmodule Battleship.GameServer do
  use GenServer

  def reg(name) do
    {:via, Registry, {Battleship.GameReg, name}}
  end

  def start(name) do
    spec = %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [name]},
      restart: :permanent,
      type: :worker,
    }
    Battleship.GameSup.start_child(spec)
  end

  def start_link(name) do
    game = Battleship.BackupAgent.get(name) || Battleship.Game.new()
    GenServer.start_link(__MODULE__, game, name: reg(name))
  end

  def set_name(name, uName) do
    GenServer.call(reg(name), {:set_name, name, uName})
  end

  def board_init(name, board, uName) do
    GenServer.call(reg(name), {:board_init, name, board, uName})
  end

  def fire(name, idx, uName) do
    GenServer.call(reg(name), {:fire, name, idx, uName})
  end

  def peek(name) do
    GenServer.call(reg(name), {:peek, name})
  end

  def init(game) do
    {:ok, game}
  end
  
  def handle_call({:set_name, name, uName}, _from, game) do
    game = Battleship.Game.set_name(game, uName)
    Battleship.BackupAgent.put(name, game)
    {:reply, game, game}
  end

  def handle_call({:board_init, name, board, uName}, _from, game) do
    game = Battleship.GameServer.board_init(game, board, uName)
    Battleship.BackupAgent.put(name, game)
    {:reply, game, game}
  end

  def handle_call({:fire, name, idx, uName}, _from, game) do
    game = Battleship.GameServer.fire(game, idx, uName)
    Battleship.BackupAgent.put(name, game)
    {:reply, game, game}
  end

  def handle_call({:peek, _name}, _from, game) do
    {:reply, game, game}
  end
end
