package oak.model;

import java.io.Serializable;
import java.time.LocalDate;

import oak.enums.FreezeStatus;

public class Member implements Serializable {
    private static final long serialVersionUID = 1L;
    private int memberId;
    private String fullName;
    private String username;
    private String password;
    private FreezeStatus freezeStatus;
    private String email;
    private String phoneNum;
    private LocalDate freezeStatusDate;
    private String readerCardBarcode;
    private boolean loginStatus;

    public Member() {}

    public Member(int memberId, String fullName, String username, String password,
                 FreezeStatus freezeStatus, String email, String phoneNum, String readerCardBarcode) {
        this.memberId = memberId;
        this.fullName = fullName;
        this.username = username;
        this.password = password;
        this.freezeStatus = freezeStatus;
        this.email = email;
        this.phoneNum = phoneNum;
        this.readerCardBarcode = readerCardBarcode;
    }

    public Member(int memberId, String fullName, String username, String password,
                 FreezeStatus freezeStatus, String email, String phoneNum, LocalDate freezeStatusDate, String readerCardBarcode) {
        this.memberId = memberId;
        this.fullName = fullName;
        this.username = username;
        this.password = password;
        this.freezeStatus = freezeStatus;
        this.email = email;
        this.phoneNum = phoneNum;
        this.freezeStatusDate = freezeStatusDate;
        this.readerCardBarcode = readerCardBarcode;
    }

    public void setLoginStatus(boolean loginStatus) { this.loginStatus = loginStatus; }
    public boolean getLoginStatus() { return loginStatus; }

    public String getReaderCardBarcode() { return readerCardBarcode; }
    public void setReaderCardBarcode(String readerCardBarcode) { this.readerCardBarcode = readerCardBarcode; }

    public LocalDate getFreezeStatusDate() { return freezeStatusDate; }
    public void setFreezeStatusDate(LocalDate freezeStatusDate) { this.freezeStatusDate = freezeStatusDate; }

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public FreezeStatus getFreezeStatus() { return freezeStatus; }
    public void setFreezeStatus(FreezeStatus freezeStatus) { this.freezeStatus = freezeStatus; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNum() { return phoneNum; }
    public void setPhoneNum(String phoneNum) { this.phoneNum = phoneNum; }

    @Override
    public String toString() {
        return "Subscriber{" +
                "membershipNumber=" + memberId +
                ", memberFullName='" + fullName + '\'' +
                ", username='" + username + '\'' +
                ", memberFreezeStatus=" + freezeStatus +
                ", emailAddress='" + email + '\'' +
                ", memberPhoneNumber='" + phoneNum + '\'' +
                '}';
    }
}