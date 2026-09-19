<template>
  <header class="header">
    <div class="heading"><button class="collapse-button" aria-label="折叠菜单" @click="handleCollapse"><el-icon :size="20"><Fold v-if="!isCollapse" /><Expand v-else /></el-icon></button><span>{{ title }}</span></div>
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="account"><img :src="userInfo.headImg || '/avatar.svg'" alt="个人头像" /><span>{{ userInfo.nickname || userInfo.name }}<small>{{ userInfo.identity === 'admin' ? '管理员' : '读者' }}</small></span><el-icon><ArrowDown /></el-icon></button>
      <template #dropdown><el-dropdown-menu><el-dropdown-item command="profile">个人中心</el-dropdown-item><el-dropdown-item command="logout" divided>退出登录</el-dropdown-item></el-dropdown-menu></template>
    </el-dropdown>
  </header>
</template>
<script setup>
import router from '../router';
import emitter from '../utils/eventBus';
defineProps(['handleCollapse', 'isCollapse', 'userInfo', 'title']);
const handleCommand = (command) => {
  if (command === 'profile') emitter.emit('menu-selected', 'profile');
  else { localStorage.removeItem('token'); router.push('/login'); }
};
</script>
<style scoped>
.header { height: 100%; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; }
.heading { display: flex; gap: 16px; align-items: center; font-size: 14px; color: #64748b; }
.collapse-button, .account { background: transparent; cursor: pointer; display: flex; align-items: center; color: #334155; }
.collapse-button { padding: 8px; border-radius: 8px; }.collapse-button:hover { background: #f1f5f9; }
.account { gap: 10px; text-align: left; }.account img { width: 38px; height: 38px; object-fit: cover; border-radius: 50%; background: #f1f5f9; }
.account small { display: block; color: #94a3b8; font-size: 11px; margin-top: 3px; }
</style>
