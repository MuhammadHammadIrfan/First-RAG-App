const { InferenceClient } = require('@huggingface/inference');
require('dotenv').config();

const hf = new InferenceClient(process.env.huggingface_api_key);

class EmbeddingService {
    constructor(){
        this.model = 'sentence-transformers/all-MiniLM-L6-v2';
    }
    async generateEmbedding(text){
        try{
            console.log(`Generating embedding for text: ${text.substring(0,100)}...`)
            const response = await hf.featureExtraction({
                model: this.model,
                inputs:text
            }); 
            const embedding = Array.isArray(response) ? response : Array.from(response);
            console.log(`Generated embedding: ${embedding.length} dimensions`);
            return embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    async generateEmbeddings(texts){
        try{
            const embeddings = await Promise.all(
                texts.map(text=> this.generateEmbedding(text))
            )
            return embeddings;
        }catch(error){
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }
}

module.exports = EmbeddingService;