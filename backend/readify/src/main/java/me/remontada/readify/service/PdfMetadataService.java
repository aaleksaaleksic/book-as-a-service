package me.remontada.readify.service;

import me.remontada.readify.dto.PdfMetadataDto;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import org.springframework.core.io.Resource;

import java.io.IOException;

/**
 * PdfMetadataService - Interface for PDF metadata extraction and processing
 *
 * Purpose: Extract critical PDF structure information needed for efficient
 * client-side rendering with PDF.js while maintaining security.
 */
public interface PdfMetadataService {

    /**
     * Extract comprehensive metadata from a PDF resource
     *
     * This includes:
     * - Document structure (XRef, Root, Catalog)
     * - File size and optimal chunk sizing
     * - Initial payload for PDF.js bootstrapping
     *
     * @param resource PDF file resource
     * @param book Book entity for metadata enrichment
     * @param user User requesting access (for watermarking)
     * @return Complete metadata DTO for frontend consumption
     * @throws IOException if PDF cannot be read or parsed
     */
    PdfMetadataDto extractMetadata(Resource resource, Book book, User user) throws IOException;
}