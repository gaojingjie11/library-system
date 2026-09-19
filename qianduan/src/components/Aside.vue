<template>
  <el-menu :collapse="isCollapse" class="el-menu-vertical-demo" active-text-color="#409eff" background-color="#1f2937"
    text-color="#fff">
    <div class="xd-icon">
      <img src="../assets/xd-icon.png">
      <span>图书管理系统</span>
    </div>
    <el-sub-menu index="1">
      <template #title>
        <el-icon>
          <document />
        </el-icon>
        <span>图书展示</span>
      </template>
      <el-menu-item index="1-1" @click="selectMenu('Allbook')">图书</el-menu-item>
    </el-sub-menu>
    <el-sub-menu v-if="performance"  index="2">
      <template #title >
        <el-icon>
          <setting />
        </el-icon>
        <span>用户管理</span>
      </template>
      <el-menu-item  @click="selectMenu('user')" index="2-1">用户信息</el-menu-item>
    </el-sub-menu>
    
    <el-sub-menu  index="3">
      <template #title>
        <el-icon>
          <document />
        </el-icon>
        <span>借阅情况</span>
      </template>
      <el-menu-item index="3-1" @click="selectMenu('situation')">个人借阅</el-menu-item>
      <el-menu-item index="3-2" v-if="performance" @click="selectMenu('allsituation')">全部借阅</el-menu-item>
    </el-sub-menu>

  </el-menu>
</template>
<script setup>
import { defineProps, onMounted, reactive, VueElement ,ref} from 'vue';
import { getUserInfo } from '../api/index';
import emitter from '../utils/eventBus'



/**
 * 控制侧边栏的折叠和展开
 */
const { isCollapsen } = defineProps(['isCollapse'])

const userInfo = reactive({
  identity: '',

})
const performance = ref(false)
//用户信息接口的调用
const getUserInfoData = async () => {
  const res = await getUserInfo()
    userInfo.identity=res.identity
    if(userInfo.identity === 'admin'){
      performance.value=true
    }

}

onMounted(()=>{
  getUserInfoData()
})


/**
 * 点击类目tab触发课程列表重新获取
 */
const selectMenu = (type) => {
  emitter.emit('menu-selected',type)
}
</script>
<style lang="less" scoped>
.el-radio-button__inner {
  padding: 0;
}

.el-menu--collapse {
  border: none;
}

.el-menu:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
  border: none;
}

.xd-icon {
  display: flex;
  align-items: center;
  font-weight: 600;
  height: 60px;
      background-color: #111827;
  white-space: nowrap;
  padding-left: 15px;

  img {
    width: 45px;
    height: 40px;
    margin-right: 10px;
  }
}
</style>
