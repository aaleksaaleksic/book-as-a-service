package me.remontada.readify.service;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;


public interface BookService {

    List<Book> getAllAvailableBooks();
    List<Book> getFreeBooks();
    List<Book> getPremiumBooks();
    Optional<Book> findById(Long id);
    List<Book> findByCategory(String category);
    List<Book> findByAuthor(String author);
    List<Book> searchBooks(String searchTerm);
    List<String> getAllCategories();

    List<Book> getPopularBooks();
    List<Book> getTopRatedBooks();

    Book createBook(String title, String author, String description, String isbn,
                    String category, Integer pages, String language, Integer publicationYear,
                    BigDecimal price, Boolean isPremium, User addedBy);

    Book updateBook(Long id, Book bookData, User updatedBy);
    void deleteBook(Long id);

    Book getBookContent(Long bookId, User user);
    void incrementReadCount(Long bookId);
}