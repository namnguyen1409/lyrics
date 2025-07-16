import React from 'react'
import { motion } from 'framer-motion'
import { Card, Button, Typography, Row, Col } from 'antd'
import { PlayCircleOutlined, FileTextOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import OfflineStatus from './OfflineStatus'

const { Title, Paragraph } = Typography

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  action: () => void
  buttonText: string
  buttonType: 'primary' | 'default'
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100
      }
    }
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  }

  const features: Feature[] = [
    {
      icon: <PlusOutlined className="text-4xl text-blue-500" />,
      title: "Tạo dự án mới",
      description: "Upload nhạc và nhập lời bài hát để bắt đầu đồng bộ",
      action: () => navigate('/input'),
      buttonText: "Bắt đầu",
      buttonType: "primary"
    },
    {
      icon: <HistoryOutlined className="text-4xl text-green-500" />,
      title: "Dự án đã lưu",
      description: "Xem và chỉnh sửa các dự án lyrics đã tạo trước đó",
      action: () => navigate('/saved'),
      buttonText: "Xem dự án",
      buttonType: "default"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        className="container mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div
            className="flex justify-center items-center mb-6"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <PlayCircleOutlined className="text-6xl text-purple-400 mr-4" />
            <FileTextOutlined className="text-6xl text-blue-400" />
          </motion.div>
          
          <Title 
            level={1} 
            className="!text-white !text-5xl !font-bold !mb-4"
          >
            Lyrics Synchronizer
          </Title>
          
          <Paragraph className="!text-gray-300 !text-xl !max-w-2xl !mx-auto">
            Đồng bộ hóa lời bài hát với âm thanh, tạo hiệu ứng karaoke chuyên nghiệp
            với giao diện hiện đại và trải nghiệm mượt mà.
          </Paragraph>
        </motion.div>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto">
          <Row gutter={[32, 32]} justify="center">
            {features.map((feature, index) => (
              <Col key={index} xs={24} sm={12} lg={12}>
                <motion.div
                  variants={itemVariants}
                  whileHover="hover"
                  className="h-full"
                >
                  <motion.div variants={cardHoverVariants} className="h-full">
                    <Card
                      className="h-full bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300"
                      styles={{
                        body: {
                          padding: '2.5rem',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          margin: '10px 0'
                        }
                      }}
                    >
                      <div className="text-center flex-1">
                        <motion.div
                          className="mb-8"
                          whileHover={{ 
                            rotate: [0, -10, 10, 0],
                            transition: { duration: 0.5 }
                          }}
                        >
                          {feature.icon}
                        </motion.div>
                        
                        <Title level={3} className="!text-white !mb-4">
                          {feature.title}
                        </Title>
                        
                        <Paragraph className="!text-gray-300 !mb-8 !text-base">
                          {feature.description}
                        </Paragraph>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-auto"
                      >
                        <Button
                          type={feature.buttonType}
                          size="large"
                          block
                          onClick={feature.action}
                          className="!h-12 !text-lg !font-semibold"
                        >
                          {feature.buttonText}
                        </Button>
                      </motion.div>
                    </Card>
                  </motion.div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Offline Status */}
        <motion.div
          className="mt-24 max-w-6xl mx-auto"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <OfflineStatus />
        </motion.div>

        {/* Features Showcase */}
        <motion.div 
          className="mt-24 max-w-6xl mx-auto"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 !border-opacity-10">
            <Title level={2} className="!text-white !text-center !mb-12">
              Tính năng nổi bật
            </Title>
            
            <Row gutter={[48, 32]}>
              <Col xs={24} md={8}>
                <div className="text-center p-6">
                  <motion.div
                    className="text-4xl text-yellow-400 mb-6"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      transition: { 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                  >
                    🎵
                  </motion.div>
                  <Title level={4} className="!text-white !mb-4">
                    Đồng bộ chính xác
                  </Title>
                  <Paragraph className="!text-gray-300 !text-base">
                    Timestamp từng dòng lyrics với độ chính xác cao
                  </Paragraph>
                </div>
              </Col>
              
              <Col xs={24} md={8}>
                <div className="text-center p-6">
                  <motion.div
                    className="text-4xl text-pink-400 mb-6"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      transition: { 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                  >
                    ✨
                  </motion.div>
                  <Title level={4} className="!text-white !mb-4">
                    Hiệu ứng karaoke
                  </Title>
                  <Paragraph className="!text-gray-300 !text-base">
                    Hiệu ứng từng từ mượt mà như các ứng dụng chuyên nghiệp
                  </Paragraph>
                </div>
              </Col>
              
              <Col xs={24} md={8}>
                <div className="text-center p-6">
                  <motion.div
                    className="text-4xl text-green-400 mb-6"
                    animate={{ 
                      y: [0, -10, 0],
                      transition: { 
                        duration: 1.8,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                  >
                    📱
                  </motion.div>
                  <Title level={4} className="!text-white !mb-4">
                    Responsive Design
                  </Title>
                  <Paragraph className="!text-gray-300 !text-base">
                    Tối ưu cho mọi thiết bị từ desktop đến mobile
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default HomePage
