<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Icon from './components/EpubIcon.vue'

const route = useRoute()
</script>

<template>
  <header v-if="!route?.meta?.hideHeader">
    <icon name="logo" class="logo" />
    <div class="wrapper">
      <HelloWorld msg="ePub Press" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  background-color: var(--vt-c-green);
  color: var(--vt-c-white);
  display: flex;

  .wrapper {
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }
}

.logo {
  font-size: 1.5rem;
  fill: currentColor;
  height: 1.5rem;
  margin-inline-start: 1rem;
  margin-block: 0.5rem;
  align-self: center;
}

nav {
  //width: 100%;
  font-size: 12px;
  text-align: center;

  a {
    color: var(--color-text);
  }
}

nav a.router-link-exact-active {
  color: var(--vt-c-white);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  nav {
    font-size: 1rem;

    padding: 1rem 0;
  }
}
</style>
