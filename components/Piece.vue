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
import { NonEmptySquare, coordinatesToIndex} from '~/assets/src/board'
import { relXYToCoordinates } from '~/assets/src/helpers'

import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'

if (process.client) {
  gsap.registerPlugin(Draggable)
}

export default Vue.extend({
  data() {
    return {
      draggable: null,
    }
  },
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
  computed: {
    domElement(): Element {
      return this.$refs.piece as Element
    },
  },

  mounted() {
    let target = this.domElement,
      scale = this.$props.size,
      square = this.$props.square,
      offsetCoordinates = this.$props.square.coordinates,
      store = this.$store,
      onDrag = () => {
        // Need to use arrow function to capture this
        this.$emit('pieceSelected', square)
      }
    this.$data.draggable = Draggable.create(target, {
      onDrag: onDrag,

      onRelease(event: Event) {
        let droppedIndex = coordinatesToIndex(relXYToCoordinates(
          scale,
          offsetCoordinates,
          this.x,
          this.y
        ))
        store.commit('board/movePiece', { square, droppedIndex})
      },

      liveSnap: {
        x: function (value) {
          //snap to the closest increment of 50.
          return Math.round(value / scale) * scale
        },
        y: function (value) {
          //snap to the closest increment of 25.
          return Math.round(value / scale) * scale
        },
      },
    })
  },
})
</script>
