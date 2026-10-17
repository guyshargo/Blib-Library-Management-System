package oak.model;

import java.io.Serializable;

public class Librarian implements Serializable {
    private static final long serialVersionUID = 1L;
    private String fullName;
    private String phoneNum;
    private int id;
    private String username;
    private String password;
    private String email;
    private boolean loginStatus;

    public Librarian() {}

    public Librarian(String fullName, String phoneNum, int id, String email,
                     String username, String password) {
        this.fullName = fullName;
        this.phoneNum = phoneNum;
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    public boolean getLoginStatus() { return loginStatus; }
    public void setLoginStatus(boolean loginStatus) { this.loginStatus = loginStatus; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNum; }
    public void setPhoneNumber(String phoneNum) { this.phoneNum = phoneNum; }

    public int getLibrarianId() { return id; }
    public void setLibrarianId(int id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmailAddress() { return email; }
    public void setEmailAddress(String email) { this.email = email; }

    @Override
    public String toString() {
        return "Librarian{" +
                "fullName='" + fullName + '\'' +
                ", phoneNum='" + phoneNum + '\'' +
                ", id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}