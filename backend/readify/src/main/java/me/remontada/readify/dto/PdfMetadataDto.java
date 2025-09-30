package me.remontada.readify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PdfMetadataDto - Contains essential PDF metadata for efficient loading
 *
 * This DTO provides the frontend with critical information needed to:
 * - Initialize PDF.js with proper document structure
 * - Calculate optimal chunk sizes for streaming
 * - Display document information before full load
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfMetadataDto {

    /**
     * Total file size in bytes
     * Used by PDF.js for range request calculations
     */
    private Long totalSize;

    /**
     * Base64-encoded initial chunk containing:
     * - PDF header (first ~1KB)
     * - Root reference and XRef table (last ~100KB)
     *
     * This allows PDF.js to parse document structure without additional requests
     */
    private String initialChunk;

    /**
     * Size of the initial chunk in bytes
     */
    private Long initialChunkSize;

    /**
     * Streaming session token for authenticated chunk requests
     */
    private String sessionToken;

    /**
     * Watermark signature for content protection
     */
    private String watermarkSignature;

    /**
     * Session issuance timestamp (ISO-8601 format)
     */
    private String issuedAt;

    /**
     * Recommended chunk size for optimal streaming (typically 5MB)
     */
    private Long recommendedChunkSize;

    /**
     * Book title for display
     */
    private String title;

    /**
     * PDF version (e.g., "1.7")
     */
    private String pdfVersion;
}