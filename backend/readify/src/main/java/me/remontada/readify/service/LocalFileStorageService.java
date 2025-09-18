package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * LocalFileStorageService
 *
 * Aktivna samo kada NIJE production profil (@Profile("!production"))
 * Čuva fajlove u lokalnom file sistemu za development i testing
 */
@Slf4j
@Service
@Profile("!production")
public class LocalFileStorageService implements FileStorageService {

    @Value("${app.storage.local.base-path:./storage}")
    private String basePath;

    @Value("${app.storage.local.books-dir:books}")
    private String booksDir;

    @Value("${app.storage.local.covers-dir:covers}")
    private String coversDir;

    // Maksimalna veličina fajla (70MB default)
    @Value("${app.storage.max-file-size:73400320}")
    private long maxFileSize;

    private Path booksPath;
    private Path coversPath;

    /**
     * @PostConstruct - izvršava se nakon dependency injection
     * Kreira potrebne direktorijume ako ne postoje
     */
    @PostConstruct
    public void init() {
        try {
            // Kreiranje putanja
            Path baseStoragePath = Paths.get(basePath).toAbsolutePath().normalize();
            this.booksPath = baseStoragePath.resolve(booksDir);
            this.coversPath = baseStoragePath.resolve(coversDir);

            // Kreiranje direktorijuma ako ne postoje
            Files.createDirectories(this.booksPath);
            Files.createDirectories(this.coversPath);

            log.info("Local storage initialized at: {}", baseStoragePath);
            log.info("Books directory: {}", this.booksPath);
            log.info("Covers directory: {}", this.coversPath);

        } catch (IOException e) {
            log.error("Failed to create storage directories", e);
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Override
    public String saveBookPdf(MultipartFile file, Long bookId) throws IOException {
        // Validacija
        validateFile(file, "application/pdf");

        // Generisanje imena fajla: book-{id}.pdf
        String fileName = "book-" + bookId + ".pdf";
        Path targetLocation = this.booksPath.resolve(fileName);

        // Kopiranje fajla
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);


        // Vraćamo relativnu putanju za čuvanje u bazi
        return booksDir + "/" + fileName;
    }

    @Override
    public String saveBookCover(MultipartFile file, Long bookId) throws IOException {
        // Validacija - prihvatamo JPG i PNG
        String contentType = file.getContentType();
        if (!isImageFile(contentType)) {
            throw new IllegalArgumentException("Cover must be JPG or PNG image");
        }

        // Ekstrakcija ekstenzije
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFilename);

        // Generisanje imena: book-{id}-cover.{ext}
        String fileName = "book-" + bookId + "-cover." + fileExtension;
        Path targetLocation = this.coversPath.resolve(fileName);

        // Čuvanje fajla
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        log.info("Saved book cover: {} (size: {} bytes)", fileName, file.getSize());

        return coversDir + "/" + fileName;
    }

    @Override
    public Resource getBookPdf(Long bookId) throws IOException {
        String fileName = "book-" + bookId + ".pdf";
        Path filePath = this.booksPath.resolve(fileName).normalize();

        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists() || !resource.isReadable()) {
            log.error("Book PDF not found: {}", fileName);
            throw new IOException("Book file not found: " + bookId);
        }

        return resource;
    }

    @Override
    public Resource getBookCover(Long bookId) throws IOException {
        // Pokušavamo različite ekstenzije
        String[] extensions = {".jpg", ".jpeg", ".png"};

        for (String ext : extensions) {
            String fileName = "book-" + bookId + "-cover" + ext;
            Path filePath = this.coversPath.resolve(fileName).normalize();
            Resource resource = new FileSystemResource(filePath);

            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        }

        log.error("Book cover not found for ID: {}", bookId);
        throw new IOException("Cover image not found: " + bookId);
    }

    @Override
    public String generateSecureBookUrl(Long bookId, int expiryHours) {

        return "/api/v1/files/books/" + bookId + "/content";
    }

    @Override
    public void deleteBookFiles(Long bookId) throws IOException {
        // Brisanje PDF-a
        String pdfName = "book-" + bookId + ".pdf";
        Path pdfPath = this.booksPath.resolve(pdfName);
        Files.deleteIfExists(pdfPath);

        // Brisanje cover-a (sve ekstenzije)
        String[] extensions = {".jpg", ".jpeg", ".png"};
        for (String ext : extensions) {
            String coverName = "book-" + bookId + "-cover" + ext;
            Path coverPath = this.coversPath.resolve(coverName);
            Files.deleteIfExists(coverPath);
        }

        log.info("Deleted files for book ID: {}", bookId);
    }

    @Override
    public boolean bookFilesExist(Long bookId) {
        try {
            Resource pdf = getBookPdf(bookId);
            Resource cover = getBookCover(bookId);
            return pdf.exists() && cover.exists();
        } catch (IOException e) {
            return false;
        }
    }

    @Override
    public String getBookPdfPath(Long bookId) {
        return booksDir + "/book-" + bookId + ".pdf";
    }

    @Override
    public String getBookCoverPath(Long bookId) {
        String[] extensions = {".jpg", ".jpeg", ".png"};
        for (String ext : extensions) {
            String fileName = "book-" + bookId + "-cover" + ext;
            Path filePath = this.coversPath.resolve(fileName);
            if (Files.exists(filePath)) {
                return coversDir + "/" + fileName;
            }
        }
        // Default ako ne postoji
        return coversDir + "/book-" + bookId + "-cover.jpg";
    }

    /**
     * Validacija fajla - tip i veličina
     */
    private void validateFile(MultipartFile file, String expectedType) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size");
        }

        String contentType = file.getContentType();
        if (expectedType != null && !expectedType.equals(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Expected: " + expectedType);
        }
    }

    /**
     * Provera da li je fajl slika
     */
    private boolean isImageFile(String contentType) {
        return contentType != null && (
                contentType.equals("image/jpeg") ||
                        contentType.equals("image/jpg") ||
                        contentType.equals("image/png")
        );
    }

    /**
     * Ekstraktovanje ekstenzije iz imena fajla
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "jpg"; // default
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
}