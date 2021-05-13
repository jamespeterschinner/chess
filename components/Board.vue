<template>
  <div>
    <svg viewBox="0 0 10 10" width="400px" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="square" viewBox="0 0 2 2" width="25%" height="25%">
          <rect class="light" x="0" y="0" width="1" height="1" />
          <rect class="light" x="1" y="1" width="1" height="1" />
        </pattern>
      </defs>

      <rect
        class="board"
        x="1"
        y="1"
        width="8"
        height="8"
        fill="url(#square)"
      />
      <path
        class="border stroke-current text-purple-500"
        d="M1,0.5 
        h8
        a0.5,0.5 0 0 1 0.5,0.5 
        v8
        a0.5,0.5 0 0 1 -0.5,0.5
        h-8
        a0.5,0.5 0 0 1 -0.5,-0.5
        v-8
        a0.5,0.5 0 0 1 0.5,-0.5
        Z"
      />
      <Piece
        v-for="({ svg, coordinates }, index) in boardState"
        :key="index"
        :svg-path="svg"
        :coordinates="coordinates"
      />
    </svg>
    <button @click="logState">log state</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {
  assignedPieceToSVG,
  indexToCoordinates,
  Square,
  isSome,
  Coordinates,
} from '~/assets/src/board'

export default Vue.extend({
  computed: {
    boardState() {
      return this.$store.state.board.boardState
        .map((square: Square, index: number) => [
          square,
          indexToCoordinates(index),
        ])
        .filter(([square]: [Square, Coordinates]) => isSome(square))
        .map(([square, coordinates]: [Square, Coordinates]) => {
          return { svg: assignedPieceToSVG(square?.value!), coordinates }
        })
    },
  },
  methods: {
    logState() {
      console.log(this.$store.state.board.boardState)
    },
  },
})
</script>

<style scoped>
.light {
  fill: white;
}
.border {
  fill: transparent;
  stroke-width: 3%;
}
</style>
