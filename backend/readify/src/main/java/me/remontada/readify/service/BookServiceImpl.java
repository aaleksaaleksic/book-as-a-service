package me.remontada.readify.service;


import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;

    @Autowired
    public BookServiceImpl(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getAllAvailableBooks() {
        return bookRepository.findByIsAvailableTrueOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getFreeBooks() {
        return bookRepository.findByIsAvailableTrueAndIsPremiumFalseOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getPremiumBooks() {
        return bookRepository.findByIsAvailableTrueAndIsPremiumTrueOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Book> findById(Long id) {
        return bookRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> findByCategory(String category) {
        return bookRepository.findByCategoryAndIsAvailableTrueOrderByTitle(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> findByAuthor(String author) {
        return bookRepository.findByAuthorContainingIgnoreCaseAndIsAvailableTrue(author);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> searchBooks(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllAvailableBooks();
        }
        log.info("Searching books with term: {}", searchTerm);
        return bookRepository.searchBooks(searchTerm.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return bookRepository.findDistinctCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getPopularBooks() {
        return bookRepository.findTop10ByIsAvailableTrueOrderByTotalReadsDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getTopRatedBooks() {
        return bookRepository.findTop10ByIsAvailableTrueOrderByAverageRatingDesc();
    }

    @Override
    public Book createBook(String title, String author, String description, String isbn,
                           String category, Integer pages, String language, Integer publicationYear,
                           BigDecimal price, Boolean isPremium, User addedBy) {

        validateBookData(title, author, isbn, pages, price);

        Book book = Book.builder()
                .title(title.trim())
                .author(author.trim())
                .description(description != null ? description.trim() : null)
                .isbn(isbn)
                .category(category)
                .pages(pages)
                .language(language)
                .publicationYear(publicationYear)
                .price(price)
                .isPremium(isPremium != null ? isPremium : false)
                .isAvailable(true)
                .addedBy(addedBy)
                .build();

        Book savedBook = bookRepository.save(book);
        log.info("Created new book: {} by {} (ID: {})", savedBook.getTitle(), savedBook.getAuthor(), savedBook.getId());

        return savedBook;
    }

    @Override
    public Book updateBook(Long id, Book bookData, User updatedBy) {
        Book existingBook = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));

        if (bookData.getTitle() != null) existingBook.setTitle(bookData.getTitle());
        if (bookData.getAuthor() != null) existingBook.setAuthor(bookData.getAuthor());
        if (bookData.getDescription() != null) existingBook.setDescription(bookData.getDescription());
        if (bookData.getCategory() != null) existingBook.setCategory(bookData.getCategory());
        if (bookData.getPages() != null) existingBook.setPages(bookData.getPages());
        if (bookData.getLanguage() != null) existingBook.setLanguage(bookData.getLanguage());
        if (bookData.getPrice() != null) existingBook.setPrice(bookData.getPrice());
        if (bookData.getIsPremium() != null) existingBook.setIsPremium(bookData.getIsPremium());
        if (bookData.getIsAvailable() != null) existingBook.setIsAvailable(bookData.getIsAvailable());

        Book updatedBook = bookRepository.save(existingBook);
        log.info("Updated book ID: {} by user: {}", id, updatedBy.getEmail());

        return updatedBook;
    }

    @Override
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));

        book.setIsAvailable(false); // Soft delete
        bookRepository.save(book);

        log.info("Soft deleted book ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Book getBookContent(Long bookId, User user) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (!book.isAccessibleToUser(user)) {
            throw new RuntimeException("You don't have access to this premium book");
        }

        incrementReadCount(bookId);

        return book;
    }

    @Override
    public void incrementReadCount(Long bookId) {
        Optional<Book> bookOpt = bookRepository.findById(bookId);

        if (bookOpt.isPresent()) {
            Book book = bookOpt.get();
            book.incrementReadCount();
            bookRepository.save(book);

            log.debug("Incremented read count for book ID: {} to {}", bookId, book.getTotalReads());
        }
    }

    private void validateBookData(String title, String author, String isbn, Integer pages, BigDecimal price) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Book title is required");
        }

        if (author == null || author.trim().isEmpty()) {
            throw new IllegalArgumentException("Book author is required");
        }

        if (isbn == null || isbn.trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN is required");
        }

        if (pages == null || pages <= 0) {
            throw new IllegalArgumentException("Pages must be a positive number");
        }

        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price must be non-negative");
        }
    }
}