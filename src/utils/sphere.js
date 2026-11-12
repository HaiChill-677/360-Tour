/**
 * Chuyển một điểm giao (THREE.Vector3) thành tọa độ hotspot nằm ngay bên
 * trong mặt cầu. Lưu tọa độ 3D thay vì pixel để hotspot không bị lệch khi
 * người xem xoay panorama hoặc đổi kích thước màn hình.
 */
export function pointOnSphere(intersectionPoint, radius = 4.82) {
  return intersectionPoint.clone().normalize().multiplyScalar(radius).toArray();
}

export function normalizePosition(position, radius = 4.82) {
  const length = Math.hypot(position[0], position[1], position[2]) || 1;
  const scale = radius / length;
  return position.map((value) => value * scale);
}
