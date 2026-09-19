<template>
  <div class="main">
    <div style="display: flex; align-self: start">
    <el-form>
      <el-form-item>
        <el-input
        v-model="payload.name"
        placeholder="输入用户姓名"
        >
      </el-input>
      </el-form-item>
      <el-button type="primary" @click="handleClick">查询</el-button>
    </el-form>
    </div>
    <Table :list='data.list' :changeHandle='changeHandle' />
    <!-- <Pagination :currentChange="currentChange"></Pagination> -->
    <div style="display: flex; justify-content: center;">  
  <el-pagination background layout="prev, pager, next"   
    :total="data.total"   
    :page-size="5"  
    @current-change="handleCurrentChange"/>  
    </div>
  </div>
  <EditPop :popShow="popShow" v-if='popShow' :message='userItemState.message' :confirmClick='confirmClick' />
</template>
<script setup>
import Table from './Table2.vue'
import EditPop from './EditPop.vue'
// import Pagination from './Pagination.vue'
import { reactive, ref, computed, onMounted } from 'vue'
import { deleteuser, getuser, changesuer } from '../api/index';
// import emitter from '../utils/eventBus'
/**
 * 初始化的数据
 */
const data = reactive({
  list: [],
  page1: 1,//默认展示第一页
  total: "", //课程总数
})


const payload = reactive({
  name:"",
  page1: 1,
  size1: 5,
  
});
const getusers = () =>{
  getuser(payload).then((res) => {
    data.list = res.list;
    data.total = res.total;
  }).catch(err => {
    console.log(err);
  });
}

const handleCurrentChange = (val) => {
 
  payload.page1 = val;
  //切换分页的接口
  getusers( payload.page1)
}





/**
 * 用户列表数据获取
 */
const getuserData = async (query) => {
  const name=data.name
  const page1 = data.page1;
  const size1 = 5;
  //发送请求到后端进行获取数据
  try {
    const res = await getuser({ name:name, page1: page1, size1: size1 });
    console.log("查到的书", res);
    //筛选符合分类的用户
    data.list = res.list;
    //更新用户的总数，用于分页显示
    data.total = res.total;
  } catch (error) {
    ElMessage({
      message: "获取数据失败：" + error.message,
      type: "error",
    });
  }
}
onMounted(async()=>{
  await getuserData()
})



//搜索的按钮
const handleClick = async () => {
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
  //当前也的数据清零时，重置到第一页
  if (data.list.length === 0 && data.page1 > 1) {
    getuserData({  page1: 1 })
  }
}
const deleteHandle = (val) => {
  if (val) {
    data.list = data.list.filter((item) => {
      return item.id !== val
    })
    //删除接口的调用
    deleteuserdata(val)
  }
}


</script>
<style lang='less' scoped>
.el-form {
  display: flex;
}

.main {
  background-color: #fff;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;

  .input-with-select {
    width: 400px;
    margin-bottom: 40px;
  }
}

:deep(.el-table__header-wrapper) {
  position: fixed;
 
}

:deep(.el-table__inner-wrapper) {
  overflow: hidden;
}

:deep(.el-table__body-wrapper) {
  margin-top: 40px;
}

:deep(.el-input__inner) {
  width: 300px;
  margin-right: 10px;
}

:deep(.warning-row) {
  --el-table-tr-bg-color: var(--el-color-warning-light-9) !important;
  height: 140px !important;
}

.table {
  height: 80vh;
  width: 85vw;
  overflow: hidden;
  overflow-y: scroll;
}

.table::-webkit-scrollbar {
  display: none
}
</style>