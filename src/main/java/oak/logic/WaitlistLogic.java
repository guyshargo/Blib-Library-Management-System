package oak.logic;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import oak.database.MysqlConnection;
import oak.model.WaitlistEntry;

public class WaitlistLogic {
    private final MysqlConnection dbConnector;

    public WaitlistLogic() {
        dbConnector = MysqlConnection.getInstance();
    }

    public synchronized String joinWaitlist(int bookId, int memberId, String memberName, String memberPhone, String memberEmail) {
        // Check if already in waitlist for this book
        String checkQuery = "SELECT * FROM waitlist WHERE book_id = ? AND member_id = ? AND status = 'WAITING'";
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(checkQuery)) {
            ps.setInt(1, bookId);
            ps.setInt(2, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return "already_on_waitlist";
                }
            }
        } catch (SQLException e) {
            System.out.println("Error checking waitlist: " + e.getMessage());
        }

        String insertQuery = "INSERT INTO waitlist (book_id, member_id, member_name, member_phone, member_email, request_date, status) VALUES (?, ?, ?, ?, ?, ?, 'WAITING')";
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(insertQuery)) {
            ps.setInt(1, bookId);
            ps.setInt(2, memberId);
            ps.setString(3, memberName);
            ps.setString(4, memberPhone);
            ps.setString(5, memberEmail);
            ps.setDate(6, Date.valueOf(LocalDate.now()));
            
            int affected = ps.executeUpdate();
            return affected > 0 ? "approve" : "failed";
        } catch (SQLException e) {
            System.out.println("Failed to join waitlist: " + e.getMessage());
            return "failed: " + e.getMessage();
        }
    }

    public synchronized List<WaitlistEntry> getWaitlistForMember(int memberId) {
        List<WaitlistEntry> list = new ArrayList<>();
        String query = "SELECT w.*, b.title FROM waitlist w JOIN books b ON w.book_id = b.book_id WHERE w.member_id = ? ORDER BY w.request_date DESC";
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, memberId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Date reqDate = rs.getDate("request_date");
                    LocalDate requestDate = reqDate != null ? reqDate.toLocalDate() : null;
                    WaitlistEntry entry = new WaitlistEntry(
                        rs.getInt("waitlist_id"),
                        rs.getInt("book_id"),
                        rs.getInt("member_id"),
                        rs.getString("member_name"),
                        rs.getString("member_phone"),
                        rs.getString("member_email"),
                        requestDate,
                        rs.getString("status")
                    );
                    list.add(entry);
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch member waitlist: " + e.getMessage());
        }
        return list;
    }

    public synchronized boolean leaveWaitlist(int waitlistId) {
        String query = "UPDATE waitlist SET status = 'CANCELLED' WHERE waitlist_id = ?";
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, waitlistId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("Failed to leave waitlist: " + e.getMessage());
            return false;
        }
    }

    public synchronized WaitletNotificationData notifyNextInWaitlist(int bookId) {
        String query = "SELECT * FROM waitlist WHERE book_id = ? AND status = 'WAITING' ORDER BY request_date ASC LIMIT 1";
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    int waitlistId = rs.getInt("waitlist_id");
                    String memberEmail = rs.getString("member_email");
                    String memberName = rs.getString("member_name");
                    String memberPhone = rs.getString("member_phone");
                    int memberId = rs.getInt("member_id");

                    // Update status to NOTIFIED
                    String updateQ = "UPDATE waitlist SET status = 'NOTIFIED' WHERE waitlist_id = ?";
                    try (PreparedStatement ups = conn.prepareStatement(updateQ)) {
                        ups.setInt(1, waitlistId);
                        ups.executeUpdate();
                    }

                    return new WaitletNotificationData(memberId, memberName, memberEmail, memberPhone);
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to notify next in waitlist: " + e.getMessage());
        }
        return null;
    }

    public static class WaitletNotificationData {
        public int memberId;
        public String memberName;
        public String memberEmail;
        public String memberPhone;

        public WaitletNotificationData(int memberId, String memberName, String memberEmail, String memberPhone) {
            this.memberId = memberId;
            this.memberName = memberName;
            this.memberEmail = memberEmail;
            this.memberPhone = memberPhone;
        }
    }
}
