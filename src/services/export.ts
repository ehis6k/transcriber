/**
 * Export service for transcriptions and summaries
 * Supports TXT, DOCX, and PDF formats with metadata
 */

import { writeTextFile, writeBinaryFile } from '@tauri-apps/api/fs';
import { save } from '@tauri-apps/api/dialog';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import type { TranscriptionJobResult, SummarizationResult } from '@/models';

export interface ExportMetadata {
  title: string;
  sourceFile: string;
  language: string;
  modelUsed: string;
  duration: number;
  date: string;
  compressionRatio?: number | undefined;
  processingTime?: number | undefined;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeMarkdown: boolean;
  format: 'txt' | 'docx' | 'pdf';
  filename?: string;
}

export interface ExportProgress {
  status: 'preparing' | 'converting' | 'saving' | 'complete' | 'error';
  message: string;
  progress: number;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

export class ExportService {
  /**
   * Export transcription and optional summary to specified format
   */
  static async exportTranscription(
    transcription: TranscriptionJobResult,
    summary?: SummarizationResult,
    options: ExportOptions = { includeMetadata: true, includeMarkdown: false, format: 'txt' },
    onProgress?: ExportProgressCallback
  ): Promise<void> {
    try {
      onProgress?.({
        status: 'preparing',
        message: 'Preparing export...',
        progress: 0
      });

      const metadata: ExportMetadata = {
        title: `Transcription - ${transcription.modelUsed}`,
        sourceFile: 'Audio File',
        language: transcription.language,
        modelUsed: transcription.modelUsed,
        duration: transcription.duration,
        date: new Date().toISOString(),
        compressionRatio: summary?.compressionRatio,
        processingTime: summary?.processingTime
      };

      onProgress?.({
        status: 'converting',
        message: `Converting to ${options.format.toUpperCase()}...`,
        progress: 30
      });

      let content: string;
      let filename: string;

      // Prepare content based on format and options
      if (options.includeMarkdown) {
        content = this.generateMarkdownContent(transcription, summary, metadata, options);
        filename = options.filename || `${this.sanitizeFilename(metadata.title)}.md`;
      } else {
        switch (options.format) {
          case 'txt':
            content = this.generateTextContent(transcription, summary, metadata, options);
            filename = options.filename || `${this.sanitizeFilename(metadata.title)}.txt`;
            break;
          case 'docx':
            await this.exportAsDocx(transcription, summary, metadata, options, onProgress);
            return;
          case 'pdf':
            await this.exportAsPdf(transcription, summary, metadata, options, onProgress);
            return;
          default:
            throw new Error(`Unsupported format: ${options.format}`);
        }
      }

      onProgress?.({
        status: 'saving',
        message: 'Saving file...',
        progress: 70
      });

      // Save file using Tauri dialog
      const filePath = await save({
        filters: [{
          name: this.getFormatDisplayName(options.format),
          extensions: [options.format]
        }],
        defaultPath: filename
      });

      if (!filePath) {
        throw new Error('No file path selected');
      }

      await writeTextFile(filePath, content);

      onProgress?.({
        status: 'complete',
        message: 'Export completed successfully!',
        progress: 100
      });

    } catch (error) {
      onProgress?.({
        status: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 0
      });
      throw error;
    }
  }

