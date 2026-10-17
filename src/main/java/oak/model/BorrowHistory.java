package oak.model;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;


public class BorrowHistory {
    private int bookCopyId;
    private int memberId;
    private String memberName;
    private String title;
    private LocalDate borrowDate;
    private LocalDate originalReturnDate;
    private LocalDate actualReturnDate;
    private int lateDays;  // Number of late days

    public BorrowHistory(int memberId, String memberName, String title, LocalDate borrowDate,
                         LocalDate originalReturnDate, LocalDate actualReturnDate, int bookCopyId) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.title = title;
        this.borrowDate = borrowDate;
        this.originalReturnDate = originalReturnDate;
        this.actualReturnDate = actualReturnDate;
        this.lateDays = calculateLateDays(originalReturnDate, actualReturnDate);
        this.bookCopyId = bookCopyId;
    }


    public BorrowHistory(int memberId, String memberName, String title, LocalDate borrowDate,
                         LocalDate originalReturnDate, int bookCopyId) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.title = title;
        this.borrowDate = borrowDate;
        this.originalReturnDate = originalReturnDate;
        this.actualReturnDate = null;
        this.bookCopyId = bookCopyId;
        this.lateDays = 0;
    }

    public int calculateLateDays(LocalDate originalReturnDate, LocalDate actualReturnDate) {
        if (actualReturnDate != null && actualReturnDate.isAfter(originalReturnDate)) {
            return (int) ChronoUnit.DAYS.between(originalReturnDate, actualReturnDate);
        }
        return 0;  // If not late or the book is not yet returned
    }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public int getBookCopyId() { return bookCopyId; }
    public void setBookCopyId(int bookCopyId) { this.bookCopyId = bookCopyId; }

    public String getBookTitle() { return title; }
    public void setBookTitle(String title) { this.title = title; }

    public LocalDate getBorrowDate() { return borrowDate; }
    public void setBorrowDate(LocalDate borrowDate) { this.borrowDate = borrowDate; }

    public LocalDate getOriginalReturnDate() { return originalReturnDate; }
    public void setOriginalReturnDate(LocalDate originalReturnDate) { this.originalReturnDate = originalReturnDate; }

    public LocalDate getActualReturnDate() { return actualReturnDate; }
    public void setActualReturnDate(LocalDate actualReturnDate) { this.actualReturnDate = actualReturnDate; this.lateDays = calculateLateDays(originalReturnDate, actualReturnDate); }

    public int getLateDays() { return lateDays; }
    public void setLateDays(int lateDays) { this.lateDays = lateDays; }
}