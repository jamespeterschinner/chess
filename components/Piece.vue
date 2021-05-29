<template>
  <g ref="piece">
    <image
      :href="square.piece.svgURI"
      :height="size"
      :width="size"
      :x="x"
      :y="y"
      :transform="`rotate(${rotation}, ${x + size / 2}, ${y + size / 2})`"
    />
  </g>
</template>

<script lang="ts">
import Vue, { PropOptions, PropType } from 'vue'
import { mapGetters } from 'vuex'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { relXYToCoordinates, coordinatesToIndex } from '~/assets/src/helpers'
import { possibleMovesThatDontThreatenKing } from '~/assets/src/moves'
import {
  MappedMoves,
  NonEmptySquare,
  Player,
  Coordinates,
  Move,
} from '~/assets/src/types'

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
    rotation: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      draggable: null,
      Player,
    }
  },
  computed: {
    ...mapGetters('board', ['board', 'turn']),
    domElement(): Element {
      return this.$refs.piece as Element
    },
    file(): number {
      return this.$props.square.coordinates.file
    },
    row(): number {
      return this.$props.square.coordinates.row
    },
    x(): number {
      return this.file * this.$props.size
    },
    y(): number {
      return this.row * this.$props.size
    },
  },
  methods: {
    // This can't be cached as the board can change state with out the piece being
    // rerendered
    _possibleMoves(): Move[] {
      return possibleMovesThatDontThreatenKing({
        square: this.$props.square,
        board: this.board,
      })
    },
    moves(): Coordinates[] {
      return this._possibleMoves().map(({ coordinates }) => coordinates)
    },
    mappedMoves(): MappedMoves {
      return Object.fromEntries(
        this._possibleMoves().map(({ coordinates, board }) => [
          JSON.stringify(coordinates),
          board,
        ])
      )
    },
  },

  mounted() {
    const target = this.domElement
    const scale = this.$props.size
    const offsetCoordinates = this.$props.square.coordinates
    const store = this.$store
    const moves = this.moves
    const mappedMoves = this.mappedMoves
    const isturn = () => this.turn == this.square.piece.owner

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
        pieceDeselected()
        if (isturn()) {
          const droppedCoordinates = relXYToCoordinates(
            scale,
            offsetCoordinates,
            this.x,
            this.y
          )
          const droppedIndex = coordinatesToIndex(droppedCoordinates)

          let newBoard = mappedMoves()[JSON.stringify(droppedCoordinates)]
          // Using index for equality to avoid object comparison
          if (newBoard) {
            // A valid move was made
            store.commit('board/makeMove', newBoard)
            return
          }
        } 
        // No valid move was made, return piece to initial position
          gsap.set(target, { x: 0, y: 0 })
      },
    })
  },
})
</script>
