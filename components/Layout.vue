<template>
  <div class="h-screen grid grid-rows-7">
    <div class="row-span-2 bg-indigo-100">
      <slot name="header"></slot>
    </div>
    <div class="row-span-3 bg-gradient-to-t from-gray-700 to-indigo-100">
      <slot name="main"></slot>
    </div>
    <div class="row-span-2 bg-gray-700">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
export default {}
</script>
