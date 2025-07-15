import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Button, Progress, Empty, Modal, Spin, Typography, Space, Tag, Tooltip } from 'antd'
import { ArrowLeftOutlined, SoundOutlined, CalendarOutlined, DeleteOutlined, PlayCircleOutlined, EditOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import localforage from 'localforage'

const { Title, Text } = Typography

function SavedProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const projectsList = await localforage.getItem('projects_list') || []
      const projectsData = []

      for (const projectId of projectsList) {
        const project = await localforage.getItem(`project_${projectId}`)
        if (project) {
          projectsData.push(project)
        }
      }

      // Sort by creation date (newest first)
      projectsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId) => {
    Modal.confirm({
      title: 'Xác nhận xóa dự án',
      content: 'Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          // Remove from projects list
          const projectsList = await localforage.getItem('projects_list') || []
          const updatedList = projectsList.filter(id => id !== projectId)
          await localforage.setItem('projects_list', updatedList)

          // Remove project data and audio file
          await localforage.removeItem(`project_${projectId}`)
          await localforage.removeItem(`audio_${projectId}`)

          // Update state
          setProjects(prev => prev.filter(p => p.id !== projectId))
        } catch (error) {
          console.error('Error deleting project:', error)
          Modal.error({
            title: 'Lỗi',
            content: 'Có lỗi xảy ra khi xóa dự án',
          })
        }
      }
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSyncedLyricsCount = (lyrics) => {
    return lyrics.filter(lyric => lyric.timestamp !== null).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Spin size="large" />
          <div className="mt-4 text-white text-lg">Đang tải dự án...</div>
        </motion.div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
            Dự án đã lưu
          </Title>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-center max-w-md">
              <Empty
                image={<SoundOutlined className="text-6xl text-purple-400" />}
                description={
                  <div className="text-white">
                    <Title level={3} className="!text-white">Chưa có dự án nào</Title>
                    <Text className="text-gray-300">
                      Tạo dự án đầu tiên của bạn để bắt đầu đồng bộ lyrics
                    </Text>
                  </div>
                }
              >
                <Link to="/input">
                  <Button type="primary" size="large" className="bg-gradient-to-r from-purple-500 to-pink-500 border-none">
                    Tạo dự án mới
                  </Button>
                </Link>
              </Empty>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {projects.map((project) => {
              const syncedCount = getSyncedLyricsCount(project.lyrics)
              const totalCount = project.lyrics.length
              const progressPercent = totalCount > 0 ? (syncedCount / totalCount) * 100 : 0

              return (
                <motion.div key={project.id} variants={cardVariants}>
                  <Card
                    className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
                    actions={[
                      <Tooltip title="Xem trước">
                        <Button
                          type="text"
                          icon={<PlayCircleOutlined />}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                          onClick={() => navigate(`/preview/${project.id}`)}
                        >
                          Xem trước
                        </Button>
                      </Tooltip>,
                      <Tooltip title="Chỉnh sửa">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                          onClick={() => {
                            const projectForSync = {
                              songTitle: project.title,
                              artist: project.artist,
                              lyrics: project.lyrics.map(l => l.text),
                              audioDataUrl: project.audioDataUrl,
                              audioFileName: project.audioFileName,
                              audioFileType: project.audioFileType
                            }
                            sessionStorage.setItem('currentProject', JSON.stringify(projectForSync))
                            navigate('/sync')
                          }}
                        >
                          Chỉnh sửa
                        </Button>
                      </Tooltip>,
                      <Tooltip title="Xóa dự án">
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={() => deleteProject(project.id)}
                        >
                          Xóa
                        </Button>
                      </Tooltip>
                    ]}
                  >
                    <div className="space-y-4">
                      {/* Project Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <SoundOutlined className="text-purple-400 text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Title level={4} className="!text-white !mb-1 truncate">
                              {project.title}
                            </Title>
                            <Text className="text-gray-300 text-sm">
                              {project.artist}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Progress Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Text className="text-gray-300 text-sm">
                            Tiến độ đồng bộ
                          </Text>
                          <Tag color={progressPercent === 100 ? 'green' : 'blue'}>
                            {syncedCount}/{totalCount} dòng
                          </Tag>
                        </div>
                        <Progress
                          percent={progressPercent}
                          showInfo={false}
                          strokeColor={{
                            '0%': '#8b5cf6',
                            '100%': '#ec4899',
                          }}
                          trailColor="rgba(255,255,255,0.1)"
                        />
                      </div>

                      {/* Project Meta */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center text-gray-400 text-xs">
                          <CalendarOutlined className="mr-1" />
                          {formatDate(project.createdAt)}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          📁 {project.audioFileName}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SavedProjects
