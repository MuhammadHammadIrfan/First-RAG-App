const pdf = require('pdf-parse');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class DocumentProcessor {
  constructor() {
    this.chunkSize = 500; // characters per chunk
    this.chunkOverlap = 50; // overlap between chunks
  }

  // Extract text from PDF
  async extractFromPDF(filePath) {
    try {
      console.log(`Extracting text from PDF: ${filePath}`);
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      console.log(`Extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error) {
      console.error('Error extracting PDF:', error);
      throw error;
    }
  }

  // Extract text from HTML
  extractFromHTML(htmlContent) {
    try {
      console.log('Extracting text from HTML');
      const $ = cheerio.load(htmlContent);

      // Remove script and style elements
      $('script, style').remove();

      // Get text content
      const text = $('body').text() || $.text();
      console.log(`Extracted ${text.length} characters from HTML`);
      return text;
    } catch (error) {
      console.error('Error extracting HTML:', error);
      throw error;
    }
  }

  // Extract text from plain text file
  async extractFromText(filePath) {
    try {
      console.log(`Reading text file: ${filePath}`);
      const text = await fs.readFile(filePath, 'utf-8');
      console.log(`Read ${text.length} characters from text file`);
      return text;
    } catch (error) {
      console.error('Error reading text file:', error);
      throw error;
    }
  }

  // Chunk text into smaller pieces
  chunkText(text) {
    console.log(`Chunking text of ${text.length} characters`);

    if (text.length <= this.chunkSize) {
      return [text.trim()];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;

      // If we're not at the end, try to break at a sentence or word boundary
      if (end < text.length) {
        // Look for sentence ending
        const sentenceEnd = text.lastIndexOf('.', end);
        const questionEnd = text.lastIndexOf('?', end);
        const exclamationEnd = text.lastIndexOf('!', end);

        const sentenceBoundary = Math.max(
          sentenceEnd,
          questionEnd,
          exclamationEnd
        );

        if (sentenceBoundary > start + this.chunkSize * 0.5) {
          end = sentenceBoundary + 1;
        } else {
          // Fall back to word boundary
          const wordBoundary = text.lastIndexOf(' ', end);
          if (wordBoundary > start + this.chunkSize * 0.5) {
            end = wordBoundary;
          }
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = end - this.chunkOverlap;
    }

    console.log(`Created ${chunks.length} chunks`);
    return chunks;
  }

  // Process document based on file type
  async processDocument(filePath, fileType) {
    let text = '';

    switch (fileType.toLowerCase()) {
      case 'pdf':
        text = await this.extractFromPDF(filePath);
        break;
      case 'txt':
        text = await this.extractFromText(filePath);
        break;
      case 'html':
      case 'htm':
        const htmlContent = await fs.readFile(filePath, 'utf-8');
        text = this.extractFromHTML(htmlContent);
        break;
      default:
        // Try to read as text file
        text = await this.extractFromText(filePath);
    }

    // Clean up the text
    text = this.cleanText(text);

    // Chunk the text
    const chunks = this.chunkText(text);

    return {
      originalText: text,
      chunks: chunks,
      metadata: {
        filePath,
        fileType,
        textLength: text.length,
        chunkCount: chunks.length,
        processedAt: new Date().toISOString(),
      },
    };
  }

  // Clean up extracted text
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }
}

module.exports = DocumentProcessor;
