# 🎵 Hướng dẫn sử dụng Lyrics Sync Offline

Ứng dụng Lyrics Sync được thiết kế để hoạt động hoàn toàn offline, không cần kết nối internet sau khi tải lần đầu.

## 🚀 Tính năng Offline

### ✅ Các tính năng hoạt động offline:
- **Tải lên file audio/video**: Hỗ trợ MP3, MP4, WAV, M4A
- **Nhập và chỉnh sửa lyrics**: Toàn bộ editor hoạt động offline
- **Đồng bộ timestamps**: Sync lyrics với audio không cần mạng
- **Xem trước karaoke**: Preview mode hoạt động hoàn toàn offline
- **Lưu trữ dự án**: Tất cả dữ liệu lưu cục bộ trên thiết bị
- **Xuất file**: Export synchronized lyrics ra file
- **Text formatting**: Chuyển đổi định dạng text (uppercase, lowercase, etc.)

### 📱 PWA (Progressive Web App)
- **Cài đặt như app native**: Có thể cài đặt trên điện thoại/máy tính
- **Hoạt động offline hoàn toàn**: Không cần internet sau khi cài đặt
- **Cập nhật tự động**: Tự động cập nhật khi có phiên bản mới
- **Lưu trữ bền vững**: Dữ liệu không bị mất khi offline

## 🔧 Cách cài đặt

### Trên điện thoại (Android/iOS):
1. Mở ứng dụng bằng Chrome/Safari
2. Nhấn menu "Thêm vào màn hình chính"
3. Chọn "Cài đặt" hoặc "Thêm"
4. Ứng dụng sẽ xuất hiện như app native

### Trên máy tính:
1. Mở ứng dụng bằng Chrome/Edge
2. Nhấn biểu tượng "Cài đặt" trên thanh địa chỉ
3. Hoặc nhấn Ctrl+Shift+I → Application → Install

## 💾 Lưu trữ dữ liệu

### LocalForage (IndexedDB):
- **Dung lượng**: Lên đến 50MB+ tùy thiết bị
- **Bền vững**: Dữ liệu không bị xóa tự động
- **Nhanh**: Truy xuất dữ liệu cực nhanh
- **An toàn**: Dữ liệu chỉ lưu trên thiết bị của bạn

### Các loại dữ liệu được lưu:
- **Dự án lyrics**: Toàn bộ thông tin dự án
- **File audio**: Audio data được lưu cục bộ
- **Timestamps**: Thông tin đồng bộ
- **Cài đặt**: Preferences và settings

## 🛠️ Cách sử dụng

### 1. Tạo dự án mới:
```
1. Chọn "Tạo dự án mới"
2. Tải lên file audio/video
3. Nhập thông tin bài hát
4. Nhập lyrics (có thể copy/paste)
5. Chọn định dạng text nếu cần
```

### 2. Đồng bộ lyrics:
```
1. Phát audio và nghe từng dòng lyrics
2. Nhấn "Set Time" khi đến đúng thời điểm
3. Sử dụng phím tắt:
   - Space: Play/Pause
   - ↑/↓: Chuyển dòng lyrics
   - ←/→: Tua audio ±5s
   - S: Set end time
```

### 3. Xem trước karaoke:
```
1. Nhấn "Preview" để xem karaoke mode
2. Kiểm tra timing và hiệu ứng
3. Quay lại chỉnh sửa nếu cần
```

### 4. Lưu và quản lý:
```
1. Nhấn "Lưu dự án" để lưu cục bộ
2. Vào "Dự án đã lưu" để quản lý
3. Export ra file .lrc hoặc .srt
```

## 📊 Theo dõi dung lượng

### Kiểm tra storage:
- Vào Settings → Storage Info
- Xem dung lượng đã sử dụng
- Quản lý và xóa dự án cũ nếu cần

### Tối ưu hóa:
- **Audio quality**: Giảm quality nếu cần tiết kiệm dung lượng
- **Xóa dự án cũ**: Thường xuyên dọn dẹp
- **Export và backup**: Xuất file quan trọng

## 🔄 Sync khi online

### Tự động sync:
- Ứng dụng tự động phát hiện khi có internet
- Dữ liệu pending sẽ được sync
- Cập nhật phiên bản mới nếu có

### Manual sync:
- Nhấn "Sync Now" trong Settings
- Kiểm tra status trong Offline Status

## ⚠️ Lưu ý quan trọng

### Backup dữ liệu:
- **Xuất dự án thường xuyên**: Export ra file để backup
- **Không dựa hoàn toàn vào local storage**: Có thể bị xóa khi thiếu dung lượng
- **Sync khi có internet**: Để đảm bảo an toàn dữ liệu

### Hiệu suất:
- **File audio lớn**: Có thể ảnh hưởng hiệu suất
- **Nhiều dự án**: Kiểm tra dung lượng thường xuyên
- **RAM thiết bị**: Đóng app khác khi xử lý file lớn

### Tương thích:
- **Chrome/Edge**: Hỗ trợ tốt nhất
- **Firefox**: Hỗ trợ cơ bản
- **Safari**: Hỗ trợ iOS 14.3+
- **Mobile browsers**: Hỗ trợ đầy đủ trên mobile

## 🆘 Troubleshooting

### Ứng dụng không hoạt động offline:
1. Kiểm tra Service Worker đã được cài đặt
2. Xóa cache và reload trang
3. Kiểm tra dung lượng thiết bị

### Dữ liệu bị mất:
1. Kiểm tra trong "Dự án đã lưu"
2. Kiểm tra localStorage backup
3. Khôi phục từ file export nếu có

### Hiệu suất chậm:
1. Giảm chất lượng audio
2. Xóa dự án không cần thiết
3. Restart ứng dụng

### Lỗi file audio:
1. Kiểm tra định dạng file (MP3, MP4, WAV, M4A)
2. Giảm kích thước file nếu quá lớn
3. Thử file khác để test

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console log (F12)
2. Thử chế độ incognito
3. Xóa cache và thử lại
4. Kiểm tra version browser

---

**Lưu ý**: Ứng dụng được thiết kế để hoạt động 100% offline sau khi tải lần đầu. Tất cả tính năng cốt lõi đều available không cần internet!
