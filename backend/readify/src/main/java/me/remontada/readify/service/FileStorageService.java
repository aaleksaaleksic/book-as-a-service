package me.remontada.readify.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * FileStorageService
 *
 * laka migracija između različitih storage sistema:
 * - Local File System (development)
 * - AWS S3 / Cloudflare R2 (production)

 */
public interface FileStorageService {

    /**
     * Čuva PDF fajl knjige u storage
     * @param file - MultipartFile PDF dokument
     * @param bookId - ID knjige za naming convention
     * @return String - relativna putanja do sačuvanog fajla
     * @throws IOException - ako se desi greška pri čuvanju
     */
    String saveBookPdf(MultipartFile file, Long bookId) throws IOException;

    /**
     * Čuva cover sliku knjige
     * @param file - MultipartFile slika (JPG/PNG)
     * @param bookId - ID knjige
     * @return String - relativna putanja do sačuvane slike
     * @throws IOException
     */
    String saveBookCover(MultipartFile file, Long bookId) throws IOException;

    /**
     * Dohvata PDF fajl kao Resource za streaming
     * @param bookId - ID knjige
     * @return Resource - Spring Resource za HTTP streaming
     * @throws IOException - ako fajl ne postoji
     */
    Resource getBookPdf(Long bookId) throws IOException;

    /**
     * Dohvata cover sliku kao Resource
     * @param bookId - ID knjige
     * @return Resource - slika za prikaz
     * @throws IOException
     */
    Resource getBookCover(Long bookId) throws IOException;

    /**
     * Generiše sigurnosni URL za pristup PDF-u (za cloud storage)
     * @param bookId - ID knjige
     * @param expiryHours - koliko sati URL važi
     * @return String - signed URL ili lokalni endpoint
     */
    String generateSecureBookUrl(Long bookId, int expiryHours);

    /**
     * Briše sve fajlove vezane za knjigu
     * @param bookId - ID knjige
     * @throws IOException
     */
    void deleteBookFiles(Long bookId) throws IOException;

    /**
     * Proverava da li postoje fajlovi za datu knjigu
     * @param bookId - ID knjige
     * @return boolean - true ako postoje i PDF i cover
     */
    boolean bookFilesExist(Long bookId);

    /**
     * Vraća putanju do PDF fajla (za bazu podataka)
     * @param bookId - ID knjige
     * @return String - relativna putanja
     */
    String getBookPdfPath(Long bookId);

    /**
     * Vraća putanju do cover slike (za bazu podataka)
     * @param bookId - ID knjige
     * @return String - relativna putanja
     */
    String getBookCoverPath(Long bookId);
}