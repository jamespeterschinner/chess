import {initialBoard, getSquaresWithPieces,} from '~/assets/src/helpers'
import { applyChange } from '~/assets/src/moves'
import {
  PieceMove, Model,
  Player, AssignedPiece,
  Square,
  Board
} from "~/assets/src/types"


export const state = (): Model => ({
  turn: Player.White,
  boardState: initialBoard,
})

export const mutations = {
  initialize(state: Model): Model {
    return {
      turn: Player.White,
      boardState: initialBoard,
    }
  },
  movePiece(state: Model, change: PieceMove): Model {
    state.boardState = applyChange(state.boardState, change)
    state.turn = state.turn == Player.White? Player.Black : Player.White
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
  }
}
