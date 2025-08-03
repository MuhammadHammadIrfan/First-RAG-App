const EmbeddingService = require('./embedding');
const SimpleVectorStore = require('./vectorStore');
const DocumentProcessor = require('./documents');
const TextGenerator = require('./generation');

class RAGSystem {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.vectorStore = new SimpleVectorStore();
    this.documentProcessor = new DocumentProcessor();
    this.textGenerator = new TextGenerator();
    console.log('RAG System initialized');
  }

  // Add document to the system
  async addDocument(filePath, fileType) {
    try {
      // Process the document based on its type
      console.log(
        `\n=== Adding document from ${filePath} of type ${fileType} ===`
      );
      const processedDoc = await this.documentProcessor.processDocument(
        filePath,
        fileType
      );
      console.log(
        `Document processed into ${processedDoc.chunks.length} chunks`
      );
      // Generate embeddings for the chunks
      console.log('Generating embeddings for chunks...');
      const embeddings = await this.embeddingService.generateEmbeddings(
        processedDoc.chunks
      );
      // Add each chunk with its embedding to the vector store
      processedDoc.chunks.forEach((chunk, index) => {
        this.vectorStore.addDocument(chunk, embeddings[index], {
          sourceFile: filePath,
          fileType: fileType,
          chunkIndex: index,
          totalChunks: processedDoc.chunks.length,
        });
      });

      console.log(
        `Successfully added ${processedDoc.chunks.length} chunks to the vector store`
      );
      console.log(
        `Total documents in store: ${this.vectorStore.getDocumentCount()}`
      );

      return {
        success: true,
        chunksAdded: processedDoc.chunks.length,
        totalDocuments: this.vectorStore.getDocumentCount(),
        metadata: processedDoc.metadata,
      };
    } catch (error) {
      console.error(`Error adding document: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Query the system with a question
  async askQuestion(question, topK = 3) {
    try {
      console.log(`\n===Processing Question: "${question}" ===`);
      if (this.vectorStore.getDocumentCount() === 0) {
        return {
          success: false,
          error: 'No documents in the system. Please add documents first',
          answer: null,
        };
      }
      // Generate embedding for the question
      console.log('Generating embedding for the question...');
      const questionEmbedding = await this.embeddingService.generateEmbedding(
        question
      );
      //search for similar documents
      console.log(`Searching for ${topK} most similar documents...`);
      const searchResults = this.vectorStore.search(questionEmbedding, topK);
      if (searchResults.length === 0) {
        return {
          success: false,
          error: 'No relevant documents found for the question',
          answer: null,
        };
      }

      // combining relevant documents into context
      const context = this.createContext(searchResults);
      console.log(`Created context with ${context.length}`);

      // Generate answer using the text generator
      console.log('Generating answer');
      const answer = await this.textGenerator.generateAnswer(question, context);

      console.log(`Generated answer: "${answer}"`);
      console.log('\n\n=== RAG Process Completed ===\n');
      return {
        success: true,
        answer: answer,
        context: context,
        relevantDocuments: searchResults.map((result) => ({
          text: result.document.substring(0, 100) + '...',
          similarity: result.similarity.toFixed(4),
          metadata: result.metadata,
        })),
      };
    } catch (error) {
      console.error(`Error processing question: ${error.message}`);
      return {
        success: false,
        error: error.message,
        answer: null,
      };
    }
  }

  //create context from search results
  createContext(searchResults) {
    return searchResults
      .map((result, index) => {
        return `=== Document Section ${index + 1} ===\n${result.document}\n`;
      })
      .join('\n');
  }

  // Get system statistics
  getStats() {
    return {
      totalDocuments: this.vectorStore.getDocumentCount(),
      allDocuments: this.vectorStore.getAllDocuments().map((doc) => {
        return {
          text: doc.text.substring(0, 100) + '...',
          metadata: doc.metadata,
        };
      }),
    };
  }

  // Clear the system
  clearSystem() {
    this.vectorStore.clear();
    console.log('RAG System cleared');
    return {
      success: true,
      message: 'System cleared successfully',
    };
  }

  //configue chunk size
  setChunkSize(size) {
    this.documentProcessor.chunkSize = size;
    console.log(`Chunk size set to ${size} characters`);
    return {
      success: true,
      message: `Chunk size updated to ${size} characters`,
    };
  }
  // configue top K for search
  setTopK(topK) {
    this.textGenerator.topK = topK;
    console.log(`Top K set to ${topK}`);
    return {
      success: true,
      message: `Top K updated to ${topK}`,
    };
  }
}
module.exports = RAGSystem;
