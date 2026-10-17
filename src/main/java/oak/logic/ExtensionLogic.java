package oak.logic;

import java.sql.*;
import java.time.LocalDate;

import oak.database.MysqlConnection;
import oak.model.BorrowedBook;


public class ExtensionLogic {

    private final MysqlConnection dbConnector;

    // Singleton database connector
    public ExtensionLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized boolean existingOrders(BorrowedBook borrowedBook) {
        String query = "SELECT * FROM orders WHERE book_id = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
             
            ps.setInt(1, borrowedBook.getBookId());
            
            try (ResultSet resultSet = ps.executeQuery()) {
                return resultSet.next();
            }
            
        } catch (SQLException ex) {
            System.out.println("Error checking existing orders: " + ex.getMessage());
            return false;
        }
    }

    public synchronized boolean borrowExtensionRequest(BorrowedBook borrowedBook) {
        // Check if there are any existing orders for the book copy
        if (existingOrders(borrowedBook)) {
            return false;
        }
        
        BorrowLogic borrowLogic = new BorrowLogic();
        // Default adding extension 2 weeks
        LocalDate newReturnDate = borrowedBook.getReturnDate().plusDays(14);
        
        // Directly return the boolean result of the database update
        return borrowLogic.setReturnDate(borrowedBook.getMemberId(), borrowedBook.getCopyOfBookId(), newReturnDate);
    }
}