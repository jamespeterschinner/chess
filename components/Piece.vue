<template>
  <svg>
    <image
      :key="index"
      :href="require(`~/assets/pieces/${svgPath}`)"
      height="1"
      width="1"
      :x="coordinates.file + 1"
      :y="coordinates.row + 1"
    />
  </svg>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue'
import { Coordinates } from '~/assets/src/board'

export default Vue.extend({
  props: {
    svgPath: {
      type: String,
      require: true,
      default: '',
    } as PropOptions<string>,
    coordinates: {
      type: Object,
      required: true,
    } as PropOptions<Coordinates>,
  },
})
</script>
