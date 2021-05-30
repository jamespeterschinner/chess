<template>
  <svg :width="`${size * 4}`" :height="`${size}`">
    <image
      v-for="(piece, index) in promotablePieces"
      :key="index"
      :href="piece.svgURI"
      :x="size * index"
      :width="size"
      :height="size"
      @click="click(piece)"
    />
  </svg>
</template>

<script lang="ts">
import vue, { PropOptions } from 'vue'
import { mapGetters } from 'vuex'
import { getPromotablePieces } from '~/assets/src/helpers'
import { AssignedPiece} from '~/assets/src/types'

export default vue.extend({
  props: {
    size: {
      type: Number,
      required: true,
    } as PropOptions<Number>,
     rotation: {
      type: Number,
      required: true,
    },
  },
  computed: {
    ...mapGetters('board', ['turn']),
    promotablePieces(): AssignedPiece[] {
      return getPromotablePieces(this.turn)
    },
  },
  methods: {
      click(piece: AssignedPiece){
          this.$emit('promotionSelected', piece)
      }
  }
})
</script>
