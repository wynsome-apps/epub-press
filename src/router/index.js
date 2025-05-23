import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditView from '../views/EditView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/epub/:pathMatch(.*)*',
      // path: '/epub/:file',
      name: 'epub',
      component: HomeView,
      // component: UserDetails,
      beforeEnter: () => {
        // reject the navigation
        console.log('skipping from route');
        return false
      },
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/edit/:id',
      name: 'edit',
      component: EditView,
      meta: {
        hideHeader: true,
      }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
