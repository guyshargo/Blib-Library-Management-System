package oak.model;

import java.io.Serializable;
import java.util.Date;

import oak.enums.InvoiceSubject;
import oak.enums.IsRead;

public class InvoiceMessage implements Serializable {
    private static final long serialVersionUID = 1L;
    private int msgId;
    private int memberId;
    private String username;
    private String fullName;
    private InvoiceSubject subject;
    private String content;
    private Date date;
    private IsRead isRead;

    public InvoiceMessage(int msgId, int memberId, String username, String fullName, InvoiceSubject subject,
                          String content, Date date, IsRead isRead) {
        this.msgId = msgId;
        this.memberId = memberId;
        this.username = username;
        this.fullName = fullName;
        this.subject = subject;
        this.content = content;
        this.date = date;
        this.isRead = isRead;
    }

    public int getMsgId() { return this.msgId; }

    public int getMemberId() { return this.memberId; }

    public String getUsername() { return this.username; }

    public String getFullName() { return this.fullName; }

    public InvoiceSubject getSubject() { return this.subject; }

    public String getContent() { return this.content; }

    public Date getDate() { return this.date; }

    public IsRead getIsRead() { return this.isRead; }

    @Override
    public String toString() {
        return "(InvoiceMessage) " + this.getSubject() + "(id: " + this.getMsgId() + ", memberID: " +
                this.getMemberId() + ", username: " + this.getUsername() + ", name: " + this.getFullName() +
                ", read?: " + this.getIsRead() + ", date: " + this.getDate() + ")";
    }
}