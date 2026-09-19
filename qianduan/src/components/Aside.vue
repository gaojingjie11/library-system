<template>
  <nav class="sidebar">
    <div class="brand"><span class="brand-mark">阅</span><div v-if="!isCollapse"><strong>实验室图书馆</strong><small>LAB LIBRARY</small></div></div>
    <el-menu :collapse="isCollapse" :default-active="active" background-color="#182537" text-color="#aebbd0" active-text-color="#fff">
      <el-menu-item index="Main" @click="select('Allbook')"><el-icon><Reading /></el-icon><template #title>图书馆藏</template></el-menu-item>
      <el-menu-item index="Main3" @click="select('situation')"><el-icon><Collection /></el-icon><template #title>我的借阅</template></el-menu-item>
      <el-menu-item v-if="isAdmin" index="Main4" @click="select('allsituation')"><el-icon><List /></el-icon><template #title>全部借阅</template></el-menu-item>
      <el-menu-item v-if="isAdmin" index="Main2" @click="select('user')"><el-icon><User /></el-icon><template #title>用户管理</template></el-menu-item>
      <el-menu-item index="Profile" @click="select('profile')"><el-icon><Setting /></el-icon><template #title>个人中心</template></el-menu-item>
    </el-menu>
    <div v-if="!isCollapse" class="sidebar-note">让每一本书，都有所归。</div>
  </nav>
</template>
<script setup>
import emitter from '../utils/eventBus';
defineProps(['isCollapse', 'active', 'isAdmin']);
const select = (value) => emitter.emit('menu-selected', value);
</script>
<style scoped>
.sidebar { height: 100%; display: flex; flex-direction: column; padding: 0 8px; }
.brand { display: flex; align-items: center; gap: 12px; height: 96px; padding: 0 12px; color: #fff; white-space: nowrap; }
.brand-mark { display: grid; place-items: center; background: #4678ed; border-radius: 12px; width: 36px; height: 40px; flex-shrink: 0; font-size: 20px; }
.brand strong { font-size: 16px; }.brand small { display: block; margin-top: 5px; letter-spacing: 2px; font-size: 10px; color: #94a8c1; }
.el-menu { border: 0; }.el-menu--collapse { width: 56px; }
.el-menu--collapse :deep(.el-menu-item span) { display: none; }
.el-menu-item { margin: 6px 0; border-radius: 8px; height: 48px; }
.el-menu-item.is-active { background: #2b446a; }
.sidebar-note { margin-top: auto; padding: 24px 12px; color: #7f93b0; font-size: 12px; white-space: nowrap; }
</style>
