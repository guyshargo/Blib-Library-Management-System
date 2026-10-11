package blib.model;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;


public class BorrowedBook implements Serializable {
    private static final long serialVersionUID = 1L;
    private LocalDate borrowDate;
    private LocalDate returnDate;
    private int memberId;
    private String title;
    private String author;
    private String librarianName;
    private int bookCopyId;
    private LocalDate extensionDate;
    public int librarianId;
    public int bookId;

    public BorrowedBook(int memberId, String title, int bookCopyId, String librarianName, int librarianId,
                        LocalDate borrowDate, LocalDate returnDate, LocalDate extensionDate, int bookId) {
        this.borrowDate = borrowDate;
        this.returnDate = returnDate;
        this.bookId = bookId;
        this.memberId = memberId;
        this.title = title;
        this.librarianName = librarianName;
        this.librarianId = librarianId;
        this.bookCopyId = bookCopyId;
        this.extensionDate = extensionDate;
    }

    public BorrowedBook(int memberId, String title, int bookCopyId, String librarianName) {
        this.borrowDate = LocalDate.now(); // Set current date as borrow date
        this.returnDate = this.borrowDate.plusWeeks(2); // Default return date to 2 weeks later
        this.bookCopyId = bookCopyId;
        this.memberId = memberId;
        this.title = title;
        this.librarianName = librarianName;
    }


    public BorrowedBook(int memberId, String title, int bookCopyId, LocalDate borrowDate,
                        String librarianName, int librarianId, int bookId) {
        this.borrowDate = borrowDate;
        this.librarianId = librarianId;
        this.librarianName = librarianName;
        this.returnDate = borrowDate.plusWeeks(2); // Default return date to 2 weeks later
        this.bookId = bookId;
        this.memberId = memberId;
        this.title = title;
        this.bookCopyId = bookCopyId;
    }

    public BorrowedBook(){};

    public LocalDate getBorrowDate() { return this.borrowDate; }

    public LocalDate getReturnDate() { return this.returnDate; }

    public int getMemberId() { return this.memberId; }

    public String getNameOfBook() { return this.title; }

    public String getAuthor() { return this.author; }

    public void setAuthor(String author) { this.author = author; }

    public String getLibrarianName() { return this.librarianName; }

    public int getCopyOfBookId() { return this.bookCopyId; }

    public LocalDate getExtensionDate() { return this.extensionDate; }

    public int getLibrarianId() { return this.librarianId; }

    public int getBookId() { return this.bookId; }


    @Override
    public String toString() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        return "(BorrowedBook) " + this.getNameOfBook()
                + " (memberID: " + this.memberId
                + ", copyOfBookID: " + this.getCopyOfBookId()
                + ", librarian name: " + this.getLibrarianName()
                + ", borrowed on: " + this.getBorrowDate().format(formatter)
                + ", return on: " + this.getReturnDate().format(formatter)
                + (this.extensionDate != null ? ", extension date: " + this.getExtensionDate().format(formatter) : "")
                + ")";
    }
}