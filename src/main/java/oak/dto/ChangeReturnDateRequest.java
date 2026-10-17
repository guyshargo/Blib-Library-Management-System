package oak.dto;

public class ChangeReturnDateRequest {
    private int memberId;
    private int bookCopyId;
    private String newReturnDate;
    private String librarianName;
    private int librarianId;
    private String extensionDate;

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }
    public int getBookCopyId() { return bookCopyId; }
    public void setBookCopyId(int bookCopyId) { this.bookCopyId = bookCopyId; }
    public String getNewReturnDate() { return newReturnDate; }
    public void setNewReturnDate(String newReturnDate) { this.newReturnDate = newReturnDate; }
    public String getLibrarianName() { return librarianName; }
    public void setLibrarianName(String librarianName) { this.librarianName = librarianName; }
    public int getLibrarianId() { return librarianId; }
    public void setLibrarianId(int librarianId) { this.librarianId = librarianId; }
    public String getExtensionDate() { return extensionDate; }
    public void setExtensionDate(String extensionDate) { this.extensionDate = extensionDate; }
}
