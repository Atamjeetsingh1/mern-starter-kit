/**
 * api/user.api.js
 * HTTP calls for user management endpoints.
 */

import axiosInstance from "./axiosInstance";

export const getAllUsersApi = (params) =>
  axiosInstance.get("/users", { params });

export const getMyProfileApi = () =>
  axiosInstance.get("/users/profile");

export const getUserByIdApi = (id) =>
  axiosInstance.get(`/users/${id}`);

export const updateUserApi = (id, data) =>
  axiosInstance.patch(`/users/${id}`, data);

export const deleteUserApi = (id) =>
  axiosInstance.delete(`/users/${id}`);