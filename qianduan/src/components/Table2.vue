<template>
  <div class="table">
    <el-table :data="list" :row-class-name="tableRowClassName">
      <el-table-column prop="head_img" label="头像">
        <template #default="scope">
          <img :src="scope.row.head_img" class="head-img" >
        </template>
      </el-table-column>
      <!-- <el-table-column prop="id1" label="id">
      </el-table-column> -->
      <el-table-column prop="name" label="名字">
      </el-table-column>
      <!-- <el-table-column prop="role" label="角色">
      </el-table-column> -->
      
      <el-table-column label="操作">
        <template #default="scope">
          <el-popconfirm title="确定要重置吗?" @confirm="changeHandle(scope.row._id)">
            <template #reference>
              <el-button type="warning">重置密码</el-button>
            </template>
          </el-popconfirm>
        
          
          <el-button type="primary" @click="openDrawer(scope.row._id)">借阅信息</el-button>
          


          <!-- <el-popconfirm title="确定要删除吗?" @confirm="deleteHandle(scope.row.id)">
            <template #reference>
              <el-button type="danger">删除</el-button>
            </template>
          </el-popconfirm> -->
        </template>
      </el-table-column>
    </el-table>
    <el-drawer
      v-model="table2"
      title="图书列表"
      size="60%"
      @close="onDrawerClose"
    >
      <span>该用户借阅的图书列表。</span>
      <div class="table2">
      <el-table :data="datalist.list" :row-class-name="tableRowClassName">
        <el-table-column prop="course_img" label="图片">
        <template #default="scope">
          <img :src="scope.row.course_img" class="course-img">
        </template>
      </el-table-column>
        <el-table-column property="title" label="书名" width="150" />
        <el-table-column property="outhor" label="作者" width="150" />
        <el-table-column property="point" label="评分" width="150" />
        <el-table-column property="category" label="分类" width="150"/>
        <el-table-column label="借阅时间">
        <template #default="scope">
          {{ formatDate(scope.row.borrowTime) }}
        </template>
      </el-table-column>
      </el-table>
      <div style="display: flex; justify-content: center;">  
  <el-pagination background layout="prev, pager, next"   
    :total="datalist.total"   
    :page-size="5"  
    @current-change="handleCurrentChange"/>  
    </div></div>
    </el-drawer>
  </div>
</template>
<script setup>
import { defineProps,reactive,ref } from 'vue';
import { format } from 'date-fns';
const props = defineProps(['list', 'changeHandle', 'deleteHandle'])
import {  borrowbooklist} from '../api/index';
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
}

const table2 = ref(false)
const userid= ref(null);
const datalist = reactive({
  list: [],
  page: 1,//默认展示第一页
  total: null, //课程总数
})

 
// const openDrawer = async (query) => {
//   userid.value = query.id;
// console.log(userid);
 
//   const page = query?.page || 1
//   const size = query?.size || 5
//   const res = await borrowbooklist({ userid:userid,page:page, size:size })
  
//   //筛选符合分类的课
//   datalist.list = res.list
//   datalist.total = res?.total[0].total
//   table2.value = true;
// }


const openDrawer = async (_id) => {
  userid.value = _id;
  console.log(userid.value);

  const page = 1;
  const size = 5;
  const res = await borrowbooklist({ userid: userid.value, page, size });

  // 筛选符合分类的课程
  datalist.list = res.list;
  datalist.total = res.total; // 确保 total 是一个有效的数值
  datalist.page = page;
  table2.value = true;
};

const handleCurrentChange = async (val) => {
  const page = val;
  const size = 5;
  const res = await borrowbooklist({ userid: userid.value, page, size });

  // 更新数据
  datalist.list = res.list;
  datalist.total = res.total; // 确保 total 是一个有效的数值
  datalist.page = page;
};

const onDrawerClose = () => {
  userid.value = null;
  datalist.list = [];
  datalist.total = 0;
  datalist.page = 1;
};



</script>
<style lang='less' scoped>
.head-img {
  width: 150px;
  height: 110px;
}
.table2 {
  .el-table {
    .course-img {
      width: 100px;
      height: 70px;
    }

    .el-table__row.warning-row {
      background: #f0f9eb;
    }

    .el-table__row {
      &.warning-row {
        background: #f0f9eb;
      }
    }
  }

  .el-pagination {
    margin-top: 20px;
  }
}
</style>