<template>
  <div class="table">
    <el-table :data="list" :row-class-name="tableRowClassName">
      <el-table-column prop="course_img" label="封面" width="110">
        <template #default="scope">
          <img :src="scope.row.course_img" class="courseImg-img">
        </template>
      </el-table-column>
      <el-table-column prop="title" label="书名">
      </el-table-column>
      <el-table-column prop="name" label="借阅人">
      </el-table-column>
      <!-- <el-table-column prop="point" label="评分">
      </el-table-column> -->
      <el-table-column label="借阅时间">
        <template #default="scope">
          {{ formatDate(scope.row.borrowTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-popconfirm title="确定要归还图书吗?" @confirm="returnHandle(scope.row._id)">
            <template #reference>
              <el-button type="primary" plain>归还</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import { defineProps } from 'vue';
import { format } from 'date-fns';
// const { list,returnHandle } = defineProps(['list','returnHandle'])
const props = defineProps({
  list: Array,
  returnHandle: Function
});
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



// 格式化日期时间
const formatDate = (date) => {
  if (!date) {
    return '';
  }
  // 确保传入的是一个有效的 Date 对象
  if (typeof date === 'string') {
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

</script>
<style lang='less' scoped>
.courseImg-img {
  width: 64px;
  height: 88px;
  object-fit: contain;
  background: #f5f7fa;
  border-radius: 6px;
}
</style>
