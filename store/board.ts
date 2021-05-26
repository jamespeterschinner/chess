import {
  Model,
  Player,
  initialBoard,
  AssignedPiece,
  Coordinates,
  Square,
  getSquaresWithPieces,
  NonEmptySquare,
  Board
} from '~/assets/src/board'
import {applyChange, StateChange} from '~/assets/src/moves'

interface MovePiece {
  square: NonEmptySquare,
  droppedIndex: number
}

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
  movePiece(state: Model, change: StateChange): Model {
    state.boardState =  applyChange(state.boardState, change)
    return state
  }
}

export const getters = {
  squaresWithPieces(state: Model): Square<AssignedPiece>[] {
    // console.log(state)
    return getSquaresWithPieces(state.boardState)
  },
  board(state: Model): Board {
    return state.boardState
  }
}
