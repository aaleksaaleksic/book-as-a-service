package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.PdfMetadataDto;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.StreamingSessionService.StreamingSessionDescriptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

/**
 * PdfMetadataServiceImpl - Extracts and prepares PDF metadata for streaming
 *
 * Architecture:
 * - Uses a "header + footer" strategy to capture PDF structure
 * - PDF Header (first 10KB): Contains PDF version, linearization hints
 * - PDF Footer (last 200KB): Contains XRef table, Root object, Trailer
 *
 * This ensures PDF.js can parse the document without loading the entire file.
 */
@Slf4j
@Service
public class PdfMetadataServiceImpl implements PdfMetadataService {

    private final StreamingSessionService streamingSessionService;

    // Size constants for optimal PDF structure extraction
    private static final long HEADER_SIZE = 10240;      // 10KB - PDF header
    private static final long FOOTER_SIZE = 204800;     // 200KB - XRef + Trailer
    private static final long RECOMMENDED_CHUNK = 5242880; // 5MB per chunk

    @Autowired
    public PdfMetadataServiceImpl(StreamingSessionService streamingSessionService) {
        this.streamingSessionService = streamingSessionService;
    }

    @Override
    public PdfMetadataDto extractMetadata(Resource resource, Book book, User user) throws IOException {
        long totalSize = resource.contentLength();

        log.info("Extracting PDF metadata for book {} ({}), total size: {} bytes",
                 book.getId(), book.getTitle(), totalSize);

        // Create streaming session for this user-book pair
        StreamingSessionDescriptor session = streamingSessionService.openSession(user, book);

        // Extract PDF version from header
        String pdfVersion = extractPdfVersion(resource);

        // Create initial chunk: header + footer
        // This allows PDF.js to parse document structure immediately
        byte[] initialChunk = createInitialChunk(resource, totalSize);
        String initialChunkBase64 = Base64.getEncoder().encodeToString(initialChunk);

        log.debug("Created initial chunk for book {}: {} bytes (header + footer)",
                  book.getId(), initialChunk.length);

        return PdfMetadataDto.builder()
                .totalSize(totalSize)
                .initialChunk(initialChunkBase64)
                .initialChunkSize((long) initialChunk.length)
                .sessionToken(session.token())
                .watermarkSignature(session.watermarkSignature())
                .issuedAt(session.issuedAt().toString())
                .recommendedChunkSize(RECOMMENDED_CHUNK)
                .title(book.getTitle())
                .pdfVersion(pdfVersion)
                .build();
    }

    /**
     * Creates initial chunk containing PDF header and footer
     *
     * Strategy:
     * 1. Read first HEADER_SIZE bytes (PDF header, version, linearization)
     * 2. Read last FOOTER_SIZE bytes (XRef table, Root, Trailer)
     * 3. Concatenate them for PDF.js parsing
     *
     * Why this works:
     * - PDF.js can parse XRef from the footer to understand document structure
     * - It can then request specific byte ranges for pages/objects as needed
     * - This avoids "Invalid Root reference" errors
     */
    private byte[] createInitialChunk(Resource resource, long totalSize) throws IOException {
        long headerSize = Math.min(HEADER_SIZE, totalSize);
        long footerSize = Math.min(FOOTER_SIZE, totalSize - headerSize);

        byte[] header = new byte[(int) headerSize];
        byte[] footer = new byte[(int) footerSize];

        try (InputStream is = resource.getInputStream()) {
            // Read header
            int headerRead = is.readNBytes(header, 0, (int) headerSize);
            if (headerRead != headerSize) {
                log.warn("Expected {} header bytes, read {}", headerSize, headerRead);
            }

            // Skip to footer position
            long footerStart = totalSize - footerSize;
            long toSkip = footerStart - headerSize;

            if (toSkip > 0) {
                long skipped = is.skip(toSkip);
                if (skipped != toSkip) {
                    log.warn("Expected to skip {} bytes, skipped {}", toSkip, skipped);
                }
            }

            // Read footer
            int footerRead = is.readNBytes(footer, 0, (int) footerSize);
            if (footerRead != footerSize) {
                log.warn("Expected {} footer bytes, read {}", footerSize, footerRead);
            }
        }

        // Concatenate header + footer
        byte[] combined = new byte[header.length + footer.length];
        System.arraycopy(header, 0, combined, 0, header.length);
        System.arraycopy(footer, 0, combined, header.length, footer.length);

        return combined;
    }

    /**
     * Extract PDF version from file header
     *
     * PDF files start with "%PDF-1.x" where x is the version number
     * This is useful for client-side compatibility checks
     */
    private String extractPdfVersion(Resource resource) throws IOException {
        byte[] headerBytes = new byte[16]; // "%PDF-1.7" is typically within first 16 bytes

        try (InputStream is = resource.getInputStream()) {
            int read = is.read(headerBytes);
            if (read > 0) {
                String header = new String(headerBytes, 0, read);
                if (header.startsWith("%PDF-")) {
                    String version = header.substring(5, Math.min(8, header.length())).trim();
                    return version;
                }
            }
        }

        return "unknown";
    }
}