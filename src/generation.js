const { InferenceClient } = require('@huggingface/inference');
require('dotenv').config();

class TextGenerator {
  constructor() {
    this.hf = new InferenceClient(process.env.huggingface_api_key);
    // Using a better model for question-answering and structured responses
    this.model = 'google/flan-t5-large';
    // Alternative models you can try:
    // 'microsoft/DialoGPT-medium' - for chat (not good for RAG)
    // 'google/flan-t5-base' - smaller but faster
    // 'HuggingFaceH4/zephyr-7b-beta' - very good but slower
  }

  // Generate answer based on context and question
  async generateAnswer(question, context, maxLength = 300) {
    try {
      console.log(`Generating answer for question: "${question}"`);
      console.log(`Using context of ${context.length} characters`);

      // Create a prompt that includes context and question
      const prompt = this.createPrompt(question, context);

      console.log('Sending request to Hugging Face...');

      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: maxLength,
          temperature: 0.3, // Lower temperature for more focused answers
          do_sample: true,
          top_p: 0.95,
          repetition_penalty: 1.2,
        },
      });

      // Extract the generated text
      let answer = response.generated_text || response;

      // Clean up the answer - remove the prompt part
      if (typeof answer === 'string') {
        // Remove the original prompt from the response
        answer = answer.replace(prompt, '').trim();

        // Clean up common artifacts
        answer = this.cleanAnswer(answer);
      }

      console.log(`Generated answer: ${answer.substring(0, 100)}...`);
      return answer;
    } catch (error) {
      console.error('Error generating answer:', error);

      // Fallback to a simple context-based response
      return this.createFallbackAnswer(question, context);
    }
  }

  // Create a well-structured prompt
  createPrompt(question, context) {
    return `Based on the following information, please provide a detailed and well-structured answer.

CONTEXT INFORMATION:
${context}

QUESTION: ${question}

INSTRUCTIONS: Please provide a comprehensive answer that:
1. Directly answers the question based on the context
2. Includes specific details and data from the documents
3. Is well-organized with clear sections if needed
4. Cites relevant information from the source material
5. Is accurate and factual based only on the provided context

ANSWER:`;
  }

  // Clean up the generated answer
  cleanAnswer(answer) {
    return answer
      .replace(/^\s*Answer:\s*/i, '') // Remove "Answer:" prefix
      .replace(/^\s*A:\s*/i, '') // Remove "A:" prefix
      .replace(/^\s*ANSWER:\s*/i, '') // Remove "ANSWER:" prefix
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  // Fallback answer when LLM fails
  createFallbackAnswer(question, context) {
    console.log('Using fallback answer generation');

    // Try to extract relevant information from context
    const extractedInfo = this.extractRelevantInfo(question, context);

    if (extractedInfo.length > 0) {
      let answer = 'Based on the document content:\n\n';
      extractedInfo.forEach((info, index) => {
        answer += `${index + 1}. ${info}\n`;
      });
      return answer;
    }

    // Simple keyword matching fallback
    const questionWords = question
      .toLowerCase()
      .split(' ')
      .filter((word) => word.length > 3);
    const sentences = context
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);

    // Find sentences that contain question keywords
    const relevantSentences = sentences.filter((sentence) => {
      const sentenceLower = sentence.toLowerCase();
      return questionWords.some((word) => sentenceLower.includes(word));
    });

    if (relevantSentences.length > 0) {
      // Return the most relevant sentences
      const topSentences = relevantSentences.slice(0, 3);
      return topSentences.map((s) => s.trim()).join('. ') + '.';
    }

    return "I found relevant information in the documents, but I'm having trouble generating a specific answer right now. Please try rephrasing your question or asking about specific topics mentioned in the document.";
  }

  // Extract relevant information based on question type
  extractRelevantInfo(question, context) {
    const info = [];
    const questionLower = question.toLowerCase();

    // Check what type of information is being asked
    if (questionLower.includes('name') || questionLower.includes('who')) {
      const names = this.extractNames(context);
      if (names.length > 0) {
        info.push(`Names mentioned: ${names.join(', ')}`);
      }
    }

    if (questionLower.includes('date') || questionLower.includes('when')) {
      const dates = this.extractDates(context);
      if (dates.length > 0) {
        info.push(`Dates mentioned: ${dates.join(', ')}`);
      }
    }

    if (
      questionLower.includes('number') ||
      questionLower.includes('amount') ||
      questionLower.includes('value')
    ) {
      const numbers = this.extractNumbers(context);
      if (numbers.length > 0) {
        info.push(`Key numbers: ${numbers.join(', ')}`);
      }
    }

    if (
      questionLower.includes('location') ||
      questionLower.includes('where') ||
      questionLower.includes('address')
    ) {
      const locations = this.extractLocations(context);
      if (locations.length > 0) {
        info.push(`Locations mentioned: ${locations.join(', ')}`);
      }
    }

    return info;
  }

  // Extract names from context
  extractNames(context) {
    const names = [];

    // Common name patterns
    const namePatterns = [
      /(?:NAME|name)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /(?:PATIENT NAME|Patient Name)\s+([^\n]+)/g,
      /(?:Dr\.|Doctor|Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    ];

    namePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(context)) !== null) {
        const name = match[1].trim();
        if (name && !names.includes(name)) {
          names.push(name);
        }
      }
    });

    return names;
  }

  // Extract dates from context
  extractDates(context) {
    const dates = [];

    // Common date patterns
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{4}-\d{2}-\d{2}/g,
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/g,
      /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/g,
    ];

    datePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(context)) !== null) {
        if (!dates.includes(match[0])) {
          dates.push(match[0]);
        }
      }
    });

    return dates;
  }

  // Extract numbers with context
  extractNumbers(context) {
    const numbers = [];

    // Find numbers with their context
    const numberPattern = /([a-zA-Z\s]+)[\s:]*(\d+(?:\.\d+)?)\s*([a-zA-Z/%]*)/g;
    let match;

    while ((match = numberPattern.exec(context)) !== null) {
      const label = match[1].trim();
      const value = match[2];
      const unit = match[3] || '';

      if (label.length > 2 && label.length < 50) {
        numbers.push(`${label}: ${value}${unit ? ' ' + unit : ''}`);
      }
    }

    return numbers.slice(0, 10); // Limit to first 10 numbers
  }

  // Extract locations from context
  extractLocations(context) {
    const locations = [];

    // Common location patterns
    const locationPatterns = [
      /(?:ADDRESS|Address)\s*:?\s*([^\n]+)/g,
      /(?:LOCATION|Location)\s*:?\s*([^\n]+)/g,
      /\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)/g,
      /[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s*\d{5}/g, // City, State ZIP
    ];

    locationPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(context)) !== null) {
        const location = match[1] || match[0];
        if (location && !locations.includes(location.trim())) {
          locations.push(location.trim());
        }
      }
    });

    return locations;
  }

  // Change the model being used
  setModel(modelName) {
    this.model = modelName;
    console.log(`Model changed to: ${modelName}`);
  }

  // Generate multiple answer variations
  async generateMultipleAnswers(question, context, count = 3) {
    try {
      const answers = [];

      for (let i = 0; i < count; i++) {
        const answer = await this.generateAnswer(question, context);
        answers.push(answer);

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return answers;
    } catch (error) {
      console.error('Error generating multiple answers:', error);
      return [await this.generateAnswer(question, context)];
    }
  }
}

module.exports = TextGenerator;
