<template>
  <div class="home">
    <el-container>
      <el-aside width="200px">
        <Aside :isCollapse='isCollapse'  />
      </el-aside>
      <el-container>
        <el-header>
          <Header :handleCollapse='handleCollapse' :isCollapse='isCollapse' :userInfo='userInfo'/>
        </el-header>
        <el-main>
          <Main v-if="showComponent === 'Main'" />    

          <Main2 v-if="showComponent === 'Main2'" />  

          <Main3 v-if="showComponent === 'Main3'" /> 

          <Main4 v-if="showComponent === 'Main4'" />

          <Profile v-if="showComponent === 'Profile'" :userInfo="userInfo" @updated="getUserInfoData" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Aside from '../components/Aside.vue'
import Main from '../components/Main.vue'
import Main2 from '../components/Main2.vue'
import Main3 from '../components/Main3.vue'
import Profile from '../components/Profile.vue'
import { onMounted, ref ,onBeforeUnmount} from 'vue'
import { getUserInfo } from '@/api'
import { reactive } from 'vue'
import emitter from '@/utils/eventBus'


const isCollapse = ref(false)
const handleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
const showComponent = ref('Main'); // 默认显示Main组件  
  
const updateMainShow = (type) => {  
  if (type === 'Allbook' ) {  
    showComponent.value = 'Main'; // 点击全部图书时显示Main  
  }
  
  else if (type === 'user') {  
    showComponent.value = 'Main2'; // 点击个人信息时显示Main2  
  }
  else if(type === 'situation'){
    showComponent.value = 'Main3'; // 点击借阅情况时显示Main3

  } 
  else if(type === 'allsituation'){
    showComponent.value = 'Main4'; // 点击借阅情况时显示Main3

  }
  else if(type === 'profile') {
    showComponent.value = 'Profile';
  }
  else {  
    // 默认情况或未知类型  
    showComponent.value = 'Main';  
  }  
};  

const userInfo = reactive({
  name: '',
  nickname: '',
  headImg: '',
  identity: '',
  userid:''

})
//用户信息接口的调用
const getUserInfoData = async () => {
  const res = await getUserInfo()
  
  userInfo.name = res.name || '';
  userInfo.nickname = res.nickname || res.name || '';
  userInfo.headImg = res.headImg || '/avatar.svg';
  userInfo.identity = res.identity || '';
  userInfo.userid = res.userid || '';
}


onMounted(() => {
  
// 在组件挂载后设置事件监听器  
  /**监听切换 */
  emitter.on('menu-selected', updateMainShow);  
  //监听课程类目tab切换
//   emitter.on('course', () => {
//     data.page = 1
//     getCourseData({ page: 1 })
  
// })
    getUserInfoData()
})


// 组件卸载前移除监听器
onBeforeUnmount(() => {  
  emitter.off('menu-selected', updateMainShow);  
});  
</script>

<style lang='less' scoped>
.el-aside {
  background-color: #1f2937;
  overflow: hidden;
}

.el-container {
  height: 100vh;
}

.el-main {
  display: flex;
  padding: 0;
  background: #f4f7fb;
}

.el-header {
  background-color: #fff;
  padding: 0;
  height: 64px;
}
</style>
