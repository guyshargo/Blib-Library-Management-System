package oak.model;

import java.io.Serializable;
import java.time.LocalDate;

public class WaitlistEntry implements Serializable {
    private static final long serialVersionUID = 1L;
    private int waitlistId;
    private int bookId;
    private int memberId;
    private String memberName;
    private String memberPhone;
    private String memberEmail;
    private LocalDate requestDate;
    private String status; // 'WAITING', 'NOTIFIED', 'FULFILLED', 'CANCELLED'

    public WaitlistEntry() {}

    public WaitlistEntry(int waitlistId, int bookId, int memberId, String memberName, String memberPhone, String memberEmail, LocalDate requestDate, String status) {
        this.waitlistId = waitlistId;
        this.bookId = bookId;
        this.memberId = memberId;
        this.memberName = memberName;
        this.memberPhone = memberPhone;
        this.memberEmail = memberEmail;
        this.requestDate = requestDate;
        this.status = status;
    }

    public int getWaitlistId() { return waitlistId; }
    public void setWaitlistId(int waitlistId) { this.waitlistId = waitlistId; }

    public int getBookId() { return bookId; }
    public void setBookId(int bookId) { this.bookId = bookId; }

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getMemberPhone() { return memberPhone; }
    public void setMemberPhone(String memberPhone) { this.memberPhone = memberPhone; }

    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }

    public LocalDate getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDate requestDate) { this.requestDate = requestDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
