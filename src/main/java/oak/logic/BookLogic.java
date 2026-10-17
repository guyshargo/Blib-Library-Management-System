package oak.logic;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import oak.database.MysqlConnection;
import oak.enums.BorrowStatus;
import oak.enums.IsOrdered;
import oak.model.Book;
import oak.model.BookCopy;

public class BookLogic {

    private final MysqlConnection dbConnector;

    //// Singleton database connector
    public BookLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized BookCopy findCopyOfBook(int copyOfBookID) {
        String queryAvailableCopy = "SELECT bc.*, b.title FROM book_copies bc JOIN books b ON bc.book_id = b.book_id WHERE bc.copy_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(queryAvailableCopy)) {
             
            ps.setInt(1, copyOfBookID);
            
            try (ResultSet resultSet = ps.executeQuery()) {
                if (resultSet.next()) {
                    int copyOfBookId = resultSet.getInt("copy_id");
                    String copOfBookName = resultSet.getString("title");
                    String shelfLocation = resultSet.getString("shelf_location");
                    String barcode = resultSet.getString("barcode");
                    
                    String borrowStatusString = resultSet.getString("borrow_status");
                    BorrowStatus borrow_status = "NotBorrowed".equalsIgnoreCase(borrowStatusString) ? BorrowStatus.NOT_BORROWED : BorrowStatus.BORROWED;
                    int bookId = resultSet.getInt("book_id");
                    
                    return new BookCopy(copyOfBookId, copOfBookName, borrow_status, shelfLocation, barcode, bookId);
                }
            }
        } catch (SQLException e) {
            System.out.println("Error while finding book: " + e.getMessage());
        }
        return null;
    }

    public synchronized BookCopy getAvailableCopyOfBookByBarcode(String barcode) {
        String queryAvailableCopy = "SELECT bc.*, b.title FROM book_copies bc JOIN books b ON bc.book_id = b.book_id WHERE bc.barcode = ? AND bc.borrow_status = 'NotBorrowed' LIMIT 1";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(queryAvailableCopy)) {
             
            ps.setString(1, barcode);
            
            try (ResultSet resultSet = ps.executeQuery()) {
                if (resultSet.next()) {
                    int copyOfBookId = resultSet.getInt("copy_id");
                    String copyOfBookName = resultSet.getString("title");
                    String shelfLocation = resultSet.getString("shelf_location");
                    String barcodeResult = resultSet.getString("barcode");

                    String borrowStatusString = resultSet.getString("borrow_status");
                    BorrowStatus borrow_status = "NotBorrowed".equalsIgnoreCase(borrowStatusString) ? BorrowStatus.NOT_BORROWED : BorrowStatus.BORROWED;
                    int bookId = resultSet.getInt("book_id");
                    
                    return new BookCopy(copyOfBookId, copyOfBookName, borrow_status, shelfLocation, barcodeResult, bookId);
                }
            }
        } catch (SQLException e) {
            System.out.println("Error while finding book by barcode: " + e.getMessage());
        }
        return null;
    }

    public synchronized BookCopy getAvailableCopyOfBook(int book_id) {
        String queryAvailableCopy = "SELECT bc.*, b.title FROM book_copies bc JOIN books b ON bc.book_id = b.book_id WHERE bc.book_id = ? AND bc.borrow_status = 'NotBorrowed' LIMIT 1";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(queryAvailableCopy)) {
             
            ps.setInt(1, book_id);
            
            try (ResultSet resultSet = ps.executeQuery()) {
                if (resultSet.next()) {
                    int copyOfBookId = resultSet.getInt("copy_id");
                    String copOfBookName = resultSet.getString("title");
                    String shelfLocation = resultSet.getString("shelf_location");
                    String barcode = resultSet.getString("barcode");

                    String borrowStatusString = resultSet.getString("borrow_status");
                    BorrowStatus borrow_status = "NotBorrowed".equalsIgnoreCase(borrowStatusString) ? BorrowStatus.NOT_BORROWED : BorrowStatus.BORROWED;
                    int bookId = resultSet.getInt("book_id");
                    
                    return new BookCopy(copyOfBookId, copOfBookName, borrow_status, shelfLocation, barcode, bookId);
                }
            }
        } catch (SQLException e) {
            System.out.println("Error while finding book: " + e.getMessage());
        }
        return null; 
    }

    public synchronized boolean increaseBorrowedCopies(Book book) {
        if (book == null) {
            return false;
        }
        
        String query = "UPDATE books SET number_of_borrowed_copies = number_of_borrowed_copies + 1 WHERE book_id = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
             
            ps.setInt(1, book.getBookId());
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to increase borrowed copies: " + e.getMessage());
            return false;
        }
    }


    public synchronized boolean decreaseBorrowedCopies(int bookid) {
        String query = "UPDATE books SET number_of_borrowed_copies = number_of_borrowed_copies - 1 WHERE book_id = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
             
            ps.setInt(1, bookid);
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to decrease borrowed copies: " + e.getMessage());
            return false;
        }
    }

    public synchronized void decreaseOrdersNumber(Book book) {
        String query = "UPDATE books SET number_of_orders = number_of_orders - 1 WHERE book_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, book.getBookId());

            int rowsAffected = ps.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("Order deleted successfully.");
            } else {
                System.out.println("No matching order found.");
            }
        } catch (SQLException e) {
            System.err.println("SQL error: " + e.getMessage());
        }
    }

    public synchronized boolean changeBookOrderStatus(int book_id, int numberOfOrders, boolean increase) {
        String query = "UPDATE books SET is_ordered = ?, number_of_orders = ? WHERE book_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {

            if (increase) {
                ps.setString(1, "yes");
                ps.setInt(2, numberOfOrders + 1);
            } else {
                int newNumberOfOrders = numberOfOrders - 1;
                ps.setInt(2, newNumberOfOrders);
                if (newNumberOfOrders == 0) {
                    ps.setString(1, "no");
                } else {
                    ps.setString(1, "yes");
                }
            }
            ps.setInt(3, book_id);
            ps.executeUpdate(); 
            return true;
            
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public synchronized boolean increaseQuantityOfBook(Book book) {
        // Check if book exists
        Book existingBook = fetchBook(book.getBookId());
        if (existingBook == null) {
            return false; // Book doesn't exist
        }

        String query = "UPDATE books SET number_of_copies = number_of_copies + 1 WHERE book_id = ?";
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, book.getBookId());
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to increase book quantity: " + e.getMessage());
            return false;
        }
    }

    public synchronized boolean decreaseQuantityOfBook(Book book) {
        // Check if book exists
        Book existingBook = fetchBook(book.getBookId());
        if (existingBook == null) {
            return false; // Book doesn't exist
        }
        
        String query = "UPDATE books SET number_of_copies = number_of_copies - 1 WHERE book_id = ?";
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, book.getBookId());
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to decrease book quantity: " + e.getMessage());
            return false;
        }
    }

    public synchronized boolean changeBookCopyBorrowStatus(BookCopy copyOfBook) {
        String query = "UPDATE book_copies SET borrow_status = ? WHERE copy_id = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
             
            ps.setString(1, copyOfBook.getBorrowStatus().toString());
            ps.setInt(2, copyOfBook.getCopyId());
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to update borrow status: " + e.getMessage());
            return false;
        }
    }

    public synchronized Book fetchBook(int book_id) {
        String query = "SELECT * FROM books WHERE book_id = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
             
            ps.setInt(1, book_id);
            
            try (ResultSet resultSet = ps.executeQuery()) {
                if (resultSet.next()) {
                    String title = resultSet.getString("title");
                    String author = resultSet.getString("author");
                    String genre = resultSet.getString("genre");
                    int numberOfCopies = resultSet.getInt("number_of_copies");
                    int borrowedCopies = resultSet.getInt("number_of_borrowed_copies");
                    String keywords = resultSet.getString("keywords");
                    if (keywords == null) {
                        keywords = ""; 
                    }
                    int numberOfOrders = resultSet.getInt("number_of_orders");
                    IsOrdered is_ordered = IsOrdered.valueOf(resultSet.getString("is_ordered").toUpperCase());
                    String bookSummary = resultSet.getString("summary");
                    String characters = resultSet.getString("characters");
                    int pages = resultSet.getInt("pages");
                    double orderPrice = resultSet.getDouble("order_price");
                    double rating = resultSet.getDouble("rating");
                    if (bookSummary == null) bookSummary = "";

                    Book book = new Book(title, author, genre, numberOfCopies, borrowedCopies, keywords, is_ordered, book_id, numberOfOrders);
                    book.setBookSummary(bookSummary);
                    book.setCharacters(characters);
                    book.setOrderPrice(orderPrice);
                    book.setRating(rating);
                    book.setPages(pages);
                    return book;
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch book by ID: " + e.getMessage());
        }
        return null;
    }    

    public synchronized List<Book> searchBooks(String title, String genre, String freeText) {
        List<Book> searchResults = new ArrayList<>();
        StringBuilder queryBuilder = new StringBuilder("SELECT * FROM books WHERE 1=1");

        // add search criteria dynamically
        boolean hasName = title != null && !title.trim().isEmpty() && !"is empty".equals(title);
        boolean hasGenre = genre != null && !genre.trim().isEmpty() && !"is empty".equals(genre);
        boolean hasFreeText = freeText != null && !freeText.trim().isEmpty() && !"is empty".equals(freeText);

        if (hasName) queryBuilder.append(" AND title LIKE ?");
        if (hasGenre) queryBuilder.append(" AND genre LIKE ?");
        
        String[] keywords = null;
        if (hasFreeText) {
            keywords = freeText.split(",");
            queryBuilder.append(" AND (");
            for (int i = 0; i < keywords.length; i++) {
                queryBuilder.append("keywords LIKE ?");
                if (i < keywords.length - 1) queryBuilder.append(" OR ");
            }
            queryBuilder.append(")");
        }

        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(queryBuilder.toString())) {
             
            int paramIndex = 1;
            if (hasName) ps.setString(paramIndex++, "%" + title.trim().toLowerCase() + "%");
            if (hasGenre) ps.setString(paramIndex++, "%" + genre.trim().toLowerCase() + "%");
            if (hasFreeText && keywords != null) {
                for (String keyword : keywords) {
                    ps.setString(paramIndex++, "%" + keyword.trim().toLowerCase() + "%");
                }
            }
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String bookSummary = rs.getString("summary");
                    String characters = rs.getString("characters");
                    int pages = rs.getInt("pages");
                    double orderPrice = rs.getDouble("order_price");
                    double rating = rs.getDouble("rating");
                    if (bookSummary == null) bookSummary = "";
                    
                    IsOrdered isOrderedEnum = IsOrdered.valueOf(rs.getString("is_ordered").toUpperCase());
                    Book book = new Book(
                            rs.getString("title"),
                            rs.getString("author"),
                            rs.getString("genre"),
                            rs.getInt("number_of_copies"),
                            rs.getInt("number_of_borrowed_copies"),
                            rs.getString("keywords"),
                            isOrderedEnum,
                            rs.getInt("book_id"),
                            rs.getInt("number_of_orders")
                    );
                    book.setBookSummary(bookSummary);
                    book.setCharacters(characters);
                    book.setOrderPrice(orderPrice);
                    book.setRating(rating);
                    book.setPages(pages);
                    searchResults.add(book);
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to search books: " + e.getMessage());
        }
        return searchResults;
    }


    
}