package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.Category;
import me.remontada.readify.model.Publisher;
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
    private final CategoryService categoryService;
    private final PublisherService publisherService;

    @Autowired
    public BookServiceImpl(BookRepository bookRepository, CategoryService categoryService, PublisherService publisherService) {
        this.bookRepository = bookRepository;
        this.categoryService = categoryService;
        this.publisherService = publisherService;
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
    public List<Book> getAllBooks() {
        return bookRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Book> findById(Long id) {
        if (id == null) {
            log.warn("Attempted to find book with null ID");
            return Optional.empty();
        }

        return bookRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> findByCategory(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            log.warn("Attempted to search books with empty category");
            return List.of();
        }

        // Find category by name first, then find books
        Category category = categoryService.getAllCategories().stream()
                .filter(c -> c.getName().equalsIgnoreCase(categoryName.trim()))
                .findFirst()
                .orElse(null);

        if (category == null) {
            log.warn("Category not found: {}", categoryName);
            return List.of();
        }

        return bookRepository.findByCategoryAndIsAvailableTrueOrderByTitle(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> findByAuthor(String author) {
        if (author == null || author.trim().isEmpty()) {
            log.warn("Attempted to search books with empty author");
            return List.of();
        }

        return bookRepository.findByAuthorContainingIgnoreCaseAndIsAvailableTrue(author);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> searchBooks(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            log.debug("Empty search term, returning all available books");
            return getAllAvailableBooks();
        }

        return bookRepository.searchBooks(searchTerm.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return bookRepository.findDistinctCategories().stream()
                .map(Category::getName)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getPopularBooks() {
        return bookRepository.findTop10ByIsAvailableTrueOrderByTotalReadsDesc();
    }

    @Override
    @Deprecated
    public Book createBook(String title, String author, String description, String isbn,
                           String category, String publisher, Integer pages, String language, Integer publicationYear,
                           BigDecimal price, Boolean isPremium, Boolean isAvailable, User addedBy) {

        validateBookCreationData(title, author, isbn, pages, price, addedBy);

        log.info("BookService.createBook (DEPRECATED) called with publisher: {}", publisher);

        // This method is deprecated - use createBookWithCategoryId instead
        // For backward compatibility, try to find category by name
        Category categoryEntity = null;
        if (category != null && !category.trim().isEmpty()) {
            categoryEntity = categoryService.getAllCategories().stream()
                    .filter(c -> c.getName().equalsIgnoreCase(category.trim()))
                    .findFirst()
                    .orElse(null);
        }

        if (categoryEntity == null) {
            throw new IllegalArgumentException("Category not found: " + category);
        }

        // For backward compatibility, try to find publisher by name or create a default one
        Publisher publisherEntity = null;
        if (publisher != null && !publisher.trim().isEmpty()) {
            publisherEntity = publisherService.getAllPublishers().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(publisher.trim()))
                    .findFirst()
                    .orElseGet(() -> {
                        // Create a new publisher if it doesn't exist
                        return publisherService.createPublisher(publisher.trim(), null, null);
                    });
        }

        if (publisherEntity == null) {
            throw new IllegalArgumentException("Publisher is required");
        }

        Book book = Book.builder()
                .title(sanitizeString(title))
                .author(sanitizeString(author))
                .description(sanitizeString(description))
                .isbn(sanitizeIsbn(isbn))
                .category(categoryEntity)
                .publisher(publisherEntity)
                .pages(pages)
                .language(language != null ? language.trim() : "Serbian")
                .publicationYear(publicationYear)
                .price(price)
                .isPremium(isPremium != null ? isPremium : false)
                .isAvailable(isAvailable != null ? isAvailable : Boolean.TRUE)
                .addedBy(addedBy)
                .totalReads(0L)
                .build();

        Book savedBook = bookRepository.save(book);

        log.info("Created new book: '{}' by '{}' (ID: {}) - Publisher: '{}' - Premium: {}, Price: {} RSD",
                savedBook.getTitle(), savedBook.getAuthor(), savedBook.getId(),
                savedBook.getPublisher().getName(), savedBook.getIsPremium(), savedBook.getPrice());

        return savedBook;
    }

    public Book createBookWithCategoryId(String title, String author, String description, String isbn,
                           Long categoryId, Long publisherId, Integer pages, String language, Integer publicationYear,
                           BigDecimal price, Boolean isPremium, Boolean isAvailable, User addedBy) {

        validateBookCreationData(title, author, isbn, pages, price, addedBy);

        Category category = categoryService.getCategoryById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + categoryId));

        Publisher publisher = publisherService.getPublisherById(publisherId)
                .orElseThrow(() -> new IllegalArgumentException("Publisher not found with id: " + publisherId));

        log.info("BookService.createBookWithCategoryId called with category: {}, publisher: {}", category.getName(), publisher.getName());

        Book book = Book.builder()
                .title(sanitizeString(title))
                .author(sanitizeString(author))
                .description(sanitizeString(description))
                .isbn(sanitizeIsbn(isbn))
                .category(category)
                .publisher(publisher)
                .pages(pages)
                .language(language != null ? language.trim() : "Serbian")
                .publicationYear(publicationYear)
                .price(price)
                .isPremium(isPremium != null ? isPremium : false)
                .isAvailable(isAvailable != null ? isAvailable : Boolean.TRUE)
                .addedBy(addedBy)
                .totalReads(0L)
                .build();

        Book savedBook = bookRepository.save(book);

        log.info("Created new book: '{}' by '{}' (ID: {}) - Category: '{}' - Publisher: '{}' - Premium: {}, Price: {} RSD",
                savedBook.getTitle(), savedBook.getAuthor(), savedBook.getId(),
                savedBook.getCategory().getName(), savedBook.getPublisher().getName(), savedBook.getIsPremium(), savedBook.getPrice());

        return savedBook;
    }

    @Override
    public Book updateBook(Long id, Book bookData, User updatedBy) {
        if (id == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }

        if (updatedBy == null) {
            throw new IllegalArgumentException("User performing update cannot be null");
        }

        Book existingBook = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));

        StringBuilder changes = new StringBuilder();

        if (bookData.getTitle() != null && !bookData.getTitle().equals(existingBook.getTitle())) {
            changes.append("title: '").append(existingBook.getTitle()).append("' -> '").append(bookData.getTitle()).append("', ");
            existingBook.setTitle(sanitizeString(bookData.getTitle()));
        }

        if (bookData.getAuthor() != null && !bookData.getAuthor().equals(existingBook.getAuthor())) {
            changes.append("author: '").append(existingBook.getAuthor()).append("' -> '").append(bookData.getAuthor()).append("', ");
            existingBook.setAuthor(sanitizeString(bookData.getAuthor()));
        }

        if (bookData.getDescription() != null) {
            existingBook.setDescription(sanitizeString(bookData.getDescription()));
        }

        if (bookData.getIsbn() != null) {
            String sanitizedIsbn = sanitizeIsbn(bookData.getIsbn());
            if (sanitizedIsbn != null && !sanitizedIsbn.equals(existingBook.getIsbn())) {
                existingBook.setIsbn(sanitizedIsbn);
            }
        }

        if (bookData.getCategory() != null) {
            existingBook.setCategory(bookData.getCategory());
        }

        if (bookData.getPublisher() != null) {
            existingBook.setPublisher(bookData.getPublisher());
        }

        if (bookData.getPages() != null && bookData.getPages() > 0) {
            existingBook.setPages(bookData.getPages());
        }

        if (bookData.getLanguage() != null) {
            existingBook.setLanguage(bookData.getLanguage().trim());
        }

        if (bookData.getPublicationYear() != null) {
            existingBook.setPublicationYear(bookData.getPublicationYear());
        }

        if (bookData.getPrice() != null && bookData.getPrice().compareTo(BigDecimal.ZERO) >= 0) {
            existingBook.setPrice(bookData.getPrice());
        }

        if (bookData.getIsPremium() != null) {
            existingBook.setIsPremium(bookData.getIsPremium());
        }

        if (bookData.getIsAvailable() != null) {
            existingBook.setIsAvailable(bookData.getIsAvailable());
        }

        Book updatedBook = bookRepository.save(existingBook);

        return updatedBook;
    }

    @Override
    public void deleteBook(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }

        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));

        book.setIsAvailable(false);
        bookRepository.save(book);

        log.info("Soft deleted book: '{}' (ID: {})", book.getTitle(), id);
    }

    @Override
    @Transactional(readOnly = true)
    public Book getBookContent(Long bookId, User user) {
        if (bookId == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }

        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        if (!book.isAccessibleToUser(user)) {
            throw new RuntimeException("Access denied: You don't have permission to read this " +
                    (book.getIsPremium() ? "premium" : "") + " book");
        }

        log.info("User {} accessed book content: {} (ID: {})",
                user.getEmail(), book.getTitle(), bookId);

        return book;
    }

    @Override
    public void incrementReadCount(Long bookId) {
        if (bookId == null) {
            log.warn("Attempted to increment read count for null book ID");
            return;
        }

        try {
            Optional<Book> bookOpt = bookRepository.findById(bookId);

            if (bookOpt.isPresent()) {
                Book book = bookOpt.get();
                Long previousReads = book.getTotalReads();
                book.incrementReadCount();
                bookRepository.save(book);

                log.debug("Incremented read count for book '{}' (ID: {}) from {} to {}",
                        book.getTitle(), bookId, previousReads, book.getTotalReads());
            } else {
                log.warn("Could not increment read count - book not found: {}", bookId);
            }
        } catch (Exception e) {
            log.error("Error incrementing read count for book ID: {}", bookId, e);
        }
    }

    @Override
    @Transactional
    public Book save(Book book) {
        if (book == null) {
            throw new IllegalArgumentException("Book cannot be null");
        }

        if (book.getId() != null) {
            log.debug("Updating existing book with ID: {}", book.getId());

            // Setuj updatedAt timestamp ako postoji to polje
            // book.setUpdatedAt(LocalDateTime.now());
        } else {
            log.debug("Saving new book: {}", book.getTitle());

            if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Book title is required");
            }

            if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) {
                throw new IllegalArgumentException("Book author is required");
            }

            if (book.getIsbn() == null || book.getIsbn().trim().isEmpty()) {
                throw new IllegalArgumentException("Book ISBN is required");
            }
        }


        Book savedBook = bookRepository.save(book);

        log.info("Successfully saved book: '{}' (ID: {})",
                savedBook.getTitle(), savedBook.getId());

        return savedBook;
    }


    private void validateBookCreationData(String title, String author, String isbn,
                                          Integer pages, BigDecimal price, User addedBy) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Book title is required and cannot be empty");
        }

        if (title.length() > 255) {
            throw new IllegalArgumentException("Book title cannot exceed 255 characters");
        }

        if (author == null || author.trim().isEmpty()) {
            throw new IllegalArgumentException("Book author is required and cannot be empty");
        }

        if (author.length() > 255) {
            throw new IllegalArgumentException("Book author cannot exceed 255 characters");
        }

        if (isbn == null || isbn.trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN is required and cannot be empty");
        }

        // Basic ISBN format validation (can be improved with proper ISBN validation library)
        //TODO pitati Mišu za ISBN
        String cleanIsbn = sanitizeIsbn(isbn);
        if (cleanIsbn.length() != 10 && cleanIsbn.length() != 13) {
            throw new IllegalArgumentException("ISBN must be 10 or 13 digits long");
        }

        if (pages == null || pages <= 0) {
            throw new IllegalArgumentException("Number of pages must be a positive number");
        }

        if (pages > 10000) {
            throw new IllegalArgumentException("Number of pages cannot exceed 10,000");
        }

        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price must be non-negative");
        }

        if (price.compareTo(new BigDecimal("999999.99")) > 0) {
            throw new IllegalArgumentException("Price cannot exceed 999,999.99 RSD");
        }

        if (addedBy == null) {
            throw new IllegalArgumentException("User adding the book cannot be null");
        }
    }


    private String sanitizeString(String input) {
        return input != null ? input.trim() : null;
    }

    private String sanitizeIsbn(String isbn) {
        if (isbn == null) {
            return null;
        }
        return isbn.replaceAll("[^0-9X]", "");
    }

    @Override
    @Transactional(readOnly = true)
    public List<Book> getBooksWithPromoChapters() {
        return bookRepository.findByIsAvailableTrueAndPromoChapterPathIsNotNullOrderByCreatedAtDesc();
    }
}