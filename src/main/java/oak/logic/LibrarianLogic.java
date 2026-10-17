package oak.logic;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import oak.database.MysqlConnection;
import oak.model.Librarian;

public class LibrarianLogic {

    private final MysqlConnection dbConnector;
    public LibrarianLogic() { dbConnector = MysqlConnection.getInstance(); }


    public synchronized Librarian fetchLibrarianByUsername(String username) {
        String query = "SELECT * FROM librarians WHERE username = ? ";
        Librarian librarian = null;

        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
            
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    librarian = new Librarian(
                            rs.getString("full_name"),
                            rs.getString("phone_number"),
                            rs.getInt("librarian_id"),
                            rs.getString("email_address"),
                            rs.getString("username"),
                            rs.getString("password")
                    );
                    librarian.setLoginStatus(rs.getBoolean("is_logged_in"));
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch username: " + e.getMessage());
        }
        return librarian;
    }

    /**
     * Description:
     * Method for disconnecting all librarians
     */
    public synchronized void logOutStatusToAllLibrarian() {
        String query = "UPDATE librarians SET is_logged_in = ? WHERE is_logged_in = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
            
            ps.setBoolean(1, false);
            ps.setBoolean(2, true);
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Failed to logout librarians: " + e.getMessage());
        }
    }


    public synchronized boolean ChangeLogInStatus(int librarianId, boolean status) {
        String query = "UPDATE librarians SET is_logged_in = ? WHERE librarian_id = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
            
            ps.setBoolean(1, status);
            ps.setInt(2, librarianId);
            return ps.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to update librarian login status: " + e.getMessage());
        }
        return false;
    }

    public synchronized Librarian fetchLibrarianByID(int librarianID) {
        String query = "SELECT * FROM librarians WHERE librarian_id = ?";
        Librarian librarian = null;
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
            
            ps.setInt(1, librarianID);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    librarian = new Librarian(
                            rs.getString("full_name"),
                            rs.getString("phone_number"),
                            rs.getInt("librarian_id"),
                            rs.getString("email_address"),
                            rs.getString("username"),
                            rs.getString("password")
                    );
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch librarian ID: " + e.getMessage());
        }
        return librarian;
    }

    public synchronized boolean deleteLibrarian(int id){
        String query = "DELETE FROM librarians WHERE librarian_id = ?";

        try(Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)){

                ps.setInt(1, id);
                return (ps.executeUpdate() > 0);
             
            } catch(SQLException e){
                System.out.println("Error during librarian deletion: " + e.getMessage());
            }
        return false;
    }
}