import request from "@/utils/axios.ts";

// 获取目录树
export function getTree() {
  return request.get("/api/intentra/tree");
}

// 获取用例列表
export function getCaseList(params: any) {
  return request.get("/api/intentra/case/list", params);
}

// 保存用例
export function saveCase(data: any) {
  return request.post("/api/intentra/case/save", data);
}

// 删除用例
export function deleteCase(id: number) {
  return request.delete("/api/intentra/case/delete", { id });
}

// 获取设备列表
export function getDevices() {
  return request.get("/api/intentra/devices");
}

// 执行用例
export function runCase(data: { case_id: number; device_id: string }) {
  return request.post("/api/intentra/run", data);
}

// 获取执行结果列表
export function getResultList(params: any) {
  return request.get("/api/intentra/result/list", params);
}

// 获取执行结果详情
export function getResultDetail(id: number) {
  return request.get("/api/intentra/result/detail", { id });
}

// 保存模块
export function saveModule(data: any) {
  return request.post("/api/intentra/module/save", data);
}

// 删除模块
export function deleteModule(id: number) {
  return request.delete("/api/intentra/module/delete", { id });
}