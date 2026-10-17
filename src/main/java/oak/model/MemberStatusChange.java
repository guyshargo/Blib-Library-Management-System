package oak.model;

import java.time.LocalDate;

import oak.enums.FreezeStatus;

public class MemberStatusChange {
    private int id;
    private String fullName;
    private FreezeStatus freezeStatus;
    private LocalDate changeStatusDate;

    public MemberStatusChange(int id, String fullName, FreezeStatus freezeStatus, LocalDate changeStatusDate) {
        this.id = id;
        this.fullName = fullName;
        this.freezeStatus = freezeStatus;
        this.changeStatusDate = changeStatusDate;
    }

    public String getMemberName() { return fullName; }

    public int getMemberId() { return id; }

    public FreezeStatus getFreezeStatus() { return freezeStatus; }

    public LocalDate getChangeStatusDate() { return changeStatusDate; }
}