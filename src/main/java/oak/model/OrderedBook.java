package oak.model;

import java.io.Serializable;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import oak.enums.ArrivalStatus;


public class OrderedBook implements Serializable {
    private static final long serialVersionUID = 1L;
    private int orderId;
    private String memberName;
    private String memberPhone;
    private String memberEmail;
    private int memberId;
    private LocalDate orderDate;
    private ArrivalStatus arrivalStatus;
    private int bookId;
    private String title;
    private String author;
    private LocalDate arrivalDate;


    public OrderedBook(int orderId, String memberName, int memberId, String memberPhone, String memberEmail,
                       int bookId, String title, LocalDate orderDate, ArrivalStatus arrivalStatus,
                       LocalDate arrivalDate) {
        this.orderId = orderId;
        this.memberName = memberName;
        this.memberPhone = memberPhone;
        this.memberEmail = memberEmail;
        this.memberId = memberId;
        this.orderDate = orderDate;
        this.arrivalStatus = arrivalStatus;
        this.bookId = bookId;
        this.title = title;
        this.arrivalDate = arrivalDate;
    }

    public OrderedBook() {}


    public int getOrderId() { return this.orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public String getMemberPhone() { return this.memberPhone; }
    public void setMemberPhone(String memberPhone) { this.memberPhone = memberPhone; }

    public String getMemberName() { return this.memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getMemberEmail() { return this.memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }

    public int getMemberId() { return this.memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public LocalDate getOrderDate() { return this.orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public ArrivalStatus getArrivalStatus() { return this.arrivalStatus; }
    public void setArrivalStatus(ArrivalStatus arrivalStatus) { this.arrivalStatus = arrivalStatus; }

    @JsonProperty("title")
    public String getBookTitle() { return this.title; }
    public void setBookTitle(String title) { this.title = title; }

    public String getAuthor() { return this.author; }
    public void setAuthor(String author) { this.author = author; }


    public int getBookId() { return this.bookId; }
    public void setBookId(int bookId) { this.bookId = bookId; }

    public LocalDate getArrivalDate() { return this.arrivalDate; }
    public void setArrivalDate(LocalDate arrivalDate) { this.arrivalDate = arrivalDate; }


    public String toString() {
        return "(OrderBook) " + this.getBookTitle() + "(id: " + this.getOrderId() + ", name: " + this.getMemberName() +
                ", memberId: " + this.memberId + ", bookId: " + this.getBookId() + ", email" +
                this.getMemberEmail() + ", ordered on: " + this.getOrderDate() + ", arrived?:" +
                this.getArrivalStatus() + ", date of arrival" + this.getArrivalDate() + ")\n";
    }
}