  /**
   * Generate plain text content
   */
  private static generateTextContent(
    transcription: TranscriptionJobResult,
    summary?: SummarizationResult,
    metadata?: ExportMetadata,
    options?: ExportOptions
  ): string {
    let content = '';

    // Add metadata header
    if (options?.includeMetadata && metadata) {
      content += this.generateMetadataHeader(metadata);
      content += '\n\n';
    }

    // Add transcription content
    content += 'TRANSCRIPTION\n';
    content += '='.repeat(50) + '\n\n';

    if (transcription.segments.length > 0) {
      // Format with timestamps
      transcription.segments.forEach((segment: any) => {
        const timestamp = this.formatTimestamp(segment.startTime);
        content += `[${timestamp}] ${segment.text}\n`;
        if (segment.confidence) {
          content += `  Confidence: ${Math.round(segment.confidence * 100)}%\n`;
        }
        content += '\n';
      });
    } else {
      content += transcription.text + '\n\n';
    }

    // Add summary if available
    if (summary) {
      content += 'SUMMARY\n';
      content += '='.repeat(50) + '\n\n';
      content += summary.summary + '\n\n';

      if (summary.chunks.length > 1) {
        content += 'CHUNKED SUMMARY\n';
        content += '-'.repeat(30) + '\n\n';
        summary.chunks.forEach((chunk, index) => {
          content += `Chunk ${index + 1} (Chars ${chunk.startIndex}-${chunk.endIndex}):\n`;
          content += chunk.summary + '\n\n';
        });
      }
    }

    return content;
  }

  /**
   * Generate markdown content
   */
  private static generateMarkdownContent(
    transcription: TranscriptionJobResult,
    summary?: SummarizationResult,
    metadata?: ExportMetadata,
    options?: ExportOptions
  ): string {
    let content = '';

    // Add metadata header
    if (options?.includeMetadata && metadata) {
      content += this.generateMarkdownMetadata(metadata);
      content += '\n\n';
    }

    // Add transcription content
    content += '# Transcription\n\n';

    if (transcription.segments.length > 0) {
      // Format with timestamps
      transcription.segments.forEach((segment: any) => {
        const timestamp = this.formatTimestamp(segment.startTime);
        content += `**${timestamp}** ${segment.text}\n`;
        if (segment.confidence) {
          const confidenceLevel = segment.confidence > 0.8 ? '🟢' : segment.confidence > 0.6 ? '🟡' : '🔴';
          content += `*Confidence: ${Math.round(segment.confidence * 100)}% ${confidenceLevel}*\n`;
        }
        content += '\n';
      });
    } else {
      content += transcription.text + '\n\n';
    }

    // Add summary if available
    if (summary) {
      content += '# Summary\n\n';
      content += summary.summary + '\n\n';

      if (summary.chunks.length > 1) {
        content += '## Chunked Summary\n\n';
        summary.chunks.forEach((chunk, index) => {
          content += `### Chunk ${index + 1}\n`;
          content += `*Characters ${chunk.startIndex}-${chunk.endIndex}*\n\n`;
          content += chunk.summary + '\n\n';
        });
      }
    }

    return content;
  }

