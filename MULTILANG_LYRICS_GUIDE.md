# Hướng dẫn sử dụng tính năng Lyrics đa dòng

## Tổng quan
Tính năng này cho phép mỗi dòng lời bài hát có thể chứa nhiều thông tin bổ sung như:
- **Phiên âm** (trong ngoặc đơn)
- **Dịch nghĩa** (trong ngoặc vuông)
- **Ghi chú** (bắt đầu với #, //, Note:, hoặc Ghi chú:)

## Các cách nhập lyrics

### 1. Cơ bản - Mỗi dòng một lời
```
Hello world
How are you today?
I'm fine thank you
```

### 2. Với phiên âm
```
Hello world
(He-lo world)

How are you today?
(Hao ar yu tu-day?)

I'm fine thank you
(Aim fain thank yu)
```

### 3. Với dịch nghĩa
```
Hello world
[Xin chào thế giới]

How are you today?
[Hôm nay bạn thế nào?]

I'm fine thank you
[Tôi khỏe, cảm ơn bạn]
```

### 4. Với ghi chú
```
Hello world
# Lời chào phổ biến

How are you today?
// Câu hỏi thăm hỏi

I'm fine thank you
Note: Câu trả lời lịch sự
```

### 5. Kết hợp đầy đủ
```
Hello beautiful world
(He-lo biu-ti-ful world)
[Xin chào thế giới xinh đẹp]
// Lời chào trữ tình

How are you today my friend?
(Hao ar yu tu-day mai frend?)
[Hôm nay bạn thế nào, bạn tôi?]
# Câu hỏi thân thiện

I'm absolutely fine, thank you so much
(Aim ab-so-lut-ly fain, thank yu so moch)
[Tôi hoàn toàn ổn, cảm ơn bạn rất nhiều]
Ghi chú: Câu trả lời nhiệt tình
```

### 6. Sử dụng dấu phân cách
```
Hello beautiful world
(He-lo biu-ti-ful world)
[Xin chào thế giới xinh đẹp]
// Lời chào trữ tình
---
How are you today my friend?
(Hao ar yu tu-day mai frend?)
[Hôm nay bạn thế nào, bạn tôi?]
# Câu hỏi thân thiện
===
I'm absolutely fine, thank you so much
(Aim ab-so-lut-ly fain, thank yu so moch)
[Tôi hoàn toàn ổn, cảm ơn bạn rất nhiều]
Note: Câu trả lời nhiệt tình
```

## Tự động phát hiện patterns

Hệ thống sẽ tự động phát hiện và phân loại:

### Pattern phiên âm
- `(nội dung)` - Phiên âm tiếng Anh/Việt
- `（nội dung）` - Phiên âm tiếng Nhật/Trung

### Pattern dịch nghĩa
- `[nội dung]` - Dịch nghĩa thông thường
- `【nội dung】` - Dịch nghĩa kiểu Trung/Nhật

### Pattern ghi chú
- `# nội dung` - Ghi chú kiểu markdown
- `// nội dung` - Ghi chú kiểu code
- `Note: nội dung` - Ghi chú tiếng Anh
- `Ghi chú: nội dung` - Ghi chú tiếng Việt

### Pattern phân cách
- `---` trên dòng riêng - Dấu phân cách thông thường
- `===` trên dòng riêng - Dấu phân cách mạnh

## Ví dụ thực tế

### Bài hát tiếng Anh với phiên âm Việt:
```
Yesterday, all my troubles seemed so far away
(Yes-tơ-day, ol mai tra-bồ sim so far ơ-way)
[Hôm qua, mọi rắc rối dường như rất xa]

Now it looks as though they're here to stay
(Nao it luks az dou dey hia tu stay)
[Giờ có vẻ như chúng ở lại đây]

Oh, I believe in yesterday
(Ou, ai bi-li-v in yes-tơ-day)
[Ôi, tôi tin vào ngày hôm qua]
```

### Bài hát tiếng Trung với bính âm và dịch:
```
春天来了
(Chūn tiān lái le)
[Mùa xuân đến rồi]
# Câu mở đầu

花开满园
(Huā kāi mǎn yuán)
[Hoa nở khắp vườn]
// Miêu tả cảnh xuân

鸟儿歌唱
(Niǎo ér gē chàng)
[Chim hót ca]
Note: Âm thanh của mùa xuân
```

## Lưu ý khi sử dụng

1. **Chọn chế độ gom nhóm phù hợp:**
   - **Line mode**: Cho lyrics đơn giản, mỗi dòng một ý
   - **Paragraph mode**: Cho lyrics có phiên âm/dịch, gom theo đoạn văn
   - **Separator mode**: Cho lyrics phức tạp, sử dụng dấu phân cách

2. **Hệ thống tự động gợi ý** chế độ phù hợp dựa trên nội dung

3. **Preview real-time** để kiểm tra kết quả trước khi bắt đầu đồng bộ

4. **Có thể chỉnh sửa** sau khi bắt đầu đồng bộ nếu cần

## Cấu trúc dữ liệu mới

Mỗi lyric line giờ có cấu trúc:
```typescript
interface LyricLine {
  id: string
  text: string              // Lời chính
  timestamp: number | null
  endTime: number | null
  isActive?: boolean
  phonetic?: string         // Phiên âm
  translation?: string      // Dịch nghĩa
  notes?: string           // Ghi chú
  additionalLines?: {      // Thông tin bổ sung
    type: 'phonetic' | 'translation' | 'note' | 'custom'
    text: string
    label?: string
  }[]
}
```

Tính năng này giúp hỗ trợ tốt hơn cho việc học ngôn ngữ, karaoke đa ngữ và chia sẻ lyrics phong phú hơn.
