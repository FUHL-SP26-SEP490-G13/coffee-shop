import jwtDecode from "jwt-decode";

export function getCurrentUser() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
}
