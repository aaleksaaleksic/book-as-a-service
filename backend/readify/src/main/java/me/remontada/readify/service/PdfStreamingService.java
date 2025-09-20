package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResourceRegion;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

/**
 * Service responsible for preparing PDF byte ranges for secure streaming.
 *
 * The service slices the PDF file into predictable chunks so that the controller can
 * reply with {@link org.springframework.http.HttpStatus#PARTIAL_CONTENT} responses.
 * This allows the frontend PDF.js viewer to request only the portions of the file
 * that are currently needed while preventing accidental full file downloads.
 */
@Slf4j
@Service
public class PdfStreamingService {

    /**
     * Default chunk size (256 KiB) used when the client doesn't request
     * a specific range length. The value can be overridden through configuration.
     */
    private final long chunkSize;

    public PdfStreamingService(@Value("${app.streaming.chunk-size:262144}") long chunkSize) {
        if (chunkSize <= 0) {
            throw new IllegalArgumentException("Streaming chunk size must be greater than zero");
        }
        this.chunkSize = chunkSize;
    }

    public long getChunkSize() {
        return chunkSize;
    }

    /**
     * Resolve the {@link ResourceRegion} that should be returned for the incoming request.
     *
     * @param resource PDF resource to slice
     * @param headers  incoming HTTP headers (used to parse Range header)
     * @return region that should be streamed back to the caller
     * @throws IOException when the file cannot be accessed
     */
    public ResourceRegion getResourceRegion(Resource resource, HttpHeaders headers) throws IOException {
        long contentLength = resource.contentLength();
        List<HttpRange> ranges = headers.getRange();

        if (ranges == null || ranges.isEmpty()) {
            long effectiveLength = Math.min(chunkSize, contentLength);
            log.debug("Range header missing, defaulting to first chunk ({} bytes)", effectiveLength);
            return new ResourceRegion(resource, 0, effectiveLength);
        }

        HttpRange range = ranges.get(0);
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);

        if (start >= contentLength) {
            log.warn("Requested range starts after file end: start={} length={} for resource {}", start, contentLength,
                    resource.getFilename());
            throw new IllegalArgumentException("Requested range not satisfiable");
        }

        long rangeLength = end - start + 1;
        long effectiveLength = Math.min(chunkSize, rangeLength);

        log.trace("Serving PDF range start={}, requestedLength={}, effectiveLength={}", start, rangeLength, effectiveLength);

        return new ResourceRegion(resource, start, effectiveLength);
    }

    /**
     * Helper method used primarily for logging purposes so that controllers can
     * emit human readable messages about the media type that will be streamed.
     */
    public MediaType resolveMediaType(Resource resource) {
        return MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_PDF);
    }
}
