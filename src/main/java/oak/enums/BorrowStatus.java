package oak.enums;

public enum BorrowStatus {
    BORROWED(true), 
    NOT_BORROWED(false);

    private final boolean value;

    BorrowStatus(boolean value) {
        this.value = value;
    }

    public boolean getValue() { return value; }

    public String toString() {
        if (value)
            return "Borrowed";
        else
            return "NotBorrowed";
    }
}