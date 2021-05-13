<template>
  <Layout>
    <template #main>
      <div class="h-full grid grid-rows-1 justify-center items-center">
        <div>
          <h1 class="text-9xl text-gray-300">Chess</h1>
        </div>
        <div class="flex mx-auto">
          <nuxt-link
            to="/board"
            class="
              border-2 border-white
              text-xl text-white
              py-4
              px-6
              m-10
              rounded-xl
              bg-purple-600
              hover:bg-purple-800
              focus:outline-none
            "
            @click="initializeBoard"
          >
            Let's play!
          </nuxt-link>
        </div>
      </div>
    </template>
  </Layout>
</template>

<script>
export default {
  methods: {
    initializeBoard() {
      this.$store.commit('initialize')
    },
  },
}
</script>
