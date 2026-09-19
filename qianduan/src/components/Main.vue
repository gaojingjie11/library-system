<template>
  <div class="main">
    <div style="display: flex; align-self: start">
      <el-input
        v-model="payload.title"
        placeholder="输入图书名"
        style="margin-left: 20px; margin-right: 50px;width: 70px"
      >
      </el-input>

      <el-input
        v-model="payload.outhor"
        placeholder="输入作者名"
        style="margin-left: 50px; margin-right: 50px;width: 70px"
      >
      </el-input>

      <!-- <el-input
        v-model="payload.miniPrice"
        placeholder="输入最低价格"
        style="margin-left: 20px; width: 120px"
      >
      </el-input>

      <el-input
        v-model="payload.maxPrice"
        placeholder="输入最高价格"
        style="margin-left: 20px; width: 120px"
      >
      </el-input> -->

      <el-input
        v-model="payload.miniPoint"
        placeholder="输入最低评分"
        style="margin-left: 50px; margin-right: 50px;width: 70px"
      >
      </el-input>

      <el-input
        v-model="payload.maxPoint"
        placeholder="输入最高评分"
        style="margin-left: 50px; margin-right: 50px;width: 70px"
      >
      <!--下拉分类-->
      </el-input>
        
      <el-input
        v-model="payload.category"
        placeholder="输入图书类型"
        style="margin-left: 50px; margin-right: 50px;width: 70px"
      >
      </el-input>
      
      <el-button type="primary" @click="handleClick" style="margin-left: 40px"
        >搜索</el-button>

      <el-button v-if="isAdmin" type="warning" @click="handleAdd"  style="margin-left: 200px;width: 100px" > 新增图书 </el-button>


    </div>
    <Table :list='data.list' :editClick='editClick' :deleteHandle='deleteHandle' :borrowHandle='borrowHandle' />
    <!-- <Pagination :currentChange="currentChange"></Pagination> -->
    <div style="display: flex; justify-content: center;">  
  <el-pagination background layout="prev, pager, next"   
    :total="data.total"   
    :page-size="5" :current-page="payload.page"
    @current-change="handleCurrentChange"/>  
    </div>
  </div>
  <EditPop :popShow="popShow" v-if='popShow' :message='courseItemState.message' :confirmClick='confirmClick' />
  <AddPop :addShow="addShow"
      :confirmClickAdd="confirmClickAdd"
      :addData="addData" />
</template>
<script setup>
import Table from './Table.vue';
import EditPop from './EditPop.vue';
import AddPop from './AddPop.vue';
import { reactive, ref, onMounted } from 'vue';
import { getCourse, changeCourse, deleteCourse, getBorrowBook, getUserInfo, addCourse } from '../api/index';
const data = reactive({ list: [], total: 0 });
const payload = reactive({ category: '', page: 1, size: 5, title: '', outhor: '', maxPoint: '', miniPoint: '' });
const addData = reactive({ course_img: '', title: '', outhor: '', point: '', category: '' });
const addShow = ref(false), popShow = ref(false), isAdmin = ref(false);
const courseItemState = reactive({ message: {} });
const getBooks = async () => {
  const query = { title: payload.title, outhor: payload.outhor, category: payload.category, page: payload.page, size: payload.size };
  if (payload.miniPoint !== '') query.minPoint = Number(payload.miniPoint);
  if (payload.maxPoint !== '') query.maxPoint = Number(payload.maxPoint);
  const res = await getCourse(query);
  const lastPage = Math.max(1, Math.ceil(res.total / payload.size));
  if (payload.page > lastPage) { payload.page = lastPage; return getBooks(); }
  data.list = res.list;
  data.total = res.total;
};
const handleCurrentChange = async (page) => {
  payload.page = page;
  try { await getBooks(); } catch { /* interceptor displays error */ }
};
const handleClick = async () => {
  for (const value of [payload.miniPoint, payload.maxPoint]) {
    if (value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 10)) {
      ElMessage.error('评分必须是 0 到 10 之间的数字'); return;
    }
  }
  if (payload.miniPoint !== '' && payload.maxPoint !== '' && Number(payload.miniPoint) > Number(payload.maxPoint)) {
    ElMessage.error('最低评分不能大于最高评分'); return;
  }
  await handleCurrentChange(1);
};
const handleAdd = () => {
  Object.keys(addData).forEach(key => { addData[key] = ''; });
  addShow.value = true;
};
const confirmClickAdd = async (value) => {
  if (value === 'cancel') { addShow.value = false; return; }
  const res = await addCourse(value);
  ElMessage.success(res.message);
  addShow.value = false;
  await getBooks();
};
const editClick = (value) => { courseItemState.message = value; popShow.value = true; };
const confirmClick = async (value) => {
  if (value === 'cancel') { popShow.value = false; return; }
  try {
    const res = await changeCourse(value);
    ElMessage.success(res.message);
    popShow.value = false;
    await getBooks();
  } catch { /* keep dialog open on failure */ }
};
const deleteHandle = async (_id) => {
  try {
    const res = await deleteCourse({ _id });
    ElMessage.success(res.message);
    await getBooks();
  } catch { /* keep row on failure */ }
};
const borrowing = new Set();
const borrowHandle = async (bookid) => {
  if (borrowing.has(bookid)) return;
  borrowing.add(bookid);
  try {
    const res = await getBorrowBook({ bookid });
    ElMessage.success(res.message);
    await getBooks();
  } catch { /* keep displayed stock on failure */ }
  finally { borrowing.delete(bookid); }
};
onMounted(async () => {
  try {
    const user = await getUserInfo();
    isAdmin.value = user.identity === 'admin';
    await getBooks();
  } catch { /* interceptor displays error */ }
});
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
    width: 100px;
    margin-bottom: 40px;
  }
}

:deep(.el-table__header-wrapper) {
  position: fixed;
  z-index: 20;
}

:deep(.el-table__inner-wrapper) {
  overflow: hidden;
}

:deep(.el-table__body-wrapper) {
  margin-top: 40px;
}

:deep(.el-input__inner) {
  width: 120px;
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