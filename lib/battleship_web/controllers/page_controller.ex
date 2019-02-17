defmodule BattleshipWeb.PageController do
  use BattleshipWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end

  def join(conn, %{"game_name" => game_name, "name" => uName}) do
    render conn, "game.html", game_name: game_name, uName: uName
  end
end
