package blib.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;


public class MysqlConnection {

    private static MysqlConnection instance;
    private Properties envProperties;


    private MysqlConnection() {
        envProperties = new Properties();

        try (FileInputStream fis = new FileInputStream(".env")) {
            envProperties.load(fis);
        } catch (IOException ex) {
            System.out.println("Warning: Could not load .env file. Falling back to default credentials.");
        }
        
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("Driver definition succeed");
        } catch (Exception ex) {
            System.out.println("Driver definition failed");
        }
    }


    public static MysqlConnection getInstance() {
        if (instance == null) {
            instance = new MysqlConnection();
        }
        return instance;
    }


    public Connection getConnection() {
        try {
            String url = envProperties.getProperty("DB_URL", "jdbc:mysql://localhost:3306/blib?serverTimezone=Asia/Jerusalem");
            String user = envProperties.getProperty("DB_USER", "root");
            String password = envProperties.getProperty("DB_PASSWORD", "Aa123456");
            
            // Return a fresh connection every time to prevent cross-thread closures
            return DriverManager.getConnection(url, user, password);

        } catch (SQLException ex) {
            System.out.println("SQLException: " + ex.getMessage());
            System.out.println("SQLState: " + ex.getSQLState());
            System.out.println("VendorError: " + ex.getErrorCode());
            return null;
        }
    }
}