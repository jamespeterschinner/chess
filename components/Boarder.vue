<template>
  <path
    class="border stroke-current text-purple-500"
    :d="`M${2 * radius},${radius} 
        h${length}
        a${radius} ,${radius}  0 0 1 ${radius} ,${radius} 
        v${length}
        a${radius} ,${radius}  0 0 1 -${radius} ,${radius} 
        h-${length}
        a${radius} ,${radius}  0 0 1 -${radius} ,-${radius} 
        v-${length}
        a${radius} ,${radius}  0 0 1 ${radius} ,-${radius} 
        Z`"
  />
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    length: {
      type: Number,
      required: true,
    },
    radius: {
      type: Number,
      required: true,
    },
  },
})
</script>
