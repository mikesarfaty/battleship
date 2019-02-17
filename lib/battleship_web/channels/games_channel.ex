defmodule BattleshipWeb.GamesChannel do
  use BattleshipWeb, :channel
  
  alias Battleship.Game
  alias Battleship.BackupAgent

  # Source: Nat Tuck - https://github.com/NatTuck/hangman-2019-01/blob/422f1b60ef5d4b51afe20ec65f7d30746ef11f82/lib/hangman_web/channels/games_channel.ex
  # Applies to handle_in() as well
  def join("games:" <> name, payload, socket) do
    if authorized?(payload) do
      game = BackupAgent.get(name) || Game.new()
      BackupAgent.put(name, game)
      socket = socket
      |> assign(:game, game)
      |> assign(:name, name)
      {:ok, %{"join" => name, "game" => Game.client_view(game, name)}, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  # handle a player submitting their desired username
  def handle_in("set_name", %{"name" => uName}, socket) do
    name = socket.assigns[:name]
    game = Game.set_name(socket.assigns[:game], uName)
    socket = assign(socket, :game, game)
    BackupAgent.put(name, game)
    {:reply, {:ok, %{ "game" => Game.client_view(game, uName)}}, socket}
  end

  # handle a player submitting their battleship placements
  def handle_in("board_init", %{"board" => board, "name" => uName}, socket) do
    name = socket.assigns[:name]
    game = Game.board_init(socket.assigns[:game], board, uName)
    socket = assign(socket, :game, game)
    BackupAgent.put(name, game)
    {:reply, {:ok, %{ "game" => Game.client_view(game, uName)}}, socket}
  end

  # handle a player submitting their guesses
  def handle_in("fire", %{"idx" => idx, "name" => uName}, socket) do
    name = socket.assigns[:name]
    game = Game.fire(socket.assigns[:game], idx, uName)
    socket = assign(socket, :game, game)
    BackupAgent.put(name, game)
    {:reply, {:ok, %{ "game" => Game.client_view(game, uName)}}, socket}
  end
  
  # Add authorization logic here as required.
  defp authorized?(_payload) do
    # ?TODO: maybe this is a better place to do user-checking?
    true
  end
end
