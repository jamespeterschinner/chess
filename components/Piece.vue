<template>
  <image
    ref="piece"
    :href="drawablePiece.svgURI"
    :height="size"
    :width="size"
    :x="drawablePiece.assignedPiece.coordinates.file * size"
    :y="drawablePiece.assignedPiece.coordinates.row * size"
    @click="click"
  />
</template>

<script lang="ts">
import Vue, { PropOptions, PropType } from 'vue'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'

import { DrawablePiece } from '~/assets/src/board'

if (process.client) {
  gsap.registerPlugin(Draggable)
}

export default Vue.extend({
  props: {
    size: {
      type: Number,
      required: true,
    } as PropOptions<Number>,
    drawablePiece: {
      type: Object as PropType<DrawablePiece>,
      required: true,
    },
  },
  computed: {
    domElement(): Element {
      return this.$refs.piece as Element
    },
    // x():Number {
    //   let offset =
    //     Number(this.domElement.attributes?.transform.value.match(/(\-?\d+,?){4}(\-?\d+)/).pop())
    // }
  },
  methods: {
    getTransformNumber(index: Number): Number {
      try {
        return Number(
          this.domElement.attributes
            .getNamedItem('transform')! // Silence lint
            .value.match(`(\\-?\\d+,?){${index}}(\\-?\\d+)`)! // Any errors will return 0
            .pop()
        )
      } catch {
        return 0
      }
    },

    click() {
      // This event callback is fired when a Drag event ends
      console.log(this.getTransformNumber(4), this.getTransformNumber(5))
      // console.log(xYToCoordinates(this.$props.scale, this.domElement.attributes))
    },
  },
  mounted() {
    Draggable.create(this.domElement)
  },
})
</script>
