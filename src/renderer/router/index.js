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
      path: '*',
      redirect: '/'
    }
  ]
})
