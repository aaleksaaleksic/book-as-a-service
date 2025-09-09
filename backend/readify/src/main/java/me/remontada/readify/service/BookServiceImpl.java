package me.remontada.readify.service;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

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

        if (title == null || title.trim().isEmpty()) {
            throw new RuntimeException("Book title is required");
        }

        if (author == null || author.trim().isEmpty()) {
            throw new RuntimeException("Book author is required");
        }

        Book book = new Book();
        book.setTitle(title.trim());
        book.setAuthor(author.trim());
        book.setDescription(description);
        book.setIsbn(isbn);
        book.setCategory(category);
        book.setPages(pages);
        book.setLanguage(language);
        book.setPublicationYear(publicationYear);
        book.setPrice(price);
        book.setIsPremium(isPremium != null ? isPremium : false);
        book.setAddedBy(addedBy);

        return bookRepository.save(book);
    }

    @Override
    public Book updateBook(Long id, Book bookData, User updatedBy) {
        Optional<Book> existingBookOpt = findById(id);

        if (existingBookOpt.isEmpty()) {
            throw new RuntimeException("Book not found with id: " + id);
        }

        Book existingBook = existingBookOpt.get();

        // Update fields
        if (bookData.getTitle() != null) existingBook.setTitle(bookData.getTitle());
        if (bookData.getAuthor() != null) existingBook.setAuthor(bookData.getAuthor());
        if (bookData.getDescription() != null) existingBook.setDescription(bookData.getDescription());
        if (bookData.getCategory() != null) existingBook.setCategory(bookData.getCategory());
        if (bookData.getPages() != null) existingBook.setPages(bookData.getPages());
        if (bookData.getLanguage() != null) existingBook.setLanguage(bookData.getLanguage());
        if (bookData.getPrice() != null) existingBook.setPrice(bookData.getPrice());
        if (bookData.getIsPremium() != null) existingBook.setIsPremium(bookData.getIsPremium());
        if (bookData.getIsAvailable() != null) existingBook.setIsAvailable(bookData.getIsAvailable());

        return bookRepository.save(existingBook);
    }

    @Override
    public void deleteBook(Long id) {
        Optional<Book> bookOpt = findById(id);

        if (bookOpt.isEmpty()) {
            throw new RuntimeException("Book not found with id: " + id);
        }

        Book book = bookOpt.get();
        book.setIsAvailable(false); // Soft delete
        bookRepository.save(book);
    }

    @Override
    @Transactional(readOnly = true)
    public Book getBookContent(Long bookId, User user) {
        Optional<Book> bookOpt = findById(bookId);

        if (bookOpt.isEmpty()) {
            throw new RuntimeException("Book not found");
        }

        Book book = bookOpt.get();

        if (!book.isAccessibleToUser(user)) {
            throw new RuntimeException("You don't have access to this premium book");
        }

        // Increment read count
        incrementReadCount(bookId);

        return book;
    }

    @Override
    public void incrementReadCount(Long bookId) {
        Optional<Book> bookOpt = findById(bookId);

        if (bookOpt.isPresent()) {
            Book book = bookOpt.get();
            book.setTotalReads(book.getTotalReads() + 1);
            bookRepository.save(book);
        }
    }
}