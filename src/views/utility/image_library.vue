<script setup lang="ts" name="ImageLibrary">
import { ref, onMounted } from "vue";
import { MsgBox, MsgSuccess, NoticeError } from "@/utils/koi.ts";
import { delete_img, img_list } from "@/api/api_app/img.ts";
import { app_menu_select } from "@/api/api_app/app";

const showSearch = ref<boolean>(true);
const total = ref<number>(0);

const searchParams = ref({
  currentPage: 1,
  pageSize: 10,
  search: {
    file_name__icontains: "",
    menu_id: "",
    current_path: ""
  }
});

const goUp = () => {
    if (!searchParams.value.search.current_path) return;
    const parts = searchParams.value.search.current_path.split("/").filter(Boolean);
    parts.pop();
    searchParams.value.search.current_path = parts.length ? parts.join("/") + "/" : "";
    searchParams.value.currentPage = 1;
    get_img_list();
};

const handleRowDblClick = (row: any) => {
    if (row.is_folder) {
        // Navigate down
        searchParams.value.search.current_path = row.rel_path;
        searchParams.value.currentPage = 1;
        get_img_list();
    }
};

const dialogVisible = ref(false);
const loading = ref(false);
const tableList = ref<any>([]);
const app_menu_list = ref<any>([]);
const selectionList = ref<any[]>([]);

const handleSelectionChange = (val: any[]) => {
  selectionList.value = val;
};

const BatchDelete = async () => {
    MsgBox(`您确认需要删除选中的 ${selectionList.value.length} 项数据吗？`).then(async () => {
        try {
            for (const item of selectionList.value) {
                 if (item.is_folder) {
                     NoticeError("暂不支持批量删除文件夹：" + item.file_name);
                     continue;
                 }
                 await delete_img({ id: item.id });
            }
            MsgSuccess("批量删除完成");
            await get_img_list();
            selectionList.value = [];
        } catch (e) {
            NoticeError("删除失败");
        }
    });
};

const get_app_select = async () => {
  const res: any = await app_menu_select({});
  app_menu_list.value = res.data;
  if (app_menu_list.value.length > 0) {
    searchParams.value.search.menu_id = app_menu_list.value[0].id;
  }
  await get_img_list();
};

const get_img_list = async () => {
  try {
    loading.value = true;
    const res: any = await img_list(searchParams.value);
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
  await get_img_list();
};

const Add = () => {
  dialogVisible.value = true;
};

const Delete = async (row: any) => {
  MsgBox("您确认需要删除图像[" + row.file_name + "]么？").then(async () => {
    const res: any = await delete_img({ id: row.id });
    MsgSuccess(res.message);
    await get_img_list();
  });
};

const uploadBatchRef = ref();

const handleConfirm = async () => {
  if (uploadBatchRef.value && uploadBatchRef.value.fileList.length > 0) {
    await uploadBatchRef.value.submitUpload();
  } else {
    dialogVisible.value = false;
  }
};

const handleUploadSuccess = () => {
  get_img_list();
  dialogVisible.value = false;
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
          <el-select v-model="searchParams.search.menu_id" placeholder="请选择菜单名称" clearable style="width: 200px" @change="get_img_list">
            <el-option v-for="item in app_menu_list" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="图像名称">
          <el-input placeholder="请输入图像名称" v-model="searchParams.search.file_name__icontains" clearable style="width: 200px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" plain @click="get_img_list">搜索</el-button>
          <el-button type="danger" icon="refresh" plain @click="resetsearch">重置</el-button>
          <el-button type="primary" icon="plus" plain @click="Add()">批量新增/上传</el-button>
          <el-button type="danger" icon="Delete" plain :disabled="selectionList.length === 0" @click="BatchDelete">批量删除</el-button>
        </el-form-item>
      </el-form>
      
      <div class="flex items-center gap-2 mb-2" v-if="searchParams.search.current_path">
        <el-button link type="primary" @click="goUp">
          <el-icon><Back /></el-icon> 返回上一级
        </el-button>
        <span class="text-gray-500">当前路径: /{{ searchParams.search.current_path }}</span>
      </div>
      
      <div class="h-10px"></div>
      
      <el-table v-loading="loading" border :data="tableList" empty-text="暂时没有数据哟🌻" @row-dblclick="handleRowDblClick" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="80px" align="center"></el-table-column>
        <el-table-column label="名称" prop="file_name" align="left" :show-overflow-tooltip="true">
          <template #default="{ row }">
             <div class="flex items-center gap-2 cursor-pointer">
               <el-icon v-if="row.is_folder" class="text-yellow-500 text-lg"><Folder /></el-icon>
               <el-icon v-else class="text-gray-400 text-lg"><Picture /></el-icon>
               <span :class="{'text-primary font-bold': row.is_folder}">{{ row.file_name }}</span>
             </div>
          </template>
        </el-table-column>
        <el-table-column label="预览" align="center">
          <template #default="scope">
            <el-image 
              v-if="!scope.row.is_folder"
              class="w-100px h-60px" 
              :preview-teleported="true" 
              :preview-src-list="[scope.row.file_path]"
              :src="scope.row.file_path"
              fit="contain"
            >
              <template #error>
                <el-icon><Picture /></el-icon>
              </template>
            </el-image>
            <div v-else class="text-gray-400 text-sm">文件夹</div>
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
        @size-change="get_img_list"
        @current-change="get_img_list" 
      />

      <el-dialog v-model="dialogVisible" title="批量上传图片" width="600px" align-center :close-on-click-modal="false">
        <el-alert title="说明" type="info" description="支持批量选择图片，或通过按钮上传整个文件夹。上传后将自动关联至当前选中的项目。" show-icon :closable="false" style="margin-bottom: 20px" />
        <KoiUploadBatch 
             ref="uploadBatchRef"
             action="/api/common/upload_airtest_img" 
             :data="{ menu_id: searchParams.search.menu_id }"
             @success="handleUploadSuccess" 
        />
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </KoiCard>
  </div>
</template>
