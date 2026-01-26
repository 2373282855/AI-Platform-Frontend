import request from "@/utils/request";

// 获取目录树
export function getTree() {
  return request({
    url: "/api/intentra/tree",
    method: "get"
  });
}

// 获取用例列表
export function getCaseList(module_id: number) {
  return request({
    url: "/api/intentra/case/list",
    method: "get",
    params: { module_id }
  });
}

// 保存用例
export function saveCase(data: any) {
  return request({
    url: "/api/intentra/case/save",
    method: "post",
    data
  });
}

// 执行用例
export function runCase(data: { case_id: number; device_id?: string }) {
  return request({
    url: "/api/intentra/run",
    method: "post",
    data
  });
}