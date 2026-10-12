package blib.logic;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import blib.database.MysqlConnection;
import blib.enums.ActivityType;
import blib.model.Activity;

public class ActivityLogic {

    private final MysqlConnection dbConnector;

    // Singleton database connector
    public ActivityLogic() { dbConnector = MysqlConnection.getInstance(); }

    public synchronized boolean addActivity(Activity activity) {
        String query = "INSERT INTO activities (member_id, activity_name, affected_entity_id, activity_date) VALUES (?, ?, ?, ?)";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement pstmt = connection.prepareStatement(query)) {

            ActivityType type = activity.getType() != null
                    ? activity.getType()
                    : ActivityType.DEFAULT;

            int affectedEntityId;
            if(type == ActivityType.REGISTRATION || type == ActivityType.FREEZE_STATUS){
                affectedEntityId = activity.getMemberId();
            } else{
                affectedEntityId = activity.getAffectedEntityId();
            }

            // Set parameters for the prepared statement
            pstmt.setInt(1, activity.getMemberId());
            pstmt.setString(2, type.name());
            pstmt.setInt(3, affectedEntityId);
            pstmt.setTimestamp(4, Timestamp.valueOf(activity.getActivityDateTime()));

            // Execute the insert query
            return pstmt.executeUpdate() > 0;
            
        } catch (SQLException e) {
            System.out.println("Failed to add activity: " + e.getMessage());
            return false;
        }
    }

    public synchronized List<Activity> fetchAllActivitiesForAMember(int memberId) {
        String query = "SELECT * FROM activities WHERE member_id = ? ORDER BY activity_date ASC";
        List<Activity> activityList = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setInt(1, memberId); // Set the member ID in the query
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String rawType = rs.getString("activity_name");
                    ActivityType activityType;
                    try {
                        activityType = rawType != null ? ActivityType.valueOf(rawType) : ActivityType.DEFAULT;
                    } catch (IllegalArgumentException e) {
                        activityType = ActivityType.DEFAULT;
                    }

                    // Map the database row to an Activity object
                    Activity currActivity = new Activity(
                            rs.getInt("member_id"),
                            activityType,
                            rs.getInt("affected_entity_id"),
                            rs.getTimestamp("activity_date").toLocalDateTime()
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