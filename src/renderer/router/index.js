import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: "/",
      name: "main",
      component: require("@/components/pages/Main").default
    },
    {
      path: "/auth",
      name: "auth",
      component: require("@/components/pages/Auth").default
    },
    {
      path: "/downloads",
      name: "downloads",
      component: require("@/components/pages/Downloads").default
    },
    {
      path: "/settings",
      name: "settings",
      component: require("@/components/pages/Settings").default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
