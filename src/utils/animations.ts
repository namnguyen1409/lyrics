// Optimized animation variants for better performance
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2, // Further reduced
      staggerChildren: 0.02 // Much smaller stagger
    }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 5 }, // Reduced movement
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 } // Faster transitions
  }
}
