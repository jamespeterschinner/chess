<template>
  <circle
    :height="size"
    :width="size"
    :cx="coordinates.file * size + size / 2"
    :cy="coordinates.row * size + size / 2"
    :r="size / 4"
    opacity="0.3"
  />
</template>

<script lang='ts'>
import Vue, { PropOptions } from 'vue'
import { Coordinates } from '~/assets/src/types'

export default Vue.extend({
  props: {
    size: {
      type: Number,
      required: true,
    } as PropOptions<Number>,
    coordinates: {
      type: Object,
      required: true,
    } as PropOptions<Coordinates>,
  },
})
</script>
