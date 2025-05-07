<script setup>
defineProps({
  msg: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="greetings">
    <h1>{{ msg }}</h1>
    <h3>Your printing press for ePubs</h3>
  </div>
</template>

<style scoped>
.greetings {
  display: flex;
  justify-content: flex-start;
  align-items: baseline;
  gap: 1rem;
}

h1 {
  font-weight: bold;
  font-size: 1rem;
  position: relative;
}

h3 {
  font-size: 0.75rem;
  font-weight: normal;
}

.greetings h1,
.greetings h3 {
  text-align: left;
  flex-grow: 1;
}

@media (max-width: 500px) {
  .greetings h3 { display: none; }
}
@media (max-width: 300px) {
  .greetings h1 { display: none; }
}
</style>
