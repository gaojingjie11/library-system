<template>
  <div class="header">
    <div class="homeIcon">
      <el-icon size="30px" @click="handleCollapse" :style="{ transform: isCollapse ? '' : 'rotate(180deg)' }">
        <expand />
      </el-icon>
      <span>首页</span>
    </div>
    <div class="user" @mouseenter="isShowUserInfo('show')" @mouseleave="isShowUserInfo('leave')">
      <img :src="userInfo.headImg">
      <div class="userInfo" v-show="show">
        <div class="user-name">{{ userInfo.nickname || userInfo.name }}</div>
        <div @click="openProfile">个人中心</div>
        <div @click="loginOut">退出登录</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import router from '../router/index';
import { defineProps, ref } from 'vue';
import emitter from '../utils/eventBus';

/**
 * 获取父组件的参数
 */
const props = defineProps(['handleCollapse', 'isCollapse','userInfo'])
/**
 * 鼠标移动个人信息的展示
 */
const show = ref(false)
const isShowUserInfo = (type) => {
  type === 'show' ? show.value = true : show.value = false
}
/**
 * 获取用户信息
 */


/**
 * 退出登录按钮
 */
const loginOut = () => {
  router.push('/login'),
    localStorage.removeItem('token')
}
const openProfile = () => {
  emitter.emit('menu-selected', 'profile');
  show.value = false;
};
</script>
<style lang='less' scoped>
.userInfo {
  z-index: 22;
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0;
  top: 52px;
  min-width: 132px;
  background-color: #fff;
  border: 5px;
  box-shadow: 0 4px 8px 0 rgb(7 17 27 / 10%);
  text-align: center;

  div:hover {
    color: #409eff;
  }

  div {
    padding: 10px;
  }

  .user-name {
    color: #303133;
    font-weight: 600;
    cursor: default;
  }
}

.header {
  position: relative;
  height: 100%;
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #edf0f5;

  .homeIcon {
    display: flex;
    align-items: center;

    span {
      margin-left: 10px;
    }
  }

    .user {
    display: flex;
    justify-content: center;
    width: 80px;
    cursor: pointer;

    img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
    }
  }
}
</style>
