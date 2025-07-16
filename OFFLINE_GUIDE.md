# Hướng dẫn Sử dụng Offline - Lyrics Synchronization App

## Tổng quan
Ứng dụng Lyrics Synchronization đã được thiết kế để hoạt động **hoàn toàn offline** mà không cần kết nối internet. Tất cả các tính năng chính đều có thể sử dụng ngay cả khi bạn không có mạng.

## ✅ Tính năng hoạt động offline

### 1. **Upload và phát Audio/Video**
- Tải lên file audio (.mp3, .wav, .flac, .m4a)
- Tải lên file video (.mp4, .mov, .avi) - sẽ tự động trích xuất audio
- Phát/tạm dừng, tua nhanh/chậm
- Điều chỉnh tốc độ phát (0.5x - 2x)
- Thanh progress bar và volume control

### 2. **Nhập và chỉnh sửa Lyrics**
- Nhập lyrics thủ công
- Paste từ clipboard
- Chỉnh sửa từng dòng lyrics
- Xem trước với định dạng khác nhau

### 3. **Đồng bộ Timestamps**
- Đặt timestamp cho từng dòng lyrics
- Điều khiển bằng phím tắt
- Tự động chuyển dòng
- Đặt thời gian bắt đầu và kết thúc

### 4. **Xem trước Karaoke**
- Preview với hiệu ứng karaoke mượt mà
- Hiển thị lyrics theo thời gian thực
- Animation chuyển đổi giữa các dòng
- Preview trên mobile và desktop

### 5. **Lưu và quản lý Dự án**
- Lưu dự án vào bộ nhớ cục bộ (IndexedDB)
- Quản lý danh sách dự án đã lưu
- Xóa dự án không cần
- Xuất file synchronized lyrics

### 6. **Xuất file Synchronized**
- Xuất file .lrc (LRC format)
- Xuất file .srt (SubRip format)  
- Xuất JSON với metadata đầy đủ

## 🔧 Cách kích hoạt chế độ Offline

### Bước 1: Cài đặt Service Worker (Tự động)
- Service Worker sẽ tự động được cài đặt khi bạn truy cập ứng dụng
- Kiểm tra thông báo "Service Worker registered" trong Console

### Bước 2: Cache assets (Tự động)
- Ứng dụng sẽ tự động cache tất cả assets cần thiết
- Bao gồm HTML, CSS, JS, và các file static

### Bước 3: Cài đặt PWA (Tùy chọn)
- Nhấn nút "Cài đặt ứng dụng" trên trang chủ
- Hoặc sử dụng tùy chọn "Add to Home Screen" trên browser
- Ứng dụng sẽ hoạt động như app native

## 📱 Sử dụng trên Mobile

### Android:
1. Mở ứng dụng trong Chrome
2. Nhấn menu (3 chấm) → "Add to Home screen"
3. Đặt tên và nhấn "Add"
4. App sẽ xuất hiện trên màn hình chính

### iOS:
1. Mở ứng dụng trong Safari
2. Nhấn nút Share → "Add to Home Screen"
3. Đặt tên và nhấn "Add"
4. App sẽ xuất hiện trên màn hình chính

## 💾 Lưu trữ dữ liệu

### Bộ nhớ cục bộ:
- **IndexedDB**: Lưu dự án, audio files, lyrics
- **LocalStorage**: Lưu cài đặt và preferences
- **Cache Storage**: Lưu app assets và resources

### Dung lượng:
- Desktop: Có thể lưu hàng GB dữ liệu
- Mobile: Tùy thuộc vào thiết bị (thường 50MB+)
- Yêu cầu "Persistent Storage" để tránh bị xóa tự động

## ⌨️ Phím tắt Offline

Khi đồng bộ lyrics:
- **Space**: Phát/Tạm dừng
- **←/→**: Tua lùi/tiến 5 giây
- **↑/↓**: Chuyển dòng lyrics
- **S**: Đặt timestamp cho dòng hiện tại

## 🔍 Kiểm tra trạng thái Offline

### Trong ứng dụng:
- Kiểm tra icon Wi-Fi trên trang chủ
- Màu xanh = Online, Màu cam = Offline
- Xem thông tin chi tiết trong phần "Offline Status"

### Trong Developer Tools:
- F12 → Network tab → Throttling → "Offline"
- Thử tải lại trang để test

## 🛠️ Xử lý sự cố

### Nếu ứng dụng không hoạt động offline:

1. **Kiểm tra Service Worker**:
   ```javascript
   // Trong Console
   navigator.serviceWorker.getRegistrations()
   ```

2. **Clear cache và đăng ký lại**:
   ```javascript
   // Clear cache
   caches.keys().then(names => names.forEach(name => caches.delete(name)))
   // Reload page
   location.reload()
   ```

3. **Kiểm tra browser support**:
   - Service Worker: Chrome 40+, Firefox 44+, Safari 11.1+
   - IndexedDB: Chrome 23+, Firefox 16+, Safari 7+
   - Cache API: Chrome 40+, Firefox 39+, Safari 11.1+

### Nếu dữ liệu bị mất:

1. **Kiểm tra Persistent Storage**:
   ```javascript
   navigator.storage.persist()
   ```

2. **Backup định kỳ**:
   - Xuất dự án thành file JSON
   - Lưu vào cloud storage hoặc email

## 🔄 Đồng bộ khi trở lại Online

Khi có kết nối internet trở lại:
- Ứng dụng sẽ hiển thị thông báo "Đã kết nối internet"
- Tự động kiểm tra cập nhật
- Đồng bộ dữ liệu pending (nếu có)

## 📋 Checklist hoạt động Offline

- [ ] Service Worker đã được cài đặt
- [ ] Cache đã được populated  
- [ ] IndexedDB hoạt động bình thường
- [ ] Audio/Video playback hoạt động
- [ ] Lưu/tải dự án thành công
- [ ] Export file hoạt động
- [ ] PWA đã được cài đặt (tùy chọn)

## 🎯 Tips để tối ưu trải nghiệm Offline

1. **Cài đặt PWA** cho trải nghiệm app native
2. **Yêu cầu Persistent Storage** để tránh mất dữ liệu  
3. **Backup dự án quan trọng** bằng cách export
4. **Test offline mode** trước khi sử dụng thực tế
5. **Sử dụng audio files nhẹ** để tiết kiệm bộ nhớ
6. **Làm quen với phím tắt** để làm việc hiệu quả hơn

---

**Lưu ý**: Ứng dụng được thiết kế để hoạt động 100% offline. Mọi tính năng cơ bản đều khả dụng mà không cần internet!
