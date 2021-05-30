import { initialBoard, getSquaresWithPieces, } from '~/assets/src/helpers'
import {
  PossibleMove, Model,
  Player, AssignedPiece,
  Square,
  Board,
  Move
} from "~/assets/src/types"


export const state = (): Model => ({
  turn: Player.White,
  boardState: initialBoard,
  size: 500
})

export const mutations = {
  initialize(state: Model): Model {
    return {
      turn: Player.White,
      boardState: initialBoard,
      size: 500
    }
  },
  makeMove(state: Model, { board, changeTurn }: { board: Board, changeTurn: boolean }): Model {
    state.boardState = board
    if (changeTurn) {
      state.turn = state.turn == Player.White ? Player.Black : Player.White
    }
    return state
  }
}

export const getters = {
  squaresWithPieces(state: Model): Square<AssignedPiece>[] {
    return getSquaresWithPieces(state.boardState)
  },
  board(state: Model): Board {
    return state.boardState
  },
  turn(state: Model): Player {
    return state.turn
  },
  size(state: Model): number {
    return state.size
  }
}
