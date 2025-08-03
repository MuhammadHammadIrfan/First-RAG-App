class SimpleVectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = [];
    this.metadata = [];
  }

  //add document with the embedding and metadata to store
  addDocument(text, embedding, metadata = {}) {
    this.documents.push(text);
    this.embeddings.push(embedding);
    this.metadata.push({
      ...metadata,
      id: this.documents.length - 1,
      timestamp: new Date().toISOString(),
    });
    console.log(
      `Document added with ID: ${
        this.documents.length - 1
      }: text "${text.substring(0, 50)}..."`
    );
  }

  //calculate similarity between two embeddings
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must be of the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0; //avoid division by zero
    }
    return dotProduct / (normA * normB);
  }

  //search for similar documents based on query embedding
  search(queryEmbedding, topK = 3) {
    if (this.embeddings.length === 0) {
      console.log('No documents in store to search');
      return [];
    }
    const similarities = this.embeddings.map((embedding, index) => {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      return {
        index,
        similarity,
        document: this.documents[index],
        metadata: this.metadata[index],
      };
    });
    //sort by similarity score, to return top k
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    console.log(`Found ${results.length} results for query`);
    results.forEach((result, i) => {
      console.log(
        `Result ${i + 1}: ID ${
          result.index
        }, Similarity: ${result.similarity.toFixed(
          4
        )}, Text: "${result.document.substring(0, 50)}..."`
      );
    });
    return results;
  }

  //get all documents in the store
  getAllDocuments() {
    return this.documents.map((doc, index) => ({
      index,
      text: doc,
      embedding: this.embeddings[index],
      metadata: this.metadata[index],
    }));
  }

  // get document count
  getDocumentCount() {
    return this.documents.length;
  }

  //clear all vector store data
  clear() {
    this.documents = [];
    this.embeddings = [];
    this.metadata = [];
    console.log('All vector store data cleared');
  }
}

module.exports = SimpleVectorStore;
