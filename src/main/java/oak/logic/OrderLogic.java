package oak.logic;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import oak.database.MysqlConnection;
import oak.enums.ArrivalStatus;
import oak.model.Book;
import oak.model.BorrowedBook;
import oak.model.OrderedBook;

public class OrderLogic {
    private final MysqlConnection dbConnector;

    // Singleton database connector
    public OrderLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized boolean changeArrivalStatus(int book_id) {
        OrderedBook found = importOrderedBooksByBookId(book_id);
        
        if (found != null) {
            // trigger email notification
            Notification.sendArrivedBookOrderReminderByEmail(found, LocalDate.now().plusDays(2));

            Date tempDate = new Date();
            java.sql.Date currentDate = new java.sql.Date(tempDate.getTime());
            
            String query = "UPDATE orders SET arrival_status = ?, arrival_date = ? WHERE order_id = ?";
            
            try (Connection connection = dbConnector.getConnection();
                 PreparedStatement ps = connection.prepareStatement(query)) {
                 
                ps.setString(1, ArrivalStatus.ARRIVED.name());
                ps.setDate(2, currentDate);
                ps.setInt(3, found.getOrderId());
                return ps.executeUpdate() > 0;
                
            } catch (SQLException e) {
                e.printStackTrace();
                return false;
            }
        }
        return false;
    }

    public synchronized List<OrderedBook> importOrderedBooks(int member_id) {
        String query = "SELECT o.*, b.title, b.author FROM orders o JOIN books b ON o.book_id = b.book_id WHERE o.member_id = ?";
        List<OrderedBook> orderList = new ArrayList<>();
        
        try (Connection con = dbConnector.getConnection();
             PreparedStatement ps = con.prepareStatement(query)) {
             
            ps.setInt(1, member_id);
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ArrivalStatus arrival_status = ArrivalStatus.valueOf(rs.getString("arrival_status"));
                    
                    java.sql.Date orderDateSql = rs.getDate("order_date");
                    java.sql.Date arrivalDateSql = rs.getDate("arrival_date");
                    
                    LocalDate order_date = (orderDateSql != null) ? orderDateSql.toLocalDate() : null;
                    LocalDate localCurrentDate = (arrivalDateSql != null) ? arrivalDateSql.toLocalDate() : null;
                    
                    OrderedBook orderedBook = new OrderedBook(
                            rs.getInt("order_id"),
                            rs.getString("member_name"),
                            rs.getInt("member_id"),
                            rs.getString("member_phone"),
                            rs.getString("member_email"),
                            rs.getInt("book_id"),
                            rs.getString("title"),
                            order_date,
                            arrival_status,
                            localCurrentDate
                    );
                    orderedBook.setAuthor(rs.getString("author"));
                    orderList.add(orderedBook);
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch ordered books: " + e.getMessage());
        }
        return orderList;
    }

    public synchronized OrderedBook importOrderedBooksByBookId(int book_id) {
        String query = "SELECT o.*, b.title FROM orders o JOIN books b ON o.book_id = b.book_id WHERE o.book_id = ? AND o.arrival_status = ? ORDER BY o.order_date ASC LIMIT 1";
        
        try (Connection con = dbConnector.getConnection();
             PreparedStatement ps = con.prepareStatement(query)) {
             
            ps.setInt(1, book_id);
            ps.setString(2, ArrivalStatus.NOT_ARRIVED.name());
            
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ArrivalStatus arrival_status = ArrivalStatus.valueOf(rs.getString("arrival_status"));
                    java.sql.Date orderDateSql = rs.getDate("order_date");
                    java.sql.Date arrivalDateSql = rs.getDate("arrival_date");

                    LocalDate order_date = (orderDateSql != null) ? orderDateSql.toLocalDate() : null;
                    LocalDate arrival_date = (arrivalDateSql != null) ? arrivalDateSql.toLocalDate() : null;
                    
                    return new OrderedBook(
                            rs.getInt("order_id"),
                            rs.getString("member_name"),
                            rs.getInt("member_id"),
                            rs.getString("member_phone"),
                            rs.getString("member_email"),
                            rs.getInt("book_id"),
                            rs.getString("title"),
                            order_date,
                            arrival_status,
                            arrival_date
                    );
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch ordered book by name: " + e.getMessage());
        }
        return null;
    }

    public synchronized boolean removeOrderForBorrowedBook(BorrowedBook borrowedBook) {
        String query = "DELETE FROM orders WHERE book_id = ? AND member_id = ? AND arrival_status = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, borrowedBook.getBookId());
            ps.setInt(2, borrowedBook.getMemberId());
            ps.setString(3, ArrivalStatus.ARRIVED.name());

            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.err.println("SQL error: " + e.getMessage());
        }
        return false;
    }


    public synchronized boolean cancelOrder(int order_id) {
        String query = "DELETE FROM orders WHERE order_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, order_id);
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public synchronized String orderBook(int bookId, int member_id, String member_name,
                                         String member_phone, String member_email) {
        BookLogic bookLogic = new BookLogic();
        Book book = bookLogic.fetchBook(bookId);
        if (book == null) {
            return "book not found";
        }

        if (book.getNumberOforders() >= book.getNumberOfCopies()) {
            return "reached maximum ordering to the book";
        }
            
        java.sql.Date currentDate = java.sql.Date.valueOf(LocalDate.now());
        
        String query = "INSERT INTO orders (book_id, order_date, member_id, member_name, member_phone, member_email, arrival_status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, bookId);
            ps.setDate(2, currentDate);
            ps.setInt(3, member_id);
            ps.setString(4, member_name);
            ps.setString(5, member_phone);
            ps.setString(6, member_email);
            ps.setString(7, ArrivalStatus.NOT_ARRIVED.name());
            ps.executeUpdate(); 
            
            bookLogic.changeBookOrderStatus(bookId, book.getNumberOforders(), true);

            return "approve";
        } catch (SQLException e) {
            e.printStackTrace();
            return "inserting problem";
        }
    }


    public synchronized List<OrderedBook> importAllLateOrderedBooks(LocalDate givenDate) {
        String query = "SELECT o.*, b.title FROM orders o JOIN books b ON o.book_id = b.book_id WHERE o.arrival_date = ?";
        List<OrderedBook> orderList = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setDate(1, java.sql.Date.valueOf(givenDate.minusDays(3))); 
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.sql.Date orderDateSql = rs.getDate("order_date");
                    java.sql.Date arrivalDateSql = rs.getDate("arrival_date");
                    LocalDate order_date = (orderDateSql != null) ? orderDateSql.toLocalDate() : null;
                    LocalDate arrival_date = (arrivalDateSql != null) ? arrivalDateSql.toLocalDate() : null;

                    orderList.add(new OrderedBook(
                            rs.getInt("order_id"),
                            rs.getString("member_name"),
                            rs.getInt("member_id"),
                            rs.getString("member_phone"),
                            rs.getString("member_email"),
                            rs.getInt("book_id"),
                            rs.getString("title"),
                            order_date,
                            ArrivalStatus.valueOf(rs.getString("arrival_status")),
                            arrival_date
                    ));
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch ordered books: " + e.getMessage());
        }
        return orderList;
    }

}