package oak.model;

import java.io.Serializable;

import oak.enums.BorrowStatus;

public class BookCopy implements Serializable {
    private static final long serialVersionUID = 1L;
    private int copyId;
    private String title;
    private BorrowStatus borrowStatus;
    private String shelfLocation;
    private String barcode;
    private int bookId;

    public BookCopy(int copyId, String title, BorrowStatus borrowStatus, String shelfLocation,
                      String barcode, int bookId) {
        this.copyId = copyId;
        this.title = title;
        this.borrowStatus = borrowStatus;
        this.shelfLocation = shelfLocation;
        this.barcode = barcode;
        this.bookId = bookId;
    }

    public String getBookTitle() { return title; }

    public int getCopyId() { return copyId; }

    public BorrowStatus getBorrowStatus() { return borrowStatus; }
    public void setBorrowStatus(BorrowStatus borrowStatus) { this.borrowStatus = borrowStatus; }

    public String getShelfLocation() { return shelfLocation; }

    public String getBarcode() { return barcode; }

    public int getBookId() { return bookId; }

    @Override
    public String toString() {
        return "(BookCopy) Title: " + this.getBookTitle() + ", CopyID: " + this.getCopyId() + ", borrowed: " + this.getBorrowStatus()
                + ", location: " + this.getShelfLocation() + ", barcode: " + this.getBarcode() + ", BookID: " + this.getBookId();
    }
}