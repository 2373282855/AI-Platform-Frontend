import axios from "@/utils/axios.ts";

enum API {
  VIDEO_LIST = "/api/app/video_list",
  DELETE_VIDEO = "/api/app/delete_video",
}

export const video_list = (params: any) => {
  return axios.post(API.VIDEO_LIST, params);
};

export const delete_video = (params: any) => {
  return axios.post(API.DELETE_VIDEO, params); 
};
