import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS } from "@/constants";

export function getCurrentUser() {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
}
