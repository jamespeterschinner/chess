import {Model, Player, initializeBoard } from "~/assets/src/board";

export const state = (): Model => ({
    turn: Player.White,
    boardState: initializeBoard()
})

export const mutations = () => ({
    initialize(state: Model): Model {
        return {
            turn: Player.White,
            boardState: initializeBoard()
        }
    }
})