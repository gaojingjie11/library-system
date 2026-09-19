<template>
  <el-dialog title="编辑图书" :model-value="popShow" @update:model-value="confirmClick('cancel')" width="500" center :show-close="false">
    <el-form :model="editData" ref="ruleForm" label-width="82px">
      <el-form-item label="封面">
        <el-upload
          :show-file-list="false"
          :http-request="uploadRequest"
          :before-upload="beforeUpload"
          :disabled="uploading"
        >
          <img :src="editData.course_img || '/avatar.svg'" class="cover-preview" alt="图书封面" />
          <div class="upload-tip">点击更换封面</div>
        </el-upload>
      </el-form-item>
      <el-form-item label="书籍名称" prop="title" required>
        <el-input v-model="editData.title" />
      </el-form-item>
      <el-form-item label="书籍作者" prop="outhor" required>
        <el-input v-model="editData.outhor" />
      </el-form-item>
      <el-form-item label="评分" prop="point" required>
        <el-input v-model="editData.point" />
      </el-form-item>
      <el-form-item label="分类" prop="category" required>
        <el-input v-model="editData.category" />
      </el-form-item>
      <el-form-item>
        <el-button @click="confirmClick('cancel')">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitForm">确认</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { uploadImage } from '../utils/request';

const props = defineProps(['popShow', 'message', 'confirmClick']);
const editData = reactive({ title: '', outhor: '', _id: '', point: '', category: '', course_img: '' });
const ruleForm = ref(null);
const uploading = ref(false);

watch(() => props.message, (message) => {
  Object.assign(editData, {
    title: message?.title || '',
    outhor: message?.outhor || '',
    _id: message?._id || '',
    point: message?.point ?? '',
    category: message?.category || '',
    course_img: message?.course_img || ''
  });
}, { immediate: true });

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
    editData.course_img = (await uploadImage(file)).url;
    ElMessage.success('封面上传成功，请点击确认保存');
  } finally {
    uploading.value = false;
  }
};

const submitForm = async () => {
  if (uploading.value || !ruleForm.value) return;
  const valid = await ruleForm.value.validate().catch(() => false);
  if (!valid) return;
  props.confirmClick({ ...editData });
};
</script>

<style lang="less" scoped>
.cover-preview { width: 100px; height: 140px; border-radius: 8px; object-fit: contain; cursor: pointer; border: 1px solid #ebeef5; }
.upload-tip { color: #909399; font-size: 12px; margin-top: 4px; }
</style>
