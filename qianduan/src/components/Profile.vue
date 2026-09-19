<template>
  <div class="profile-page page-shell">
    <div class="page-heading">
      <div>
        <h2>个人中心</h2>
        <p>管理你的头像、昵称和登录密码</p>
      </div>
    </div>
    <el-card class="profile-card" shadow="never">
      <el-form :model="form" label-width="92px" @submit.prevent>
        <el-form-item label="头像">
          <el-upload
            :show-file-list="false"
            :http-request="uploadRequest"
            :before-upload="beforeUpload"
            :disabled="uploading"
          >
            <img :src="preview" class="profile-avatar" alt="头像" />
            <div class="avatar-tip">点击更换头像</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input :model-value="props.userInfo.name" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model.trim="form.nickname" maxlength="30" show-word-limit placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model.trim="form.password" type="password" show-password placeholder="不修改请留空" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model.trim="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { uploadAvatar, updateProfile } from '../api/index';

const props = defineProps({ userInfo: { type: Object, required: true } });
const emit = defineEmits(['updated']);
const form = reactive({ nickname: '', password: '', confirmPassword: '' });
const pendingHeadImg = ref('');
const preview = computed(() => pendingHeadImg.value || props.userInfo.headImg || '/avatar.svg');
const uploading = ref(false);
const saving = ref(false);

watch(() => [props.userInfo.nickname, props.userInfo.name], ([nickname, name]) => {
  if (!form.nickname || form.nickname === props.userInfo.name) form.nickname = nickname || name || '';
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
    pendingHeadImg.value = (await uploadAvatar(file)).url;
    ElMessage.success('头像上传成功，请点击保存修改');
  } finally {
    uploading.value = false;
  }
};

const save = async () => {
  if (!form.nickname) return ElMessage.error('昵称不能为空');
  if (form.password && !/^\S{6,12}$/.test(form.password)) return ElMessage.error('密码必须为 6 到 12 个非空白字符');
  if (form.password !== form.confirmPassword) return ElMessage.error('两次输入的密码不一致');
  const data = { nickname: form.nickname };
  if (form.password) data.password = form.password;
  if (pendingHeadImg.value) data.headImg = pendingHeadImg.value;
  saving.value = true;
  try {
    const result = await updateProfile(data);
    form.password = '';
    form.confirmPassword = '';
    pendingHeadImg.value = '';
    emit('updated', result);
    ElMessage.success('个人资料已保存');
  } finally {
    saving.value = false;
  }
};
</script>

<style lang="less" scoped>
.profile-page { max-width: 920px; }
.profile-card { max-width: 680px; }
.profile-avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 3px solid #e8f3ff; }
.avatar-tip { color: #909399; font-size: 12px; text-align: center; margin-top: 6px; }
</style>
