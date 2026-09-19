<template>
  <div class="table">
    <el-table :data="list" :row-class-name="tableRowClassName">
      <el-table-column prop="course_img" label="图片">
        <template #default="scope">
          <img :src="scope.row.course_img" class="courseImg-img">
        </template>
      </el-table-column>
      <el-table-column prop="title" label="书名">
      </el-table-column>
      <el-table-column prop="outhor" label="作者">
      </el-table-column>
      <el-table-column prop="point" label="评分">
      </el-table-column>
      <el-table-column prop="category" label="类型">
      </el-table-column>
      <el-table-column prop="num" label="库存">
      </el-table-column>
      <el-table-column label="操作"  class-name="last-column" width="300">
       
        <template #default="scope">
          <el-button v-if="performance" type="primary" @click="editClick(scope.row)">
            编辑
          </el-button>
          <el-popconfirm title="确定要删除该课程吗?" @confirm="deleteHandle(scope.row._id)">
            <template #reference>
              <el-button v-if="performance" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm title="确定要借阅该课程吗?" @confirm="borrowHandle(scope.row._id)">
            <template #reference>
              <el-button type="warning">借阅</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import { defineProps ,reactive,ref,onMounted} from 'vue';
import { getUserInfo } from '../api/index';
const props = defineProps(['list', 'editClick', 'deleteHandle','borrowHandle'])
/**
 * 定义每行课程的区分颜色
 */
const tableRowClassName = ({ rowIndex }) => {
  if (rowIndex % 2 === 0) {
    return 'warning-row'
  } else {
    return ''
  }
}


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


</script>
<style lang='less' scoped>
.courseImg-img {
  width: 150px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}
</style>
