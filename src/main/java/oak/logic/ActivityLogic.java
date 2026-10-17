package oak.logic;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import oak.database.MysqlConnection;
import oak.enums.ActivityType;
import oak.model.Activity;

public class ActivityLogic {

    private final MysqlConnection dbConnector;

    // Singleton database connector
    public ActivityLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized boolean addActivity(Activity activity) {
        String query = "INSERT INTO activities (member_id, activity_name, affected_entity_id, activity_date, librarian_id) VALUES (?, ?, ?, ?, ?)";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement pstmt = connection.prepareStatement(query)) {

            ActivityType type = activity.getType() != null
                    ? activity.getType()
                    : ActivityType.DEFAULT;

            int affectedEntityId = (type == ActivityType.REGISTRATION || type == ActivityType.FREEZE_STATUS) 
                                    ? activity.getMemberId() : activity.getAffectedEntityId();

            // Set parameters for the prepared statement
            pstmt.setInt(1, activity.getMemberId());
            pstmt.setString(2, type.name());
            pstmt.setInt(3, affectedEntityId);
            pstmt.setTimestamp(4, Timestamp.valueOf(activity.getActivityDateTime()));

            // optional Librarian ID
            if (activity.getLibrarianId() != null) {
                pstmt.setInt(5, activity.getLibrarianId());
            } else {
                pstmt.setNull(5, java.sql.Types.INTEGER);
            }

            // Execute the insert query
            return pstmt.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to add activity: " + e.getMessage());
            return false;
        }
    }

    public synchronized List<Activity> fetchAllActivitiesForAMember(int memberId) {
        return fetchActivities("SELECT * FROM activities WHERE member_id = ? ORDER BY activity_date DESC", memberId);
    }

    public synchronized List<Activity> fetchAllActivitiesForLibrarian(int librarianId) {
        return fetchActivities("SELECT * FROM activities WHERE librarian_id = ? ORDER BY activity_date DESC", librarianId);
    }

    private List<Activity> fetchActivities(String query, int id) {
        List<Activity> activityList = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, id); 
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String rawType = rs.getString("activity_name");
                    ActivityType activityType;
                    try {
                        activityType = rawType != null ? ActivityType.valueOf(rawType) : ActivityType.DEFAULT;
                    } catch (IllegalArgumentException e) {
                        activityType = ActivityType.DEFAULT;
                    }

                    // Read librarian_id (handle SQL NULL)
                    int libId = rs.getInt("librarian_id");
                    Integer librarianId = rs.wasNull() ? null : libId;

                    Activity currActivity = new Activity(
                            rs.getInt("member_id"),
                            activityType,
                            rs.getInt("affected_entity_id"),
                            rs.getTimestamp("activity_date").toLocalDateTime(),
                            librarianId
                    );
                    activityList.add(currActivity);
                }
            }
        } catch (SQLException e) {
            System.out.println("Failed to fetch activities: " + e.getMessage());
        }
        return activityList;
    }

}
