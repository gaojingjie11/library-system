<template>
  <div class="table">
    <el-table :data="list" :row-class-name="tableRowClassName">
      <el-table-column prop="course_img" label="封面" width="110">
        <template #default="scope">
          <img :src="scope.row.course_img" class="courseImg-img">
        </template>
      </el-table-column>
      <el-table-column prop="title" label="书名" min-width="160">
      </el-table-column>
      <el-table-column prop="outhor" label="作者" min-width="120">
      </el-table-column>
      <el-table-column prop="point" label="评分">
      </el-table-column>
      <el-table-column prop="category" label="类型">
      </el-table-column>
      <el-table-column label="库存" min-width="120">
        <template #default="scope">
          <span>{{ scope.row.num }}</span>
          <span v-if="scope.row.myBorrowCount" class="mine-tag">已借 {{ scope.row.myBorrowCount }} 本</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" class-name="last-column" width="260">
        <template #default="scope">
          <el-button v-if="performance" type="primary" @click="editClick(scope.row)">
            编辑
          </el-button>
          <el-popconfirm title="确定要删除该图书吗?" @confirm="deleteHandle(scope.row._id)">
            <template #reference>
              <el-button v-if="performance" type="danger" plain>删除</el-button>
            </template>
          </el-popconfirm>
          <el-button
            type="primary"
            plain
            :disabled="!scope.row.num"
            @click="borrowClick(scope.row)"
          >
            {{ scope.row.num ? '借阅' : '已借完' }}
          </el-button>
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
 * 定义每行图书的区分颜色
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
// 同一本书允许重复借阅（现实中存在帮同学代借的情况），后端不设硬性上限，
// 但已经借过时必须二次确认，避免误点又借一本；库存为 0 时按钮直接禁用。
const borrowClick = async (row) => {
  if (row.myBorrowCount) {
    try {
      await ElMessageBox.confirm(
        `你已借阅《${row.title}》${row.myBorrowCount} 本且尚未归还，确认再借 1 本吗？`,
        '重复借阅确认',
        { type: 'warning', confirmButtonText: '再借一本', cancelButtonText: '取消' }
      );
    } catch {
      return;
    }
  }
  props.borrowHandle(row._id);
};
onMounted(()=>{
  getUserInfoData()
})


</script>
<style lang='less' scoped>
.courseImg-img {
  width: 64px;
  height: 88px;
  object-fit: contain;
  background: #f5f7fa;
  border-radius: 8px;
}
.mine-tag {
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f0f9eb;
  color: #529b2e;
  font-size: 12px;
  white-space: nowrap;
}
</style>
