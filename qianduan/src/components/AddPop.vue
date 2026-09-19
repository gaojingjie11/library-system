<template>
  <el-dialog title="新增图书" :model-value="addShow" @update:model-value="confirmClickAdd('cancel')"    width="500" center :show-close="false">
    <el-form>
        <el-form-item label="上传图片:">
          <el-upload
            class="upload-button"
            :http-request="uploadRequest"
            :disabled="uploading"
            :before-upload="beforeUpload"
            :show-file-list="false"
          >
          <el-button type="primary" style="width: 125px;margin-left: 0px;" 
              >选择图片</el-button
            >
          </el-upload>
        </el-form-item>
      </el-form>
      <div v-if="uploadUrl">
      <p><img :src="uploadUrl" style="border-radius: 50%;width:100px;margin-left: 90px;"></p>
      
    </div>
    <el-form :model="addData" ref="ruleFormAdd">
      <el-form-item label="书籍名称" prop="title" required>
        <el-input v-model='addData.title' />
      </el-form-item>
      <el-form-item label="书籍作者" prop="outhor" required>
        <el-input v-model='addData.outhor' />
      </el-form-item>
      <el-form-item label="评分" prop="point" required>
        <el-input v-model='addData.point' />
      </el-form-item>
      <el-form-item label="分类" prop="category" required>
        <el-input v-model='addData.category' />
      </el-form-item>
      <el-form-item>
        <el-button @click="confirmClickAdd('cancel')">取消</el-button>
        <el-button type="primary" :disabled="uploading" @click="submitAdd(ruleFormAdd)">确认</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
<script setup>
import { ref, watch } from 'vue';
import { uploadImage } from '@/utils/request';
const props = defineProps(['addShow', 'confirmClickAdd', 'addData']);
const uploadUrl = ref(null);
const uploading = ref(false);
const ruleFormAdd = ref(null);
watch(() => props.addShow, (show) => { if (show) uploadUrl.value = null; });
const beforeUpload = (file) => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    ElMessage.error('请选择不超过 5MB 的 JPG、PNG、WebP 或 GIF 图片');
    return false;
  }
  return true;
};
const uploadRequest = async ({ file }) => {
  uploading.value = true;
  try {
    const result = await uploadImage(file);
    uploadUrl.value = result.url;
    ElMessage.success('上传成功');
    return result;
  } finally { uploading.value = false; }
};
const submitAdd = async (form) => {
  if (!form || uploading.value) return;
  if (!uploadUrl.value) { ElMessage.error('请先上传图片'); return; }
  try {
    await form.validate();
    await props.confirmClickAdd({ ...props.addData, course_img: uploadUrl.value });
  } catch { /* validation or API already displays the error */ }
};
</script>
<style lang='less' scoped>
.dialog-footer button:first-child {
  margin-right: 10px;
}

:deep(.el-form-item__label) {
  width: 80px !important;
}

:deep(.el-form-item__content) {
  justify-content: center;
  margin-left: 0 !important;
}
</style>