package oak.logic;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import oak.database.MysqlConnection;
import oak.enums.InvoiceSubject;
import oak.enums.IsRead;
import oak.model.InvoiceMessage;

public class InvoiceLogic {

    private final MysqlConnection dbConnector;

    public InvoiceLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized List<InvoiceMessage> importMessages() {
        List<InvoiceMessage> list = new ArrayList<>();
        String query = "SELECT * FROM invoices";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                InvoiceSubject subject = InvoiceSubject.valueOf(rs.getString("subject"));
                IsRead isRead = IsRead.valueOf(rs.getString("is_read"));
                
                InvoiceMessage message = new InvoiceMessage(
                        rs.getInt("message_id"),
                        rs.getInt("member_id"),
                        rs.getString("username"),
                        rs.getString("member_name"),
                        subject,
                        rs.getString("content"),
                        rs.getDate("message_date"),
                        isRead
                );
                list.add(message);
            }
        } catch (SQLException e) {
            System.out.println("Error importing invoice messages: " + e.getMessage());
        }
        return list;
    }

    public synchronized boolean sendMessage(int member_id, String username, String member_name, InvoiceSubject subject, String content) {
        String query = "INSERT INTO invoices (member_id, username, member_name, subject, content, message_date, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        java.sql.Date currentDate = new java.sql.Date(new Date().getTime());
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, member_id);
            ps.setString(2, username);
            ps.setString(3, member_name);
            ps.setString(4, subject.name());
            ps.setString(5, content);
            ps.setDate(6, currentDate);
            ps.setString(7, IsRead.NOT_READ.name());
            
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Error sending invoice message: " + e.getMessage());
            return false;
        }
    }

    public synchronized void readMessage(int message_id) {
        String query = "UPDATE invoices SET is_read = ? WHERE message_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setString(1, IsRead.READ.name());
            ps.setInt(2, message_id);
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error updating read status: " + e.getMessage());
        }
    }
}