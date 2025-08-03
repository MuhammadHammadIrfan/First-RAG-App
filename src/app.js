const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const RAGSystem = require('./retrieval');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize RAG system
const ragSystem = new RAGSystem();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = ['.pdf', '.txt', '.html', '.htm'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and HTML files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Upload and process document
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    console.log(`\n=== File Upload Request ===`);
    console.log(`File: ${req.file.originalname}`);
    console.log(`Size: ${req.file.size} bytes`);
    console.log(`Type: ${req.file.mimetype}`);

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).substring(1);

    // Process the document
    const result = await ragSystem.addDocument(filePath, fileType);

    if (result.success) {
      res.json({
        success: true,
        message: `Document processed successfully! Added ${result.chunksAdded} chunks.`,
        data: {
          filename: req.file.originalname,
          chunksAdded: result.chunksAdded,
          totalDocuments: result.totalDocuments,
        },
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Ask a question
app.post('/api/ask', async (req, res) => {
  try {
    const { question, topK = 3 } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    console.log(`\n=== Question API Request ===`);
    console.log(`Question: ${question}`);
    console.log(`Top K: ${topK}`);

    const result = await ragSystem.askQuestion(question, topK);

    res.json(result);
  } catch (error) {
    console.error('Question error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get system statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = ragSystem.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clear all documents
app.delete('/api/clear', (req, res) => {
  try {
    const result = ragSystem.clearSystem();
    res.json(result);
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Configure system settings
app.post('/api/config', (req, res) => {
  try {
    const { chunkSize, topK } = req.body;

    const results = {};

    if (chunkSize) {
      results.chunkSize = ragSystem.setChunkSize(chunkSize);
    }

    if (topK) {
      results.topK = ragSystem.setTopK(topK);
    }

    res.json({
      success: true,
      message: 'Configuration updated',
      data: results,
    });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 RAG Application Server Started!`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`❓ Question endpoint: http://localhost:${PORT}/api/ask`);
  console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
  console.log(`\n=== Ready to process documents and answer questions! ===\n`);
});

module.exports = app;
