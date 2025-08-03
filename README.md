# 🤖 My First RAG Application

A Retrieval-Augmented Generation (RAG) application built from scratch using JavaScript and free Hugging Face models. Upload documents and ask intelligent questions about their content!

## ✨ Features

- 📄 **Document Processing**: Upload PDF, TXT, and HTML files
- 🧠 **Smart Embeddings**: Convert text to vectors using free Hugging Face models
- 🔍 **Semantic Search**: Find relevant content using cosine similarity
- 💬 **AI Responses**: Generate contextual answers using free LLMs
- 🌐 **Web Interface**: Modern, responsive web UI with drag & drop
- 🆓 **100% Free**: No OpenAI or paid API costs!

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Hugging Face Account** (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MuhammadHammadIrfan/First-RAG-App.git
   cd First-RAG-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your Hugging Face API key
   nano .env
   ```

4. **Get your Hugging Face API Key**
   - Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - Create a new token with **"Inference API"** permissions
   - Copy the token to your `.env` file

5. **Start the application**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎯 How to Use

### 1. Upload Documents
- Drag & drop files or click "Choose File"
- Supported formats: **PDF**, **TXT**, **HTML**
- Max file size: **10MB**

### 2. Ask Questions
- Wait for document processing to complete
- Type your question in the text area
- Click "Ask Question" or press **Ctrl+Enter**

### 3. Get AI Answers
- View the generated answer with source context
- See which document sections were used
- Ask follow-up questions about the same documents

## 📁 Project Structure

```
first-rag-app/
├── src/
│   ├── app.js           # Express server & API routes
│   ├── embedding.js     # Hugging Face embeddings
│   ├── vectorStore.js   # Simple vector database
│   ├── documents.js     # Document processing
│   ├── generation.js    # AI text generation
│   └── retrieval.js     # RAG orchestration
├── public/
│   └── index.html       # Frontend interface
├── uploads/             # Uploaded documents
├── .env.example         # Environment template
└── package.json         # Dependencies
```

## 🔧 Configuration

### Environment Variables

```bash
# Required: Hugging Face API key with Inference permissions
huggingface_api_key=hf_your_token_here

# Optional: Server port (default: 3000)
PORT=3000
```

### Models Used

- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
- **Text Generation**: `google/flan-t5-large` (instruction-following)
- **Fallback Model**: `microsoft/DialoGPT-medium`

### Customization

You can modify these settings in the code:

```javascript
// Document chunk size (characters)
this.chunkSize = 500;

// Overlap between chunks
this.chunkOverlap = 50;

// Number of relevant documents to retrieve
topK = 3;

// Answer length limit
maxLength = 300;
```

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload and process documents |
| `POST` | `/api/ask` | Ask questions about documents |
| `GET` | `/api/stats` | Get system statistics |
| `DELETE` | `/api/clear` | Clear all documents |
| `POST` | `/api/config` | Update system settings |

### Example API Usage

```javascript
// Upload a document
const formData = new FormData();
formData.append('document', file);
fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// Ask a question
fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "What are the main points?",
    topK: 3
  })
});
```

## 🎨 Frontend Features

- **📱 Responsive Design**: Works on desktop and mobile
- **🎯 Drag & Drop**: Easy file uploading
- **⚡ Real-time Feedback**: Loading states and progress
- **📊 Statistics**: Document count and status
- **🎨 Modern UI**: Clean, professional interface
- **⌨️ Keyboard Shortcuts**: Ctrl+Enter to ask questions

## 🧠 How RAG Works

1. **Document Processing**
   - Extract text from uploaded files
   - Split into smaller chunks (500 characters)
   - Handle overlap to preserve context

2. **Embedding Generation**
   - Convert text chunks to 384-dimensional vectors
   - Use semantic similarity for search
   - Store in simple in-memory vector database

3. **Question Processing**
   - Convert user question to embedding
   - Find most similar document chunks
   - Rank by cosine similarity

4. **Answer Generation**
   - Combine relevant chunks as context
   - Create structured prompt for LLM
   - Generate contextual answer
   - Clean and format response

## 🔍 Example Questions

**📚 General Content**
- "What is this document about?"
- "Summarize the main points"
- "What are the key findings?"

**📊 Specific Information**
- "What dates are mentioned?"
- "Who are the people involved?"
- "What numbers or statistics are provided?"

**🏥 Medical Documents**
- "What are the patient's test results?"
- "What treatments are recommended?"
- "What are the lab values?"

**📋 Business Documents**
- "What are the financial figures?"
- "Who are the stakeholders?"
- "What are the deadlines?"

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" for Hugging Face API**
- Ensure your API key has "Inference API" permissions
- Check the key is correctly set in `.env`

**"No documents found"**
- Make sure documents uploaded successfully
- Check console for processing errors

**Slow responses**
- Large documents take time to process
- Hugging Face free tier has rate limits

**Upload failures**
- Check file size (max 10MB)
- Ensure file format is supported (PDF, TXT, HTML)

### Debug Mode

Enable verbose logging by adding to your `.env`:
```bash
DEBUG=true
NODE_ENV=development
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Learning Resources

- **RAG Concepts**: [RAG Paper](https://arxiv.org/abs/2005.11401)
- **Hugging Face**: [Transformers Documentation](https://huggingface.co/docs/transformers)
- **Vector Similarity**: [Cosine Similarity Explained](https://en.wikipedia.org/wiki/Cosine_similarity)
- **LangChain**: [LangChain Documentation](https://langchain.readthedocs.io/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hugging Face** for free model APIs
- **Sentence Transformers** for embedding models
- **Google** for FLAN-T5 language model
- **RAG Research Community** for the foundational concepts

## 📧 Contact

**Muhammad Hammad Irfan**
- GitHub: [@MuhammadHammadIrfan](https://github.com/MuhammadHammadIrfan)
- Email: your.email@example.com

---

⭐ **Star this repository if it helped you learn RAG!** ⭐

**Built with ❤️ using JavaScript and free AI models**