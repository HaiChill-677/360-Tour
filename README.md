# 360° Virtual Tour Studio

Ứng dụng web tạo tour tham quan panorama 360° với React, Vite, Three.js / React Three Fiber, Tailwind CSS và Framer Motion.

## 1. Yêu cầu

- Node.js 20.19+ (khuyến nghị Node.js 22 LTS)
- npm 10+
- Ảnh panorama dạng equirectangular (tỉ lệ khuyến nghị 2:1, ví dụ 6000 × 3000 px)

## 2. Cài đặt và chạy

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal, mặc định là `http://localhost:5173`.

Build bản production:

```bash
npm run build
npm run preview
```

## 3. Thêm ảnh panorama

Ứng dụng bắt đầu với thư viện trống, không còn tạo sẵn bốn slot ảnh mẫu. Trong chế độ **Design**, nhấn nút **Thêm ảnh +** ở thanh thư viện bên dưới để mở hộp chọn tệp của trình duyệt. Có thể chọn một hoặc nhiều ảnh cùng lúc; hỗ trợ JPG/JPEG, PNG và WebP. Ảnh được thêm ngay vào carousel và ảnh đầu tiên sẽ tự động được mở. Không cần chép thủ công ảnh vào `public/panoramas`.

Ảnh panorama equirectangular có tỉ lệ khuyến nghị 2:1. Ví dụ: 6000 × 3000 px. Ảnh khác tỉ lệ vẫn có thể được chọn, nhưng trường nhìn 360° có thể bị méo.

**Lưu ý:** bản hiện tại nạp ảnh trực tiếp trong trình duyệt bằng Object URL để xem và thiết kế tour. Ảnh không được tải lên máy chủ; sau khi tải lại trang hoặc đóng tab, cần chọn lại ảnh. Muốn lưu ảnh lâu dài để truy cập từ thiết bị khác, cần bổ sung backend hoặc dịch vụ lưu trữ như Cloudinary/Supabase Storage.

## 4. Cách sử dụng

1. Chọn panorama ở thanh thư viện phía dưới.
2. Kéo chuột trái để xoay góc nhìn 360°; cuộn con lăn lên/xuống để zoom in/out. Zoom chỉ điều chỉnh FOV của camera, không làm tăng độ phân giải ảnh gốc.
3. Ở chế độ **Design**, nhấp đúp vào vị trí muốn đặt checkpoint.
4. Trong hộp thoại, nhập tên, chọn biểu tượng và panorama đích; nhấn nút **Tạo checkpoint** ở cuối hộp thoại để xác nhận. Nút xác nhận nằm ở chân hộp thoại; có thể nhấn Enter để lưu hoặc Escape để hủy.
5. Nhấp vào checkpoint khi đang ở Design để sửa hoặc xóa.
6. Chuyển sang **Preview**. Mỗi checkpoint hiển thị nhãn **ĐI ĐẾN** kèm tên panorama đích; nhấp vào checkpoint để chuyển cảnh. Dùng **Quay lại** ở thanh Preview để quay về không gian vừa xem.

## 5. Cấu trúc thư mục

```text
virtual-tour-builder/
├── public/
│   └── panoramas/             # Đặt 1.jpg, 2.jpg, 3.jpg, 4.jpg tại đây
├── src/
│   ├── components/
│   │   ├── HotspotEditor.jsx  # Modal tạo/sửa/xóa checkpoint
│   │   ├── TourViewer.jsx     # Canvas 3D, cầu panorama, marker và camera controls
│   │   └── UIOverlay.jsx      # Header, Design/Preview, Asset Manager carousel
│   ├── data/
│   │   └── defaultPanoramas.js
│   ├── utils/
│   │   └── sphere.js          # Hàm tính tọa độ trên mặt cầu
│   ├── App.jsx                # State và luồng tương tác toàn ứng dụng
│   ├── index.css              # Tailwind + glassmorphism theme
│   └── main.jsx
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## 6. Cách lưu tọa độ hotspot (x, y, z)

Khi người dùng nhấp đúp lên mesh hình cầu, React Three Fiber cung cấp `event.point` — điểm giao của tia chuột và bề mặt sphere trong world coordinates. Chuẩn hóa vector và nhân với bán kính nhỏ hơn bán kính sphere một chút:

```js
const position = event.point.clone().normalize().multiplyScalar(4.82).toArray();
// Ví dụ: [1.21, 2.08, -4.14]
```

Sphere có bán kính `5`, còn marker nằm ở bán kính `4.82` để ở phía trong bề mặt. Dữ liệu của một checkpoint được lưu theo dạng:

```js
{
  id: 'checkpoint-id',
  name: 'Sảnh chính',
  icon: '⌖',
  targetId: 'pano-2',
  position: [1.21, 2.08, -4.14]
}
```

Dữ liệu được tổ chức theo panorama nguồn:

```js
const hotspotsByPanorama = {
  'pano-1': [/* các checkpoint nằm trên pano-1 */],
  'pano-2': [/* các checkpoint nằm trên pano-2 */],
};
```

Marker dùng chính mảng `position` làm thuộc tính `position` của `<group>` trong R3F. Do lưu theo tọa độ 3D của sphere, vị trí marker không phụ thuộc kích thước màn hình.

## 7. Quản lý bộ nhớ Three.js

`PanoramaSphere` tạo một `SphereGeometry`, `MeshBasicMaterial` và `Texture` riêng cho panorama hiện tại. Khi chuyển panorama, component cũ unmount và effect cleanup gọi:

```js
texture.dispose();
geometry.dispose();
material.dispose();
```

Việc cleanup texture được quản lý riêng vì `Material.dispose()` không tự giải phóng texture map. Ngoài ra, Object URL tạo khi upload ảnh local được thu hồi bằng `URL.revokeObjectURL()` khi xóa ảnh hoặc khi ứng dụng unmount.

## 8. Ghi chú triển khai

- Ảnh nên là panorama equirectangular 2:1. Ảnh thường vẫn có thể tải lên nhưng sẽ không tạo được góc nhìn 360° chính xác.
- Trong bản hiện tại, cấu hình checkpoint chỉ lưu trong React state (RAM của tab). Muốn giữ dự án sau khi đóng trình duyệt, cần bổ sung chức năng Save/Load JSON hoặc backend/database. Sau khi tạo, ứng dụng hiển thị thông báo xác nhận ở phía dưới màn hình.
- Nên resize ảnh về kích thước phù hợp với thiết bị đích trước khi đưa lên web. Ảnh 8K/16K có thể tốn nhiều RAM GPU.
- Đã đặt `dpr` tối đa 1.5, tắt antialias và giới hạn anisotropy để giảm tải GPU trên máy cấu hình thấp.

