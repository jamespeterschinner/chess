<template>
  <image
    ref="piece"
    :href="square.piece.svgURI"
    :height="size"
    :width="size"
    :x="square.coordinates.file * size"
    :y="square.coordinates.row * size"
  />
</template>

<script lang="ts">
import Vue, { PropOptions, PropType } from 'vue'
import { mapGetters } from 'vuex'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import {
  NonEmptySquare,
  coordinatesToIndex,
  Coordinates,
  Board,
} from '~/assets/src/board'
import { relXYToCoordinates } from '~/assets/src/helpers'
import { possibleMoves } from '~/assets/src/moves'

if (process.client) {
  gsap.registerPlugin(Draggable)
}

export default Vue.extend({
  props: {
    size: {
      type: Number,
      required: true,
    } as PropOptions<Number>,
    square: {
      type: Object as PropType<NonEmptySquare>,
      required: true,
    },
  },
  data() {
    return {
      draggable: null,
    }
  },
  computed: {
    ...mapGetters('board', ['board']),
    domElement(): Element {
      return this.$refs.piece as Element
    },
  },
  methods: {
    // This can't be cached as the board can change state with out the piece being
    // rerendered
    moves(): Coordinates[] {
      return possibleMoves({ square: this.$props.square, board: this.board })
    },
  },

  mounted() {
    const target = this.domElement
    const scale = this.$props.size
    const square = this.$props.square
    const offsetCoordinates = this.$props.square.coordinates
    const store = this.$store
    const moves = this.moves

    // Options for the draggable object that need to emit events
    // need to be specified outside of the Draggable constructor
    // inorder to correctly bind `this`
    const onPress = () => {
      this.$emit('pieceSelected', moves())
    }

    const pieceDeselected = () => {
      this.$emit('pieceDeselected')
    }

    this.$data.draggable = Draggable.create(target, {
      onPress,

      onRelease(event: Event) {
        const droppedCoordinates = relXYToCoordinates(
          scale,
          offsetCoordinates,
          this.x,
          this.y
        )
        const droppedIndex = coordinatesToIndex(droppedCoordinates)
        // Using index for equality to avoid object comparison
        if (moves().map((value) => JSON.stringify(value)).some(value => value == JSON.stringify(droppedCoordinates))) {
          // A valid move was made
          store.commit('board/movePiece', { square, droppedIndex })
        } else {
          // No valid move was made, return piece to initial position
          gsap.set(target, { x: 0, y: 0 })
        }
        pieceDeselected()
      },

      // liveSnap: {
      //   x(value) {
      //     // snap to the closest increment of 50.
      //     return Math.round(value / scale) * scale
      //   },
      //   y(value) {
      //     // snap to the closest increment of 25.
      //     return Math.round(value / scale) * scale
      //   },
      // },
    })
  },
})
</script>
