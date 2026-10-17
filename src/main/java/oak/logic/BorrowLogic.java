package oak.logic;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import oak.database.MysqlConnection;
import oak.enums.BorrowStatus;
import oak.model.Book;
import oak.model.BookCopy;
import oak.model.BorrowedBook;

public class BorrowLogic {

    private final MysqlConnection dbConnector;

    // Singleton database connector
    public BorrowLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized BorrowedBook getCloserReturnDateBook(int book_id) {
        String query = "SELECT bb.*, b.title FROM borrowed_books bb JOIN books b ON bb.book_id = b.book_id WHERE bb.book_id = ? ORDER BY bb.return_date ASC LIMIT 1";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, book_id);
            
            try (ResultSet resultSet = ps.executeQuery()) {
                if (resultSet.next()) {
                    java.sql.Date extensionDateSql = resultSet.getDate("extension_date");
                    LocalDate extension_date = (extensionDateSql != null) ? extensionDateSql.toLocalDate().plusDays(1) : null;
                    
                    int member_id = resultSet.getInt("member_id");
                    String bookName = resultSet.getString("title");
                    int copyOfBookId = resultSet.getInt("copy_id");
                    String librarian_name = resultSet.getString("librarian_name");
                    int librarian_id = resultSet.getInt("librarian_id");
                    LocalDate borrow_date = resultSet.getDate("borrow_date").toLocalDate().plusDays(1);
                    LocalDate return_date = resultSet.getDate("return_date").toLocalDate().plusDays(1);
                    int book_Id = resultSet.getInt("book_id");

                    return new BorrowedBook(member_id, bookName, copyOfBookId, librarian_name, librarian_id, borrow_date, return_date, extension_date, book_Id);
                }
            }
        } catch (SQLException e) {
            System.out.println("Error fetching the soonest return date: " + e.getMessage());
        }
        return null;
    }

    

    public synchronized boolean checkIfAMemberCanBorrowTheBook(int member_id, BookCopy cpbook, Book book) {
        String orderQuery = "SELECT * FROM orders WHERE book_id = ? AND member_id = ? AND arrival_status = 'Arrived'";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(orderQuery)) {
             
            ps.setInt(1, cpbook.getBookId());
            ps.setInt(2, member_id);
            
            try (ResultSet ordersResult = ps.executeQuery()) {
                boolean memberOrderedBook = ordersResult.next();
                boolean isBookOrdered = book.getIsOrderedBoolean();
                
                int numberOfAvailableCopies = book.getNumberOfCopies() - book.getNumberOfBorrowedCopies();
                
                // Check borrowing conditions
                return memberOrderedBook || !isBookOrdered || numberOfAvailableCopies > book.getNumberOforders();
            }
        } catch (SQLException e) {
            System.out.println("Error while checking if a member can borrow the book: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    

    

    

    public synchronized BorrowedBook borrowBook(int memberId, int copyOfBookId, int librarian_id, String librarian_name) {
        BookLogic bookLogic = new BookLogic();
        OrderLogic orderLogic = new OrderLogic();

        BookCopy availableCopy = bookLogic.findCopyOfBook(copyOfBookId);
        
        if (availableCopy == null || availableCopy.getBorrowStatus() == BorrowStatus.BORROWED) {
            return null; 
        }
        
        availableCopy.setBorrowStatus(BorrowStatus.BORROWED);
        boolean borrowUpdated = bookLogic.changeBookCopyBorrowStatus(availableCopy);
        if (!borrowUpdated) {
            return null; 
        }
        
        BorrowedBook borrowedBook = new BorrowedBook(
                memberId,
                availableCopy.getBookTitle(),
                availableCopy.getCopyId(),
                LocalDate.now(),
                librarian_name,
                librarian_id,
                availableCopy.getBookId()
        );
        addNewBorrowedBook(borrowedBook);
        
        Book book = bookLogic.fetchBook(availableCopy.getBookId());
        boolean existingOrders = orderLogic.removeOrderForBorrowedBook(borrowedBook);
        if (existingOrders) {
            bookLogic.decreaseOrdersNumber(book);
        }
        bookLogic.increaseBorrowedCopies(book);
        return borrowedBook;
    }

    

    public synchronized boolean setReturnDate(int membershipNum, int copy_id, LocalDate newReturnDate) {
        String query = "UPDATE borrowed_books SET return_date = ? WHERE member_id = ? AND copy_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setDate(1, java.sql.Date.valueOf(newReturnDate));
            ps.setInt(2, membershipNum);
            ps.setInt(3, copy_id);

            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to update return date: " + e.getMessage());
            return false;
        }
    }

    public synchronized boolean setLibrarianForReturnDate(int memberNumber, int copyOfBookId, String librarian_name,
                                                          int librarian_id, LocalDate extension_date) {
        String query = "UPDATE borrowed_books SET librarian_name = ?, librarian_id = ?, extension_date = ? WHERE member_id = ? AND copy_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setString(1, librarian_name);
            ps.setInt(2, librarian_id);
            ps.setDate(3, java.sql.Date.valueOf(extension_date));
            ps.setInt(4, memberNumber);
            ps.setInt(5, copyOfBookId);

            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to update librarian: " + e.getMessage());
            return false;
        }
    }

    public synchronized List<BorrowedBook> importAllBorrowedBooks() {
        String query = "SELECT borrowed_books.*, books.title FROM borrowed_books JOIN books ON borrowed_books.book_id = books.book_id";
        List<BorrowedBook> borrowList = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                java.sql.Date extensionDateSql = rs.getDate("extension_date");
                LocalDate extension_date = (extensionDateSql != null) ? extensionDateSql.toLocalDate().plusDays(1) : null;
                
                borrowList.add(new BorrowedBook(
                        rs.getInt("member_id"),
                        rs.getString("title"),
                        rs.getInt("copy_id"),
                        rs.getString("librarian_name"),
                        rs.getInt("librarian_id"),
                        rs.getDate("borrow_date").toLocalDate().plusDays(1),
                        rs.getDate("return_date").toLocalDate().plusDays(1),
                        extension_date,
                        rs.getInt("book_id")
                ));
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch borrowed books: " + e.getMessage());
        }
        return borrowList;
    }

    

    public synchronized boolean deleteBorrowedBook(int bookid) {
        String query = "DELETE FROM borrowed_books WHERE copy_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, bookid);
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to delete borrowed book: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public synchronized boolean addNewBorrowedBook(BorrowedBook borrowedBook) {
        String query = "INSERT INTO borrowed_books (member_id, borrow_date, return_date, librarian_name, librarian_id, copy_id, extension_date, book_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
             
            ps.setInt(1, borrowedBook.getMemberId());
            ps.setDate(2, java.sql.Date.valueOf(borrowedBook.getBorrowDate()));
            ps.setDate(3, java.sql.Date.valueOf(borrowedBook.getReturnDate()));
            ps.setString(4, borrowedBook.getLibrarianName());
            ps.setInt(5, borrowedBook.getLibrarianId());
            ps.setInt(6, borrowedBook.getCopyOfBookId());

            if (borrowedBook.getExtensionDate() != null) {
                ps.setDate(7, java.sql.Date.valueOf(borrowedBook.getExtensionDate()));
            } else {
                ps.setNull(7, java.sql.Types.DATE);
            }
            ps.setInt(8, borrowedBook.getBookId());

            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to add borrowed book: " + e.getMessage());
            return false;
        }
    }

    

    public synchronized BorrowedBook fetchBorrowedBook(int member_id, int copy_id) {
        List<BorrowedBook> borrowedBooks = this.importBorrowedBooks(member_id);
        for (BorrowedBook borrow : borrowedBooks) {
            if (borrow.getMemberId() == member_id && borrow.getCopyOfBookId() == copy_id) {
                return borrow;
            }
        }
        return null;
    }


    public synchronized List<BorrowedBook> importBorrowedBooks(int member_id) {
        String query = "SELECT bb.*, b.title, b.author FROM borrowed_books bb JOIN books b ON bb.book_id = b.book_id WHERE bb.member_id = ?";
        List<BorrowedBook> borrowList = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, member_id);
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.sql.Date extensionDateSql = rs.getDate("extension_date");
                    LocalDate extension_date = (extensionDateSql != null) ? extensionDateSql.toLocalDate().plusDays(1) : null;
                    
                    BorrowedBook borrowedBook = new BorrowedBook(
                            rs.getInt("member_id"),
                            rs.getString("title"),
                            rs.getInt("copy_id"),
                            rs.getString("librarian_name"),
                            rs.getInt("librarian_id"),
                            rs.getDate("borrow_date").toLocalDate().plusDays(1),
                            rs.getDate("return_date").toLocalDate().plusDays(1),
                            extension_date,
                            rs.getInt("book_id")
                    );
                    borrowedBook.setAuthor(rs.getString("author"));
                    borrowList.add(borrowedBook);
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch borrowed books: " + e.getMessage());
        }
        return borrowList;
    }
}