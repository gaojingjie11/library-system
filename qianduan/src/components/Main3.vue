<template>
  <div class="main page-shell"><div class="page-heading"><div><h2>我的借阅</h2><p>查看当前借阅，读完后及时归还。</p></div></div>
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
<style scoped>
.main { min-width: 0; }
</style>
