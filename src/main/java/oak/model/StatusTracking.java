package oak.model;

import java.time.LocalDate;

public class StatusTracking {
    private LocalDate date;
    private int frozenMembers;
    private int notFrozenMembers;

    public StatusTracking(LocalDate date, int frozenMembers, int notFrozenMembers) {
        this.date = date;
        this.frozenMembers = frozenMembers;
        this.notFrozenMembers = notFrozenMembers;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getFrozenMembers() { return frozenMembers; }

    public int getNotFrozenMembers() { return notFrozenMembers; }
}