  /**
   * Export as DOCX document
   */
  private static async exportAsDocx(
    transcription: TranscriptionJobResult,
    summary?: SummarizationResult,
    metadata?: ExportMetadata,
    options?: ExportOptions,
    onProgress?: ExportProgressCallback
  ): Promise<void> {
    const children: Paragraph[] = [];

    // Add title
    children.push(
      new Paragraph({
        text: 'Transcription Report',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER
      })
    );

    // Add metadata if requested
    if (options?.includeMetadata && metadata) {
      children.push(
        new Paragraph({
          text: 'Document Information',
          heading: HeadingLevel.HEADING_2
        })
      );

      const metadataText = this.generateMetadataText(metadata);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: metadataText, size: 20 })]
        })
      );
    }

    // Add transcription content
    children.push(
      new Paragraph({
        text: 'Transcription',
        heading: HeadingLevel.HEADING_2
      })
    );

    if (transcription.segments.length > 0) {
      transcription.segments.forEach((segment: any) => {
        const timestamp = this.formatTimestamp(segment.startTime);
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: `[${timestamp}] `, 
                bold: true,
                color: '666666'
              }),
              new TextRun({ text: segment.text })
            ]
          })
        );

        if (segment.confidence) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `Confidence: ${Math.round(segment.confidence * 100)}%`,
                  size: 18,
                  color: segment.confidence > 0.8 ? '008000' : segment.confidence > 0.6 ? 'FFA500' : 'FF0000'
                })
              ],
              spacing: { before: 100, after: 200 }
            })
          );
        }
      });
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: transcription.text })]
        })
      );
    }

    // Add summary if available
    if (summary) {
      children.push(
        new Paragraph({
          text: 'Summary',
          heading: HeadingLevel.HEADING_2
        })
      );

      children.push(
        new Paragraph({
          children: [new TextRun({ text: summary.summary })]
        })
      );

      if (summary.chunks.length > 1) {
        children.push(
          new Paragraph({
            text: 'Chunked Summary',
            heading: HeadingLevel.HEADING_3
          })
        );

        summary.chunks.forEach((chunk, index) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `Chunk ${index + 1} (Chars ${chunk.startIndex}-${chunk.endIndex}):`,
                  bold: true
                })
              ]
            })
          );

          children.push(
            new Paragraph({
              children: [new TextRun({ text: chunk.summary })]
            })
          );
        });
      }
    }

    // Create document
    const doc = new Document({
      creator: 'TranscriptApp',
      description: 'Generated transcription and summary report',
      title: metadata?.title || 'Transcription Report',
      sections: [{
        properties: {},
        children
      }]
    });

    onProgress?.({
      status: 'saving',
      message: 'Saving DOCX file...',
      progress: 70
    });

    // Generate and save file
    const buffer = await Packer.toBuffer(doc);
    
    const filename = options?.filename || `${this.sanitizeFilename(metadata?.title || 'transcription')}.docx`;
    const filePath = await save({
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
      defaultPath: filename
    });

    if (!filePath) {
      throw new Error('No file path selected');
    }

    await writeBinaryFile(filePath, buffer);

    onProgress?.({
      status: 'complete',
      message: 'DOCX export completed successfully!',
      progress: 100
    });
  }

  /**
   * Export as PDF document
   */
  private static async exportAsPdf(
    transcription: TranscriptionJobResult,
    summary?: SummarizationResult,
    metadata?: ExportMetadata,
    options?: ExportOptions,
    onProgress?: ExportProgressCallback
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Transcription Report', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Add metadata if requested
    if (options?.includeMetadata && metadata) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Document Information', 20, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const metadataText = this.generateMetadataText(metadata);
      const metadataLines = doc.splitTextToSize(metadataText, 170);
      doc.text(metadataLines, 20, yPosition);
      yPosition += metadataLines.length * 5 + 10;
    }

    // Add transcription content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transcription', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (transcription.segments.length > 0) {
      transcription.segments.forEach((segment: any) => {
        const timestamp = this.formatTimestamp(segment.startTime);
        
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Add timestamp in bold
        doc.setFont('helvetica', 'bold');
        doc.text(`[${timestamp}] `, 20, yPosition);
        
        // Add segment text
        doc.setFont('helvetica', 'normal');
        const textWidth = doc.getTextWidth(`[${timestamp}] `);
        const remainingWidth = 170 - textWidth;
        const textLines = doc.splitTextToSize(segment.text, remainingWidth);
        doc.text(textLines, 20 + textWidth, yPosition);
        yPosition += textLines.length * 5;

        // Add confidence if available
        if (segment.confidence) {
          const confidenceText = `Confidence: ${Math.round(segment.confidence * 100)}%`;
          doc.setFontSize(8);
          doc.text(confidenceText, 25, yPosition);
          yPosition += 5;
          doc.setFontSize(10);
        }

        yPosition += 3;
      });
    } else {
      const textLines = doc.splitTextToSize(transcription.text, 170);
      doc.text(textLines, 20, yPosition);
      yPosition += textLines.length * 5 + 10;
    }

    // Add summary if available
    if (summary) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(summary.summary, 170);
      doc.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 10;

      if (summary.chunks.length > 1) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Chunked Summary', 20, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        summary.chunks.forEach((chunk, index) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          const chunkHeader = `Chunk ${index + 1} (Chars ${chunk.startIndex}-${chunk.endIndex}):`;
          doc.setFont('helvetica', 'bold');
          doc.text(chunkHeader, 20, yPosition);
          yPosition += 5;

          doc.setFont('helvetica', 'normal');
          const chunkLines = doc.splitTextToSize(chunk.summary, 170);
          doc.text(chunkLines, 20, yPosition);
          yPosition += chunkLines.length * 5 + 5;
        });
      }
    }

    onProgress?.({
      status: 'saving',
      message: 'Saving PDF file...',
      progress: 70
    });

    // Save file
    const filename = options?.filename || `${this.sanitizeFilename(metadata?.title || 'transcription')}.pdf`;
    const filePath = await save({
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      defaultPath: filename
    });

    if (!filePath) {
      throw new Error('No file path selected');
    }

    const pdfBuffer = doc.output('arraybuffer');
    await writeBinaryFile(filePath, new Uint8Array(pdfBuffer));

    onProgress?.({
      status: 'complete',
      message: 'PDF export completed successfully!',
      progress: 100
    });
  }

  /**
   * Generate metadata header for text files
   */
  private static generateMetadataHeader(metadata: ExportMetadata): string {
    return [
      'TRANSCRIPTION REPORT',
      '='.repeat(50),
      `Title: ${metadata.title}`,
      `Source File: ${metadata.sourceFile}`,
      `Language: ${metadata.language}`,
      `Model: ${metadata.modelUsed}`,
      `Duration: ${this.formatTimestamp(metadata.duration)}`,
      `Date: ${new Date(metadata.date).toLocaleString()}`,
      ...(metadata.compressionRatio ? [`Compression: ${metadata.compressionRatio.toFixed(1)}% shorter`] : []),
      ...(metadata.processingTime ? [`Processing Time: ${(metadata.processingTime / 1000).toFixed(1)}s`] : []),
      '='.repeat(50)
    ].join('\n');
  }

  /**
   * Generate markdown metadata
   */
  private static generateMarkdownMetadata(metadata: ExportMetadata): string {
    return [
      '---',
      `title: "${metadata.title}"`,
      `source_file: "${metadata.sourceFile}"`,
      `language: "${metadata.language}"`,
      `model: "${metadata.modelUsed}"`,
      `duration: "${this.formatTimestamp(metadata.duration)}"`,
      `date: "${new Date(metadata.date).toISOString()}"`,
      ...(metadata.compressionRatio ? [`compression_ratio: ${metadata.compressionRatio.toFixed(1)}`] : []),
      ...(metadata.processingTime ? [`processing_time: ${(metadata.processingTime / 1000).toFixed(1)}s`] : []),
      '---'
    ].join('\n');
  }

  /**
   * Generate metadata text for documents
   */
  private static generateMetadataText(metadata: ExportMetadata): string {
    const lines = [
      `Source File: ${metadata.sourceFile}`,
      `Language: ${metadata.language}`,
      `Model: ${metadata.modelUsed}`,
      `Duration: ${this.formatTimestamp(metadata.duration)}`,
      `Date: ${new Date(metadata.date).toLocaleString()}`
    ];

    if (metadata.compressionRatio) {
      lines.push(`Compression: ${metadata.compressionRatio.toFixed(1)}% shorter`);
    }

    if (metadata.processingTime) {
      lines.push(`Processing Time: ${(metadata.processingTime / 1000).toFixed(1)}s`);
    }

    return lines.join('\n');
  }

  /**
   * Format timestamp in MM:SS format
   */
  private static formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get display name for format
   */
  private static getFormatDisplayName(format: string): string {
    switch (format) {
      case 'txt': return 'Text File';
      case 'docx': return 'Word Document';
      case 'pdf': return 'PDF Document';
      case 'md': return 'Markdown File';
      default: return 'File';
    }
  }

  /**
   * Sanitize filename for safe saving
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }
} 