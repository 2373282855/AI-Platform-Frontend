import request from "@/utils/axios.ts";

// 获取目录树
export function getTree() {
  return request.post("/api/intentra/tree", {});
}

// 获取用例列表
export function getCaseList(params: any) {
  return request.post("/api/intentra/case/list", params);
}

// 保存用例
export function saveCase(data: any) {
  return request.post("/api/intentra/case/save", data);
}

// 删除用例
export function deleteCase(id: number) {
  return request.post("/api/intentra/case/delete", { id });
}

// 获取设备列表
export function getDevices() {
  return request.post("/api/intentra/devices", {});
}

// 执行用例
export function runCase(data: { case_id: number; device_id: string }) {
  return request.post("/api/intentra/run", data);
}

// 获取执行结果列表
export function getResultList(params: any) {
  return request.post("/api/intentra/result/list", params);
}

// 获取执行结果详情
export function getResultDetail(id: number) {
  return request.post("/api/intentra/result/detail", { id });
}


// 保存模块
export function saveModule(data: any) {
  return request.post("/api/intentra/module/save", data);
}

// 删除模块
export function deleteModule(id: number) {
  return request.post("/api/intentra/module/delete", { id });
}

// ==================== 测试集相关 ====================

// 获取测试集列表
export function getSuiteList() {
  return request.post("/api/intentra/suite/list", {});
}

// 保存测试集
export function saveSuite(data: { id?: number; name: string; description?: string; case_ids: number[] }) {
  return request.post("/api/intentra/suite/save", data);
}

// 删除测试集
export function deleteSuite(id: number) {
  return request.post("/api/intentra/suite/delete", { id });
}

// 获取测试集中的用例
export function getSuiteCases(suite_id: number) {
  return request.post("/api/intentra/suite/cases", { suite_id });
}

// 执行测试集
export function runSuite(data: { suite_id: number; device_id: string }) {
  return request.post("/api/intentra/suite/run", data);
}
