package me.remontada.readify.service;

import me.remontada.readify.dto.request.RatingCreateDTO;
import me.remontada.readify.dto.response.RatingResponseDTO;
import me.remontada.readify.model.Rating;
import me.remontada.readify.model.User;

import java.util.List;
import java.util.Optional;

public interface RatingService {

    /**
     * Add or update a rating for a book by a user
     */
    RatingResponseDTO addOrUpdateRating(Long bookId, RatingCreateDTO ratingDTO, User user);

    /**
     * Get a user's rating for a specific book
     */
    Optional<RatingResponseDTO> getUserRatingForBook(Long bookId, User user);

    /**
     * Get all ratings for a specific book
     */
    List<RatingResponseDTO> getBookRatings(Long bookId);

    /**
     * Get all ratings with reviews for a specific book
     */
    List<RatingResponseDTO> getBookRatingsWithReviews(Long bookId);

    /**
     * Get all ratings by a specific user
     */
    List<RatingResponseDTO> getUserRatings(User user);

    /**
     * Delete a rating
     */
    void deleteRating(Long ratingId, User user);

    /**
     * Recalculate and update average rating for a book
     */
    void updateBookAverageRating(Long bookId);
}
