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
import {movePiece} from '~/assets/src/helpers'

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
  movePiece(state: Model, {square, droppedIndex}: MovePiece): Model {
    state.boardState =  movePiece(state.boardState, square, droppedIndex)
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
