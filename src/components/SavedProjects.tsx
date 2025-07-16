import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Button, Progress, Empty, Modal, Spin, Typography, Tag, Tooltip, message, Dropdown, Alert } from 'antd'
import { ArrowLeftOutlined, SoundOutlined, CalendarOutlined, DeleteOutlined, PlayCircleOutlined, EditOutlined, DownloadOutlined, UploadOutlined, MoreOutlined, ShareAltOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'
import type { SavedProject, ProjectData, LyricLine } from '../types'

const { Title, Text } = Typography

const SavedProjects: React.FC = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async (): Promise<void> => {
    try {
      const projectsList = (await localforage.getItem('projects_list')) as string[] || []
      const projectsData: SavedProject[] = []

      for (const projectId of projectsList) {
        const project = await localforage.getItem(`project_${projectId}`) as SavedProject | null
        if (project) {
          projectsData.push(project)
        }
      }

      // Sort by creation date (newest first)
      projectsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string): Promise<void> => {
    console.log('Opening delete modal for project:', projectId)
    setProjectToDelete(projectId)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async (): Promise<void> => {
    if (!projectToDelete) return
    
    setDeleting(true)
    try {
      // Remove from projects list
      const projectsList = (await localforage.getItem('projects_list')) as string[] || []
      const updatedList = projectsList.filter(id => id !== projectToDelete)
      await localforage.setItem('projects_list', updatedList)

      // Remove project data and audio file
      await localforage.removeItem(`project_${projectToDelete}`)
      await localforage.removeItem(`audio_${projectToDelete}`)

      // Update state
      setProjects(prev => prev.filter(p => p.id !== projectToDelete))
      
      // Close modal
      setDeleteModalVisible(false)
      setProjectToDelete(null)
      
      console.log('Project deleted successfully')
    } catch (error) {
      console.error('Error deleting project:', error)
      Modal.error({
        title: 'Lỗi',
        content: 'Có lỗi xảy ra khi xóa dự án',
        centered: true,
        zIndex: 10000,
      })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = (): void => {
    setDeleteModalVisible(false)
    setProjectToDelete(null)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSyncedLyricsCount = (lyrics: LyricLine[]): number => {
    return lyrics.filter(lyric => lyric.timestamp !== null).length
  }

  const exportAllProjects = async (): Promise<void> => {
    try {
      const exportData = {
        projects,
        exportDate: new Date().toISOString(),
        version: '1.0',
        appName: 'Lyrics Synchronizer',
        fileType: 'lyrx'
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/x-lyrx' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lyrics-projects-${new Date().toISOString().split('T')[0]}.lyrx`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success('Xuất dự án thành công!')
    } catch (error) {
      console.error('Export error:', error)
      message.error('Không thể xuất dự án')
    }
  }

  const importProjectsFromFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (!validateImportData(importData)) {
        message.error('File không đúng định dạng. Vui lòng chọn file .lyrx được xuất từ ứng dụng này.')
        return
      }

      // Show file info
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const isLyrxFile = fileExtension === 'lyrx'
      
      if (!isLyrxFile && fileExtension === 'json') {
        message.warning('Đang nhập file JSON. Khuyến nghị sử dụng file .lyrx để đảm bảo tương thích.')
      }

      // Check for duplicates first
      const duplicateProjects: SavedProject[] = []
      const newProjects: SavedProject[] = []

      for (const project of importData.projects) {
        const existingProject = projects.find(p => p.id === project.id)
        if (existingProject) {
          duplicateProjects.push(project)
        } else {
          newProjects.push(project)
        }
      }

      if (duplicateProjects.length > 0) {
        // Show confirmation modal for duplicates
        Modal.confirm({
          title: 'Phát hiện dự án trùng lặp',
          content: (
            <div>
              <p>Có {duplicateProjects.length} dự án đã tồn tại:</p>
              <ul className="mt-2 mb-4">
                {duplicateProjects.map(p => (
                  <li key={p.id} className="text-sm">• {p.title} - {p.artist}</li>
                ))}
              </ul>
              <p>Bạn có muốn ghi đè các dự án này không?</p>
              {newProjects.length > 0 && (
                <p className="mt-2 text-green-600">
                  {newProjects.length} dự án mới sẽ được nhập.
                </p>
              )}
              {importData.exportDate && (
                <p className="mt-2 text-gray-500 text-xs">
                  File được xuất: {new Date(importData.exportDate).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          ),
          okText: 'Ghi đè',
          cancelText: 'Bỏ qua dự án trùng lặp',
          onOk: async () => {
            await importProjectsToStorage([...newProjects, ...duplicateProjects])
          },
          onCancel: async () => {
            if (newProjects.length > 0) {
              await importProjectsToStorage(newProjects)
            } else {
              message.info('Không có dự án nào được nhập')
            }
          }
        })
      } else {
        // No duplicates, import directly
        await importProjectsToStorage(newProjects)
      }
    } catch (error) {
      console.error('Import error:', error)
      message.error('Không thể nhập dự án. Vui lòng kiểm tra định dạng file .lyrx.')
    }
  }

  const importProjectsToStorage = async (projectsToImport: SavedProject[]): Promise<void> => {
    try {
      let importedCount = 0

      for (const project of projectsToImport) {
        // Save project to LocalForage
        await localforage.setItem(`project_${project.id}`, project)
        
        // Update projects list
        const projectsList = (await localforage.getItem('projects_list')) as string[] || []
        if (!projectsList.includes(project.id)) {
          projectsList.push(project.id)
          await localforage.setItem('projects_list', projectsList)
        }
        
        importedCount++
      }

      // Reload projects
      await loadProjects()
      
      if (importedCount > 0) {
        message.success({
          content: `Nhập thành công ${importedCount} dự án từ file .lyrx`,
          duration: 4
        })
      }
    } catch (error) {
      console.error('Import to storage error:', error)
      message.error('Lỗi khi lưu dự án vào bộ nhớ')
    }
  }

  const triggerImportProject = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.lyrx,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        importProjectsFromFile(file)
      }
    }
    input.click()
  }

  const exportSingleProject = async (project: SavedProject): Promise<void> => {
    try {
      const exportData = {
        projects: [project],
        exportDate: new Date().toISOString(),
        version: '1.0',
        appName: 'Lyrics Synchronizer',
        fileType: 'lyrx'
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/x-lyrx' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      
      // Create safe filename from project title
      const safeTitle = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      link.download = `lyrics-project-${safeTitle}-${new Date().toISOString().split('T')[0]}.lyrx`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success(`Chia sẻ dự án "${project.title}" thành công!`)
    } catch (error) {
      console.error('Export single project error:', error)
      message.error('Không thể chia sẻ dự án')
    }
  }

  const validateImportData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false
    if (!data.projects || !Array.isArray(data.projects)) return false
    
    // Check if it's our format
    if (data.fileType && data.fileType !== 'lyrx') {
      return false
    }
    
    // Validate each project structure
    for (const project of data.projects) {
      if (!project.id || !project.title || !project.lyrics || !Array.isArray(project.lyrics)) {
        return false
      }
      
      // Validate lyrics structure
      for (const lyric of project.lyrics) {
        if (typeof lyric.text !== 'string') {
          return false
        }
      }
    }
    
    return true
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
        ease: "easeOut" as const
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
        <Title level={1} className="!text-white !mb-0">
            Dự án đã lưu
        </Title>
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
          <div className="flex items-center gap-2">
            <Tooltip title="Xuất tất cả dự án">
              <Button 
                type="text" 
                icon={<DownloadOutlined />} 
                className="text-white hover:bg-white/10 border-none"
                onClick={exportAllProjects}
              >
                Xuất
              </Button>
            </Tooltip>
            <Tooltip title="Nhập dự án">
              <Button 
                type="text" 
                icon={<UploadOutlined />} 
                className="text-white hover:bg-white/10 border-none"
                onClick={triggerImportProject}
              >
                Nhập
              </Button>
            </Tooltip>
          </div>
        </div>
      </motion.header>

      {/* Info Alert */}
      {projects.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Alert
              message="Chia sẻ và sao lưu dự án"
              description="Bạn có thể xuất dự án dưới dạng file .lyrx để sao lưu hoặc chia sẻ với người khác. Sử dụng nút 'Xuất' để tải tất cả dự án hoặc 'Chia sẻ dự án' cho từng dự án riêng lẻ. File .lyrx có thể được nhập trở lại ứng dụng."
              type="info"
              showIcon
              className="bg-blue-500/10 border-blue-400/30 text-white backdrop-blur-lg"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: 'white'
              }}
              closable
            />
          </motion.div>
        </div>
      )}

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
                      <Tooltip title="Xem trước" key="preview">
                        <Button
                          type="text"
                          icon={<PlayCircleOutlined />}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                          onClick={() => navigate(`/preview/${project.id}`)}
                        >
                          Xem trước
                        </Button>
                      </Tooltip>,
                      <Tooltip title="Chỉnh sửa" key="edit">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                          onClick={async () => {
                            try {
                              // Generate unique session ID for temporary audio storage
                              const sessionId = uuidv4()
                              
                              // Save audio data to LocalForage if it exists
                              if (project.audioDataUrl) {
                                await localforage.setItem(`temp_audio_${sessionId}`, project.audioDataUrl)
                              }
                              
                              const projectForSync: ProjectData = {
                                songTitle: project.title,
                                artist: project.artist,
                                lyrics: project.lyrics, // Giữ nguyên object lyrics với timestamp
                                audioDataUrl: '', // Empty to save space in sessionStorage
                                audioFileName: project.audioFileName,
                                audioFileType: project.audioFileType,
                                isEditing: true, // Flag để biết đây là chỉnh sửa
                                projectId: project.id, // ID để save lại
                                tempAudioId: project.audioDataUrl ? sessionId : undefined // Reference to audio in LocalForage
                              }
                              
                              sessionStorage.setItem('currentProject', JSON.stringify(projectForSync))
                              navigate('/sync')
                            } catch (error) {
                              console.error('Error preparing project for edit:', error)
                              message.error('Có lỗi xảy ra khi chuẩn bị chỉnh sửa dự án')
                            }
                          }}
                        >
                          Chỉnh sửa
                        </Button>
                      </Tooltip>,
                      <Dropdown
                        key="more"
                        menu={{
                          items: [
                            {
                              key: 'export',
                              icon: <ShareAltOutlined />,
                              label: 'Chia sẻ dự án',
                              onClick: () => exportSingleProject(project)
                            },
                            {
                              type: 'divider'
                            },
                            {
                              key: 'delete',
                              icon: <DeleteOutlined />,
                              label: 'Xóa dự án',
                              danger: true,
                              onClick: () => deleteProject(project.id)
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10"
                        />
                      </Dropdown>
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

      {/* Custom Delete Modal */}
      <Modal
        title="Xác nhận xóa dự án"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
        confirmLoading={deleting}
        centered
        zIndex={10000}
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          },
          content: {
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          },
          header: {
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          },
          body: {
            color: '#d1d5db'
          }
        }}
      >
        <div className="text-gray-300">
          Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.
        </div>
      </Modal>
    </div>
  )
}

export default SavedProjects
