import {
  Model,
  Player,
  initializeBoard,
  boardToDrawablePieces,
  DrawablePieces,
} from '~/assets/src/board'

export const state = (): Model => ({
  turn: Player.White,
  boardState: initializeBoard(),
})

export const mutations = () => ({
  initialize(state: Model): Model {
    return {
      turn: Player.White,
      boardState: initializeBoard(),
    }
  },
})

export const getters = {
  drawablePieces(state: Model): DrawablePieces {
    // console.log(state)
    return boardToDrawablePieces(state.boardState)
  },
}
