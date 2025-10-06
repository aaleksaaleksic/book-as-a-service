package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.RatingCreateDTO;
import me.remontada.readify.dto.response.RatingResponseDTO;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.Rating;
import me.remontada.readify.model.User;
import me.remontada.readify.repository.BookRepository;
import me.remontada.readify.repository.RatingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final BookRepository bookRepository;

    public RatingServiceImpl(RatingRepository ratingRepository, BookRepository bookRepository) {
        this.ratingRepository = ratingRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    @Transactional
    public RatingResponseDTO addOrUpdateRating(Long bookId, RatingCreateDTO ratingDTO, User user) {
        log.info("Adding/updating rating for book {} by user {}", bookId, user.getEmail());

        // Find the book
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        // Check if user already rated this book
        Optional<Rating> existingRating = ratingRepository.findByUserAndBook(user, book);

        Rating rating;
        if (existingRating.isPresent()) {
            // Update existing rating
            rating = existingRating.get();
            log.info("Updating existing rating {} for book {} by user {}", rating.getId(), bookId, user.getEmail());
            rating.setRating(ratingDTO.getRating());
            rating.setReview(ratingDTO.getReview());
        } else {
            // Create new rating
            log.info("Creating new rating for book {} by user {}", bookId, user.getEmail());
            rating = Rating.builder()
                    .user(user)
                    .book(book)
                    .rating(ratingDTO.getRating())
                    .review(ratingDTO.getReview())
                    .build();
        }

        // Save the rating
        rating = ratingRepository.save(rating);

        // Update book's average rating
        updateBookAverageRating(bookId);

        return mapToDTO(rating);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RatingResponseDTO> getUserRatingForBook(Long bookId, User user) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        return ratingRepository.findByUserAndBook(user, book)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getBookRatings(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        return ratingRepository.findByBookOrderByCreatedAtDesc(book)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getBookRatingsWithReviews(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        return ratingRepository.findRatingsWithReviewsByBook(book)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RatingResponseDTO> getUserRatings(User user) {
        return ratingRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteRating(Long ratingId, User user) {
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new RuntimeException("Rating not found with id: " + ratingId));

        // Check if the rating belongs to the user
        if (!rating.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own ratings");
        }

        Long bookId = rating.getBook().getId();
        ratingRepository.delete(rating);

        // Update book's average rating after deletion
        updateBookAverageRating(bookId);

        log.info("Deleted rating {} for book {} by user {}", ratingId, bookId, user.getEmail());
    }

    @Override
    @Transactional
    public void updateBookAverageRating(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        // Get average rating and count from repository
        Double avgRating = ratingRepository.getAverageRatingByBook(book);
        Long ratingCount = ratingRepository.getRatingCountByBook(book);

        // Update book's average rating and count
        BigDecimal averageRating = avgRating != null
            ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        book.setAverageRating(averageRating);
        book.setRatingsCount(ratingCount != null ? ratingCount : 0L);

        bookRepository.save(book);

        log.info("Updated average rating for book {}: {} ({} ratings)",
                 bookId, averageRating, ratingCount);
    }

    /**
     * Map Rating entity to RatingResponseDTO
     */
    private RatingResponseDTO mapToDTO(Rating rating) {
        return RatingResponseDTO.builder()
                .id(rating.getId())
                .userId(rating.getUser().getId())
                .userFirstName(rating.getUser().getFirstName())
                .userLastName(rating.getUser().getLastName())
                .bookId(rating.getBook().getId())
                .bookTitle(rating.getBook().getTitle())
                .rating(rating.getRating())
                .review(rating.getReview())
                .createdAt(rating.getCreatedAt())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }
}
