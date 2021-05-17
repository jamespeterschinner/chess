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
          v-for="(drawablePiece, index) in drawablePieces"
          :key="index"
          :size="svgDim.squareSize"
          :drawable-piece="drawablePiece"
        />
      </svg>
    </svg>
    <button @click="logState">log state</button>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      size: 500,
    }
  },
  computed: {
    ...mapGetters('board', ['drawablePieces']),
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
    logState() {
      console.log(this.$store.state)
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
