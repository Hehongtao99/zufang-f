import { createRouter, createWebHistory } from 'vue-router'

// 登录注册
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')

// 普通用户
const UserLayout = () => import('../views/user/Layout.vue')
const UserHome = () => import('../views/user/Home.vue')
const UserHouseList = () => import('../views/user/house/List.vue')
const UserHouseDetail = () => import('@/views/user/house/Detail.vue')
const UserMyHouse = () => import('../views/user/myhouse/List.vue')
const UserAppointment = () => import('../views/user/Appointment.vue')
const UserOrder = () => import('../views/user/Order.vue')
const UserContractSign = () => import('../views/user/contract/Sign.vue')
const UserContractList = () => import('../views/user/contract/List.vue')
const UserPayment = () => import('../views/user/payment/index.vue')
const UserProfile = () => import('../views/user/Profile.vue')
const UserMessage = () => import('../views/user/message/index.vue')

// 房东
const LandlordLayout = () => import('../views/landlord/Layout.vue')
const LandlordHouseAdd = () => import('../views/landlord/house/Add.vue')
const LandlordHouseList = () => import('../views/landlord/house/List.vue')
const LandlordAppointment = () => import('../views/landlord/Appointment.vue')
const LandlordOrder = () => import('../views/landlord/Order.vue')
const LandlordTerminate = () => import('../views/landlord/TerminateManage.vue')
const LandlordFinance = () => import('../views/landlord/Finance.vue')
const LandlordMessage = () => import('../views/landlord/message/index.vue')
const LandlordHouseDetail = () => import('../views/landlord/house/Detail.vue')
const LandlordHouseEdit = () => import('../views/landlord/house/Edit.vue')
const LandlordOrderDetail = () => import('../views/landlord/OrderDetail.vue')

// 管理员
const AdminLayout = () => import('../views/admin/Layout.vue')
const AdminHouseList = () => import('../views/admin/house/List.vue')
const AdminHouseApprove = () => import('../views/admin/house/Approve.vue')
const AdminHouseDetail = () => import('../views/admin/house/Detail.vue')
const AdminHouseEdit = () => import('../views/admin/house/Edit.vue')
const AdminOrder = () => import('../views/admin/Order.vue')
const AdminUser = () => import('../views/admin/User.vue')
const AdminSystem = () => import('../views/admin/System.vue')
const AdminRegionManagement = () => import('../views/admin/RegionManagement.vue')
const AdminNotifications = () => import('../views/admin/notifications/index.vue')

