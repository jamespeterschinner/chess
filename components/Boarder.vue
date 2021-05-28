<template>
  <path
    class="border stroke-current"
    v-bind:class="[turn? `text-black`: `text-white`]"
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
import Vue, {PropOptions} from 'vue'
import {Player} from '~/assets/src/types'

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
    turn: {
      type: Number,
      required: true,
    } as PropOptions<Player>
  },
  data(){
    return {
      Player,
    }
  }
})
</script>
