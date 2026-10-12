package blib.dto;
import blib.enums.ActivityType;

public class ActivityRequest {
    private int memberId;
    private ActivityType type;
    private int affectedEntityId;

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public int getAffectedEntityId() { return affectedEntityId; }
    public void setAffectedEntityId(int affectedEntityId) { this.affectedEntityId = affectedEntityId; }
}