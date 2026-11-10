/* ============================================================
   ВЕРИТИ.fan — интерфейс шашек и шахмат
   ============================================================ */

(() => {
  "use strict";

  const root = document.getElementById("gamesApp");
  if (!root) return;

  const Engine = window.VerityGames;
  if (!Engine) return;

  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));

  const boardEl = $("#gameBoard");
  const statusEl = $("#gameStatus");
  const hintEl = $("#gameHint");
  const capturedEl = $("#gameCaptured");
  const difficultyWrap = $("#difficultyWrap");
  const difficultySelect = $("#gameDifficulty");
  const promotionEl = $("#promotionPicker");
  const promotionButtons = $$("[data-promotion]", promotionEl);
  const newButton = $("#gameNew");
  const undoButton = $("#gameUndo");
  const flipButton = $("#gameFlip");

  const FILES = "abcdefgh";
  const CHESS_GLYPHS = {
    w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
    b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
  };
  const CHESS_NAMES = {
    k: "король",
    q: "ферзь",
    r: "ладья",
    b: "слон",
    n: "конь",
    p: "пешка"
  };

  const state = {
    active: "checkers",
    mode: "ai",
    difficulty: "medium",
    flipped: false,
    thinking: false,
    aiTimer: null,
    promotion: null,
    games: {
      checkers: {
        game: new Engine.CheckersGame(),
        history: [],
        selected: null,
        path: []
      },
      chess: {
        game: new Engine.ChessGame(),
        history: [],
        selected: null,
        path: []
      }
    }
  };

  const current = () => state.games[state.active];

  const squareName = (index) => `${FILES[index % 8]}${8 - Math.floor(index / 8)}`;

  function pieceLabel(piece) {
    if (!piece) return "пусто";
    if (state.active === "chess") {
      const color = piece[0] === "w" ? "белый" : "чёрный";
      return `${color} ${CHESS_NAMES[piece[1]] || "фигура"}`;
    }
    return `${piece.color === "w" ? "белая" : "чёрная"} ${piece.king ? "дамка" : "шашка"}`;
  }

  function cancelAI() {
    if (state.aiTimer !== null) {
      window.clearTimeout(state.aiTimer);
      state.aiTimer = null;
    }
    state.thinking = false;
  }

  function hidePromotion() {
    state.promotion = null;
    if (promotionEl) promotionEl.hidden = true;
  }

  function showPromotion(move) {
    state.promotion = { gameKey: state.active, move };
    if (promotionEl) promotionEl.hidden = false;
    render();
  }

  function commitMove(gameKey, move) {
    const slot = state.games[gameKey];
    if (!slot) return;
    slot.history.push(slot.game.clone());
    if (slot.history.length > 220) slot.history.shift();

    if (gameKey === "checkers") {
      slot.game.applyMove(move);
    } else {
      slot.game.makeMove(move);
    }

    slot.selected = null;
    slot.path = [];

    if (state.active === gameKey) {
      render();
      maybeAI();
    }
  }

  function maybeAI() {
    if (state.mode !== "ai" || state.thinking) return;

    const gameKey = state.active;
    const slot = state.games[gameKey];
    if (!slot) return;

    const game = slot.game;
    if (game.turn !== "b") return;

    const status = game.status();
    if (status.over) return;

    state.thinking = true;
    render();

    state.aiTimer = window.setTimeout(() => {
      state.aiTimer = null;
      const slotNow = state.games[gameKey];
      if (!slotNow || slotNow.game !== game) {
        state.thinking = false;
        return;
      }

      const statusNow = game.status();
      if (statusNow.over || game.turn !== "b") {
        state.thinking = false;
        if (state.active === gameKey) render();
        return;
      }

      let move = null;
      try {
        move = game.chooseMove(state.difficulty);
      } catch (error) {
        move = null;
      }
      state.thinking = false;

      if (!move) {
        if (state.active === gameKey) render();
        return;
      }
      commitMove(gameKey, move);
    }, 350);
  }

  function renderTabs() {
    $$(".game-tab").forEach((button) => {
      const active = button.dataset.game === state.active;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function renderMode() {
    $$(".mode-btn").forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (difficultyWrap) difficultyWrap.hidden = state.mode !== "ai";
  }

  function renderActions(slot) {
    if (undoButton) undoButton.disabled = slot.history.length === 0;
  }

  function renderBoard(slot, status) {
    if (!boardEl) return;
    const game = slot.game;
    const selected = slot.selected;
    const path = slot.path || [];
    const targetSquares = new Set();
    const nextMap = new Map();
    const chessTargets = new Map();

    if (state.active === "checkers" && selected !== null) {
      const prefix = [selected, ...path];
      const compatible = status.moves.filter(
        (move) => move.from === selected && prefix.every((square, index) => move.path[index] === square)
      );
      const nextIndex = prefix.length;
      compatible.forEach((move) => {
        const square = move.path[nextIndex];
        if (square === undefined) return;
        if (!nextMap.has(square)) {
          nextMap.set(square, { captures: new Set(), capture: move.captures.length > 0 });
        }
        move.captures.forEach((captured) => nextMap.get(square).captures.add(captured));
      });
      nextMap.forEach((info) => info.captures.forEach((captured) => targetSquares.add(captured)));
    }

    if (state.active === "chess" && selected !== null) {
      status.moves
        .filter((move) => move.from === selected)
        .forEach((move) => {
          chessTargets.set(move.to, move);
          if (move.ep) targetSquares.add(move.epSquare);
          else if (move.captured) targetSquares.add(move.to);
        });
    }

    const lastSquares = new Set();
    if (game.lastMove) {
      lastSquares.add(game.lastMove.from);
      lastSquares.add(game.lastMove.to);
      if (Array.isArray(game.lastMove.path)) {
        game.lastMove.path.forEach((square) => lastSquares.add(square));
      }
    }

    const checkSquare =
      state.active === "chess" && status.inCheck ? game.findKing(game.turn) : -1;

    boardEl.innerHTML = "";

    for (let display = 0; display < 64; display += 1) {
      const index = state.flipped ? 63 - display : display;
      const row = Math.floor(index / 8);
      const col = index % 8;
      const light = (row + col) % 2 === 0;
      const piece = game.board[index];

      const square = document.createElement("button");
      square.type = "button";
      square.className = `sq ${light ? "is-light" : "is-dark"}`;
      square.dataset.square = String(index);
      square.setAttribute("aria-label", `${squareName(index)}, ${pieceLabel(piece)}`);

      if (selected === index) square.classList.add("is-selected");
      if (lastSquares.has(index)) square.classList.add("is-last");
      if (checkSquare === index) square.classList.add("is-check");
      if (targetSquares.has(index)) square.classList.add("is-target");

      if (state.active === "checkers") {
        const info = nextMap.get(index);
        if (info) {
          square.classList.add("is-move");
          if (info.capture) square.classList.add("is-capture");
        }
      } else {
        const move = chessTargets.get(index);
        if (move) {
          square.classList.add("is-move");
          if (move.captured || move.ep) square.classList.add("is-capture");
        }
      }

      if (piece) {
        const pieceEl = document.createElement("span");
        if (state.active === "chess") {
          pieceEl.className = `piece ${piece[0]}`;
          pieceEl.textContent = CHESS_GLYPHS[piece[0]][piece[1]] || "";
        } else {
          pieceEl.className = `checker-piece ${piece.color}${piece.king ? " king" : ""}`;
        }
        pieceEl.setAttribute("aria-hidden", "true");
        square.appendChild(pieceEl);
      }

      boardEl.appendChild(square);
    }
  }

  function renderStatus(slot, status) {
    const game = slot.game;
    const turnName = game.turn === "w" ? "белых" : "чёрных";
    const mustCapture =
      state.active === "checkers" &&
      status.moves.length > 0 &&
      status.moves.every((move) => move.captures.length > 0);

    let text = "";
    let hint = "";
    let check = false;

    if (state.thinking) {
      text = "Верити думает...";
      hint = "Он уже знает, чем это закончится.";
    } else if (status.over) {
      if (status.draw) {
        if (status.reason === "stalemate") text = "Пат — ничья.";
        else if (status.reason === "50-move") text = "Ничья по правилу 50 ходов.";
        else if (status.reason === "material") text = "Ничья: недостаточно материала.";
        else text = "Ничья.";
      } else {
        const winner = status.winner === "w" ? "белых" : "чёрных";
        text = status.reason === "checkmate" ? `Мат! Победа ${winner}.` : `Победа ${winner}.`;
      }
      hint = "Нажми «Новая партия», чтобы сыграть ещё.";
      check = status.reason === "checkmate";
    } else if (state.promotion) {
      text = "Выбери фигуру для превращения.";
      hint = "Пешка дошла до последней линии.";
    } else {
      if (state.active === "chess" && status.inCheck) {
        text = `Шах! Ход ${turnName}.`;
        check = true;
      } else if (mustCapture) {
        text = `Нужно бить! Ход ${turnName}.`;
      } else if (state.mode === "ai" && game.turn === "b") {
        text = "Ход Верити.";
      } else if (state.mode === "ai" && game.turn === "w") {
        text = "Твой ход. Белые.";
      } else {
        text = `Ход ${turnName}.`;
      }

      if (slot.selected !== null) {
        hint =
          state.active === "checkers" && slot.path.length > 0
            ? "Продолжай бить — взятие обязательно."
            : "Выбери клетку.";
      } else if (mustCapture) {
        hint = "Бить обязательно. Выбери шашку, которая может бить.";
      } else if (state.mode === "ai" && game.turn === "b") {
        hint = "Верити обдумывает ход.";
      } else {
        hint = "Нажми на фигуру, чтобы увидеть ходы.";
      }
    }

    if (statusEl) {
      statusEl.textContent = text;
      statusEl.classList.toggle("is-check", check);
    }
    if (hintEl) hintEl.textContent = hint;
    if (capturedEl) {
      capturedEl.textContent =
        state.active === "checkers"
          ? `${game.count("w")} : ${game.count("b")}`
          : `ход ${game.fullmove}`;
    }
  }

  function render() {
    const slot = current();
    const status = slot.game.status();
    renderTabs();
    renderMode();
    renderBoard(slot, status);
    renderStatus(slot, status);
    renderActions(slot);
  }

  function isHumanTurn() {
    if (state.mode === "friend") return true;
    return current().game.turn === "w";
  }

  function handleChessSquare(index, slot, status) {
    const piece = slot.game.board[index];
    const selected = slot.selected;

    if (selected === null) {
      if (piece && piece[0] === slot.game.turn) {
        if (status.moves.some((move) => move.from === index)) {
          slot.selected = index;
          render();
        } else if (hintEl) {
          hintEl.textContent = "У этой фигуры нет доступных ходов.";
        }
      }
      return;
    }

    if (selected === index) {
      slot.selected = null;
      render();
      return;
    }

    const move = status.moves.find((item) => item.from === selected && item.to === index);
    if (move) {
      if (move.promotion) {
        showPromotion(move);
      } else {
        commitMove(state.active, move);
      }
      return;
    }

    if (piece && piece[0] === slot.game.turn) {
      if (status.moves.some((item) => item.from === index)) {
        slot.selected = index;
        render();
      } else if (hintEl) {
        hintEl.textContent = "У этой фигуры нет доступных ходов.";
      }
      return;
    }

    slot.selected = null;
    render();
  }

  function handleCheckersSquare(index, slot, status) {
    const piece = slot.game.board[index];
    const selected = slot.selected;

    if (selected === null) {
      if (piece && piece.color === slot.game.turn) {
        const legalFrom = status.moves.filter((move) => move.from === index);
        if (legalFrom.length) {
          slot.selected = index;
          slot.path = [];
          render();
        } else if (hintEl) {
          hintEl.textContent = status.moves.some((move) => move.captures.length > 0)
            ? "Бить обязательно. Выбери шашку, которая может бить."
            : "У этой шашки нет доступных ходов.";
        }
      }
      return;
    }

    if (selected === index && slot.path.length === 0) {
      slot.selected = null;
      render();
      return;
    }

    if (piece && piece.color === slot.game.turn && slot.path.length === 0) {
      const legalFrom = status.moves.filter((move) => move.from === index);
      if (legalFrom.length) {
        slot.selected = index;
        slot.path = [];
        render();
      } else if (hintEl) {
        hintEl.textContent = status.moves.some((move) => move.captures.length > 0)
          ? "Бить обязательно. Выбери шашку, которая может бить."
          : "У этой шашки нет доступных ходов.";
      }
      return;
    }

    const prefix = [selected, ...slot.path];
    const compatible = status.moves.filter(
      (move) => move.from === selected && prefix.every((square, idx) => move.path[idx] === square)
    );
    const nextIndex = prefix.length;
    const nextMoves = compatible.filter((move) => move.path[nextIndex] === index);

    if (!nextMoves.length) {
      if (hintEl) {
        hintEl.textContent = slot.path.length > 0
          ? "Нужно продолжить взятие."
          : "Так ходить нельзя.";
      }
      return;
    }

    const newPath = slot.path.concat(index);
    const prefix2 = [selected, ...newPath];
    const compatible2 = status.moves.filter(
      (move) => move.from === selected && prefix2.every((square, idx) => move.path[idx] === square)
    );
    const complete = compatible2.filter((move) => move.path.length === prefix2.length);
    const longer = compatible2.filter((move) => move.path.length > prefix2.length);

    if (complete.length && longer.length === 0) {
      commitMove(state.active, complete[0]);
    } else if (longer.length) {
      slot.path = newPath;
      render();
    } else if (hintEl) {
      hintEl.textContent = "Нужно продолжить взятие.";
    }
  }

  function handleSquare(index) {
    if (state.thinking || state.promotion) return;
    if (!isHumanTurn()) return;

    const slot = current();
    const status = slot.game.status();
    if (status.over) return;

    if (state.active === "chess") handleChessSquare(index, slot, status);
    else handleCheckersSquare(index, slot, status);
  }

  function resetActive() {
    cancelAI();
    hidePromotion();
    const slot = current();
    slot.game = state.active === "checkers" ? new Engine.CheckersGame() : new Engine.ChessGame();
    slot.history = [];
    slot.selected = null;
    slot.path = [];
    render();
    maybeAI();
  }

  function undo() {
    cancelAI();
    hidePromotion();
    const slot = current();
    if (!slot.history.length) return;

    slot.game = slot.history.pop();
    if (state.mode === "ai" && slot.game.turn === "b" && slot.history.length) {
      slot.game = slot.history.pop();
    }
    slot.selected = null;
    slot.path = [];
    render();
    maybeAI();
  }

  $$(".game-tab").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.game === state.active) return;
      cancelAI();
      hidePromotion();
      state.active = button.dataset.game;
      render();
      maybeAI();
    });
  });

  $$(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.mode === state.mode) return;
      cancelAI();
      hidePromotion();
      state.mode = button.dataset.mode;
      render();
      maybeAI();
    });
  });

  if (difficultySelect) {
    difficultySelect.addEventListener("change", () => {
      state.difficulty = difficultySelect.value;
    });
  }

  if (newButton) newButton.addEventListener("click", resetActive);
  if (undoButton) undoButton.addEventListener("click", undo);
  if (flipButton) {
    flipButton.addEventListener("click", () => {
      state.flipped = !state.flipped;
      render();
    });
  }

  if (boardEl) {
    boardEl.addEventListener("click", (event) => {
      const square = event.target.closest(".sq");
      if (!square) return;
      handleSquare(Number(square.dataset.square));
    });
  }

  promotionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.promotion) return;
      const { gameKey, move } = state.promotion;
      const chosen = { ...move, promotion: button.dataset.promotion };
      hidePromotion();
      commitMove(gameKey, chosen);
    });
  });

  render();
  maybeAI();
})();
