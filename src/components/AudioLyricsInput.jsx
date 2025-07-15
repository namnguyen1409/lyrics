import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Upload, Button, Typography, Space, message, Divider } from 'antd'
import { ArrowLeftOutlined, UploadOutlined, SoundOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function AudioLyricsInput() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [audioFile, setAudioFile] = useState(null)
  const [audioDataUrl, setAudioDataUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleAudioUpload = (file) => {
    setUploading(true)
    
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'video/mp4', 'video/webm']
    
    if (!validTypes.includes(file.type)) {
      message.error('Vui lòng chọn file âm thanh hoặc video hợp lệ')
      setUploading(false)
      return false
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setAudioDataUrl(e.target.result)
      setAudioFile(file)
      setUploading(false)
      message.success('Tải file thành công!')
    }
    reader.onerror = () => {
      message.error('Có lỗi xảy ra khi đọc file')
      setUploading(false)
    }
    reader.readAsDataURL(file)
    
    return false // Prevent auto upload
  }

  const handleSubmit = (values) => {
    if (!audioFile) {
      message.error('Vui lòng chọn file âm thanh')
      return
    }

    if (!values.lyrics?.trim()) {
      message.error('Vui lòng nhập lời bài hát')
      return
    }

    const lyrics = values.lyrics.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lyrics.length === 0) {
      message.error('Vui lòng nhập ít nhất một dòng lời bài hát')
      return
    }

    const projectData = {
      songTitle: values.songTitle || 'Untitled',
      artist: values.artist || 'Unknown Artist',
      lyrics,
      audioDataUrl,
      audioFileName: audioFile.name,
      audioFileType: audioFile.type
    }

    sessionStorage.setItem('currentProject', JSON.stringify(projectData))
    navigate('/sync')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-6 py-4"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              className="text-white hover:bg-white/10 border-none"
            >
              Quay lại
            </Button>
          </Link>
          <Title level={2} className="!text-white !mb-0">
            Tạo dự án mới
          </Title>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-6"
          >
            {/* Project Info Card */}
            <motion.div variants={cardVariants}>
              <Card 
                title={
                  <div className="flex items-center space-x-2 text-white">
                    <SoundOutlined />
                    <span>Thông tin bài hát</span>
                  </div>
                }
                className="bg-white/10 backdrop-blur-lg border-white/20"
                styles={{
                  header: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label={<span className="text-white">Tên bài hát</span>}
                    name="songTitle"
                    rules={[{ required: true, message: 'Vui lòng nhập tên bài hát' }]}
                  >
                    <Input 
                      placeholder="Nhập tên bài hát"
                      className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-white">Nghệ sĩ</span>}
                    name="artist"
                    rules={[{ required: true, message: 'Vui lòng nhập tên nghệ sĩ' }]}
                  >
                    <Input 
                      placeholder="Nhập tên nghệ sĩ"
                      className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                    />
                  </Form.Item>
                </div>
              </Card>
            </motion.div>

            {/* Audio Upload Card */}
            <motion.div variants={cardVariants}>
              <Card 
                title={
                  <div className="flex items-center space-x-2 text-white">
                    <UploadOutlined />
                    <span>Tải file âm thanh</span>
                  </div>
                }
                className="bg-white/10 backdrop-blur-lg border-white/20"
                styles={{
                  header: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Upload.Dragger
                  beforeUpload={handleAudioUpload}
                  showUploadList={false}
                  accept="audio/*,video/*"
                  className="bg-white/5 border-white/30 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="py-8">
                    {uploading ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <Text className="text-white">Đang tải file...</Text>
                      </div>
                    ) : audioFile ? (
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-400 text-4xl mb-4"
                        >
                          ✓
                        </motion.div>
                        <Title level={4} className="!text-white !mb-2">
                          {audioFile.name}
                        </Title>
                        <Text className="text-gray-300">
                          File đã sẵn sàng để đồng bộ
                        </Text>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadOutlined className="text-4xl text-purple-400 mb-4" />
                        <Title level={4} className="!text-white !mb-2">
                          Kéo thả file hoặc click để chọn
                        </Title>
                        <Text className="text-gray-300">
                          Hỗ trợ file MP3, WAV, MP4, WebM và các định dạng âm thanh khác
                        </Text>
                      </div>
                    )}
                  </div>
                </Upload.Dragger>

                {audioFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-green-400 font-medium">
                          📁 {audioFile.name}
                        </Text>
                        <br />
                        <Text className="text-gray-400 text-sm">
                          Kích thước: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      </div>
                      <Button
                        type="text"
                        className="text-red-400 hover:bg-red-400/10"
                        onClick={() => {
                          setAudioFile(null)
                          setAudioDataUrl('')
                        }}
                      >
                        Xóa file
                      </Button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>

            {/* Lyrics Input Card */}
            <motion.div variants={cardVariants}>
              <Card 
                title={
                  <div className="flex items-center space-x-2 text-white">
                    <FileTextOutlined />
                    <span>Lời bài hát</span>
                  </div>
                }
                className="bg-white/10 backdrop-blur-lg border-white/20"
                styles={{
                  header: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Form.Item
                  name="lyrics"
                  rules={[{ required: true, message: 'Vui lòng nhập lời bài hát' }]}
                >
                  <TextArea
                    placeholder="Nhập lời bài hát, mỗi dòng một câu hát..."
                    rows={12}
                    className="bg-white/10 border-white/30 text-white placeholder-gray-400 resize-none"
                  />
                </Form.Item>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Title level={5} className="!text-blue-400 !mb-2">
                    💡 Gợi ý:
                  </Title>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Mỗi dòng lời bài hát nên được viết trên một dòng riêng</li>
                    <li>• Các dòng trống sẽ được tự động loại bỏ</li>
                    <li>• Bạn có thể chỉnh sửa lời bài hát sau khi bắt đầu đồng bộ</li>
                  </ul>
                </div>
              </Card>
            </motion.div>

            {/* Submit Button */}
            <motion.div 
              variants={cardVariants}
              className="flex justify-center"
            >
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                className="bg-gradient-to-r from-purple-500 to-pink-500 border-none px-8 py-2 h-auto text-lg"
                htmlType="submit"
              >
                Bắt đầu đồng bộ
              </Button>
            </motion.div>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}

export default AudioLyricsInput
