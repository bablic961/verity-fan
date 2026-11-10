/* ============================================================
   ВЕРИТИ.fan — движки шашек и шахмат
   Чистая логика без DOM. В браузере — window.VerityGames,
   в Node — module.exports (для тестов).
   ============================================================ */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VerityGames = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  /* ==========================================================
     ШАШКИ (русские)
     ========================================================== */

  const CHECKERS_SIZE = 8;
  const WHITE = "w";
  const BLACK = "b";
  const CHECKERS_DIRS = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];

  const cRow = (i) => Math.floor(i / 8);
  const cCol = (i) => i % 8;
  const cIndex = (r, c) => r * 8 + c;
  const cOnBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const cDark = (r, c) => (r + c) % 2 === 1;
  const cOther = (color) => (color === WHITE ? BLACK : WHITE);
  const cPromotionRow = (color) => (color === WHITE ? 0 : 7);

  class CheckersGame {
    constructor() {
      this.reset();
    }

    reset() {
      this.board = Array(64).fill(null);
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 8; c += 1) {
          if (cDark(r, c)) this.board[cIndex(r, c)] = { color: BLACK, king: false };
        }
      }
      for (let r = 5; r < 8; r += 1) {
        for (let c = 0; c < 8; c += 1) {
          if (cDark(r, c)) this.board[cIndex(r, c)] = { color: WHITE, king: false };
        }
      }
      this.turn = WHITE;
      this.ply = 0;
      this.idle = 0;
      this.lastMove = null;
    }

    clone() {
      const copy = new CheckersGame();
      copy.board = this.board.map((piece) => (piece ? { color: piece.color, king: piece.king } : null));
      copy.turn = this.turn;
      copy.ply = this.ply;
      copy.idle = this.idle;
      copy.lastMove = this.lastMove ? JSON.parse(JSON.stringify(this.lastMove)) : null;
      return copy;
    }

    legalMoves(color = this.turn) {
      const captures = [];
      const simple = [];
      for (let i = 0; i < 64; i += 1) {
        const piece = this.board[i];
        if (!piece || piece.color !== color) continue;
        captures.push(...this.capturesFrom(i, piece));
      }
      if (captures.length) return captures;
      for (let i = 0; i < 64; i += 1) {
        const piece = this.board[i];
        if (!piece || piece.color !== color) continue;
        simple.push(...this.simpleFrom(i, piece));
      }
      return simple;
    }

    simpleFrom(from, piece) {
      const moves = [];
      const row = cRow(from);
      const col = cCol(from);
      const dirs = piece.king
        ? CHECKERS_DIRS
        : [
            [piece.color === WHITE ? -1 : 1, -1],
            [piece.color === WHITE ? -1 : 1, 1]
          ];

      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (cOnBoard(r, c)) {
          const to = cIndex(r, c);
          if (this.board[to]) break;
          moves.push({
            from,
            to,
            path: [from, to],
            captures: [],
            promoted: !piece.king && r === cPromotionRow(piece.color)
          });
          if (!piece.king) break;
          r += dr;
          c += dc;
        }
      }
      return moves;
    }

    capturesFrom(from, piece) {
      const initial = this.board.map((item) => (item ? { color: item.color, king: item.king } : null));
      initial[from] = null;
      const results = [];

      const walk = (board, current, path, captured, visited, isKing) => {
        const out = [];
        const row = cRow(current);
        const col = cCol(current);

        for (const [dr, dc] of CHECKERS_DIRS) {
          let r = row + dr;
          let c = col + dc;
          let enemy = -1;

          while (cOnBoard(r, c)) {
            const square = cIndex(r, c);
            if (board[square] === null) {
              // Обычная шашка ищет соперника только на соседней клетке,
              // дамка — на всей диагонали.
              if (!isKing) break;
              r += dr;
              c += dc;
              continue;
            }
            if (board[square].color === piece.color) break;
            enemy = square;
            break;
          }
          if (enemy < 0) continue;

          let lr = cRow(enemy) + dr;
          let lc = cCol(enemy) + dc;
          while (cOnBoard(lr, lc)) {
            const land = cIndex(lr, lc);
            if (board[land] !== null) break;
            if (!visited.has(land)) {
              const nextBoard = board.map((item) =>
                item ? { color: item.color, king: item.king } : null
              );
              nextBoard[current] = null;
              nextBoard[enemy] = null;
              const moved = { color: piece.color, king: isKing };
              const promoted = !isKing && lr === cPromotionRow(piece.color);
              if (promoted) moved.king = true;
              nextBoard[land] = moved;

              const nextPath = path.concat(land);
              const nextCaptured = captured.concat(enemy);
              const nextVisited = new Set(visited);
              nextVisited.add(land);

              if (promoted) {
                out.push({
                  from,
                  to: land,
                  path: nextPath,
                  captures: nextCaptured,
                  promoted: true
                });
              } else {
                const further = walk(nextBoard, land, nextPath, nextCaptured, nextVisited, isKing);
                if (further.length) {
                  out.push(...further);
                } else {
                  out.push({
                    from,
                    to: land,
                    path: nextPath,
                    captures: nextCaptured,
                    promoted: false
                  });
                }
              }
            }
            if (!isKing) break;
            lr += dr;
            lc += dc;
          }
        }
        return out;
      };

      results.push(...walk(initial, from, [from], [], new Set([from]), piece.king));
      return results;
    }

    applyMove(move) {
      const piece = this.board[move.from];
      if (!piece) return false;
      this.board[move.from] = null;
      for (const captured of move.captures) this.board[captured] = null;
      const promoted =
        !piece.king &&
        (move.promoted || cRow(move.to) === cPromotionRow(piece.color));
      this.board[move.to] = { color: piece.color, king: piece.king || promoted };
      this.lastMove = {
        from: move.from,
        to: move.to,
        path: move.path.slice(),
        captures: move.captures.slice()
      };
      this.ply += 1;
      const resetIdle = move.captures.length > 0 || !piece.king;
      this.idle = resetIdle ? 0 : this.idle + 1;
      this.turn = cOther(this.turn);
      return true;
    }

    status() {
      const moves = this.legalMoves();
      if (!moves.length) {
        return { over: true, winner: cOther(this.turn), draw: false, reason: "no-moves", moves };
      }
      if (this.idle >= 60) {
        return { over: true, winner: null, draw: true, reason: "idle", moves };
      }
      return { over: false, winner: null, draw: false, reason: "", moves };
    }

    count(color) {
      return this.board.reduce((total, piece) => total + (piece && piece.color === color ? 1 : 0), 0);
    }

    evaluate() {
      let score = 0;
      for (let i = 0; i < 64; i += 1) {
        const piece = this.board[i];
        if (!piece) continue;
        const row = cRow(i);
        const col = cCol(i);
        let value = piece.king ? 320 : 100;
        if (!piece.king) {
          const advance = piece.color === WHITE ? 7 - row : row;
          value += advance * 6;
          if ((piece.color === WHITE && row === 7) || (piece.color === BLACK && row === 0)) {
            value += 12;
          }
        } else {
          value += 20;
        }
        const center = 7 - Math.abs(3.5 - row) - Math.abs(3.5 - col);
        value += center * 2;
        score += piece.color === WHITE ? value : -value;
      }
      return score;
    }

    orderMoves(moves) {
      return moves.slice().sort((a, b) => {
        const scoreA = a.captures.length * 100 + (a.promoted ? 50 : 0);
        const scoreB = b.captures.length * 100 + (b.promoted ? 50 : 0);
        return scoreB - scoreA;
      });
    }

    search(depth, alpha, beta) {
      if (depth <= 0) return this.evaluate() * (this.turn === WHITE ? 1 : -1);
      const moves = this.legalMoves();
      if (!moves.length) return -100000 + this.ply;
      if (this.idle >= 60) return 0;

      let best = -Infinity;
      for (const move of this.orderMoves(moves)) {
        const child = this.clone();
        child.applyMove(move);
        const score = -child.search(depth - 1, -beta, -alpha);
        if (score > best) best = score;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }

    chooseMove(difficulty = "medium") {
      const moves = this.legalMoves();
      if (!moves.length) return null;
      if (difficulty === "easy" && Math.random() < 0.3) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      const depth = difficulty === "easy" ? 1 : difficulty === "hard" ? 5 : 3;
      let bestScore = -Infinity;
      let bestMoves = [];

      for (const move of this.orderMoves(moves)) {
        const child = this.clone();
        child.applyMove(move);
        let score = -child.search(depth - 1, -Infinity, Infinity);
        if (difficulty === "easy") score += (Math.random() - 0.5) * 40;
        if (score > bestScore + 0.001) {
          bestScore = score;
          bestMoves = [move];
        } else if (Math.abs(score - bestScore) <= 0.001) {
          bestMoves.push(move);
        }
      }
      return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
    }
  }

  /* ==========================================================
     ШАХМАТЫ
     ========================================================== */

  const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  const PAWN_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
  ];

  const KNIGHT_TABLE = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
  ];

  const BISHOP_TABLE = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
  ];

  const ROOK_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0
  ];

  const QUEEN_TABLE = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20
  ];

  const KING_TABLE = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20
  ];

  const KING_END_TABLE = [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10, 0, 0, -10, -20, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -30, 0, 0, 0, 0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50
  ];

  const CHESS_TABLES = {
    p: PAWN_TABLE,
    n: KNIGHT_TABLE,
    b: BISHOP_TABLE,
    r: ROOK_TABLE,
    q: QUEEN_TABLE,
    k: KING_TABLE
  };

  const KNIGHT_DELTAS = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  const KING_DELTAS = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1]
  ];
  const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const QUEEN_DIRS = ROOK_DIRS.concat(BISHOP_DIRS);

  const chRow = (i) => Math.floor(i / 8);
  const chCol = (i) => i % 8;
  const chIndex = (r, c) => r * 8 + c;
  const chOnBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const chOther = (color) => (color === "w" ? "b" : "w");
  const chColor = (piece) => (piece ? piece[0] : null);
  const chType = (piece) => (piece ? piece[1] : null);

  class ChessGame {
    constructor() {
      this.reset();
    }

    reset() {
      this.board = Array(64).fill(null);
      const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
      for (let c = 0; c < 8; c += 1) {
        this.board[c] = "b" + back[c];
        this.board[8 + c] = "bp";
        this.board[48 + c] = "wp";
        this.board[56 + c] = "w" + back[c];
      }
      this.turn = "w";
      this.castling = { wK: true, wQ: true, bK: true, bQ: true };
      this.ep = -1;
      this.halfmove = 0;
      this.fullmove = 1;
      this.ply = 0;
      this.lastMove = null;
    }

    clone() {
      const copy = new ChessGame();
      copy.board = this.board.slice();
      copy.turn = this.turn;
      copy.castling = { ...this.castling };
      copy.ep = this.ep;
      copy.halfmove = this.halfmove;
      copy.fullmove = this.fullmove;
      copy.ply = this.ply;
      copy.lastMove = this.lastMove ? { ...this.lastMove } : null;
      return copy;
    }

    findKing(color) {
      const target = color + "k";
      for (let i = 0; i < 64; i += 1) {
        if (this.board[i] === target) return i;
      }
      return -1;
    }

    isSquareAttacked(square, byColor) {
      const row = chRow(square);
      const col = chCol(square);

      const pawnRow = row + (byColor === "w" ? 1 : -1);
      for (const dc of [-1, 1]) {
        const c = col + dc;
        if (chOnBoard(pawnRow, c) && this.board[chIndex(pawnRow, c)] === byColor + "p") {
          return true;
        }
      }

      for (const [dr, dc] of KNIGHT_DELTAS) {
        const r = row + dr;
        const c = col + dc;
        if (chOnBoard(r, c) && this.board[chIndex(r, c)] === byColor + "n") return true;
      }

      for (const [dr, dc] of KING_DELTAS) {
        const r = row + dr;
        const c = col + dc;
        if (chOnBoard(r, c) && this.board[chIndex(r, c)] === byColor + "k") return true;
      }

      for (const [dr, dc] of ROOK_DIRS) {
        let r = row + dr;
        let c = col + dc;
        while (chOnBoard(r, c)) {
          const piece = this.board[chIndex(r, c)];
          if (piece) {
            if (chColor(piece) === byColor && (chType(piece) === "r" || chType(piece) === "q")) {
              return true;
            }
            break;
          }
          r += dr;
          c += dc;
        }
      }

      for (const [dr, dc] of BISHOP_DIRS) {
        let r = row + dr;
        let c = col + dc;
        while (chOnBoard(r, c)) {
          const piece = this.board[chIndex(r, c)];
          if (piece) {
            if (chColor(piece) === byColor && (chType(piece) === "b" || chType(piece) === "q")) {
              return true;
            }
            break;
          }
          r += dr;
          c += dc;
        }
      }

      return false;
    }

    isKingInCheck(color) {
      const king = this.findKing(color);
      return king >= 0 && this.isSquareAttacked(king, chOther(color));
    }

    addPromotions(moves, from, to, captured) {
      for (const promotion of ["q", "r", "b", "n"]) {
        moves.push({ from, to, promotion, captured: captured || null });
      }
    }

    pseudoMoves(color = this.turn) {
      const moves = [];
      for (let from = 0; from < 64; from += 1) {
        const piece = this.board[from];
        if (!piece || chColor(piece) !== color) continue;
        const type = chType(piece);
        const row = chRow(from);
        const col = chCol(from);

        if (type === "p") {
          const dir = color === "w" ? -1 : 1;
          const startRow = color === "w" ? 6 : 1;
          const promoRow = color === "w" ? 0 : 7;
          const oneRow = row + dir;
          if (chOnBoard(oneRow, col) && !this.board[chIndex(oneRow, col)]) {
            const to = chIndex(oneRow, col);
            if (oneRow === promoRow) {
              this.addPromotions(moves, from, to, null);
            } else {
              moves.push({ from, to, captured: null });
              const twoRow = row + 2 * dir;
              if (row === startRow && !this.board[chIndex(twoRow, col)]) {
                moves.push({ from, to: chIndex(twoRow, col), captured: null });
              }
            }
          }
          for (const dc of [-1, 1]) {
            const c = col + dc;
            if (!chOnBoard(oneRow, c)) continue;
            const to = chIndex(oneRow, c);
            const target = this.board[to];
            if (target && chColor(target) !== color) {
              if (oneRow === promoRow) {
                this.addPromotions(moves, from, to, target);
              } else {
                moves.push({ from, to, captured: target });
              }
            } else if (!target && to === this.ep) {
              const capSq = to + (color === "w" ? 8 : -8);
              moves.push({
                from,
                to,
                captured: this.board[capSq],
                ep: true,
                epSquare: capSq
              });
            }
          }
          continue;
        }

        if (type === "n" || type === "k") {
          const deltas = type === "n" ? KNIGHT_DELTAS : KING_DELTAS;
          for (const [dr, dc] of deltas) {
            const r = row + dr;
            const c = col + dc;
            if (!chOnBoard(r, c)) continue;
            const to = chIndex(r, c);
            const target = this.board[to];
            if (!target || chColor(target) !== color) {
              moves.push({ from, to, captured: target || null });
            }
          }
          continue;
        }

        const dirs = type === "r" ? ROOK_DIRS : type === "b" ? BISHOP_DIRS : QUEEN_DIRS;
        for (const [dr, dc] of dirs) {
          let r = row + dr;
          let c = col + dc;
          while (chOnBoard(r, c)) {
            const to = chIndex(r, c);
            const target = this.board[to];
            if (!target) {
              moves.push({ from, to, captured: null });
            } else {
              if (chColor(target) !== color) moves.push({ from, to, captured: target });
              break;
            }
            r += dr;
            c += dc;
          }
        }
      }

      const kingSquare = color === "w" ? 60 : 4;
      const kingPiece = color === "w" ? "wk" : "bk";
      const enemy = chOther(color);
      if (this.board[kingSquare] === kingPiece && !this.isSquareAttacked(kingSquare, enemy)) {
        if (color === "w") {
          if (
            this.castling.wK &&
            this.board[63] === "wr" &&
            !this.board[61] &&
            !this.board[62] &&
            !this.isSquareAttacked(61, enemy) &&
            !this.isSquareAttacked(62, enemy)
          ) {
            moves.push({ from: 60, to: 62, castle: "K", captured: null });
          }
          if (
            this.castling.wQ &&
            this.board[56] === "wr" &&
            !this.board[59] &&
            !this.board[58] &&
            !this.board[57] &&
            !this.isSquareAttacked(59, enemy) &&
            !this.isSquareAttacked(58, enemy)
          ) {
            moves.push({ from: 60, to: 58, castle: "Q", captured: null });
          }
        } else {
          if (
            this.castling.bK &&
            this.board[7] === "br" &&
            !this.board[5] &&
            !this.board[6] &&
            !this.isSquareAttacked(5, enemy) &&
            !this.isSquareAttacked(6, enemy)
          ) {
            moves.push({ from: 4, to: 6, castle: "K", captured: null });
          }
          if (
            this.castling.bQ &&
            this.board[0] === "br" &&
            !this.board[3] &&
            !this.board[2] &&
            !this.board[1] &&
            !this.isSquareAttacked(3, enemy) &&
            !this.isSquareAttacked(2, enemy)
          ) {
            moves.push({ from: 4, to: 2, castle: "Q", captured: null });
          }
        }
      }

      return moves;
    }

    legalMoves(color = this.turn) {
      const legal = [];
      for (const move of this.pseudoMoves(color)) {
        const undo = this.makeMove(move);
        if (!this.isKingInCheck(color)) legal.push(move);
        this.unmakeMove(undo);
      }
      return legal;
    }

    makeMove(move) {
      const piece = this.board[move.from];
      const color = chColor(piece);
      const type = chType(piece);
      const undo = {
        move,
        piece,
        captured: null,
        capturedSquare: -1,
        castling: { ...this.castling },
        ep: this.ep,
        halfmove: this.halfmove,
        fullmove: this.fullmove,
        turn: this.turn,
        ply: this.ply,
        lastMove: this.lastMove,
        rookFrom: -1,
        rookTo: -1
      };

      this.board[move.from] = null;

      if (move.ep) {
        const capSq = move.to + (color === "w" ? 8 : -8);
        undo.captured = this.board[capSq];
        undo.capturedSquare = capSq;
        this.board[capSq] = null;
      } else {
        const target = this.board[move.to];
        if (target) {
          undo.captured = target;
          undo.capturedSquare = move.to;
          this.board[move.to] = null;
        }
      }

      this.board[move.to] = move.promotion ? color + move.promotion : piece;

      if (move.castle === "K") {
        undo.rookFrom = color === "w" ? 63 : 7;
        undo.rookTo = color === "w" ? 61 : 5;
      } else if (move.castle === "Q") {
        undo.rookFrom = color === "w" ? 56 : 0;
        undo.rookTo = color === "w" ? 59 : 3;
      }
      if (undo.rookFrom >= 0) {
        this.board[undo.rookTo] = this.board[undo.rookFrom];
        this.board[undo.rookFrom] = null;
      }

      if (type === "k") {
        if (color === "w") {
          this.castling.wK = false;
          this.castling.wQ = false;
        } else {
          this.castling.bK = false;
          this.castling.bQ = false;
        }
      }
      if (type === "r") {
        if (move.from === 63) this.castling.wK = false;
        if (move.from === 56) this.castling.wQ = false;
        if (move.from === 7) this.castling.bK = false;
        if (move.from === 0) this.castling.bQ = false;
      }
      if (undo.captured && chType(undo.captured) === "r") {
        if (undo.capturedSquare === 63) this.castling.wK = false;
        if (undo.capturedSquare === 56) this.castling.wQ = false;
        if (undo.capturedSquare === 7) this.castling.bK = false;
        if (undo.capturedSquare === 0) this.castling.bQ = false;
      }

      this.ep = type === "p" && Math.abs(move.to - move.from) === 16 ? (move.from + move.to) / 2 : -1;
      this.halfmove = type === "p" || undo.captured ? 0 : this.halfmove + 1;
      if (color === "b") this.fullmove += 1;
      this.turn = chOther(color);
      this.ply += 1;
      this.lastMove = move;
      return undo;
    }

    unmakeMove(undo) {
      const move = undo.move;
      this.board[move.to] = null;
      if (undo.rookFrom >= 0) {
        this.board[undo.rookFrom] = this.board[undo.rookTo];
        this.board[undo.rookTo] = null;
      }
      if (undo.captured) this.board[undo.capturedSquare] = undo.captured;
      this.board[move.from] = undo.piece;
      this.castling = undo.castling;
      this.ep = undo.ep;
      this.halfmove = undo.halfmove;
      this.fullmove = undo.fullmove;
      this.turn = undo.turn;
      this.ply = undo.ply;
      this.lastMove = undo.lastMove;
    }

    isInsufficientMaterial() {
      const pieces = [];
      for (let i = 0; i < 64; i += 1) {
        if (this.board[i]) pieces.push(this.board[i]);
      }
      if (pieces.length <= 2) return true;
      if (pieces.length === 3 && pieces.some((piece) => chType(piece) === "b" || chType(piece) === "n")) {
        return true;
      }
      return false;
    }

    status() {
      const moves = this.legalMoves();
      const inCheck = this.isKingInCheck(this.turn);
      if (!moves.length) {
        return {
          over: true,
          winner: inCheck ? chOther(this.turn) : null,
          draw: !inCheck,
          reason: inCheck ? "checkmate" : "stalemate",
          inCheck,
          moves
        };
      }
      if (this.halfmove >= 100) {
        return { over: true, winner: null, draw: true, reason: "50-move", inCheck, moves };
      }
      if (this.isInsufficientMaterial()) {
        return { over: true, winner: null, draw: true, reason: "material", inCheck, moves };
      }
      return { over: false, winner: null, draw: false, reason: "", inCheck, moves };
    }

    evaluate() {
      let score = 0;
      let material = 0;
      for (let i = 0; i < 64; i += 1) {
        const piece = this.board[i];
        if (!piece || chType(piece) === "k") continue;
        material += PIECE_VALUES[chType(piece)];
      }
      const endgame = material < 2200;

      for (let i = 0; i < 64; i += 1) {
        const piece = this.board[i];
        if (!piece) continue;
        const color = chColor(piece);
        const type = chType(piece);
        const table = type === "k" && endgame ? KING_END_TABLE : CHESS_TABLES[type];
        const index = color === "w" ? i : i ^ 56;
        const value = PIECE_VALUES[type] + table[index];
        score += color === "w" ? value : -value;
      }

      const whiteBishops = this.board.filter((piece) => piece === "wb").length;
      const blackBishops = this.board.filter((piece) => piece === "bb").length;
      if (whiteBishops >= 2) score += 30;
      if (blackBishops >= 2) score -= 30;
      return score;
    }

    orderMoves(moves) {
      return moves.slice().sort((a, b) => {
        const scoreA =
          (a.captured ? PIECE_VALUES[chType(a.captured)] * 10 : 0) +
          (a.promotion ? 800 : 0) +
          (a.castle ? 40 : 0);
        const scoreB =
          (b.captured ? PIECE_VALUES[chType(b.captured)] * 10 : 0) +
          (b.promotion ? 800 : 0) +
          (b.castle ? 40 : 0);
        return scoreB - scoreA;
      });
    }

    search(depth, alpha, beta) {
      if (depth <= 0) return this.evaluate() * (this.turn === "w" ? 1 : -1);
      const moves = this.legalMoves();
      if (!moves.length) {
        if (this.isKingInCheck(this.turn)) return -100000 + this.ply;
        return 0;
      }
      if (this.halfmove >= 100) return 0;

      let best = -Infinity;
      for (const move of this.orderMoves(moves)) {
        const undo = this.makeMove(move);
        const score = -this.search(depth - 1, -beta, -alpha);
        this.unmakeMove(undo);
        if (score > best) best = score;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }

    chooseMove(difficulty = "medium") {
      const moves = this.legalMoves();
      if (!moves.length) return null;
      if (difficulty === "easy" && Math.random() < 0.35) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      const depth = difficulty === "easy" ? 1 : difficulty === "hard" ? 3 : 2;
      let bestScore = -Infinity;
      let bestMoves = [];

      for (const move of this.orderMoves(moves)) {
        const undo = this.makeMove(move);
        let score = -this.search(depth - 1, -Infinity, Infinity);
        this.unmakeMove(undo);
        if (difficulty === "easy") score += (Math.random() - 0.5) * 45;
        if (score > bestScore + 0.001) {
          bestScore = score;
          bestMoves = [move];
        } else if (Math.abs(score - bestScore) <= 0.001) {
          bestMoves.push(move);
        }
      }
      return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
    }

    perft(depth) {
      if (depth === 0) return 1;
      const moves = this.legalMoves();
      if (depth === 1) return moves.length;
      let nodes = 0;
      for (const move of moves) {
        const undo = this.makeMove(move);
        nodes += this.perft(depth - 1);
        this.unmakeMove(undo);
      }
      return nodes;
    }
  }

  return {
    CheckersGame,
    ChessGame,
    constants: {
      WHITE,
      BLACK,
      PIECE_VALUES
    }
  };
});
