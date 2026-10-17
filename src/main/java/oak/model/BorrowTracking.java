package oak.model;

import java.time.LocalDate;

public class BorrowTracking {
    private LocalDate date;
    private int borrowCount;
    private int lateCount;

    public BorrowTracking(LocalDate date, int borrowCount, int lateCount) {
        this.date = date;
        this.borrowCount = borrowCount;
        this.lateCount = lateCount;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getBorrowCount() { return borrowCount; }
    public int getLateCount() { return lateCount; }
}