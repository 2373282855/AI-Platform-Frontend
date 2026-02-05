<script setup lang="ts" name="VideoLibrary">
import { ref, onMounted } from "vue";
import { MsgBox, MsgSuccess, NoticeError } from "@/utils/koi.ts";
import { delete_video, video_list } from "@/api/api_app/video.ts";
import { app_menu_select } from "@/api/api_app/app";

const showSearch = ref<boolean>(true);
const total = ref<number>(0);

const searchParams = ref({
  currentPage: 1,
  pageSize: 10,
  search: {
    file_name__icontains: "",
    menu_id: ""
  }
});

const koiDrawerRef = ref();
const loading = ref(false);
const tableList = ref<any>([]);
const app_menu_list = ref<any>([]);

const get_app_select = async () => {
  const res: any = await app_menu_select({});
  app_menu_list.value = res.data;
  if (app_menu_list.value.length > 0) {
    searchParams.value.search.menu_id = app_menu_list.value[0].id;
  }
  await get_video_list();
};

const get_video_list = async () => {
  try {
    loading.value = true;
    const res: any = await video_list(searchParams.value);
    tableList.value = res.data.content;
    total.value = res.data.total;
    loading.value = false;
  } catch {
    NoticeError("数据查询失败，请刷新重试🌻");
    loading.value = false;
  }
};

const resetsearch = async () => {
  searchParams.value.currentPage = 1;
  searchParams.value.search.file_name__icontains = "";
  await get_video_list();
};

const Add = () => {
  koiDrawerRef.value.koiOpen();
};

const Delete = async (row: any) => {
  MsgBox("您确认需要删除视频[" + row.file_name + "]么？").then(async () => {
    const res: any = await delete_video({ id: row.id });
    MsgSuccess(res.message);
    await get_video_list();
  });
};

const uploadBatchRef = ref();

const handleConfirm = async () => {
  if (uploadBatchRef.value && uploadBatchRef.value.fileList.length > 0) {
    await uploadBatchRef.value.submitUpload();
  } else {
    koiDrawerRef.value.koiQuickClose();
  }
};

onMounted(() => {
  get_app_select();
});
</script>

<template>
  <div>
    <KoiCard>
      <el-form v-show="showSearch" :inline="true">
        <el-form-item label="项目：">
          <el-select v-model="searchParams.search.menu_id" placeholder="请选择菜单名称" clearable style="width: 200px" @change="get_video_list">
            <el-option v-for="item in app_menu_list" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="视频名称">
          <el-input placeholder="请输入视频名称" v-model="searchParams.search.file_name__icontains" clearable style="width: 200px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" plain @click="get_video_list">搜索</el-button>
          <el-button type="danger" icon="refresh" plain @click="resetsearch">重置</el-button>
          <el-button type="primary" icon="plus" plain @click="Add()">批量新增/上传</el-button>
        </el-form-item>
      </el-form>
      
      <div class="h-10px"></div>
      
      <el-table v-loading="loading" border :data="tableList" empty-text="暂时没有数据哟🌻">
        <el-table-column type="index" label="序号" width="80px" align="center"></el-table-column>
        <el-table-column label="名称" prop="file_name" align="center" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column label="预览" align="center">
          <template #default="scope">
            <video 
              class="w-160px h-90px" 
              controls
              :src="scope.row.file_path"
            >
              您的浏览器不支持 video 标签。
            </video>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="180px" align="center"></el-table-column>
        <el-table-column label="操作" align="center" width="100">
          <template #default="{ row }">
            <el-button type="danger" icon="Delete" circle plain @click="Delete(row)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="h-10px"></div>
      <el-pagination 
        background 
        v-model:current-page="searchParams.currentPage"
        v-model:page-size="searchParams.pageSize" 
        :total="total"
        layout="total, sizes, prev, pager, next, jumper" 
        @size-change="get_video_list"
        @current-change="get_video_list" 
      />

      <KoiDrawer ref="koiDrawerRef" title="批量上传视频" @koi-confirm="handleConfirm" @koi-cancel="koiDrawerRef.koiClose()">
        <template #content>
           <el-alert title="说明" type="info" description="支持批量选择视频，或通过按钮上传整个文件夹。上传后将自动关联至当前选中的项目。" show-icon :closable="false" style="margin-bottom: 20px" />
           <KoiUploadBatch 
             ref="uploadBatchRef"
             action="/api/common/upload_airtest_video" 
             :data="{ menu_id: searchParams.search.menu_id }"
             @success="get_video_list" 
           />
        </template>
      </KoiDrawer>
    </KoiCard>
  </div>
</template>
