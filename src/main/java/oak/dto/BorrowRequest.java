package oak.dto;

public class BorrowRequest {
    private int memberId;
    private int bookCopyId;
    private int librarianId;
    private String librarianName;

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }
    public int getBookCopyId() { return bookCopyId; }
    public void setBookCopyId(int bookCopyId) { this.bookCopyId = bookCopyId; }
    public int getLibrarianId() { return librarianId; }
    public void setLibrarianId(int librarianId) { this.librarianId = librarianId; }
    public String getLibrarianName() { return librarianName; }
    public void setLibrarianName(String librarianName) { this.librarianName = librarianName; }
}
