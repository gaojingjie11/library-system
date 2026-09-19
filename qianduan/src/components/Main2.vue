<template>
  <div class="main page-shell">
    <div class="page-heading">
      <div>
        <h2>用户管理</h2>
        <p>查看用户资料、借阅记录和账号身份</p>
      </div>
    </div>
    <div class="toolbar">
      <el-input v-model="payload.name" placeholder="输入用户姓名" class="search-input" clearable @keyup.enter="handleClick" />
      <el-button type="primary" @click="handleClick">查询</el-button>
    </div>
    <Table :list='data.list' :changeHandle='changeHandle' :identityHandle='identityHandle' :currentUserId='currentUserId' />
    <!-- <Pagination :currentChange="currentChange"></Pagination> -->
    <div style="display: flex; justify-content: center;">  
  <el-pagination background layout="prev, pager, next"   
    :total="data.total"   
    :page-size="5"  
    @current-change="handleCurrentChange"/>  
    </div>
  </div>
</template>
<script setup>
import Table from './Table2.vue'
// import Pagination from './Pagination.vue'
import { reactive, ref, onMounted } from 'vue'
import { deleteuser, getuser, changesuer, changeUserIdentity, getUserInfo } from '../api/index';
// import emitter from '../utils/eventBus'
/**
 * 初始化的数据
 */
const data = reactive({
  list: [],
  total: 0, //用户总数
})


const payload = reactive({
  name:"",
  page1: 1,
  size1: 5,
  
});
const currentUserId = ref('');
const getusers = async () => {
  try {
    const res = await getuser(payload);
    // 搜索条件变化后结果可能不足当前页数，回退到最后一页，避免出现"空白页"
    const lastPage = Math.max(1, Math.ceil(res.total / payload.size1));
    if (payload.page1 > lastPage) {
      payload.page1 = lastPage;
      return getusers();
    }
    data.list = res.list;
    data.total = res.total;
  } catch (error) {
    ElMessage.error('获取用户列表失败：' + error.message);
  }
}

const handleCurrentChange = (val) => {
  payload.page1 = val;
  //切换分页的接口
  getusers()
}

onMounted(async () => {
  await Promise.all([getusers(), loadCurrentUser()]);
})





/**
 * 用户列表数据获取
 */



//搜索的按钮
const handleClick = async () => {
  // 换了搜索条件必须回到第 1 页，否则 skip 会越过结果集，界面上会显示空列表
  payload.page1 = 1;
  getusers();
};



const changeuserdata = async (query) => {
  const res = await changesuer({ id: query })
  if (res?.message) {
    ElMessage({
      message: res.message,
      type: 'success'
    })
  }
}
const changeHandle = (val) => {
  
    //删除接口的调用
    changeuserdata(val)
  }

const identityHandle = async (row) => {
  const nextIdentity = row.identity === 'admin' ? 'user' : 'admin';
  try {
    await ElMessageBox.confirm(`确定将 ${row.nickname || row.name} 设置为${nextIdentity === 'admin' ? '管理员' : '普通用户'}吗？`, '修改身份', { type: 'warning' });
    const res = await changeUserIdentity({ id: row._id, identity: nextIdentity });
    ElMessage.success(res.message);
    await getusers();
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') console.error(error);
  }
};

const loadCurrentUser = async () => {
  const res = await getUserInfo();
  currentUserId.value = String(res.userid);
};



/**
 * 用户删除的逻辑
 */
//删除的接口
const deleteuserdata = async (query) => {
  const res = await deleteuser({ id: query })
  if (res?.message) {
    ElMessage({
      message: res.message,
      type: 'success'
    })
  }
  //当前页的数据清零时，重置到第一页
  if (data.list.length === 0 && payload.page1 > 1) {
    payload.page1 = 1;
  }
  await getusers();
}
const deleteHandle = (val) => {
  if (val) {
    data.list = data.list.filter((item) => {
      return item._id !== val
    })
    //删除接口的调用
    deleteuserdata(val)
  }
}


</script>
<style scoped>
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 24px; }
.filter-input { width: 160px; }
.search-input { width: min(320px, 100%); }
</style>
