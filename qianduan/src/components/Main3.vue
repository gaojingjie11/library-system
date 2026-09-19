<template>
  <div class="main">
    <Table :list="data.list" :returnHandle="returnHandle" />
    <el-pagination background layout="prev, pager, next" :total="data.total" :page-size="5"
      :current-page="data.page" @current-change="handleCurrentChange" />
  </div>
</template>
<script setup>
import Table from './Table3.vue';
import { reactive, onMounted } from 'vue';
import { borrowbooklist, returnbook } from '../api/index';
const data = reactive({ list: [], page: 1, total: 0 });
const pending = new Set();
const refresh = async () => {
  const res = await borrowbooklist({ page: data.page, size: 5 });
  const lastPage = Math.max(1, Math.ceil(res.total / 5));
  if (data.page > lastPage) { data.page = lastPage; return refresh(); }
  data.list = res.list;
  data.total = res.total;
};
const handleCurrentChange = async (page) => {
  data.page = page;
  try { await refresh(); } catch { /* request interceptor shows the error */ }
};
const returnHandle = async (id) => {
  if (!id || pending.has(id)) return;
  pending.add(id);
  try {
    const res = await returnbook({ id });
    ElMessage.success(res.message);
    await refresh();
  } catch { /* keep the row on failure */ }
  finally { pending.delete(id); }
};
onMounted(() => handleCurrentChange(1));
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
  z-index: 20;
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