// 错误页面
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册'
    }
  },
  // 用户路由
  {
    path: '/user',
    component: UserLayout,
    redirect: '/user/home',
    meta: {
      requireAuth: true,
      role: 'USER'
    },
    children: [
      {
        path: 'home',
        name: 'UserHome',
        component: UserHome,
        meta: {
          title: '用户首页'
        }
      },
      {
        path: 'house/list',
        name: 'UserHouseList',
        component: UserHouseList,
        meta: {
          title: '房源列表'
        }
      },
      {
        path: 'house/detail/:id',
        name: 'UserHouseDetail',
        component: UserHouseDetail,
        meta: {
          title: '房源详情'
        }
      },
      {
        path: 'myhouse',
        name: 'UserMyHouse',
        component: UserMyHouse,
        meta: {
          title: '我的订房'
        }
      },
      {
        path: 'appointment',
        name: 'UserAppointment',
        component: UserAppointment,
        meta: {
          title: '我的预约'
        }
      },
      {
        path: 'orders',
        name: 'UserOrder',
        component: UserOrder,
        meta: {
          title: '我的订单'
        }
      },
      {
        path: 'contract/list',
        name: 'UserContractList',
        component: UserContractList,
        meta: {
          title: '我的合同'
        }
      },
      {
        path: 'contract/sign',
        name: 'UserContractSign',
        component: UserContractSign,
        meta: {
          title: '合同签署'
        }
      },
      {
        path: 'payment',
        name: 'UserPayment',
        component: UserPayment,
        meta: {
          title: '订单支付'
        }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: {
          title: '个人资料'
        }
      },
      {
        path: 'message',
        name: 'UserMessage',
        component: UserMessage,
        meta: {
          title: '消息中心'
        }
      }
    ]
  },
  // 房东路由
  {
    path: '/landlord',
    component: LandlordLayout,
    redirect: '/landlord/house/list',
    meta: {
      requireAuth: true,
      role: 'LANDLORD'
    },
    children: [
      {
        path: 'home',
        redirect: '/landlord/house/list'
      },
      {
        path: 'house/add',
        name: 'LandlordHouseAdd',
        component: LandlordHouseAdd,
        meta: {
          title: '发布房源'
        }
      },
      {
        path: 'house/list',
        name: 'LandlordHouseList',
        component: LandlordHouseList,
        meta: {
          title: '我的房源'
        }
      },
      {
        path: 'house/detail/:id',
        name: 'LandlordHouseDetail',
        component: LandlordHouseDetail,
        meta: {
          title: '房源详情'
        }
      },
      {
        path: 'house/edit/:id',
        name: 'LandlordHouseEdit',
        component: LandlordHouseEdit,
        meta: {
          title: '编辑房源'
        }
      },
      {
        path: 'appointment',
        name: 'LandlordAppointment',
        component: LandlordAppointment,
        meta: {
          title: '预约管理'
        }
      },
      {
        path: 'order',
        name: 'LandlordOrder',
        component: LandlordOrder,
        meta: {
          title: '订单管理'
        }
      },
      {
        path: 'order/detail/:id',
        name: 'LandlordOrderDetail',
        component: LandlordOrderDetail,
        meta: {
          title: '订单详情',
          icon: 'el-icon-document'
        }
      },
      {
        path: 'terminate',
        name: 'LandlordTerminate',
        component: LandlordTerminate,
        meta: {
          title: '退租管理'
        }
      },
      {
        path: 'finance',
        name: 'LandlordFinance',
        component: LandlordFinance,
        meta: {
          title: '财务管理'
        }
      },
      {
        path: 'message',
        name: 'LandlordMessage',
        component: LandlordMessage,
        meta: {
          title: '消息管理'
        }
      },
      {
        path: 'profile',
        name: 'LandlordProfile',
        component: UserProfile,
        meta: {
          title: '个人资料'
        }
      }
    ]
  },
  // 管理员路由
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/user',
    meta: {
      requireAuth: true,
      role: 'ADMIN'
    },
    children: [
      {
        path: 'home',
        redirect: '/admin/user'
      },
      {
        path: 'house',
        name: 'AdminHouseList',
        component: AdminHouseList,
        meta: {
          title: '房源管理'
        }
      },
      {
        path: 'house/approve/:id',
        name: 'AdminHouseApprove',
        component: AdminHouseApprove,
        meta: {
          title: '房源审核'
        }
      },
      {
        path: 'house/detail/:id',
        name: 'AdminHouseDetail',
        component: AdminHouseDetail,
        meta: {
          title: '房源详情'
        }
      },
      {
        path: 'house/edit/:id',
        name: 'AdminHouseEdit',
        component: AdminHouseEdit,
        meta: {
          title: '编辑房源'
        }
      },
      {
        path: 'contracts',
        component: () => import('@/views/admin/ContractList.vue'),
        name: 'AdminContractList',
        meta: { title: '合同管理' }
      },
      {
        path: 'contract-templates',
        component: () => import('@/views/admin/ContractTemplateList.vue'),
        name: 'AdminContractTemplateList',
        meta: { title: '合同模板管理' }
      },
      {
        path: 'order',
        name: 'AdminOrder',
        component: AdminOrder,
        meta: {
          title: '订单管理'
        }
      },
      {
        path: 'user',
        name: 'AdminUser',
        component: AdminUser,
        meta: {
          title: '用户管理'
        }
      },
      {
        path: 'finance',
        name: 'AdminFinance',
        component: () => import('@/views/admin/Finance.vue'),
        meta: {
          title: '财务管理'
        }
      },
      {
        path: 'system',
        name: 'AdminSystem',
        component: AdminSystem,
        meta: {
          title: '系统设置'
        }
      },
      {
        path: 'region',
        name: 'AdminRegionManagement',
        component: AdminRegionManagement,
        meta: {
          title: '地区管理'
        }
      },
      {
        path: 'notifications',
        name: 'AdminNotifications',
        component: AdminNotifications,
        meta: {
          title: '通知管理',
          icon: 'Notification'
        }
      }
    ]
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 租房系统` : '租房系统'
  
  // 判断是否需要登录权限
  if (to.meta.requireAuth) {
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('userRole')
    
    if (!token) {
      next({ name: 'Login' })
      return
    }
    
    // 判断角色权限
    if (to.meta.role && to.meta.role !== userRole) {
      next({ name: 'NotFound' })
      return
    }
  }
  
  next()
})

export default router 