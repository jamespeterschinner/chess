<template>
  <div>
    <svg
      :viewBox="`0 0 ${size} ${size}`"
      :width="`${size}px`"
      :transform="`rotate(${rotation})`"
      xmlns="http://www.w3.org/2000/svg"
      dropzone
    >
      <defs>
        <pattern id="square" viewBox="0 0 2 2" width="25%" height="25%">
          <rect class="light" x="0" y="0" width="1" height="1" />
          <rect class="light" x="1" y="1" width="1" height="1" />
        </pattern>
      </defs>
      <Boarder
        :length="svgDim.boardSize"
        :radius="svgDim.radius"
        :turn="turn"
      />
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
          @pieceDeselected="pieceDeselected"
          :rotation="$data.rotation"
          @pieceMoved="pieceMoved"
          
        />

        <MoveHighLight
          v-for="(coordinates, index) in $data.moveHighLights"
          :key="index"
          :coordinates="coordinates"
          :size="svgDim.squareSize"
        />
      </svg>
    </svg>
    <PromotionChoice
      v-if="isJust(promotionSquare)"
      :rotation="rotation"
      :size="svgDim.squareSize"
      @promotionSelected="promotionSelected"
    />
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import Vue from 'vue'
import {
  AssignedPiece,
  Board,
  Coordinates,
  EmittedMove,
  MaybeEmptySquare,
} from '~/assets/src/types'
import gsap, { Sine } from 'gsap'
import PromotionChoice from './PromotionChoice.vue'
import { defaultMapUnwrap, isJust, just, nothing } from '~/assets/src/maybe'
import { coordinatesToIndex } from '~/assets/src/helpers'

export default Vue.extend({
  components: { PromotionChoice },
  data() {
    return {
      moveHighLights: [],
      rotation: 180,
      promotionSquare: nothing,
      isJust: isJust
    }
  },
  computed: {
    ...mapGetters('board', ['board', 'squaresWithPieces', 'turn', 'size']),
    svgDim() {
      const size = this.size
      return {
        boardOffset: size * -0.1,
        boardSize: size * 0.8,
        radius: size * 0.05,
        squareSize: size * 0.1,
      }
    },
  },
  methods: {
    pieceSelected(moveHighLights: Coordinates[]): void {
      this.$data.moveHighLights = moveHighLights
    },
    pieceDeselected(): void {
      this.$data.moveHighLights = []
    },
    pieceMoved({ coordinates, board, pawnPromotion }: EmittedMove): void {
  
      if (isJust(this.$data.promotionSquare)) {
        // Guard against making two moves
        return
      }
      if (pawnPromotion) {
        this.$data.promotionSquare = just(coordinates)
        this.$store.commit('board/makeMove', { board, changeTurn: false })
      } else {
        this.$store.commit('board/makeMove', { board, changeTurn: true })
      }
    },
    promotionSelected(piece: AssignedPiece) {

      // Out of bounds if nothing to update
      let updateIndex = defaultMapUnwrap(
        this.$data.promotionSquare,
        coordinatesToIndex,
        65
      )
      this.$store.commit('board/makeMove', {
        board: this.board.map((square: MaybeEmptySquare, index: number) => {
          if (index == updateIndex) {
            return { ...square, piece: just(piece) }
          } else {
            return square
          }
        }),
        changeTurn: true,
      })
      this.$data.promotionSquare = nothing
    },
  },
  watch: {
    turn(orientation) {
      setTimeout(
        () =>
          gsap.to(this.$data, {
            duration: 0.5,
            ease: Sine.easeIn,
            rotation: orientation ? 0 : 1 * 180,
          }),
        200
      )
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
