package blib.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import blib.enums.ActivityType;


public class Activity implements Serializable {
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final long serialVersionUID = 1L;

    private int memberId;
    private ActivityType type;
    private int affectedEntityId;
    private LocalDateTime activityDateTime;
    private Integer librarianId;

    public Activity(int memberId, ActivityType type, int affectedEntityId, LocalDateTime activityDateTime, Integer librarianId) {
        this.memberId = memberId;
        this.type = type;
        this.affectedEntityId = affectedEntityId;
        this.activityDateTime = activityDateTime;
        this.librarianId = librarianId;
    }

    public Activity(){};

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType activityType) { this.type = activityType; }

    public int getAffectedEntityId() {return affectedEntityId; }
    public void setAffectedEntityId(int affectedEntityId) { this.affectedEntityId = affectedEntityId; }

    public LocalDateTime getActivityDateTime() { return activityDateTime; }
    public void setActivityDateTime(LocalDateTime activityDateTime) { this.activityDateTime = activityDateTime; }

    public Integer getLibrarianId() { return librarianId; }
    public void setLibrarianId(Integer librarianId) { this.librarianId = librarianId; }

    @Override
    public String toString() {
        return String.format("Name: %s, Target ID: %d, Date: %s",
                type, affectedEntityId, activityDateTime.format(formatter));
    }


    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        Activity activity = (Activity) obj;

        if (memberId != activity.memberId) return false;
        if (!type.name().equals(activity.getType().name())) return false;
        return activityDateTime.equals(activity.activityDateTime);
    }


    @Override
    public int hashCode() {
        int result = memberId;
        result = 31 * result + affectedEntityId;
        result = 31 * result + activityDateTime.hashCode();
        return result;
    }
}