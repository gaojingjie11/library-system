<template>
  <el-dialog title="编辑" :model-value="popShow" @update:model-value="confirmClick('cancel')" width="30%" center :show-close="false">
    <el-form :model="editData" ref="ruleFromRef">
      <el-form-item label="书籍名称" prop="title" required>
        <el-input v-model='editData.title' />
      </el-form-item>
      <el-form-item label="书籍作者" prop="outhor" required>
        <el-input v-model='editData.outhor' />
      </el-form-item>
      <el-form-item label="评分" prop="point" required>
        <el-input v-model='editData.point' />
      </el-form-item>
      <el-form-item label="分类" prop="category" required>
        <el-input v-model='editData.category' />
      </el-form-item>
      <el-form-item>
        <el-button @click="confirmClick('cancel')">取消</el-button>
        <el-button type="primary" @click="submitForm(ruleFromRef)">确认</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
<script setup>
import { defineProps, reactive, ref } from 'vue';
const { popShow, message, confirmClick } = defineProps(['popShow', 'message', 'confirmClick'])
/**
 * 编辑组件维护的数据
 */
const editData = reactive({
  title: message.title,
  outhor: message.outhor,
  _id: message._id,
  point:message.point,
  category:message.category
})
/**
 * 表单校验
 */
const ruleFromRef = ref(null)
const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      confirmClick({ title: editData.title, outhor: editData.outhor, _id: editData._id, point:editData.point, category:editData.category })
    } else {
      console.log('error submit!', fields)
    }
  })
}

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