import axios from "@/utils/axios.ts";

// 获取目录树
export function getTree() {
  return axios({
    url: "/api/intentra/tree",
    method: "get"
  });
}

// 获取用例列表
export function getCaseList(params: any) {
  return axios({
    url: "/api/intentra/case/list",
    method: "get",
    params
  });
}

// 保存用例
export function saveCase(data: any) {
  return axios({
    url: "/api/intentra/case/save",
    method: "post",
    data
  });
}

// 删除用例
export function deleteCase(id: number) {
  return axios({
    url: "/api/intentra/case/delete",
    method: "delete",
    params: { id }
  });
}

// 获取设备列表
export function getDevices() {
  return axios({
    url: "/api/intentra/devices",
    method: "get"
  });
}

// 执行用例
export function runCase(data: { case_id: number; device_id: string }) {
  return axios({
    url: "/api/intentra/run",
    method: "post",
    data
  });
}

// 获取执行结果列表
export function getResultList(params: any) {
  return axios({
    url: "/api/intentra/result/list",
    method: "get",
    params
  });
}

// 获取执行结果详情
export function getResultDetail(id: number) {
  return axios({
    url: "/api/intentra/result/detail",
    method: "get",
    params: { id }
  });
}

// 保存模块
export function saveModule(data: any) {
  return axios({
    url: "/api/intentra/module/save",
    method: "post",
    data
  });
}

// 删除模块
export function deleteModule(id: number) {
  return axios({
    url: "/api/intentra/module/delete",
    method: "delete",
    params: { id }
  });
}