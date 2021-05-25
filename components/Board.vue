<template>
  <div>
    <svg
      :viewBox="`0 0 ${size} ${size}`"
      :width="`${size}px`"
      xmlns="http://www.w3.org/2000/svg"
      dropzone
    >
      <defs>
        <pattern id="square" viewBox="0 0 2 2" width="25%" height="25%">
          <rect class="light" x="0" y="0" width="1" height="1" />
          <rect class="light" x="1" y="1" width="1" height="1" />
        </pattern>
      </defs>
      <Boarder :length="svgDim.boardSize" :radius="svgDim.radius" />
      <!-- Using another viewBox allows alligning
      the piece coordinates with the chess board coordinates -->
      <svg
        :viewBox="`${svgDim.boardOffset} ${svgDim.boardOffset} ${size} ${size}`"
      >
        <rect
          class="board"
          x="0"
          y="0"
          :width="`${svgDim.boardSize}`"
          :height="`${svgDim.boardSize}`"
          fill="url(#square)"
        />

        <Piece
          v-for="square in squaresWithPieces"
          :key="JSON.stringify(square)"
          :size="svgDim.squareSize"
          :square="square"
          @pieceSelected="pieceSelected"
          @pieceDeselected='pieceDeselected'
        />

        <MoveHighLight
          v-for="(coordinates, index) in $data.moveHighLights"
          :key="index"
          :coordinates="coordinates"
          :size="svgDim.squareSize"
        />
      </svg>
    </svg>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import Vue from 'vue'
import {
  AssignedPiece,
  Board,
  Coordinates,
  NonEmptySquare,
} from '~/assets/src/board'
import { possibleMoves } from '~/assets/src/moves'

export default Vue.extend({
  data() {
    return {
      size: 500,
      moveHighLights: [],
    }
  },
  computed: {
    ...mapGetters('board', ['squaresWithPieces']),
    svgDim() {
      const size = this.$data.size
      return {
        boardOffset: size * -0.1,
        boardSize: size * 0.8,
        radius: size * 0.05,
        squareSize: size * 0.1,
      }
    },
  },
  methods: {
    board(): Board {
      // If used as a getter typescript doesn't infer return type
      return this.$store.state.board.boardState
    },
    pieceSelected(moveHighLights: Coordinates[]) {
      this.$data.moveHighLights = moveHighLights
    },
    pieceDeselected() {
      console.log('piece deSelected')
      this.$data.moveHighLights = []
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
